// Mood 타입 정의 추가
export type Mood = 'great' | 'good' | 'neutral' | 'bad' | 'terrible';

// 루틴 타입 정의
export interface Routine {
  id: string;
  user_id: string;
  name: string;
  icon?: string;
  color?: string;
  daysofweek: number[]; // 0: 일요일, 1: 월요일, ... 6: 토요일
  trigger?: string;
  startTime?: string | null;
  endTime?: string | null;
  status: 'completed' | 'skipped' | 'unchecked'; // 새로운 상태 필드
  created_at: string;
  updated_at: string;
  sort_order: number;
  notifications_on: boolean;
}

// 루틴 인스턴스 타입 정의
export interface RoutineInstances {
  [routineId: string]: {
    [date: string]: 'completed' | 'skipped' | 'pending' | 'unchecked';
  };
}

// 할 일(투두) 타입 정의
export interface Todo {
  id: string;
  content: string;
  dueDate: string;
  completed: boolean;
  createdAt: string;
}

// 일기 타입 정의
export interface Diary {
  id: string;
  user_id: string;
  date: string;
  title?: string;
  content: string;
  mood: Mood; // 기존 유니언 타입 대신 Mood 타입 사용
  createdAt: string;
}

// 사용자 메타데이터 타입 정의 (수정)
export interface UserMetadata {
  full_name?: string; // 기존 name 대신 full_name 사용 또는 둘 다 optional
  name?: string;      // 호환성을 위해 남겨두거나, full_name으로 통일 고려
  avatar_url?: string;
  bio?: string;       // 자기소개 필드 추가
  [key: string]: any; 
}

// 사용자 타입 정의 (수정)
export interface User {
  id: string;
  email?: string;       
  user_metadata?: UserMetadata; 
  created_at?: string;  
}

// 통계 데이터 타입 정의
export interface Statistics {
  routineCompletionRate: number;
  todoCompletionRate: number;
  dailyCompletionHistory: {
    date: string;
    routineRate: number;
    todoRate: number;
  }[];
  weeklyCompletionHistory: {
    week: string;
    routineRate: number;
    todoRate: number;
  }[];
  monthlyCompletionHistory: {
    month: string;
    routineRate: number;
    todoRate: number;
  }[];
}

// 설정 타입 정의
export interface Settings {
  language: string;
  notifications: boolean;
  routineReminders: boolean;
  todoReminders: boolean;
  reminderTime: number; // 예: 30 (분)
}

export interface Notification {
  id: string;
  user_id: string;
  title: string;
  body: string;
  url?: string;
  is_read: boolean;
  created_at: string;
}