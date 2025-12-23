import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { isTokenExpired } from '../utils/auth';

interface PrivateRouteProps {
  children: React.ReactNode;
}

const PrivateRoute: React.FC<PrivateRouteProps> = ({ children }) => {
  const location = useLocation();
  const token = localStorage.getItem('authToken');

  if (!token || isTokenExpired(token)) {
    // Clear expired token
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
    
    // Redirect to login page with return url
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
};

export default PrivateRoute;