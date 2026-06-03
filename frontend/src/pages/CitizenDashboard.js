import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import AppLayout from '../components/layout/AppLayout';
import { StatusBadge, PriorityBadge } from '../components/common/StatusBadge';

const StatCard = ({ icon, label, value, sub, color }) => (
  <div className="card p-6">
    <div className="flex items-start justify-between mb-4">
      <div className={`p-3 rounded-xl ${color}`}>
        <span className="material-symbols-outlined" style={{ fontSize: 22 }}>{icon}</span>
      </div>
    </div>
    <p className="text-3xl font-bold text-primary mb-1">{value}</p>
    <p className="text-sm font-medium text-on-surface">{label}</p>
    {sub && <p className="text-xs text-on-surface-variant mt-1">{sub}</p>}
  </div>
);

export default function CitizenDashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      try {
        const [s, r] = await Promise.all([
          axios.get('/api/requests/stats'),
          axios.get('/api/requests?limit=5'),
        ]);
        setStats(s.data.stats);
        setRequests(r.data.requests);
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, []);

  return (
    <AppLayout>
      <div className="px-4 md:px-8 py-8 max-w-portal mx-auto pb-24 lg:pb-8">
        {/* Welcome Banner */}
        <div className="bg-primary rounded-xl p-8 mb-8 relative overflow-hidden">
          <div className="absolute right-0 top-0 w-40 h-full opacity-10">
            <svg viewBox="0 0 100 100" className="w-full h-full">
              <circle cx="80" cy="20" r="40" fill="white" />
              <circle cx="100" cy="80" r="30" fill="white" />
            </svg>
          </div>
          <div className="relative z-10">
            <h2 className="text-2xl md:text-3xl font-bold text-white mb-2">
              Welcome back, {user?.fullName?.split(' ')[0]}!
            </h2>
            <p className="text-white/80 text-sm md:text-base max-w-lg mb-6">
              Your digital gateway to institutional services in Mardan. Track your applications and engage with your community.
            </p>
            <Link to="/submit-request" className="inline-flex items-center gap-2 bg-white text-primary font-semibold px-5 py-2.5 rounded-lg hover:bg-primary-fixed transition-all active:scale-95 text-sm">
              <span className="material-symbols-outlined" style={{ fontSize: 18 }}>add</span>
              Submit New Request
            </Link>
          </div>
        </div>

        {/* Stats Grid */}
        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="card p-6 h-32 animate-pulse bg-surface-container-high" />
            ))}
          </div>
        ) : stats ? (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
            <StatCard icon="folder_open" label="Total Requests" value={stats.total} color="bg-secondary-container text-on-secondary-container" />
            <StatCard icon="pending_actions" label="Active (Pending)" value={stats.submitted + stats.inReview} sub="Under review" color="bg-primary-fixed text-on-primary-fixed" />
            <StatCard icon="task_alt" label="Resolved" value={stats.resolved} sub="Successfully closed" color="bg-green-100 text-green-700" />
          </div>
        ) : null}

        {/* Recent Requests */}
        <div className="card overflow-hidden">
          <div className="flex items-center justify-between p-6 border-b border-outline-variant">
            <h3 className="font-semibold text-on-surface flex items-center gap-2">
              <span className="material-symbols-outlined text-primary" style={{ fontSize: 20 }}>history</span>
              Recent Requests
            </h3>
            <Link to="/track-status" className="text-sm text-primary font-medium hover:underline flex items-center gap-1">
              View All <span className="material-symbols-outlined" style={{ fontSize: 16 }}>arrow_forward</span>
            </Link>
          </div>

          {loading ? (
            <div className="p-6 space-y-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-16 bg-surface-container animate-pulse rounded-lg" />
              ))}
            </div>
          ) : requests.length === 0 ? (
            <div className="p-12 text-center">
              <div className="w-16 h-16 bg-surface-container rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="material-symbols-outlined text-on-surface-variant" style={{ fontSize: 28 }}>inbox</span>
              </div>
              <p className="font-medium text-on-surface mb-1">No requests yet</p>
              <p className="text-sm text-on-surface-variant mb-4">Submit your first service request to get started.</p>
              <Link to="/submit-request" className="btn-primary text-sm">Submit Request</Link>
            </div>
          ) : (
            <div className="divide-y divide-outline-variant">
              {requests.map((req) => (
                <Link
                  key={req._id}
                  to={`/requests/${req._id}`}
                  className="flex items-center justify-between p-4 hover:bg-surface-container-low transition-colors group"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 bg-secondary-container rounded-xl flex items-center justify-center flex-shrink-0">
                      <span className="material-symbols-outlined text-on-secondary-container" style={{ fontSize: 18 }}>description</span>
                    </div>
                    <div className="min-w-0">
                      <p className="font-medium text-on-surface text-sm truncate">{req.subject}</p>
                      <p className="text-xs text-on-surface-variant mt-0.5">
                        {req.requestId} · {req.serviceTypeLabel} · {new Date(req.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 ml-4 flex-shrink-0">
                    <StatusBadge status={req.status} />
                    <span className="material-symbols-outlined text-on-surface-variant group-hover:translate-x-1 transition-transform" style={{ fontSize: 18 }}>chevron_right</span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
