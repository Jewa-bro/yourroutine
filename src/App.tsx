import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import Layout from './components/layout/Layout';
import ProtectedRoute from './components/auth/ProtectedRoute';
import Dashboard from './pages/Dashboard';
import RoutinePage from './pages/RoutinePage';
import NewRoutinePage from './pages/NewRoutinePage';
import RoutineCheckPage from './pages/RoutineCheckPage';
import CalendarPage from './pages/CalendarPage';
import StatisticsPage from './pages/StatisticsPage';
import ProfilePage from './pages/ProfilePage';
import SettingsPage from './pages/SettingsPage';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import DiaryFormPage from './pages/DiaryFormPage';
import TodoFormModal from './components/todos/TodoFormModal';
import { useStore } from './store/useStore';
import { Routine } from './types';
import { format, startOfDay } from 'date-fns';
import { supabase } from './lib/supabaseClient';

function App() {
  const { user, setUser, fetchInitialData } = useStore();
  const [isAuthReady, setAuthReady] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // 1. 앱 시작 시 Supabase 세션을 확인하여 자동 로그인 처리
    const checkUserSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        setUser(session.user); // Zustand 스토어에 사용자 정보 저장
        await fetchInitialData(); // 사용자 관련 모든 데이터 불러오기
      }
      setAuthReady(true); // 인증 상태 준비 완료
    };

    checkUserSession();

    // 2. 인증 상태 변경 감지 (로그인/로그아웃)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setUser(session?.user ?? null); // 로그인/로그아웃 시 스토어 업데이트
        if (_event === 'SIGNED_IN') {
          fetchInitialData();
          navigate('/dashboard');
        }
        if (_event === 'SIGNED_OUT') {
          navigate('/login');
        }
      }
    );

    // 3. 컴포넌트 언마운트 시 구독 해제
    return () => subscription.unsubscribe();
  }, [setUser, fetchInitialData, navigate]);

  // isClient 로직은 그대로 유지
  const [isClient, setIsClient] = useState(false);
  useEffect(() => {
    setIsClient(true);
  }, []);

  // 인증 상태가 준비되지 않았으면 로딩 스피너 표시
  if (!isAuthReady) {
    return (
      <div className="w-full h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 antialiased">
      <TodoFormModal />
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />
        <Route element={<ProtectedRoute />}>
          <Route element={<Layout />}>
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