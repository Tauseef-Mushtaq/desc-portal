import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import AuthLayout from '../components/layout/AuthLayout';
import toast from 'react-hot-toast';

export default function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ fullName: '', email: '', password: '', confirmPassword: '', phone: '', cnic: '', address: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.password !== form.confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    setError('');
    setLoading(true);
    try {
      await register(form);
      toast.success('Account created successfully!');
      navigate('/home');
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  const update = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  return (
    <AuthLayout mode="register">
      <div className="text-center mb-8">
        <div className="inline-flex p-4 bg-primary rounded-full mb-4 shadow-lg">
          <span className="material-symbols-outlined text-white" style={{ fontSize: 36 }}>person_add</span>
        </div>
        <h1 className="text-3xl font-bold text-primary mb-2">Create Account</h1>
        <p className="text-on-surface-variant text-sm">Register to access DESC digital services</p>
      </div>

      <div className="card p-8">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5 md:col-span-2">
              <label className="text-xs font-semibold text-on-surface-variant uppercase tracking-wide">Full Name *</label>
              <input type="text" required className="input-field" placeholder="Ahmed Hassan" value={form.fullName} onChange={update('fullName')} />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-on-surface-variant uppercase tracking-wide">Email *</label>
              <input type="email" required className="input-field" placeholder="name@example.com" value={form.email} onChange={update('email')} />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-on-surface-variant uppercase tracking-wide">Phone</label>
              <input type="tel" className="input-field" placeholder="0300-0000000" value={form.phone} onChange={update('phone')} />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-on-surface-variant uppercase tracking-wide">CNIC</label>
              <input type="text" className="input-field" placeholder="16101-1234567-1" value={form.cnic} onChange={update('cnic')} />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-on-surface-variant uppercase tracking-wide">Password *</label>
              <input type="password" required minLength={6} className="input-field" placeholder="Min. 6 characters" value={form.password} onChange={update('password')} />
            </div>
            <div className="space-y-1.5 md:col-span-2">
              <label className="text-xs font-semibold text-on-surface-variant uppercase tracking-wide">Confirm Password *</label>
              <input type="password" required className="input-field" placeholder="Repeat password" value={form.confirmPassword} onChange={update('confirmPassword')} />
            </div>
            <div className="space-y-1.5 md:col-span-2">
              <label className="text-xs font-semibold text-on-surface-variant uppercase tracking-wide">Address</label>
              <input type="text" className="input-field" placeholder="House No., Street, Area - Mardan" value={form.address} onChange={update('address')} />
            </div>
          </div>

          {error && (
            <div className="flex items-center gap-2 p-3 bg-error-container text-on-error-container rounded-lg text-sm">
              <span className="material-symbols-outlined text-error" style={{ fontSize: 18 }}>error</span>
              {error}
            </div>
          )}

          <button type="submit" disabled={loading} className="btn-primary w-full flex items-center justify-center gap-2 disabled:opacity-60 mt-2">
            {loading ? 'Creating Account...' : 'Create Account'}
          </button>
        </form>

        <p className="text-center text-sm text-on-surface-variant mt-6">
          Already have an account?{' '}
          <Link to="/login" className="text-primary font-bold hover:underline">Sign In</Link>
        </p>
      </div>
    </AuthLayout>
  );
}
