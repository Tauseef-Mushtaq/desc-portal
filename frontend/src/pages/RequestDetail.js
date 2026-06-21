import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import toast from 'react-hot-toast';
import AppLayout from '../components/layout/AppLayout';
import { StatusBadge, PriorityBadge } from '../components/common/StatusBadge';
import StarRating from '../components/common/StarRating';
import FeedbackForm from '../components/common/FeedbackForm';
import { useSocket } from '../context/SocketContext';

export default function RequestDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [request, setRequest] = useState(null);
  const [loading, setLoading] = useState(true);
  const { socket } = useSocket();

  useEffect(() => {
    axios.get(`/api/requests/${id}`)
      .then(({ data }) => setRequest(data.request))
      .catch(() => navigate('/track-status'))
      .finally(() => setLoading(false));
  }, [id]);

  // If an admin updates this exact request while the citizen has the page
  // open, refetch silently so the status/timeline update live instead of
  // requiring a manual refresh.
  useEffect(() => {
    if (!socket) return;
    const handleNotification = (notification) => {
      if (notification.relatedRequest === id) {
        axios.get(`/api/requests/${id}`).then(({ data }) => setRequest(data.request)).catch(() => {});
        toast(notification.title, { icon: '🔄' });
      }
    };
    socket.on('notification:new', handleNotification);
    return () => socket.off('notification:new', handleNotification);
  }, [socket, id]);

  if (loading) return (
    <AppLayout>
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex gap-2">
          {[0,1,2].map(i => (
            <div key={i} className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: `${i*150}ms` }} />
          ))}
        </div>
      </div>
    </AppLayout>
  );

  if (!request) return null;

  return (
    <AppLayout>
      <div className="px-4 md:px-8 py-8 max-w-portal mx-auto pb-24 lg:pb-8">
        {/* Back */}
        <button onClick={() => navigate(-1)} className="flex items-center gap-1 text-sm text-on-surface-variant hover:text-primary mb-6 transition-colors">
          <span className="material-symbols-outlined" style={{ fontSize: 18 }}>arrow_back</span>
          Back to Requests
        </button>

        {/* Header Card */}
        <div className="card p-6 mb-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xs font-mono text-on-surface-variant bg-surface-container px-2 py-1 rounded">{request.requestId}</span>
                <StatusBadge status={request.status} />
                <PriorityBadge priority={request.priority} />
              </div>
              <h1 className="text-xl md:text-2xl font-bold text-primary">{request.subject}</h1>
              <p className="text-sm text-on-surface-variant mt-1">
                {request.serviceTypeLabel} · Submitted {new Date(request.createdAt).toLocaleDateString('en-PK', { year: 'numeric', month: 'long', day: 'numeric' })}
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Description */}
            <div className="card p-6">
              <h2 className="font-semibold text-on-surface mb-3 flex items-center gap-2">
                <span className="material-symbols-outlined text-primary" style={{ fontSize: 18 }}>edit_note</span>
                Request Details
              </h2>
              <p className="text-sm text-on-surface leading-relaxed">{request.description}</p>
              {request.district && (
                <div className="mt-4 flex items-center gap-2 text-sm text-on-surface-variant">
                  <span className="material-symbols-outlined" style={{ fontSize: 16 }}>location_on</span>
                  {[request.district, request.tehsil, request.village].filter(Boolean).join(', ')}
                </div>
              )}
            </div>

            {/* Admin Notes */}
            {request.adminNotes && (
              <div className="card p-6 border-l-4 border-primary">
                <h2 className="font-semibold text-on-surface mb-2 flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary" style={{ fontSize: 18 }}>admin_panel_settings</span>
                  Admin Notes
                </h2>
                <p className="text-sm text-on-surface">{request.adminNotes}</p>
              </div>
            )}

            {/* Rejection Reason */}
            {request.rejectionReason && (
              <div className="card p-6 bg-error-container border-l-4 border-error">
                <h2 className="font-semibold text-on-error-container mb-2 flex items-center gap-2">
                  <span className="material-symbols-outlined text-error" style={{ fontSize: 18 }}>cancel</span>
                  Rejection Reason
                </h2>
                <p className="text-sm text-on-error-container">{request.rejectionReason}</p>
              </div>
            )}

            {/* Timeline */}
            <div className="card p-6">
              <h2 className="font-semibold text-on-surface mb-4 flex items-center gap-2">
                <span className="material-symbols-outlined text-primary" style={{ fontSize: 18 }}>timeline</span>
                Status Timeline
              </h2>
              <div className="space-y-4">
                {[...request.timeline].reverse().map((event, i) => (
                  <div key={i} className="flex gap-4">
                    <div className="flex flex-col items-center">
                      <div className={`w-3 h-3 rounded-full mt-1 flex-shrink-0 ${i === 0 ? 'bg-primary' : 'bg-outline-variant'}`} />
                      {i < request.timeline.length - 1 && <div className="w-0.5 h-full bg-outline-variant mt-1 flex-shrink-0" />}
                    </div>
                    <div className="pb-4 min-w-0">
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

            {/* Feedback */}
            {request.status === 'resolved' && (
              <div className="card p-6">
                <h2 className="font-semibold text-on-surface mb-3 flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary" style={{ fontSize: 18 }}>rate_review</span>
                  Your Feedback
                </h2>
                {request.feedback?.submittedAt ? (
                  <div>
                    <StarRating value={request.feedback.rating} readOnly />
                    {request.feedback.comment && (
                      <p className="text-sm text-on-surface-variant mt-2">{request.feedback.comment}</p>
                    )}
                    <p className="text-xs text-on-surface-variant mt-2">
                      Submitted {new Date(request.feedback.submittedAt).toLocaleDateString('en-PK', { year: 'numeric', month: 'long', day: 'numeric' })}
                    </p>
                  </div>
                ) : (
                  <FeedbackForm requestId={request._id} onSubmitted={(updated) => setRequest(updated)} />
                )}
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            <div className="card p-6">
              <h3 className="font-semibold text-on-surface mb-4">Request Info</h3>
              <dl className="space-y-3 text-sm">
                {[
                  ['Request ID', request.requestId],
                  ['Service', request.serviceTypeLabel],
                  ['Priority', request.priority?.charAt(0).toUpperCase() + request.priority?.slice(1)],
                  ['Submitted', new Date(request.createdAt).toLocaleDateString('en-PK')],
                  ...(request.resolvedAt ? [['Resolved', new Date(request.resolvedAt).toLocaleDateString('en-PK')]] : []),
                ].map(([label, value]) => (
                  <div key={label} className="flex justify-between gap-2">
                    <dt className="text-on-surface-variant">{label}</dt>
                    <dd className="font-medium text-on-surface text-right">{value}</dd>
                  </div>
                ))}
              </dl>
            </div>

            <div className="card p-6">
              <h3 className="font-semibold text-on-surface mb-4">Applicant</h3>
              <dl className="space-y-3 text-sm">
                {[
                  ['Name', request.applicantName],
                  ['Phone', request.applicantPhone],
                  ['CNIC', request.applicantCnic],
                ].map(([label, value]) => (
                  <div key={label}>
                    <dt className="text-xs text-on-surface-variant uppercase tracking-wide">{label}</dt>
                    <dd className="font-medium text-on-surface mt-0.5">{value || '—'}</dd>
                  </div>
                ))}
              </dl>
            </div>

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
                      <span className="material-symbols-outlined" style={{ fontSize: 16 }}>description</span>
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
