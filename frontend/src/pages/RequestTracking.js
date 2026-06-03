import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import AppLayout from '../components/layout/AppLayout';
import { StatusBadge, PriorityBadge } from '../components/common/StatusBadge';

const STATUS_FILTERS = [
  { value: 'all', label: 'All' },
  { value: 'submitted', label: 'Submitted' },
  { value: 'in_review', label: 'In Review' },
  { value: 'approved', label: 'Approved' },
  { value: 'resolved', label: 'Resolved' },
  { value: 'rejected', label: 'Rejected' },
];

export default function RequestTracking() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState('all');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [pages, setPages] = useState(1);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    const t = setTimeout(fetchRequests, 300);
    return () => clearTimeout(t);
  }, [status, search, page]);

  const fetchRequests = async () => {
    setLoading(true);
    try {
      const { data } = await axios.get('/api/requests', {
        params: { status, search, page, limit: 10 },
      });
      setRequests(data.requests);
      setTotal(data.total);
      setPages(data.pages);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AppLayout>
      <div className="px-4 md:px-8 py-8 max-w-portal mx-auto pb-24 lg:pb-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-primary mb-2">Track Status</h1>
            <p className="text-on-surface-variant text-sm">Monitor the progress of your submitted requests.</p>
          </div>
          <div className="flex items-center gap-2 bg-primary-fixed px-4 py-2 rounded-lg text-on-primary-fixed text-sm font-medium">
            <span className="material-symbols-outlined" style={{ fontSize: 18 }}>info</span>
            Updates occur every 24 hours
          </div>
        </div>

        {/* Search & Filter */}
        <div className="card p-4 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant" style={{ fontSize: 18 }}>search</span>
              <input
                type="text"
                placeholder="Search by Request ID, subject..."
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
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                    status === f.value
                      ? 'bg-primary text-white shadow-md'
                      : 'bg-surface-container text-on-surface-variant hover:bg-surface-container-high'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Results Count */}
        {!loading && (
          <p className="text-sm text-on-surface-variant mb-4">{total} request{total !== 1 ? 's' : ''} found</p>
        )}

        {/* List */}
        <div className="card overflow-hidden mb-6">
          {loading ? (
            <div className="p-6 space-y-4">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-20 bg-surface-container animate-pulse rounded-xl" />
              ))}
            </div>
          ) : requests.length === 0 ? (
            <div className="p-16 text-center">
              <div className="w-16 h-16 bg-surface-container rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="material-symbols-outlined text-on-surface-variant" style={{ fontSize: 28 }}>search_off</span>
              </div>
              <p className="font-medium text-on-surface mb-1">No requests found</p>
              <p className="text-sm text-on-surface-variant mb-4">Try adjusting your filters or submit a new request.</p>
              <Link to="/submit-request" className="btn-primary text-sm">Submit Request</Link>
            </div>
          ) : (
            <div className="divide-y divide-outline-variant">
              {requests.map((req) => (
                <Link
                  key={req._id}
                  to={`/requests/${req._id}`}
                  className="flex flex-col md:flex-row md:items-center gap-3 p-4 hover:bg-surface-container-low transition-colors group"
                >
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="w-10 h-10 bg-secondary-container rounded-xl flex items-center justify-center flex-shrink-0">
                      <span className="material-symbols-outlined text-on-secondary-container" style={{ fontSize: 18 }}>description</span>
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold text-on-surface text-sm truncate">{req.subject}</p>
                      <p className="text-xs text-on-surface-variant mt-0.5">
                        {req.requestId} · {req.serviceTypeLabel}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0 pl-13 md:pl-0">
                    <PriorityBadge priority={req.priority} />
                    <StatusBadge status={req.status} />
                    <span className="text-xs text-on-surface-variant hidden md:block">
                      {new Date(req.createdAt).toLocaleDateString('en-PK')}
                    </span>
                    <span className="material-symbols-outlined text-on-surface-variant group-hover:translate-x-1 transition-transform" style={{ fontSize: 18 }}>chevron_right</span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Pagination */}
        {pages > 1 && (
          <div className="flex items-center justify-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="p-2 rounded-lg border border-outline-variant disabled:opacity-40 hover:bg-surface-container transition-colors"
            >
              <span className="material-symbols-outlined" style={{ fontSize: 18 }}>chevron_left</span>
            </button>
            {[...Array(pages)].map((_, i) => (
              <button
                key={i}
                onClick={() => setPage(i + 1)}
                className={`w-9 h-9 rounded-lg text-sm font-medium transition-colors ${
                  page === i + 1 ? 'bg-primary text-white' : 'border border-outline-variant hover:bg-surface-container'
                }`}
              >
                {i + 1}
              </button>
            ))}
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
    </AppLayout>
  );
}
