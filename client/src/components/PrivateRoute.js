// client/src/components/PrivateRoute.js
import React, { useContext } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import AuthContext from '../context/AuthContext';
import { MotorProvider } from '../context/MotorContext';

const PrivateRoute = () => {
  const { user, loading } = useContext(AuthContext);

  if (loading) {
    return <div>Loading...</div>; // Or a spinner component
  }

  if (!user){
    <Navigate to="/login" />
  }

  return(
    <MotorProvider>
      <Outlet />
    </MotorProvider>
  );
};

export default PrivateRoute;
