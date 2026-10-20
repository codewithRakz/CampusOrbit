import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { type UserRole } from '../services/auth';
import Logo from './Logo';
import { Loader2, ShieldAlert } from 'lucide-react';

interface ProtectedRouteProps {
  children: React.ReactElement;
  allowedRoles?: UserRole[];
}

export default function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
  const { user, isLoading } = useAuth();
  const location = useLocation();

  // 1. While auth state is initializing from server, show a clean, non-flashing loader
  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#F4F7FB] flex flex-col items-center justify-center p-4">
        <div className="flex flex-col items-center gap-4">
          <Logo size={42} />
          <div className="flex items-center gap-2 text-sm font-medium text-slate-500">
            <Loader2 size={18} className="animate-spin text-[#2878B8]" />
            <span>Verifying session...</span>
          </div>
        </div>
      </div>
    );
  }

  // 2. If unauthenticated, redirect to login while preserving the attempted location
  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // 3. If role restriction is configured and current user lacks role, handle redirection/access-denied
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    const getTargetDashboard = (role: UserRole) => {
      switch (role) {
        case 'student':
          return '/student/dashboard';
        case 'faculty':
          return '/faculty/dashboard';
        case 'placement_officer':
        case 'admin':
          return '/placement/dashboard';
        default:
          return '/';
      }
    };

    return (
      <div className="min-h-screen bg-[#F4F7FB] flex flex-col items-center justify-center p-4 text-[#14243A]">
        <div className="max-w-md w-full bg-white p-8 rounded-2xl border border-slate-200/90 shadow-xs text-center space-y-4">
          <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto">
            <ShieldAlert size={24} />
          </div>
          <h2 className="text-xl font-bold">Access Restricted</h2>
          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
            This module is restricted to authorized campus roles. Your current account has the role of{' '}
            <span className="font-semibold text-[#14243A] uppercase tracking-wider text-xs">
              {user.role.replace('_', ' ')}
            </span>.
          </p>
          <div className="pt-2">
            <Navigate to={getTargetDashboard(user.role)} replace />
          </div>
        </div>
      </div>
    );
  }

  return children;
}
