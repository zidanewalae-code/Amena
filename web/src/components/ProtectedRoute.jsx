import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../lib/auth';
import { canAccessRoute, getDashboardPath } from '../lib/access';

export default function ProtectedRoute({ children, roles, redirectTo }) {
  const { ready, isAuthed, user } = useAuth();

  if (!ready) {
    return <div className="page-loading">Loading...</div>;
  }

  if (!isAuthed) {
    return <Navigate to="/login" replace />;
  }

  if (!canAccessRoute(user?.role, roles)) {
    return <Navigate to={redirectTo || getDashboardPath(user?.role)} replace />;
  }

  return children;
}