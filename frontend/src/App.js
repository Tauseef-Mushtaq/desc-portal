import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import { SocketProvider } from './context/SocketContext';

// Pages
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import HomePage from './pages/HomePage';
import CitizenDashboard from './pages/CitizenDashboard';
import SubmitRequest from './pages/SubmitRequest';
import RequestTracking from './pages/RequestTracking';
import RequestDetail from './pages/RequestDetail';
import AdminDashboard from './pages/AdminDashboard';
import AdminRequests from './pages/AdminRequests';
import AdminRequestDetail from './pages/AdminRequestDetail';
import ProfilePage from './pages/ProfilePage';
import NotFound from './pages/NotFound';

const PrivateRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return <LoadingScreen />;
  return user ? children : <Navigate to="/login" replace />;
};

const AdminRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return <LoadingScreen />;
  if (!user) return <Navigate to="/login" replace />;
  if (user.role !== 'admin') return <Navigate to="/dashboard" replace />;
  return children;
};

const PublicRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return <LoadingScreen />;
  if (user) return <Navigate to={user.role === 'admin' ? '/admin' : '/dashboard'} replace />;
  return children;
};

const LoadingScreen = () => (
  <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4">
    <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center">
      <span className="material-symbols-outlined text-white">account_balance</span>
    </div>
    <div className="flex items-center gap-2">
      <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
      <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
      <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
    </div>
    <p className="text-on-surface-variant text-sm">Loading DESC Portal...</p>
  </div>
);

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/home" replace />} />
      <Route path="/login" element={<PublicRoute><LoginPage /></PublicRoute>} />
      <Route path="/register" element={<PublicRoute><RegisterPage /></PublicRoute>} />
      <Route path="/home" element={<PrivateRoute><HomePage /></PrivateRoute>} />
      <Route path="/dashboard" element={<PrivateRoute><CitizenDashboard /></PrivateRoute>} />
      <Route path="/submit-request" element={<PrivateRoute><SubmitRequest /></PrivateRoute>} />
      <Route path="/track-status" element={<PrivateRoute><RequestTracking /></PrivateRoute>} />
      <Route path="/requests/:id" element={<PrivateRoute><RequestDetail /></PrivateRoute>} />
      <Route path="/profile" element={<PrivateRoute><ProfilePage /></PrivateRoute>} />
      <Route path="/admin" element={<AdminRoute><AdminDashboard /></AdminRoute>} />
      <Route path="/admin/requests" element={<AdminRoute><AdminRequests /></AdminRoute>} />
      <Route path="/admin/requests/:id" element={<AdminRoute><AdminRequestDetail /></AdminRoute>} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <SocketProvider>
        <BrowserRouter>
          <AppRoutes />
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 4000,
              style: { fontFamily: 'Inter, sans-serif', fontSize: '14px', borderRadius: '10px' },
              success: { iconTheme: { primary: '#002045', secondary: '#fff' } },
            }}
          />
        </BrowserRouter>
      </SocketProvider>
    </AuthProvider>
  );
}
