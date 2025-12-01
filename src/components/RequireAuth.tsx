import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { UserRole } from '@/types/database';
import LoadingFallback from './LoadingFallback';

interface RequireAuthProps {
  children: React.ReactNode;
  requiredRole?: UserRole | UserRole[];
}

/**
 * RequireAuth Component
 * Protects routes by requiring authentication and optionally a specific role
 * 
 * CRITICAL: Do NOT redirect while loading is true - this prevents flash of login page
 * during initial session check. Instead, show a loading spinner.
 * 
 * Usage:
 *   <Route path="/producer" element={<RequireAuth><Layout /></RequireAuth>} />
 *   <Route path="/admin" element={<RequireAuth requiredRole="admin"><Layout /></RequireAuth>} />
 */
const RequireAuth: React.FC<RequireAuthProps> = ({ children, requiredRole }) => {
  const { session, user, role, loading } = useAuth();

  // CRITICAL: Show loading state while checking authentication
  // Do NOT redirect during loading - this prevents flash of login page
  if (loading) {
    return <LoadingFallback />;
  }

  // If no session, redirect to login
  if (!session || !user) {
    return <Navigate to="/login" replace />;
  }

  // If user has no role, show error message
  if (!role) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center max-w-md mx-auto px-4">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <h2 className="text-xl font-bold text-red-900 mb-2">Account Setup Required</h2>
            <p className="text-red-700 mb-4">
              Your account does not have an assigned role. Please contact support to complete your account setup.
            </p>
            <button
              onClick={() => {
                // Sign out and redirect to login
                window.location.href = '/login';
              }}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              Return to Login
            </button>
          </div>
        </div>
      </div>
    );
  }

  // If role is required, check if user has it
  if (requiredRole) {
    const allowedRoles = Array.isArray(requiredRole) ? requiredRole : [requiredRole];
    
    if (!allowedRoles.includes(role)) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="text-center max-w-md mx-auto px-4">
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
              <h2 className="text-xl font-bold text-yellow-900 mb-2">Access Denied</h2>
              <p className="text-yellow-700 mb-4">
                This page requires one of the following roles: {allowedRoles.join(', ')}.
                Your current role: {role}
              </p>
              <button
                onClick={() => {
                  window.location.href = '/producer/dashboard';
                }}
                className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors"
              >
                Go to Dashboard
              </button>
            </div>
          </div>
        </div>
      );
    }
  }

  // User is authenticated and has required role (if specified)
  return <>{children}</>;
};

export default RequireAuth;

