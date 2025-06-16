import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useStore } from '../../store/useStore';

const ProtectedRoute: React.FC = () => {
  const user = useStore(state => state.user);
  const isLoading = useStore(state => state.isLoading);
  
  if (isLoading) {
    return (
      <div className="w-full h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
};

export default ProtectedRoute; 