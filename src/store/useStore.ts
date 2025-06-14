import { create } from 'zustand';
import { Routine, Todo, Diary, User, Settings, UserMetadata, RoutineInstances } from '../types';
import { supabase } from '../lib/supabaseClient';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, startOfDay } from 'date-fns';

interface StoreState {
  // 상태
  routines: Routine[];
  todos: Todo[];
  diaries: Diary[];
  user: User | null;
  currentDate: Date;
  settings: Omit<Settings, 'theme'>;
  routineInstances: RoutineInstances;
  initialDataFetched: boolean;
  loading: boolean;
  completedDates: Record<string, boolean>;
  confettiFiredFor: Record<string, boolean>;
  isTodoModalOpen: boolean;
  editingTodo: Todo | null;
  
  // 로그인/로그아웃 액션 (추가)
  setUser: (user: User | null) => void;
  fetchInitialData: () => Promise<void>;
  updateUserProfile: (userId: string, profileData: Partial<UserMetadata>) => Promise<void>;
  changePassword: (userId: string, newPassword: string) => Promise<void>;
  uploadAvatar: (file: File, userId: string) => Promise<string>;
  
  // 루틴 관련 액션
  addRoutine: (routine: Omit<Routine, 'id' | 'user_id' | 'created_at' | 'updated_at' | 'status' | 'sort_order'> & { user_id?: string }) => Promise<void>;
  updateRoutine: (id: string, routine: Partial<Omit<Routine, 'status'>>) => Promise<void>;
  deleteRoutine: (id: string) => Promise<void>;
  updateRoutineOrder: (orderedRoutines: Routine[]) => Promise<void>;
  toggleRoutineNotification: (routineId: string, currentState: boolean) => Promise<void>;
  setRoutineStatus: (id: string, completed_date: string, status: Routine['status']) => Promise<void>;
  fetchRoutineCompletionsForMonth: (year: number, month: number) => Promise<void>;
  fetchRoutines: () => Promise<void>;
  
  // 할 일 관련 액션
  addTodo: (todoData: Omit<Todo, 'id' | 'createdAt' | 'completed'>) => Promise<void>;
  updateTodo: (id: string, todo: Partial<Omit<Todo, 'id' | 'createdAt'>>) => Promise<void>;
  deleteTodo: (id: string) => Promise<void>;
  toggleTodoCompletion: (id: string) => Promise<void>;
  openTodoModal: (todo?: Todo) => void;
  closeTodoModal: () => void;
  
  // 일기 관련 액션
  addDiary: (diaryData: Omit<Diary, 'id' | 'createdAt' | 'user_id' | 'updated_at'> & { user_id?: string }) => Promise<void>;
  updateDiary: (id: string, diary: Partial<Diary>) => Promise<void>;
  deleteDiary: (id: string) => Promise<void>;
  
  // 날짜 관련 액션
  setCurrentDate: (date: Date) => void;
  calculateCompletedDates: () => void;
  
  // 설정 관련 액션
  updateSettings: (settings: Partial<Omit<Settings, 'theme'>>) => void;
  setConfettiFiredFor: (date: string) => void;
}

// Helper function to map Supabase Auth User to our User type (추가)
const mapSupabaseAuthUserToLocalUser = (supabaseAuthUser: any): User | null => {
  if (!supabaseAuthUser) {
    return null;
  }
  return {
    id: supabaseAuthUser.id,
    email: supabaseAuthUser.email,
    user_metadata: supabaseAuthUser.user_metadata || {}, // user_metadata가 없으면 빈 객체
    created_at: supabaseAuthUser.created_at,
  };
};

// Helper function to map Supabase todo (with is_completed) to our Todo type (with completed)
const mapSupabaseTodoToLocal = (supabaseTodo: any): Todo => {
  const { is_completed, due_date, created_at, ...rest } = supabaseTodo;
  // priority와 tags 관련 로직 제거
  delete rest.priority;
  
  return {
    ...rest,
    dueDate: due_date,
    completed: is_completed,
    createdAt: created_at,
  } as Todo;
};

export const useStore = create<StoreState>((set, get) => ({
  // 초기 상태
  routines: [],
  todos: [],
  diaries: [],
  user: null,
  currentDate: startOfDay(new Date()),
  settings: {
    language: 'ko',
    notifications: true,
    routineReminders: true,
    todoReminders: true,
    reminderTime: 30
  },
  routineInstances: {},
  initialDataFetched: false,
  loading: false,
  completedDates: {},
  confettiFiredFor: {},
  isTodoModalOpen: false,
  editingTodo: null,
  
  setUser: (user) => {
    set({ 
      user,
      initialDataFetched: !user, // 사용자가 있으면 데이터 다시 불러와야 함
    });
    if (!user) {
      set({ routines: [], todos: [], diaries: [], routineInstances: {} });
    }
  },

  fetchInitialData: async () => {
    const user = get().user;
    if (!user || get().loading) {
      set({ initialDataFetched: true });
      return;
    }
    set({ loading: true });
    try {
      const userId = user.id;

      // 여러 데이터를 병렬로 가져옵니다.
      const [
        { data: routinesData, error: routinesError },
        { data: todosData, error: todosError },
        { data: diariesData, error: diariesError },
      ] = await Promise.all([
        supabase.from('routines').select('*').eq('user_id', userId).order('sort_order', { ascending: true }),
        supabase.from('todos').select('*').eq('user_id', userId),
        supabase.from('diary_entries').select('*').eq('user_id', userId),
      ]);

      if (routinesError) throw routinesError;
      if (todosError) throw todosError;
      if (diariesError) throw diariesError;

      // 가져온 데이터로 상태를 업데이트합니다.
      set({
        routines: routinesData || [],
        todos: todosData ? todosData.map(mapSupabaseTodoToLocal) : [],
        diaries: diariesData?.map(d => ({...d, date: d.entry_date, id: d.id.toString() } as Diary)) || [],
      });
      
      // 현재 월의 루틴 완료 기록도 가져옵니다.
      const today = new Date();
      await get().fetchRoutineCompletionsForMonth(today.getFullYear(), today.getMonth() + 1);

    } catch (error) {
        console.error("Error during initial data fetch:", error);
        // 에러 발생 시 데이터 초기화
        set({ routines: [], todos: [], diaries: [] });
    } finally {
        set({ loading: false, initialDataFetched: true });
    }
  },

  updateUserProfile: async (userId, profileData) => {
    const currentUser = get().user;
    if (!currentUser || currentUser.id !== userId) {
      throw new Error("User not authenticated or ID mismatch.");
    }

    // 1. 프로필 정보 업데이트 시도
    const { error: updateError } = await supabase
      .from('custom_users')
      .update(profileData)
      .eq('id', userId);

    if (updateError) {
      console.error('Error phase 1: Updating user profile in DB:', updateError);
      throw updateError; // 여기서 오류 발생 시 PGRST116이 아닐 수 있음
    }

    // 2. 업데이트 성공 후, 최신 프로필 정보 다시 조회
    const { data: refreshedUser, error: selectError } = await supabase
      .from('custom_users')
      .select('id, username, created_at, full_name, avatar_url, bio')
      .eq('id', userId)
      .single();

    if (selectError) {
      console.error('Error phase 2: Selecting updated user profile from DB:', selectError);
      // 여기서 PGRST116 오류가 발생한다면, 업데이트는 되었지만 RLS 등으로 인해 조회가 안되는 상황일 수 있음
      // 또는, 드물게 업데이트 후 조회가 너무 빨라 아직 반영 안된 경우 (일반적이지 않음)
      // 이 경우, 낙관적 업데이트를 고려하거나, 에러 처리 방식을 다르게 할 수 있음
      // 지금은 일단 에러를 throw
      throw selectError; 
    }

    if (refreshedUser) {
      const updatedUser: User = {
        id: refreshedUser.id,
        email: refreshedUser.username,
        user_metadata: {
          name: refreshedUser.username, 
          full_name: refreshedUser.full_name,
          avatar_url: refreshedUser.avatar_url,
          bio: refreshedUser.bio,
        },
        created_at: refreshedUser.created_at,
      };
      
      set({ user: updatedUser });
      localStorage.setItem('loggedInUser', JSON.stringify({
        id: updatedUser.id,
        email: updatedUser.email, 
        name: updatedUser.user_metadata?.full_name || updatedUser.user_metadata?.name, 
        avatar_url: updatedUser.user_metadata?.avatar_url,
      }));
      console.log("[useStore] User profile updated and localStorage synced successfully:", updatedUser);
    } else {
      // 이 경우는 single()에서 오류를 이미 발생시켰어야 함. 이론상 도달하기 어려움.
      console.warn("[useStore] User profile was updated, but could not be re-fetched.");
    }
  },
  
  uploadAvatar: async (file, userId) => {
    if (!file) throw new Error('No file provided for upload.');
    if (!userId) throw new Error('User ID is required for avatar upload.');

    // --- 디버깅 로그 추가 시작 ---
    try {
      console.log('[useStore] Attempting to get user and session for avatar upload...');
      const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();
      if (authError) {
        console.error('[useStore] Error getting auth user for avatar upload:', authError);
      }
      console.log('[useStore] Current authUser from supabase.auth.getUser():', authUser);

      if (authUser) {
          console.log('[useStore] authUser.id from Supabase Auth:', authUser.id, 'vs passed userId (from local store):', userId);
          if (authUser.id !== userId) {
              console.warn('[useStore] MISMATCH: Supabase authUser.id does not match userId from local store!');
          }
      } else {
          console.warn('[useStore] supabase.auth.getUser() returned NULL user before avatar upload.');
      }

      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
      if (sessionError) {
        console.error('[useStore] Error getting session for avatar upload:', sessionError);
      }
      console.log('[useStore] Current session from supabase.auth.getSession():', sessionData?.session);
      if (!sessionData?.session) {
          console.warn('[useStore] supabase.auth.getSession() returned NULL session before avatar upload.');
      }

    } catch (e) {
      console.error('[useStore] Exception while getting auth user/session:', e);
    }
    // --- 디버깅 로그 추가 끝 ---

    const fileExt = file.name.split('.').pop();
    const fileName = `${userId}-${Date.now()}.${fileExt}`;
    const filePath = `${fileName}`;

    console.log(`[useStore] Attempting to upload avatar: ${filePath} for user: ${userId}`);

    const { error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(filePath, file, { 
        cacheControl: '3600', 
        upsert: true 
      });

    if (uploadError) {
      console.error('[useStore] Error uploading avatar:', uploadError);
      throw uploadError;
    }

    console.log(`[useStore] Avatar uploaded successfully: ${filePath}`);

    const { data: publicUrlData } = supabase.storage
      .from('avatars')
      .getPublicUrl(filePath);

    if (!publicUrlData || !publicUrlData.publicUrl) {
        console.error('[useStore] Error getting public URL for avatar:', filePath, publicUrlData);
        throw new Error('Failed to get public URL for uploaded avatar.');
    }
    
    console.log(`[useStore] Public URL for avatar: ${publicUrlData.publicUrl}`);
    return publicUrlData.publicUrl;
  },

  changePassword: async (userId, newPassword) => {
    const currentUser = get().user;
    if (!currentUser || currentUser.id !== userId) {
      throw new Error("User not authenticated or ID mismatch for password change.");
    }
    const { error } = await supabase
      .from('custom_users')
      .update({ password: newPassword })
      .eq('id', userId);

    if (error) {
      console.error('Error updating password in DB:', error);
      throw error;
    }
    console.log("[useStore] Password updated successfully for user:", userId);
  },
  
  // 루틴 관련 액션
  addRoutine: async (routineData) => {
    const user = get().user;
    if (!user) throw new Error("User not authenticated");
    
    const existingRoutines = get().routines;
    const maxSortOrder = existingRoutines.reduce((max, r) => {
      // sort_order가 null이나 undefined가 아닌 숫자일 경우에만 비교
      if (typeof r.sort_order === 'number') {
        return Math.max(max, r.sort_order);
      }
      return max;
    }, -1);

    const dataToInsert = { 
      ...routineData, 
      user_id: user.id,
      daysofweek: Array.isArray(routineData.daysofweek) ? routineData.daysofweek : [],
      trigger: routineData.trigger || undefined,
      startTime: routineData.startTime || undefined,
      endTime: routineData.endTime || undefined,
      sort_order: maxSortOrder + 1,
    };

    const { data, error } = await supabase
      .from('routines')
      .insert([dataToInsert])
      .select()
      .single();
    if (error) {
      console.error('Error adding routine:', error);
      throw error;
    }
    if (data) {
      const newRoutine = { 
        ...data,
        daysofweek: Array.isArray(data.daysofweek) ? data.daysofweek : [],
        status: 'unchecked' // 새로 추가된 루틴은 기본적으로 'unchecked' 상태
      } as Routine;
      set((state) => ({ routines: [...state.routines, newRoutine] }));
    }
  },
  updateRoutine: async (id, routineUpdate) => {
    const user = get().user;
    if (!user) throw new Error("User not authenticated for update");

    const updateToApply: Partial<Omit<Routine, 'status'>> & { user_id?: string } = {
      ...routineUpdate,
      // trigger 또는 time 필드 정리
      trigger: routineUpdate.trigger || undefined,
      startTime: routineUpdate.startTime || undefined,
      endTime: routineUpdate.endTime || undefined,
    };

    if (routineUpdate.hasOwnProperty('daysofweek')) {
      updateToApply.daysofweek = Array.isArray(routineUpdate.daysofweek) ? routineUpdate.daysofweek : [];
    }

    delete (updateToApply as any).daysOfWeek; 

    const { data, error } = await supabase
      .from('routines')
      .update(updateToApply)
      .eq('id', id)
      .eq('user_id', user.id) 
      .select()
      .single();
    if (error) {
      console.error('Error updating routine:', error);
      throw error;
    }
    if (data) {
      const existingRoutine = get().routines.find(r => r.id === id);
      const updatedRoutine = { 
        ...data, 
        daysofweek: Array.isArray(data.daysofweek) ? data.daysofweek : [],
        status: existingRoutine ? existingRoutine.status : 'unchecked' // 기존 status 유지
      } as Routine;
      set(state => ({ routines: state.routines.map(r => r.id === id ? updatedRoutine : r) }));
    }
  },
  deleteRoutine: async (id) => {
    const user = get().user;
    if (!user) throw new Error("User not authenticated for delete");
    const { error } = await supabase
      .from('routines')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id); 
    if (error) {
      console.error('Error deleting routine:', error);
      throw error;
    }
    set(state => ({ routines: state.routines.filter(r => r.id !== id) }));
    const currentInstances = { ...get().routineInstances };
    delete currentInstances[id];
    set({ routineInstances: currentInstances });
  },
  
  setRoutineStatus: async (id, completed_date, status) => {
    const user = get().user;
    if (!user) throw new Error('User not authenticated');

    // DB 업데이트
    const { error: upsertError } = await supabase
      .from('routine_completions')
      .upsert(
        {
          routine_id: id,
          user_id: user.id,
          completed_date: completed_date,
          status: status,
        },
        {
          onConflict: 'routine_id,user_id,completed_date',
        }
      );

    if (upsertError) {
      console.error('Error upserting routine status:', upsertError);
      throw upsertError;
    }

    // 로컬 상태(routineInstances) 업데이트
    const currentInstances = get().routineInstances;
    const routineSpecificInstances = currentInstances[id] || {};
    
    set({
      routineInstances: {
        ...currentInstances,
        [id]: {
          ...routineSpecificInstances,
          [completed_date]: status,
        },
      }
    });
    console.log(`[useStore] Routine instance for ${id} on ${completed_date} set to ${status}`);
  },
  
  // 할 일 관련 액션
  addTodo: async (todoData) => {
    const user = get().user;
    if (!user) throw new Error("User not authenticated");
    
    const dataToInsert = {
      user_id: user.id,
      content: todoData.content,
      due_date: todoData.dueDate,
      is_completed: false,
    };

    const { data: newTodo, error } = await supabase
      .from('todos')
      .insert(dataToInsert)
      .select('*') // 더 이상 tags join 불필요
      .single();

    if (error) {
      console.error('Error adding todo:', error);
      throw error;
    }
    if (newTodo) {
      set(state => ({ todos: [...state.todos, mapSupabaseTodoToLocal(newTodo)] }));
    }
  },
  updateTodo: async (id, updatedFields) => {
    const { content, dueDate } = updatedFields;
    const dataToUpdate: { [key: string]: any } = {};
    if (content) dataToUpdate.content = content;
    if (dueDate) dataToUpdate.due_date = dueDate;
    
    const { data: updatedTodo, error } = await supabase
      .from('todos')
      .update(dataToUpdate)
      .eq('id', id)
      .select('*') // 더 이상 tags join 불필요
      .single();

    if (error) {
      console.error('Error updating todo:', error);
      throw error;
    }
    if (updatedTodo) {
      set(state => ({
        todos: state.todos.map(todo =>
          todo.id === id ? mapSupabaseTodoToLocal(updatedTodo) : todo
        ),
      }));
    }
  },
  deleteTodo: async (id) => {
    const user = get().user;
    if (!user) throw new Error("User not authenticated");
    const { error } = await supabase
      .from('todos')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting todo:', error);
      throw error;
    }
    set(state => ({
      todos: state.todos.filter(todo => todo.id !== id),
    }));
  },
  toggleTodoCompletion: async (id) => {
    const user = get().user;
    if (!user) throw new Error("User not authenticated");
    const todoToToggle = get().todos.find(t => t.id === id);
    if (!todoToToggle) return;

    const newCompletedState = !todoToToggle.completed;

    const { error } = await supabase
      .from('todos')
      .update({ is_completed: newCompletedState })
      .eq('id', id);

    if (error) {
      console.error('Error toggling todo:', error);
      // Optional: Rollback on error
      return;
    }

    set(state => ({
      todos: state.todos.map(todo =>
        todo.id === id ? { ...todo, completed: newCompletedState } : todo
      ),
    }));
  },

  // 일기 관련 액션
  addDiary: async (diaryData) => {
    const user = get().user;
    if (!user) throw new Error("User not authenticated for diary add");
    const { date, ...restOfDiaryData } = diaryData;
    const diaryToInsert = {
      ...restOfDiaryData,
      user_id: user.id,
      entry_date: date,
    };
    const { data: insertedSupabaseDiary, error } = await supabase
      .from('diary_entries')
      .insert(diaryToInsert)
      .select()
      .single();
    if (error) {
      console.error('Error adding diary:', error);
      throw error;
    }
    if (insertedSupabaseDiary) {
      const newLocalDiary = { ...insertedSupabaseDiary, date: insertedSupabaseDiary.entry_date, id: insertedSupabaseDiary.id.toString() } as Diary;
      set(state => ({ diaries: [...state.diaries, newLocalDiary] }));
    }
  },
  updateDiary: async (id, diaryUpdate) => {
    const user = get().user;
    if (!user) throw new Error("User not authenticated for diary update");
    const { date, ...restOfUpdate } = diaryUpdate as any;
    const supabaseDiaryUpdate: any = { ...restOfUpdate };
    if (date !== undefined) {
      supabaseDiaryUpdate.entry_date = date;
    }
    const { data, error } = await supabase
      .from('diary_entries')
      .update(supabaseDiaryUpdate)
      .eq('id', id)
      .eq('user_id', user.id)
      .select()
      .single();
    if (error) {
      console.error('Error updating diary:', error);
      throw error;
    }
    if (data) {
      const updatedLocalDiary = { ...data, date: data.entry_date, id: data.id.toString() } as Diary;
      set(state => ({ diaries: state.diaries.map(d => d.id === id ? updatedLocalDiary : d) }));
    }
  },
  deleteDiary: async (id) => {
    const user = get().user;
    if (!user) throw new Error("User not authenticated for diary delete");
    const { error } = await supabase
      .from('diary_entries')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id);
    if (error) {
      console.error('Error deleting diary:', error);
      throw error;
    }
    set(state => ({ diaries: state.diaries.filter(d => d.id !== id) }));
  },

  // 날짜 관련 액션
  setCurrentDate: (date: Date) => {
    set({ currentDate: date });
    const today = new Date();
    // 만약 월이 바뀌면 해당 월의 데이터를 가져온다.
    if (date.getMonth() !== today.getMonth() || date.getFullYear() !== today.getFullYear()) {
        get().fetchRoutineCompletionsForMonth(date.getFullYear(), date.getMonth() + 1);
    }
  },
  
  // 설정 관련 액션
  updateSettings: (newSettings) => set((state) => ({
    settings: { ...state.settings, ...newSettings }
  })),

  fetchRoutineCompletionsForMonth: async (year, month) => {
    const user = get().user;
    if (!user) return;
    const userId = user.id;

    const startDate = format(startOfMonth(new Date(year, month - 1)), 'yyyy-MM-dd');
    const endDate = format(endOfMonth(new Date(year, month - 1)), 'yyyy-MM-dd');

    const { data, error } = await supabase
      .from('routine_completions')
      .select('routine_id, completed_date, status')
      .eq('user_id', userId)
      .gte('completed_date', startDate)
      .lte('completed_date', endDate);

    if (error) {
      console.error('Error fetching routine completions for month:', error);
      return;
    }

    const newInstances: RoutineInstances = { ...get().routineInstances };
    data.forEach(record => {
      if (!newInstances[record.routine_id]) {
        newInstances[record.routine_id] = {};
      }
      newInstances[record.routine_id][record.completed_date] = record.status as Routine['status'];
    });
    set({ routineInstances: newInstances });
  },

  calculateCompletedDates: () => {
    set((state) => {
      const newCompletedDates: Record<string, boolean> = {};
      // ... (existing logic)
      return { completedDates: newCompletedDates };
    });
  },

  setConfettiFiredFor: (date: string) =>
    set((state) => ({
      confettiFiredFor: {
        ...state.confettiFiredFor,
        [date]: true,
      },
    })),

  fetchRoutines: async () => {
    const user = get().user;
    if (!user) {
        set({ routines: [] });
        return;
    }
    const { data: routinesFromDb, error: routinesError } = await supabase
        .from('routines')
        .select('*')
        .eq('user_id', user.id)
        .order('sort_order', { ascending: true, nullsFirst: false });

    if (routinesError) {
        console.error('Error fetching routines:', routinesError);
        set({ routines: [] });
        throw routinesError;
    } else {
        set({ routines: routinesFromDb || [] });
    }
  },

  toggleRoutineNotification: async (routineId: string, currentState: boolean) => {
    const newNotificationState = !currentState;
    
    // Optimistic update
    set(state => ({
      routines: state.routines.map(r => 
        r.id === routineId ? { ...r, notifications_on: newNotificationState } : r
      )
    }));

    const { error } = await supabase
      .from('routines')
      .update({ notifications_on: newNotificationState })
      .eq('id', routineId);

    if (error) {
      console.error('Error toggling routine notification:', error);
      // Rollback on error
      set(state => ({
        routines: state.routines.map(r =>
          r.id === routineId ? { ...r, notifications_on: currentState } : r
        )
      }));
      throw error;
    }
  },

  updateRoutineOrder: async (orderedRoutines) => {
    const user = get().user;
    if (!user) throw new Error("User not authenticated");

    const updates = orderedRoutines.map((routine, index) => ({
      id: routine.id,
      name: routine.name,
      icon: routine.icon,
      color: routine.color,
      trigger: routine.trigger,
      startTime: routine.startTime,
      endTime: routine.endTime,
      daysofweek: routine.daysofweek,
      user_id: user.id,
      sort_order: index,
    }));

    const { error } = await supabase.from('routines').upsert(updates, {
      onConflict: 'id'
    });

    if (error) {
      console.error('Error updating routine order:', error);
      throw error;
    } else {
      await get().fetchRoutines();
    }
  },

  openTodoModal: (todo) => set({ editingTodo: todo || null, isTodoModalOpen: true }),
  closeTodoModal: () => set({ isTodoModalOpen: false, editingTodo: null }),
}));

// supabase.auth.onAuthStateChange 리스너는 커스텀 로그인 방식과 함께 사용할 경우
// 주의가 필요합니다. 현재는 Supabase의 기본 Auth 세션을 사용하지 않고
// localStorage와 custom_users 테이블을 통해 사용자를 관리하고 있으므로,
// 이 리스너가 예기치 않은 동작을 유발하거나 불필요할 수 있습니다.
// 만약 Supabase Auth (예: 소셜 로그인)와 커스텀 로그인을 함께 사용한다면
// 상태 동기화 로직을 면밀히 검토해야 합니다.
// 지금은 커스텀 로그인만 사용하므로, 이 리스너의 fetchInitialData 호출이
// localStorage 기반 fetchInitialData와 중복 실행될 가능성이 있습니다.
// 편의상 일단 주석 처리하거나, 커스텀 로그인 상태와 Supabase Auth 상태를
// 명확히 분리하여 관리하는 로직으로 변경해야 합니다.
/* supabase.auth.onAuthStateChange(async (event, session) => {
  console.log('Auth event:', event, session);
  const state = useStore.getState();

  if (event === 'SIGNED_IN' || event === 'INITIAL_SESSION') {
    const user = session?.user ? ({
      id: session.user.id,
      email: session.user.email,
      user_metadata: session.user.user_metadata || {},
      created_at: session.user.created_at,
    } as User) : null;
    state.setUser(user);
    await state.fetchInitialData(); // 이 호출이 중복될 수 있음
  } else if (event === 'SIGNED_OUT') {
    state.setUser(null);
    await state.fetchInitialData(); 
  }
}); */