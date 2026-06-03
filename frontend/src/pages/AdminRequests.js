import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import AppLayout from '../components/layout/AppLayout';
import { StatusBadge, PriorityBadge } from '../components/common/StatusBadge';

const STATUS_FILTERS = [
  { value: 'all', label: 'All' },
  { value: 'submitted', label: 'Submitted' },
  { value: 'in_review', label: 'In Review' },
  { value: 'pending_info', label: 'Pending Info' },
  { value: 'approved', label: 'Approved' },
  { value: 'resolved', label: 'Resolved' },
  { value: 'rejected', label: 'Rejected' },
];

const PRIORITY_FILTERS = [
  { value: 'all', label: 'All Priorities' },
  { value: 'urgent', label: 'Urgent' },
  { value: 'high', label: 'High' },
  { value: 'normal', label: 'Normal' },
  { value: 'low', label: 'Low' },
];

export default function AdminRequests() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState('all');
  const [priority, setPriority] = useState('all');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [pages, setPages] = useState(1);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    const t = setTimeout(fetchRequests, 300);
    return () => clearTimeout(t);
  }, [status, priority, search, page]);

  const fetchRequests = async () => {
    setLoading(true);
    try {
      const { data } = await axios.get('/api/admin/requests', {
        params: { status, priority, search, page, limit: 15 },
      });
      setRequests(data.requests);
      setTotal(data.total);
      setPages(data.pages);
    } catch (err) {
      console.error('Failed to fetch requests:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = (val) => { setStatus(val); setPage(1); };
  const handlePriorityChange = (e) => { setPriority(e.target.value); setPage(1); };
  const handleSearch = (e) => { setSearch(e.target.value); setPage(1); };

  return (
    <AppLayout>
      <div className="px-4 md:px-8 py-8 max-w-portal mx-auto pb-24 lg:pb-8">

        {/* Page Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-primary">All Requests</h1>
            <p className="text-on-surface-variant text-sm mt-1">
              {total > 0 ? `${total} total request${total !== 1 ? 's' : ''}` : 'Manage and process citizen service requests'}
            </p>
          </div>
          <Link
            to="/admin"
            className="btn-secondary flex items-center gap-2 self-start"
          >
            <span className="material-symbols-outlined" style={{ fontSize: 18 }}>monitoring</span>
            Back to Overview
          </Link>
        </div>

        {/* Search & Filters */}
        <div className="card p-4 mb-6 space-y-4">
          {/* Search bar + priority filter */}
          <div className="flex flex-col md:flex-row gap-3">
            <div className="relative flex-1">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant" style={{ fontSize: 18 }}>search</span>
              <input
                type="text"
                placeholder="Search by CNIC, name, request ID, subject..."
                className="input-field pl-10"
                value={search}
                onChange={handleSearch}
              />
            </div>
            <select
              className="input-field md:w-48"
              value={priority}
              onChange={handlePriorityChange}
            >
              {PRIORITY_FILTERS.map((p) => (
                <option key={p.value} value={p.value}>{p.label}</option>
              ))}
            </select>
          </div>

          {/* Status filter pills */}
          <div className="flex flex-wrap gap-2">
            {STATUS_FILTERS.map((f) => (
              <button
                key={f.value}
                onClick={() => handleStatusChange(f.value)}
                className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all ${
                  status === f.value
                    ? 'bg-primary text-white shadow-sm'
                    : 'bg-surface-container text-on-surface-variant hover:bg-surface-container-high'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {/* Requests Table */}
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-surface-container-low">
                  <th className="text-left text-xs font-semibold text-on-surface-variant uppercase tracking-wide px-4 py-3">Request ID</th>
                  <th className="text-left text-xs font-semibold text-on-surface-variant uppercase tracking-wide px-4 py-3">Citizen</th>
                  <th className="text-left text-xs font-semibold text-on-surface-variant uppercase tracking-wide px-4 py-3">Service</th>
                  <th className="text-left text-xs font-semibold text-on-surface-variant uppercase tracking-wide px-4 py-3">Subject</th>
                  <th className="text-left text-xs font-semibold text-on-surface-variant uppercase tracking-wide px-4 py-3">Priority</th>
                  <th className="text-left text-xs font-semibold text-on-surface-variant uppercase tracking-wide px-4 py-3">Status</th>
                  <th className="text-left text-xs font-semibold text-on-surface-variant uppercase tracking-wide px-4 py-3">Date</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant">
                {loading ? (
                  [...Array(8)].map((_, i) => (
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
                    <td colSpan={8} className="text-center py-20">
                      <div className="flex flex-col items-center gap-3 text-on-surface-variant">
                        <div className="w-16 h-16 bg-surface-container rounded-full flex items-center justify-center">
                          <span className="material-symbols-outlined" style={{ fontSize: 28 }}>inbox</span>
                        </div>
                        <p className="font-medium text-on-surface">No requests found</p>
                        <p className="text-sm">Try adjusting your filters or search query.</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  requests.map((req) => (
                    <tr key={req._id} className="hover:bg-surface-container-low transition-colors group">
                      <td className="px-4 py-3">
                        <span className="text-xs font-mono text-on-surface-variant bg-surface-container px-2 py-1 rounded">
                          {req.requestId}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div>
                          <p className="text-sm font-medium text-on-surface">{req.applicantName}</p>
                          <p className="text-xs text-on-surface-variant mt-0.5">{req.applicantCnic}</p>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-sm text-on-surface-variant">{req.serviceTypeLabel}</span>
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-sm text-on-surface max-w-[200px] truncate" title={req.subject}>
                          {req.subject}
                        </p>
                      </td>
                      <td className="px-4 py-3">
                        <PriorityBadge priority={req.priority} />
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge status={req.status} />
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-xs text-on-surface-variant whitespace-nowrap">
                          {new Date(req.createdAt).toLocaleDateString('en-PK', {
                            year: 'numeric', month: 'short', day: 'numeric',
                          })}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <Link
                          to={`/admin/requests/${req._id}`}
                          className="inline-flex items-center gap-1 text-primary font-medium text-sm hover:underline whitespace-nowrap"
                        >
                          Review
                          <span className="material-symbols-outlined group-hover:translate-x-0.5 transition-transform" style={{ fontSize: 16 }}>
                            arrow_forward
                          </span>
                        </Link>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Footer: count + pagination */}
          {!loading && requests.length > 0 && (
            <div className="px-4 py-3 border-t border-outline-variant flex flex-col sm:flex-row items-center justify-between gap-3">
              <p className="text-sm text-on-surface-variant">
                Showing <span className="font-semibold text-on-surface">{requests.length}</span> of{' '}
                <span className="font-semibold text-on-surface">{total}</span> requests
              </p>

              {pages > 1 && (
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="p-2 rounded-lg border border-outline-variant disabled:opacity-40 hover:bg-surface-container transition-colors"
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: 18 }}>chevron_left</span>
                  </button>

                  {[...Array(pages)].map((_, i) => {
                    const pg = i + 1;
                    // Show first, last, current ±1, with ellipsis
                    if (
                      pg === 1 || pg === pages ||
                      (pg >= page - 1 && pg <= page + 1)
                    ) {
                      return (
                        <button
                          key={pg}
                          onClick={() => setPage(pg)}
                          className={`w-9 h-9 rounded-lg text-sm font-medium transition-colors ${
                            page === pg
                              ? 'bg-primary text-white shadow-sm'
                              : 'border border-outline-variant hover:bg-surface-container'
                          }`}
                        >
                          {pg}
                        </button>
                      );
                    }
                    if (pg === page - 2 || pg === page + 2) {
                      return <span key={pg} className="text-on-surface-variant text-sm">…</span>;
                    }
                    return null;
                  })}

                  <button
                    onClick={() => setPage((p) => Math.min(pages, p + 1))}
                    disabled={page === pages}
                    className="p-2 rounded-lg border border-outline-variant disabled:opacity-40 hover:bg-surface-container transition-colors"
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: 18 }}>chevron_right</span>
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
