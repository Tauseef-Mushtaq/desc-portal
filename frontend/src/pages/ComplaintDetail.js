import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import AppLayout from '../components/layout/AppLayout';

const STATUS_STYLES = {
  open: 'bg-secondary-container text-on-secondary-container',
  in_review: 'bg-primary-fixed text-on-primary-fixed',
  resolved: 'bg-green-100 text-green-800',
  dismissed: 'bg-surface-container-high text-on-surface-variant',
};
const STATUS_LABELS = { open: 'Open', in_review: 'In Review', resolved: 'Resolved', dismissed: 'Dismissed' };

export default function ComplaintDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [item, setItem] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios.get(`/api/complaints/${id}`)
      .then(({ data }) => setItem(data.complaint))
      .catch(() => navigate('/complaints'))
      .finally(() => setLoading(false));
  }, [id, navigate]);

  if (loading) {
    return (
      <AppLayout>
        <div className="flex justify-center py-20">
          <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      </AppLayout>
    );
  }
  if (!item) return null;

  return (
    <AppLayout>
      <div className="px-4 md:px-8 py-8 max-w-3xl mx-auto pb-24 lg:pb-8">

        <button onClick={() => navigate('/complaints')} className="flex items-center gap-1 text-sm text-on-surface-variant hover:text-primary mb-6">
          <span className="material-symbols-outlined" style={{ fontSize: 18 }}>arrow_back</span>
          Back to Complaints & Feedback
        </button>

        <div className="card p-6 mb-6">
          <div className="flex flex-wrap items-center gap-2 mb-3">
            <span className="text-xs font-medium bg-secondary-container text-on-secondary-container px-2 py-1 rounded-full capitalize">
              {item.type}
            </span>
            <span className={`text-xs px-2 py-1 rounded-full font-medium ${STATUS_STYLES[item.status]}`}>
              {STATUS_LABELS[item.status]}
            </span>
            {item.department && (
              <span className="text-xs font-medium bg-surface-container text-on-surface-variant px-2 py-1 rounded-full flex items-center gap-1">
                <span className="material-symbols-outlined" style={{ fontSize: 14 }}>{item.department.icon}</span>
                {item.department.name}
              </span>
            )}
          </div>
          <h1 className="text-xl md:text-2xl font-bold text-primary mb-1">{item.subject}</h1>
          <p className="text-sm text-on-surface-variant mb-4">
            Submitted {new Date(item.createdAt).toLocaleDateString('en-PK', { year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
          <p className="text-sm text-on-surface whitespace-pre-wrap">{item.description}</p>
          {item.relatedRequest && (
            <p className="text-xs text-on-surface-variant mt-3">
              Related to request <span className="font-mono">{item.relatedRequest.requestId}</span> — {item.relatedRequest.subject}
            </p>
          )}
        </div>

        {item.adminResponse ? (
          <div className="card p-6 bg-primary-fixed/30">
            <h2 className="font-semibold text-on-surface mb-2 flex items-center gap-2">
              <span className="material-symbols-outlined text-primary" style={{ fontSize: 18 }}>support_agent</span>
              Response from DESC
            </h2>
            <p className="text-sm text-on-surface whitespace-pre-wrap">{item.adminResponse}</p>
            <p className="text-xs text-on-surface-variant mt-3">
              {item.respondedByName} · {new Date(item.respondedAt).toLocaleDateString('en-PK', { year: 'numeric', month: 'long', day: 'numeric' })}
            </p>
          </div>
        ) : (
          <div className="card p-6 text-center">
            <span className="material-symbols-outlined text-on-surface-variant block mx-auto mb-2" style={{ fontSize: 28 }}>hourglass_empty</span>
            <p className="text-sm text-on-surface-variant">Awaiting a response from DESC.</p>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
