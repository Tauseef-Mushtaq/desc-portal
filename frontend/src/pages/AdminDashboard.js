import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import AppLayout from '../components/layout/AppLayout';
import { StatusBadge, PriorityBadge } from '../components/common/StatusBadge';
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';

// Same semantic groupings as StatusBadge.js, translated to hex since recharts
// fills via SVG attributes rather than Tailwind classes — kept in the same
// navy/teal/green/red families the rest of the app already uses.
const STATUS_COLORS = {
  Submitted: '#545f72',
  'In Review': '#2d476f',
  'Pending Info': '#004f50',
  Approved: '#16a34a',
  Resolved: '#15803d',
  Rejected: '#ba1a1a',
};

const CHART_TOOLTIP_STYLE = {
  borderRadius: 8,
  border: '1px solid #c4c6cf',
  fontSize: 13,
  fontFamily: 'Inter, sans-serif',
};

const StatCard = ({ icon, label, value, trend, trendDir, color }) => (
  <div className="card p-6">
    <div className="flex justify-between items-start mb-4">
      <div>
        <p className="text-xs font-semibold text-on-surface-variant uppercase tracking-wide">{label}</p>
        <h2 className="text-3xl font-bold text-primary mt-1">{value?.toLocaleString() ?? '—'}</h2>
      </div>
      <div className={`p-3 rounded-xl ${color}`}>
        <span className="material-symbols-outlined" style={{ fontSize: 22 }}>{icon}</span>
      </div>
    </div>
    {trend && (
      <p className={`text-xs flex items-center gap-1 ${trendDir === 'up' ? 'text-error' : 'text-green-700'}`}>
        <span className="material-symbols-outlined" style={{ fontSize: 14 }}>{trendDir === 'up' ? 'trending_up' : 'trending_down'}</span>
        {trend}
      </p>
    )}
  </div>
);

const STATUS_FILTERS = [
  { value: 'all', label: 'All' },
  { value: 'submitted', label: 'Submitted' },
  { value: 'in_review', label: 'In Review' },
  { value: 'pending_info', label: 'Pending Info' },
  { value: 'approved', label: 'Approved' },
  { value: 'resolved', label: 'Resolved' },
  { value: 'rejected', label: 'Rejected' },
];

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [department, setDepartment] = useState(null);
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [reqLoading, setReqLoading] = useState(false);
  const [status, setStatus] = useState('all');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [pages, setPages] = useState(1);

  useEffect(() => {
    axios.get('/api/admin/stats').then(({ data }) => {
      setStats(data.stats);
      setDepartment(data.department);
    }).finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    const t = setTimeout(fetchRequests, 300);
    return () => clearTimeout(t);
  }, [status, search, page]);

  const fetchRequests = async () => {
    setReqLoading(true);
    try {
      const { data } = await axios.get('/api/admin/requests', { params: { status, search, page } });
      setRequests(data.requests);
      setTotal(data.total);
      setPages(data.pages);
    } finally {
      setReqLoading(false);
    }
  };

  return (
    <AppLayout>
      <div className="px-4 md:px-8 py-8 max-w-portal mx-auto pb-24 lg:pb-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-primary">
              {department ? department.name : 'Admin Dashboard'}
            </h1>
            <p className="text-on-surface-variant text-sm mt-1">
              {department ? 'Requests routed to your department' : 'Manage and process citizen service requests — all departments'}
            </p>
          </div>
          <div className="text-sm text-on-surface-variant hidden md:block">
            {new Date().toLocaleDateString('en-PK', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </div>
        </div>

        {/* Stats */}
        {loading ? (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {[...Array(4)].map((_, i) => <div key={i} className="card h-32 animate-pulse bg-surface-container-high" />)}
          </div>
        ) : stats && (
          <>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <StatCard icon="pending_actions" label="Total Pending" value={stats.submitted + stats.inReview + stats.pendingInfo} color="bg-secondary-container text-on-secondary-container" trend={`${stats.recentRequests} new this week`} trendDir="up" />
              <StatCard icon="manage_search" label="In Review" value={stats.inReview} color="bg-primary-fixed text-on-primary-fixed" />
              <StatCard icon="task_alt" label="Resolved" value={stats.resolved} color="bg-green-100 text-green-700" />
              <StatCard icon="people" label="Total Citizens" value={stats.totalCitizens} color="bg-tertiary-fixed text-on-tertiary-fixed" />
            </div>

            {/* Second row */}
            <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
              <StatCard icon="folder_open" label="Total Requests" value={stats.total} color="bg-surface-container-high text-on-surface-variant" />
              <StatCard icon="check_circle" label="Approved" value={stats.approved} color="bg-green-50 text-green-700" />
              <StatCard icon="cancel" label="Rejected" value={stats.rejected} color="bg-error-container text-on-error-container" />
              <StatCard
                icon="star"
                label="Avg. Satisfaction"
                value={stats.avgRating ? `${stats.avgRating} / 5` : '—'}
                color="bg-yellow-50 text-yellow-700"
                trend={stats.ratingCount ? `from ${stats.ratingCount} ratings` : 'No ratings yet'}
              />
              <div className="card p-6 lg:col-span-1">
                <p className="text-xs font-semibold text-on-surface-variant uppercase tracking-wide mb-2">Resolution Rate</p>
                <p className="text-3xl font-bold text-primary">
                  {stats.total > 0 ? Math.round((stats.resolved / stats.total) * 100) : 0}%
                </p>
                <div className="mt-3 w-full bg-surface-container-high rounded-full h-2">
                  <div
                    className="bg-primary h-2 rounded-full transition-all"
                    style={{ width: `${stats.total > 0 ? (stats.resolved / stats.total) * 100 : 0}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
              {/* Request volume — last 30 days */}
              <div className="card p-6 lg:col-span-2">
                <h3 className="font-semibold text-on-surface mb-1">Request Volume</h3>
                <p className="text-xs text-on-surface-variant mb-4">Daily submissions, last 30 days</p>
                <ResponsiveContainer width="100%" height={240}>
                  <AreaChart data={stats.dailyTrend} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="volumeFill" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#002045" stopOpacity={0.25} />
                        <stop offset="100%" stopColor="#002045" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e9eb" vertical={false} />
                    <XAxis
                      dataKey="date"
                      tickFormatter={(d) => new Date(d).toLocaleDateString('en-PK', { month: 'short', day: 'numeric' })}
                      interval={4}
                      tick={{ fontSize: 11, fill: '#43474e' }}
                      axisLine={{ stroke: '#c4c6cf' }}
                      tickLine={false}
                    />
                    <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: '#43474e' }} axisLine={false} tickLine={false} />
                    <Tooltip
                      contentStyle={CHART_TOOLTIP_STYLE}
                      labelFormatter={(d) => new Date(d).toLocaleDateString('en-PK', { weekday: 'short', month: 'short', day: 'numeric' })}
                    />
                    <Area type="monotone" dataKey="count" name="Requests" stroke="#002045" strokeWidth={2} fill="url(#volumeFill)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>

              {/* Status breakdown */}
              <div className="card p-6">
                <h3 className="font-semibold text-on-surface mb-1">Status Breakdown</h3>
                <p className="text-xs text-on-surface-variant mb-4">All requests, current state</p>
                {(() => {
                  const donutData = [
                    { name: 'Submitted', value: stats.submitted },
                    { name: 'In Review', value: stats.inReview },
                    { name: 'Pending Info', value: stats.pendingInfo },
                    { name: 'Approved', value: stats.approved },
                    { name: 'Resolved', value: stats.resolved },
                    { name: 'Rejected', value: stats.rejected },
                  ].filter((d) => d.value > 0);

                  return donutData.length === 0 ? (
                    <p className="text-sm text-on-surface-variant text-center py-16">No requests yet</p>
                  ) : (
                    <ResponsiveContainer width="100%" height={240}>
                      <PieChart>
                        <Pie data={donutData} dataKey="value" nameKey="name" innerRadius={55} outerRadius={80} paddingAngle={2}>
                          {donutData.map((d) => (
                            <Cell key={d.name} fill={STATUS_COLORS[d.name]} stroke="none" />
                          ))}
                        </Pie>
                        <Tooltip contentStyle={CHART_TOOLTIP_STYLE} />
                        <Legend
                          layout="vertical"
                          align="right"
                          verticalAlign="middle"
                          iconType="circle"
                          iconSize={8}
                          wrapperStyle={{ fontSize: 12, fontFamily: 'Inter, sans-serif' }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  );
                })()}
              </div>
            </div>

            {/* By service type */}
            <div className="card p-6 mb-8">
              <h3 className="font-semibold text-on-surface mb-1">Requests by Service Type</h3>
              <p className="text-xs text-on-surface-variant mb-4">Which services citizens use most</p>
              {stats.byServiceType?.length === 0 ? (
                <p className="text-sm text-on-surface-variant text-center py-16">No requests yet</p>
              ) : (
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart data={stats.byServiceType} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e9eb" vertical={false} />
                    <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#43474e' }} axisLine={{ stroke: '#c4c6cf' }} tickLine={false} />
                    <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: '#43474e' }} axisLine={false} tickLine={false} />
                    <Tooltip contentStyle={CHART_TOOLTIP_STYLE} />
                    <Bar dataKey="count" name="Requests" fill="#1a365d" radius={[6, 6, 0, 0]} maxBarSize={56} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </>
        )}

        {/* Requests Table */}
        <div className="card overflow-hidden">
          {/* Toolbar */}
          <div className="p-4 border-b border-outline-variant">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="relative flex-1">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant" style={{ fontSize: 18 }}>search</span>
                <input
                  type="text"
                  placeholder="Search by CNIC, name, request ID..."
                  className="input-field pl-10"
                  value={search}
                  onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                />
              </div>
              <div className="flex gap-2 flex-wrap">
                {STATUS_FILTERS.map((f) => (
                  <button
                    key={f.value}
                    onClick={() => { setStatus(f.value); setPage(1); }}
                    className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
                      status === f.value ? 'bg-primary text-white' : 'bg-surface-container text-on-surface-variant hover:bg-surface-container-high'
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-surface-container-low">
                  {['Request ID', 'Citizen', 'Service', 'Subject', 'Priority', 'Status', 'Date', ''].map((h) => (
                    <th key={h} className="text-left text-xs font-semibold text-on-surface-variant uppercase tracking-wide px-4 py-3">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant">
                {reqLoading ? (
                  [...Array(5)].map((_, i) => (
                    <tr key={i}>
                      {[...Array(8)].map((_, j) => (
                        <td key={j} className="px-4 py-4">
                          <div className="h-4 bg-surface-container animate-pulse rounded" />
                        </td>
                      ))}
                    </tr>
                  ))
                ) : requests.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="text-center py-16 text-on-surface-variant">
                      <span className="material-symbols-outlined block mx-auto mb-2" style={{ fontSize: 32 }}>inbox</span>
                      No requests found
                    </td>
                  </tr>
                ) : (
                  requests.map((req) => (
                    <tr key={req._id} className="hover:bg-surface-container-low transition-colors">
                      <td className="px-4 py-3 text-xs font-mono text-on-surface-variant">{req.requestId}</td>
                      <td className="px-4 py-3 text-sm font-medium text-on-surface">{req.applicantName}</td>
                      <td className="px-4 py-3 text-sm text-on-surface-variant">{req.serviceTypeLabel}</td>
                      <td className="px-4 py-3 text-sm text-on-surface max-w-[200px] truncate">{req.subject}</td>
                      <td className="px-4 py-3"><PriorityBadge priority={req.priority} /></td>
                      <td className="px-4 py-3"><StatusBadge status={req.status} /></td>
                      <td className="px-4 py-3 text-xs text-on-surface-variant">
                        {new Date(req.createdAt).toLocaleDateString('en-PK')}
                      </td>
                      <td className="px-4 py-3">
                        <Link
                          to={`/admin/requests/${req._id}`}
                          className="text-primary font-medium text-sm hover:underline flex items-center gap-1 whitespace-nowrap"
                        >
                          Review <span className="material-symbols-outlined" style={{ fontSize: 16 }}>open_in_new</span>
                        </Link>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {pages > 1 && (
            <div className="p-4 border-t border-outline-variant flex items-center justify-between">
              <p className="text-sm text-on-surface-variant">{total} total requests</p>
              <div className="flex gap-2">
                <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="px-3 py-1.5 rounded-lg border border-outline-variant text-sm disabled:opacity-40 hover:bg-surface-container">
                  Previous
                </button>
                <span className="px-3 py-1.5 text-sm text-on-surface-variant">Page {page} of {pages}</span>
                <button onClick={() => setPage(p => Math.min(pages, p + 1))} disabled={page === pages} className="px-3 py-1.5 rounded-lg border border-outline-variant text-sm disabled:opacity-40 hover:bg-surface-container">
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
