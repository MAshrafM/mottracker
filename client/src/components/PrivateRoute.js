// client/src/components/PrivateRoute.js
import React, { useContext } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import AuthContext from '../context/AuthContext';
import { MotorProvider } from '../context/MotorContext';

const PrivateRoute = () => {
  const { user, loading } = useContext(AuthContext);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-800 flex items-center justify-center">
        <div className="bg-white/10 backdrop-blur-lg rounded-xl border border-white/20 p-8 shadow-xl flex items-center space-x-3">
          <div className="w-6 h-6 border-2 border-blue-400 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-white text-lg">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return (
    <MotorProvider>
      <Outlet />
    </MotorProvider>
  );
};

export default PrivateRoute;
