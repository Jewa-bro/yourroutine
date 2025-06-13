import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useStore } from '../../store/useStore';

const ProtectedRoute: React.FC = () => {
  const { user } = useStore();

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />; // 자식 라우트들을 렌더링합니다.
};

export default ProtectedRoute; 