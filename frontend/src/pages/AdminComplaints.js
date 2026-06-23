import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import toast from 'react-hot-toast';
import AppLayout from '../components/layout/AppLayout';

const STATUS_STYLES = {
  open: 'bg-secondary-container text-on-secondary-container',
  in_review: 'bg-primary-fixed text-on-primary-fixed',
  resolved: 'bg-green-100 text-green-800',
  dismissed: 'bg-surface-container-high text-on-surface-variant',
};
const STATUS_LABELS = { open: 'Open', in_review: 'In Review', resolved: 'Resolved', dismissed: 'Dismissed' };
const STATUS_FILTERS = [
  { value: 'all', label: 'All' },
  { value: 'open', label: 'Open' },
  { value: 'in_review', label: 'In Review' },
  { value: 'resolved', label: 'Resolved' },
  { value: 'dismissed', label: 'Dismissed' },
];

export default function AdminComplaints() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState('all');
  const [type, setType] = useState('all');
  const [expandedId, setExpandedId] = useState(null);
  const [responseForm, setResponseForm] = useState({ adminResponse: '', status: 'in_review' });
  const [submitting, setSubmitting] = useState(false);

  const fetchItems = () => {
    setLoading(true);
    axios.get('/api/admin/complaints', { params: { status, type } })
      .then(({ data }) => setItems(data.complaints))
      .catch(() => toast.error('Failed to load'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchItems();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, type]);

  const toggleExpand = (item) => {
    if (expandedId === item._id) {
      setExpandedId(null);
    } else {
      setExpandedId(item._id);
      setResponseForm({ adminResponse: item.adminResponse || '', status: item.status === 'open' ? 'in_review' : item.status });
    }
  };

  const handleRespond = async (item) => {
    setSubmitting(true);
    try {
      const { data } = await axios.put(`/api/admin/complaints/${item._id}/respond`, responseForm);
      setItems((prev) => prev.map((i) => (i._id === item._id ? data.complaint : i)));
      toast.success('Response sent');
      setExpandedId(null);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not save response');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AppLayout>
      <div className="px-4 md:px-8 py-8 max-w-portal mx-auto pb-24 lg:pb-8">

        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-primary">Complaints & Feedback</h1>
            <p className="text-on-surface-variant text-sm mt-1">
              {items.length > 0 ? `${items.length} item${items.length !== 1 ? 's' : ''}` : 'Citizen complaints and feedback'}
            </p>
          </div>
          <Link to="/admin" className="btn-secondary flex items-center gap-2 self-start">
            <span className="material-symbols-outlined" style={{ fontSize: 18 }}>monitoring</span>
            Back to Overview
          </Link>
        </div>

        {/* Filters */}
        <div className="card p-4 mb-6 flex flex-col md:flex-row gap-4">
          <div className="flex gap-2 flex-wrap">
            {STATUS_FILTERS.map((f) => (
              <button
                key={f.value}
                onClick={() => setStatus(f.value)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                  status === f.value ? 'bg-primary text-white shadow-md' : 'bg-surface-container text-on-surface-variant hover:bg-surface-container-high'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
          <div className="flex gap-2">
            {['all', 'complaint', 'feedback'].map((t) => (
              <button
                key={t}
                onClick={() => setType(t)}
                className={`px-4 py-2 rounded-full text-sm font-medium capitalize transition-all ${
                  type === t ? 'bg-secondary text-white shadow-md' : 'bg-surface-container text-on-surface-variant hover:bg-surface-container-high'
                }`}
              >
                {t === 'all' ? 'All Types' : t}
              </button>
            ))}
          </div>
        </div>

        {/* List */}
        <div className="card overflow-hidden">
          {loading ? (
            <div className="p-6 space-y-4">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-16 bg-surface-container animate-pulse rounded-xl" />
              ))}
            </div>
          ) : items.length === 0 ? (
            <div className="p-16 text-center">
              <span className="material-symbols-outlined text-on-surface-variant block mx-auto mb-3" style={{ fontSize: 32 }}>forum</span>
              <p className="font-medium text-on-surface">No complaints or feedback yet</p>
            </div>
          ) : (
            <div className="divide-y divide-outline-variant">
              {items.map((item) => (
                <div key={item._id}>
                  <button onClick={() => toggleExpand(item)} className="w-full flex flex-col md:flex-row md:items-center gap-3 p-4 hover:bg-surface-container-low transition-colors text-left">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div className="w-10 h-10 bg-secondary-container rounded-xl flex items-center justify-center flex-shrink-0">
                        <span className="material-symbols-outlined text-on-secondary-container" style={{ fontSize: 18 }}>
                          {item.type === 'complaint' ? 'report' : 'forum'}
                        </span>
                      </div>
                      <div className="min-w-0">
                        <p className="font-semibold text-on-surface text-sm truncate">{item.subject}</p>
                        <p className="text-xs text-on-surface-variant mt-0.5 truncate">
                          {item.citizen?.fullName} · {item.department?.name || 'General'} · {item.type}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0 pl-13 md:pl-0">
                      <span className={`text-xs px-2 py-1 rounded-full font-medium ${STATUS_STYLES[item.status]}`}>
                        {STATUS_LABELS[item.status]}
                      </span>
                      <span className="text-xs text-on-surface-variant hidden md:block">
                        {new Date(item.createdAt).toLocaleDateString('en-PK')}
                      </span>
                      <span className={`material-symbols-outlined text-on-surface-variant transition-transform ${expandedId === item._id ? 'rotate-180' : ''}`} style={{ fontSize: 18 }}>
                        expand_more
                      </span>
                    </div>
                  </button>

                  {expandedId === item._id && (
                    <div className="px-4 pb-4 bg-surface-container-low">
                      <div className="bg-surface-container-lowest rounded-xl p-4 space-y-3">
                        <p className="text-sm text-on-surface whitespace-pre-wrap">{item.description}</p>
                        {item.relatedRequest && (
                          <p className="text-xs text-on-surface-variant">
                            Related to <span className="font-mono">{item.relatedRequest.requestId}</span> — {item.relatedRequest.subject}
                          </p>
                        )}
                        <p className="text-xs text-on-surface-variant">
                          {item.citizen?.email} {item.citizen?.phone && `· ${item.citizen.phone}`}
                        </p>

                        <div className="border-t border-outline-variant pt-3 space-y-3">
                          <textarea
                            rows={3}
                            className="input-field"
                            placeholder="Write a response..."
                            value={responseForm.adminResponse}
                            onChange={(e) => setResponseForm({ ...responseForm, adminResponse: e.target.value })}
                          />
                          <div className="flex flex-wrap gap-3 items-center">
                            <select
                              className="input-field w-auto"
                              value={responseForm.status}
                              onChange={(e) => setResponseForm({ ...responseForm, status: e.target.value })}
                            >
                              <option value="open">Open</option>
                              <option value="in_review">In Review</option>
                              <option value="resolved">Resolved</option>
                              <option value="dismissed">Dismissed</option>
                            </select>
                            <button
                              onClick={() => handleRespond(item)}
                              disabled={submitting}
                              className="btn-primary text-sm disabled:opacity-60"
                            >
                              {submitting ? 'Saving...' : 'Save & Notify Citizen'}
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
