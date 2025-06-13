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

function App() {
  const { user, routines, fetchInitialData, initialDataFetched } = useStore();
  const navigate = useNavigate();
  const location = useLocation();
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);
  
  useEffect(() => {
    if (!isClient || initialDataFetched) {
      return;
    }

    if (user || localStorage.getItem('loggedInUser')) {
      console.log('[App.tsx] Initial data fetch triggered.');
        fetchInitialData();
    }
  }, [user, fetchInitialData, initialDataFetched, isClient]);

  useEffect(() => {
    if (!isClient || !(user && routines.length > 0)) {
        console.log('[App.tsx] Redirect check skipped (not client, or no user/routines). User:', user, 'Routines length:', routines.length, 'Pathname:', location.pathname);
        return;
    }

    console.log('[App.tsx] Redirect check effect (client-side). User:', user, 'Routines length:', routines.length, 'Pathname:', location.pathname);

      const now = new Date();
      const currentHour = now.getHours();
      const currentMinutes = now.getMinutes();
      let foundUncheckedPastRoutine = false;

      for (const routine of routines) {
      const createdAt = startOfDay(new Date(routine.created_at));
      if (startOfDay(now) < createdAt) {
        continue;
      }
      
        const todayDayOfWeek = now.getDay();
        const isToday = routine.daysofweek && routine.daysofweek.includes(todayDayOfWeek);
        const isUnchecked = routine.status === 'unchecked';
        
        if (!isUnchecked || !isToday) continue;

      if (typeof routine.endTime !== 'string' || !routine.endTime.includes(':')) {
        console.warn(`[App.tsx] Invalid or missing endTime for routine: ${routine.name}`);
        continue;
      }

        const [routineHour, routineMinutes] = routine.endTime.split(':').map(Number);
      
      if (isNaN(routineHour) || isNaN(routineMinutes)) {
        console.warn(`[App.tsx] Could not parse endTime for routine: ${routine.name} (endTime: ${routine.endTime})`);
        continue;
      }

        const isPastDue = routineHour < currentHour || (routineHour === currentHour && routineMinutes < currentMinutes);

        console.log(`[App.tsx] Checking routine: ${routine.name}, Status: ${routine.status}, Today: ${isToday}, Unchecked: ${isUnchecked}, Ends: ${routine.endTime}, PastDue: ${isPastDue}`);

        if (isPastDue) {
          foundUncheckedPastRoutine = true;
          break; 
        }
      }
      
      console.log('[App.tsx] hasUncheckedPastRoutines:', foundUncheckedPastRoutine);

      if (foundUncheckedPastRoutine && location.pathname !== '/routine-check' && location.pathname !== '/login' && location.pathname !== '/signup') {
        console.log('[App.tsx] Navigating to /routine-check because of unchecked past routines.');
        navigate('/routine-check', { replace: true });
      } else {
      console.log('[App.tsx] No navigation needed or already on a restricted page for past routines.');
    }

  }, [user, routines, location.pathname, navigate, isClient]);

  return (
    <div className="min-h-screen bg-gray-50">
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