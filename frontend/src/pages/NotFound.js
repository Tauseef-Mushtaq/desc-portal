import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function NotFound() {
  const { user } = useAuth();
  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
      <div className="text-center max-w-md">
        <div className="w-24 h-24 bg-primary-fixed rounded-full flex items-center justify-center mx-auto mb-6">
          <span className="material-symbols-outlined text-primary" style={{ fontSize: 48 }}>search_off</span>
        </div>
        <h1 className="text-6xl font-bold text-primary mb-2">404</h1>
        <h2 className="text-xl font-semibold text-on-surface mb-3">Page Not Found</h2>
        <p className="text-on-surface-variant text-sm mb-8">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <Link
          to={user ? (user.role === 'admin' ? '/admin' : '/home') : '/login'}
          className="btn-primary inline-flex items-center gap-2"
        >
          <span className="material-symbols-outlined" style={{ fontSize: 18 }}>home</span>
          Go Home
        </Link>
      </div>
    </div>
  );
}
