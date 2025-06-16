import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import Layout from './components/layout/Layout';
import ProtectedRoute from './components/auth/ProtectedRoute';
import Dashboard from './pages/Dashboard';
import RoutinePage from './pages/RoutinePage';
import NewRoutinePage from './pages/NewRoutinePage';
import RoutineCheckPage from './pages/RoutineCheckPage';
import CalendarPage from './pages/CalendarPage';
import ProfilePage from './pages/ProfilePage';
import SettingsPage from './pages/SettingsPage';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import DiaryFormPage from './pages/DiaryFormPage';
import TodoFormModal from './components/todos/TodoFormModal';
import { useStore } from './store/useStore';
import { supabase } from './lib/supabaseClient';
import { useNotificationScheduler } from './hooks/useNotificationScheduler';
import { requestNotificationPermission, subscribeToPushNotifications } from './utils/notification';

function NotificationScheduler() {
  // settings.notifications와 settings.routineReminders가 모두 true일 때만 스케줄러 훅을 활성화
  // 조건부 로직은 훅 내부로 이동했습니다.
  useNotificationScheduler();

  return null; // 이 컴포넌트는 UI를 렌더링하지 않음
}

function App() {
  const { user, fetchAndSetUser, fetchInitialData, isLoading } = useStore(state => ({
    user: state.user,
    fetchAndSetUser: state.fetchAndSetUser,
    fetchInitialData: state.fetchInitialData,
    isLoading: state.isLoading,
  }));
  const navigate = useNavigate();
  const location = useLocation();
  
  useEffect(() => {
    // 서비스 워커 등록
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/service-worker.js')
        .then(registration => console.log('Service Worker registered:', registration))
        .catch(error => console.log('Service Worker registration failed:', error));
    }
  }, []);

  useEffect(() => {
    // 1. Supabase의 인증 상태 변경을 감지하는 리스너 설정
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      // 리스너는 오직 현재 사용자 정보를 스토어에 업데이트하는 역할만 수행
      // 로그인 시 session.user가, 로그아웃 시 null이 전달됨
      fetchAndSetUser(session?.user ?? null);
    });

    // 컴포넌트가 사라질 때 리스너 정리
    return () => subscription.unsubscribe();
  }, [fetchAndSetUser]);

  useEffect(() => {
    if (user) {
      requestNotificationPermission().then(granted => {
        if (granted) {
          console.log("Notification permission granted. Subscribing to push notifications.");
          subscribeToPushNotifications();
        }
      });
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      if (location.pathname === '/login' || location.pathname === '/signup') {
        navigate('/dashboard', { replace: true });
      }
      fetchInitialData();
    }
  }, [user, fetchInitialData, navigate, location.pathname]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <div className="min-h-screen bg-gray-50 antialiased">
      <Toaster position="top-center" reverseOrder={false} />
      <TodoFormModal />
      <NotificationScheduler />
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />
        <Route element={<ProtectedRoute />}>
          <Route element={<Layout handleSignOut={handleSignOut} />}>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/routines" element={<RoutinePage />} />
          <Route path="/routines/new" element={<NewRoutinePage />} />
          <Route path="/routines/edit/:id" element={<NewRoutinePage />} />
          <Route path="/routine-check" element={<RoutineCheckPage />} />
          <Route path="/diary/new" element={<DiaryFormPage />} />
          <Route path="/diary/edit/:diaryId" element={<DiaryFormPage />} />
          <Route path="/calendar" element={<CalendarPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/settings" element={<SettingsPage />} />
          </Route>
        </Route>
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </div>
  );
}

const AppWrapper = () => (
  <Router>
    <App />
  </Router>
);

export default AppWrapper;