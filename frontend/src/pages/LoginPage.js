import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import AuthLayout from '../components/layout/AuthLayout';
import toast from 'react-hot-toast';

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const user = await login(form.email, form.password);
      toast.success(`Welcome back, ${user.fullName.split(' ')[0]}!`);
      navigate(user.role === 'admin' ? '/admin' : '/home');
    } catch (err) {
      const msg = err.response?.data?.message || 'Login failed. Please try again.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout mode="login">
      <div className="text-center mb-8">
        <div className="inline-flex p-4 bg-primary rounded-full mb-4 shadow-lg">
          <span className="material-symbols-outlined text-white" style={{ fontSize: 36 }}>verified_user</span>
        </div>
        <h1 className="text-3xl font-bold text-primary mb-2">Secure Access</h1>
        <p className="text-on-surface-variant text-sm max-w-sm mx-auto">
          Enter your credentials to access DESC digital services and track your citizen requests.
        </p>
      </div>

      <div className="card p-8">
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Email */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-on-surface-variant uppercase tracking-wide">Email Address</label>
            <div className="relative">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant" style={{ fontSize: 18 }}>mail</span>
              <input
                type="email"
                required
                placeholder="name@example.com"
                className="input-field pl-10"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
              />
            </div>
          </div>

          {/* Password */}
          <div className="space-y-1.5">
            <div className="flex justify-between">
              <label className="text-xs font-semibold text-on-surface-variant uppercase tracking-wide">Password</label>
              <a href="#" className="text-xs text-primary hover:underline">Forgot Password?</a>
            </div>
            <div className="relative">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant" style={{ fontSize: 18 }}>lock</span>
              <input
                type={showPwd ? 'text' : 'password'}
                required
                placeholder="••••••••"
                className="input-field pl-10 pr-12"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
              />
              <button
                type="button"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-primary"
                onClick={() => setShowPwd(!showPwd)}
              >
                <span className="material-symbols-outlined" style={{ fontSize: 18 }}>
                  {showPwd ? 'visibility_off' : 'visibility'}
                </span>
              </button>
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="flex items-start gap-2 p-3 bg-error-container text-on-error-container rounded-lg text-sm">
              <span className="material-symbols-outlined text-error flex-shrink-0" style={{ fontSize: 18 }}>error</span>
              {error}
            </div>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="btn-primary w-full flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed mt-2"
          >
            {loading ? (
              <>
                <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Signing In...
              </>
            ) : (
              <>
                Sign In
                <span className="material-symbols-outlined" style={{ fontSize: 18 }}>login</span>
              </>
            )}
          </button>
        </form>

        <div className="mt-8 text-center">
          <div className="flex items-center gap-4 mb-6">
            <div className="flex-1 h-px bg-outline-variant" />
            <span className="text-xs text-on-surface-variant">OR</span>
            <div className="flex-1 h-px bg-outline-variant" />
          </div>
          <p className="text-sm text-on-surface-variant">
            Don't have an account?{' '}
            <Link to="/register" className="text-primary font-bold hover:underline">Register New Account</Link>
          </p>
        </div>
      </div>
    </AuthLayout>
  );
}
