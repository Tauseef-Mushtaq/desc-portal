import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import AppLayout from '../components/layout/AppLayout';

const services = [
  { icon: 'water_drop', label: 'Water Supply', color: 'bg-blue-50 text-blue-700', to: '/submit-request' },
  { icon: 'bolt', label: 'Electricity', color: 'bg-yellow-50 text-yellow-700', to: '/submit-request' },
  { icon: 'road', label: 'Road Maintenance', color: 'bg-stone-50 text-stone-700', to: '/submit-request' },
  { icon: 'plumbing', label: 'Sewerage', color: 'bg-teal-50 text-teal-700', to: '/submit-request' },
  { icon: 'description', label: 'Birth Certificate', color: 'bg-green-50 text-green-700', to: '/submit-request' },
  { icon: 'receipt_long', label: 'Property Tax', color: 'bg-purple-50 text-purple-700', to: '/submit-request' },
];

export default function HomePage() {
  const { user } = useAuth();

  return (
    <AppLayout>
      <div className="pb-20 lg:pb-8">
        {/* Hero */}
        <section className="relative bg-primary overflow-hidden">
          <div className="absolute inset-0 opacity-10">
            <svg viewBox="0 0 1000 400" className="w-full h-full">
              <circle cx="800" cy="-50" r="300" fill="white" />
              <circle cx="1000" cy="300" r="200" fill="white" />
              <circle cx="100" cy="350" r="150" fill="white" />
            </svg>
          </div>
          <div className="relative z-10 px-4 md:px-16 py-16 max-w-portal mx-auto">
            <p className="text-primary-fixed/80 text-sm font-medium mb-2 uppercase tracking-wider">DESC — Mardan, KPK</p>
            <h1 className="text-3xl md:text-5xl font-bold text-white mb-4 leading-tight">
              Empowering the<br />Citizens of Mardan
            </h1>
            <p className="text-white/80 text-base md:text-lg max-w-lg mb-8">
              Access government services, track your applications, and stay informed with the official digital gateway.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link to="/submit-request" className="bg-white text-primary font-semibold px-6 py-3 rounded-lg hover:bg-primary-fixed transition-all active:scale-95 shadow-lg">
                Submit a Request
              </Link>
              <Link to="/track-status" className="bg-white/10 backdrop-blur border border-white/30 text-white font-semibold px-6 py-3 rounded-lg hover:bg-white/20 transition-all">
                Track Status
              </Link>
            </div>
          </div>
        </section>

        {/* Quick Actions */}
        <section className="px-4 md:px-16 max-w-portal mx-auto -mt-6 relative z-10">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Link to="/submit-request" className="card p-6 flex items-center gap-4 hover:shadow-md transition-all group cursor-pointer">
              <div className="w-12 h-12 bg-primary rounded-xl flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                <span className="material-symbols-outlined text-white" style={{ fontSize: 22 }}>add_circle</span>
              </div>
              <div>
                <h3 className="font-semibold text-on-surface">New Request</h3>
                <p className="text-sm text-on-surface-variant">Submit a service request</p>
              </div>
              <span className="material-symbols-outlined text-on-surface-variant ml-auto group-hover:translate-x-1 transition-transform" style={{ fontSize: 20 }}>chevron_right</span>
            </Link>

            <Link to="/track-status" className="card p-6 flex items-center gap-4 hover:shadow-md transition-all group cursor-pointer">
              <div className="w-12 h-12 bg-secondary-container rounded-xl flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                <span className="material-symbols-outlined text-on-secondary-container" style={{ fontSize: 22 }}>history</span>
              </div>
              <div>
                <h3 className="font-semibold text-on-surface">Track Status</h3>
                <p className="text-sm text-on-surface-variant">Monitor your requests</p>
              </div>
              <span className="material-symbols-outlined text-on-surface-variant ml-auto group-hover:translate-x-1 transition-transform" style={{ fontSize: 20 }}>chevron_right</span>
            </Link>

            <Link to="/dashboard" className="card p-6 flex items-center gap-4 hover:shadow-md transition-all group cursor-pointer">
              <div className="w-12 h-12 bg-tertiary-fixed rounded-xl flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                <span className="material-symbols-outlined text-tertiary" style={{ fontSize: 22 }}>grid_view</span>
              </div>
              <div>
                <h3 className="font-semibold text-on-surface">Dashboard</h3>
                <p className="text-sm text-on-surface-variant">View your overview</p>
              </div>
              <span className="material-symbols-outlined text-on-surface-variant ml-auto group-hover:translate-x-1 transition-transform" style={{ fontSize: 20 }}>chevron_right</span>
            </Link>
          </div>
        </section>

        {/* Services Grid */}
        <section className="px-4 md:px-16 max-w-portal mx-auto mt-10">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="text-xl font-bold text-on-surface">Available Services</h2>
              <p className="text-sm text-on-surface-variant mt-1">Select a service category to get started</p>
            </div>
            <Link to="/submit-request" className="text-sm text-primary font-medium hover:underline hidden md:flex items-center gap-1">
              View All <span className="material-symbols-outlined" style={{ fontSize: 16 }}>arrow_forward</span>
            </Link>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {services.map((svc) => (
              <Link
                key={svc.label}
                to={svc.to}
                className="card p-4 flex flex-col items-center gap-3 hover:shadow-md transition-all group text-center"
              >
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${svc.color} group-hover:scale-110 transition-transform`}>
                  <span className="material-symbols-outlined" style={{ fontSize: 22 }}>{svc.icon}</span>
                </div>
                <span className="text-xs font-medium text-on-surface leading-tight">{svc.label}</span>
              </Link>
            ))}
          </div>
        </section>

        {/* Info Banner */}
        <section className="px-4 md:px-16 max-w-portal mx-auto mt-10">
          <div className="bg-primary-fixed rounded-xl p-6 flex flex-col md:flex-row items-center gap-4">
            <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center flex-shrink-0">
              <span className="material-symbols-outlined text-white" style={{ fontSize: 22 }}>notifications</span>
            </div>
            <div className="flex-1 text-center md:text-left">
              <h3 className="font-semibold text-on-primary-fixed">Stay Informed</h3>
              <p className="text-sm text-on-primary-fixed/80 mt-1">
                Request status updates are processed within 24 hours. Check your dashboard regularly for the latest updates.
              </p>
            </div>
            <Link to="/dashboard" className="btn-primary flex-shrink-0 text-sm">
              Go to Dashboard
            </Link>
          </div>
        </section>
      </div>
    </AppLayout>
  );
}
