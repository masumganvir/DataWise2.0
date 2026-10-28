/**
 * DataWise AI — Protected Route Guard
 * Redirects unauthenticated users to /login.
 * Waits for both the auth store AND Clerk to finish loading before deciding.
 */

import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../services/authStore';
import { useUser } from '@clerk/clerk-react';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuthStore();
  const { isLoaded: clerkLoaded } = useUser();
  const location = useLocation();

  // Wait for Clerk initialization AND our own auth store to settle
  if (!clerkLoaded || isLoading) {
    return (
      <div
        style={{
          minHeight: '100vh',
          background: 'var(--bg-primary, #0a0f1a)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <div style={{
          width: 40, height: 40,
          border: '2px solid var(--primary, #6366f1)',
          borderTopColor: 'transparent',
          borderRadius: '50%',
          animation: 'spin 0.8s linear infinite',
          marginBottom: 16,
        }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        <p style={{ color: 'var(--text-secondary, #94a3b8)', fontSize: 12, fontFamily: 'var(--font-mono, monospace)' }}>
          Restoring session…
        </p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
};
