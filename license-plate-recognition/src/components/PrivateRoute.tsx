import React from 'react';
import { Navigate } from 'react-router-dom';

interface PrivateRouteProps {
  children: React.ReactNode;
  allowedRoles: string[];
}

const PrivateRoute: React.FC<PrivateRouteProps> = ({ children, allowedRoles }) => {
  const userRole = localStorage.getItem('userRole');
  const isAuthenticated = !!userRole;
  const hasRequiredRole = allowedRoles.includes(userRole || '');

  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }

  if (!hasRequiredRole) {
    return <Navigate to="/" />;
  }

  return <>{children}</>;
};

export default PrivateRoute;
