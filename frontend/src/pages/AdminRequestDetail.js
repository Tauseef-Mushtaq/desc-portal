import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import AppLayout from '../components/layout/AppLayout';
import { StatusBadge, PriorityBadge } from '../components/common/StatusBadge';
import StarRating from '../components/common/StarRating';
import toast from 'react-hot-toast';

const STATUS_OPTIONS = [
  { value: 'submitted', label: 'Submitted' },
  { value: 'in_review', label: 'In Review' },
  { value: 'pending_info', label: 'Pending Info' },
  { value: 'approved', label: 'Approved' },
  { value: 'resolved', label: 'Resolved' },
  { value: 'rejected', label: 'Rejected' },
];

export default function AdminRequestDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [request, setRequest] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [form, setForm] = useState({ status: '', adminNotes: '', rejectionReason: '' });

  useEffect(() => {
    axios.get(`/api/admin/requests/${id}`)
      .then(({ data }) => {
        setRequest(data.request);
        setForm({ status: data.request.status, adminNotes: data.request.adminNotes || '', rejectionReason: data.request.rejectionReason || '' });
      })
      .catch(() => navigate('/admin'))
      .finally(() => setLoading(false));
  }, [id]);

  const handleUpdate = async () => {
    setUpdating(true);
    try {
      const { data } = await axios.put(`/api/admin/requests/${id}/status`, form);
      setRequest(data.request);
      toast.success('Request status updated successfully');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Update failed');
    } finally {
      setUpdating(false);
    }
  };

  if (loading) return (
    <AppLayout>
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex gap-2">
          {[0,1,2].map(i => <div key={i} className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: `${i*150}ms` }} />)}
        </div>
      </div>
    </AppLayout>
  );

  if (!request) return null;

  return (
    <AppLayout>
      <div className="px-4 md:px-8 py-8 max-w-portal mx-auto pb-24 lg:pb-8">
        <button onClick={() => navigate(-1)} className="flex items-center gap-1 text-sm text-on-surface-variant hover:text-primary mb-6 transition-colors">
          <span className="material-symbols-outlined" style={{ fontSize: 18 }}>arrow_back</span>
          Back to Dashboard
        </button>

        {/* Header */}
        <div className="card p-6 mb-6">
          <div className="flex flex-wrap items-center gap-3 mb-2">
            <span className="text-xs font-mono text-on-surface-variant bg-surface-container px-2 py-1 rounded">{request.requestId}</span>
            <StatusBadge status={request.status} />
            <PriorityBadge priority={request.priority} />
          </div>
          <h1 className="text-xl md:text-2xl font-bold text-primary mb-1">{request.subject}</h1>
          <p className="text-sm text-on-surface-variant">
            {request.serviceTypeLabel} · Submitted {new Date(request.createdAt).toLocaleDateString('en-PK', { year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Description */}
            <div className="card p-6">
              <h2 className="font-semibold text-on-surface mb-3 flex items-center gap-2">
                <span className="material-symbols-outlined text-primary" style={{ fontSize: 18 }}>edit_note</span>
                Request Description
              </h2>
              <p className="text-sm text-on-surface leading-relaxed">{request.description}</p>
              {(request.district || request.tehsil) && (
                <div className="mt-4 flex items-center gap-2 text-sm text-on-surface-variant">
                  <span className="material-symbols-outlined" style={{ fontSize: 16 }}>location_on</span>
                  {[request.district, request.tehsil, request.village].filter(Boolean).join(', ')}
                </div>
              )}
            </div>

            {/* Admin Action Panel */}
            <div className="card p-6 border-t-4 border-primary">
              <h2 className="font-semibold text-on-surface mb-4 flex items-center gap-2">
                <span className="material-symbols-outlined text-primary" style={{ fontSize: 18 }}>admin_panel_settings</span>
                Admin Actions
              </h2>
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-on-surface-variant uppercase tracking-wide">Update Status</label>
                  <select
                    className="input-field"
                    value={form.status}
                    onChange={(e) => setForm({ ...form, status: e.target.value })}
                  >
                    {STATUS_OPTIONS.map((s) => (
                      <option key={s.value} value={s.value}>{s.label}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-on-surface-variant uppercase tracking-wide">Admin Notes</label>
                  <textarea
                    rows={3}
                    className="input-field resize-none"
                    placeholder="Internal notes or citizen-facing update..."
                    value={form.adminNotes}
                    onChange={(e) => setForm({ ...form, adminNotes: e.target.value })}
                  />
                </div>
                {form.status === 'rejected' && (
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-on-surface-variant uppercase tracking-wide">Rejection Reason *</label>
                    <textarea
                      rows={2}
                      className="input-field resize-none border-error"
                      placeholder="Reason for rejection (shown to citizen)..."
                      value={form.rejectionReason}
                      onChange={(e) => setForm({ ...form, rejectionReason: e.target.value })}
                    />
                  </div>
                )}
                <button
                  onClick={handleUpdate}
                  disabled={updating}
                  className="btn-primary flex items-center gap-2 disabled:opacity-60"
                >
                  {updating ? (
                    <>
                      <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                      Updating...
                    </>
                  ) : (
                    <>
                      <span className="material-symbols-outlined" style={{ fontSize: 18 }}>save</span>
                      Update Request
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Timeline */}
            <div className="card p-6">
              <h2 className="font-semibold text-on-surface mb-4 flex items-center gap-2">
                <span className="material-symbols-outlined text-primary" style={{ fontSize: 18 }}>timeline</span>
                Activity Timeline
              </h2>
              <div className="space-y-4">
                {[...request.timeline].reverse().map((event, i) => (
                  <div key={i} className="flex gap-4">
                    <div className="flex flex-col items-center">
                      <div className={`w-3 h-3 rounded-full mt-1 flex-shrink-0 ${i === 0 ? 'bg-primary' : 'bg-outline-variant'}`} />
                      {i < request.timeline.length - 1 && <div className="w-0.5 h-full bg-outline-variant mt-1" />}
                    </div>
                    <div className="pb-4">
                      <div className="flex items-center gap-2 mb-1">
                        <StatusBadge status={event.status} />
                        <span className="text-xs text-on-surface-variant">
                          {new Date(event.createdAt).toLocaleDateString('en-PK', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      {event.note && <p className="text-sm text-on-surface-variant">{event.note}</p>}
                      <p className="text-xs text-on-surface-variant mt-1">by {event.updatedByName}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            {/* Citizen Info */}
            <div className="card p-6">
              <h3 className="font-semibold text-on-surface mb-4 flex items-center gap-2">
                <span className="material-symbols-outlined text-primary" style={{ fontSize: 18 }}>person</span>
                Citizen Details
              </h3>
              <dl className="space-y-3 text-sm">
                {[
                  ['Full Name', request.applicantName],
                  ['Email', request.applicantEmail],
                  ['Phone', request.applicantPhone],
                  ['CNIC', request.applicantCnic],
                  ['Address', request.applicantAddress],
                ].map(([label, value]) => (
                  <div key={label}>
                    <dt className="text-xs text-on-surface-variant uppercase tracking-wide">{label}</dt>
                    <dd className="font-medium text-on-surface mt-0.5 break-words">{value || '—'}</dd>
                  </div>
                ))}
              </dl>
            </div>

            {/* Request Meta */}
            <div className="card p-6">
              <h3 className="font-semibold text-on-surface mb-4">Request Info</h3>
              <dl className="space-y-3 text-sm">
                {[
                  ['ID', request.requestId],
                  ['Service', request.serviceTypeLabel],
                  ['Priority', request.priority],
                  ['Date', new Date(request.createdAt).toLocaleDateString('en-PK')],
                ].map(([label, value]) => (
                  <div key={label} className="flex justify-between gap-2">
                    <dt className="text-on-surface-variant">{label}</dt>
                    <dd className="font-medium text-on-surface text-right capitalize">{value}</dd>
                  </div>
                ))}
              </dl>
            </div>

            {/* Citizen Feedback */}
            {request.feedback?.submittedAt && (
              <div className="card p-6">
                <h3 className="font-semibold text-on-surface mb-3 flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary" style={{ fontSize: 18 }}>rate_review</span>
                  Citizen Feedback
                </h3>
                <StarRating value={request.feedback.rating} readOnly size={20} />
                {request.feedback.comment && (
                  <p className="text-sm text-on-surface-variant mt-2">{request.feedback.comment}</p>
                )}
                <p className="text-xs text-on-surface-variant mt-2">
                  {new Date(request.feedback.submittedAt).toLocaleDateString('en-PK', { year: 'numeric', month: 'long', day: 'numeric' })}
                </p>
              </div>
            )}

            {/* Attachments */}
            {request.attachments?.length > 0 && (
              <div className="card p-6">
                <h3 className="font-semibold text-on-surface mb-4 flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary" style={{ fontSize: 18 }}>attach_file</span>
                  Attachments ({request.attachments.length})
                </h3>
                <div className="space-y-2">
                  {request.attachments.map((a, i) => (
                    <a
                      key={i}
                      href={a.url || '#'}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-sm text-on-surface-variant bg-surface-container p-2 rounded-lg hover:bg-surface-container-high transition-colors"
                    >
                      <span className="material-symbols-outlined" style={{ fontSize: 16 }}>attach_file</span>
                      <span className="flex-1 truncate">{a.originalName}</span>
                      <span className="text-xs">{(a.size / 1024).toFixed(0)} KB</span>
                      <span className="material-symbols-outlined text-primary" style={{ fontSize: 16 }}>download</span>
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
