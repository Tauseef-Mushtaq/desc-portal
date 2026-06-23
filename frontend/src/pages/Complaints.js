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

export default function Complaints() {
  const [items, setItems] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({ type: 'complaint', subject: '', description: '', department: '' });

  const loadData = () => {
    setLoading(true);
    Promise.all([axios.get('/api/complaints'), axios.get('/api/complaints/departments')])
      .then(([itemsRes, deptRes]) => {
        setItems(itemsRes.data.complaints);
        setDepartments(deptRes.data.departments);
      })
      .catch(() => toast.error('Failed to load'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const { data } = await axios.post('/api/complaints', form);
      toast.success(data.message);
      setForm({ type: 'complaint', subject: '', description: '', department: '' });
      setShowForm(false);
      loadData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not submit');
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
              Tell us what's wrong, or what's working — about any department, anytime.
            </p>
          </div>
          <button onClick={() => setShowForm((v) => !v)} className="btn-primary flex items-center gap-2 self-start">
            <span className="material-symbols-outlined" style={{ fontSize: 18 }}>add_comment</span>
            New
          </button>
        </div>

        {/* Submit form */}
        {showForm && (
          <div className="card p-6 mb-8">
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Type toggle */}
              <div className="flex gap-2">
                {['complaint', 'feedback'].map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setForm({ ...form, type: t })}
                    className={`flex-1 py-2.5 rounded-lg text-sm font-semibold capitalize transition-all ${
                      form.type === t ? 'bg-primary text-white shadow-md' : 'bg-surface-container text-on-surface-variant hover:bg-surface-container-high'
                    }`}
                  >
                    {t === 'complaint' ? '⚠️ File a Complaint' : '💬 Share Feedback'}
                  </button>
                ))}
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-on-surface-variant uppercase tracking-wide">Subject *</label>
                <input
                  type="text" required className="input-field"
                  placeholder={form.type === 'complaint' ? 'Briefly describe the issue' : 'What would you like to share?'}
                  value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })}
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-on-surface-variant uppercase tracking-wide">Details *</label>
                <textarea
                  required rows={4} className="input-field"
                  placeholder="Tell us more..."
                  value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })}
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-on-surface-variant uppercase tracking-wide">Which department? (optional)</label>
                <select
                  className="input-field"
                  value={form.department}
                  onChange={(e) => setForm({ ...form, department: e.target.value })}
                >
                  <option value="">General — not about a specific department</option>
                  {departments.map((d) => (
                    <option key={d._id} value={d._id}>{d.name}</option>
                  ))}
                </select>
              </div>

              <div className="flex gap-3">
                <button type="submit" disabled={submitting} className="btn-primary disabled:opacity-60">
                  {submitting ? 'Submitting...' : 'Submit'}
                </button>
                <button type="button" onClick={() => setShowForm(false)} className="btn-secondary">Cancel</button>
              </div>
            </form>
          </div>
        )}

        {/* History */}
        <div className="card overflow-hidden">
          {loading ? (
            <div className="p-6 space-y-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-16 bg-surface-container animate-pulse rounded-xl" />
              ))}
            </div>
          ) : items.length === 0 ? (
            <div className="p-16 text-center">
              <div className="w-16 h-16 bg-surface-container rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="material-symbols-outlined text-on-surface-variant" style={{ fontSize: 28 }}>forum</span>
              </div>
              <p className="font-medium text-on-surface mb-1">Nothing submitted yet</p>
              <p className="text-sm text-on-surface-variant">Filed complaints and feedback will show up here.</p>
            </div>
          ) : (
            <div className="divide-y divide-outline-variant">
              {items.map((item) => (
                <Link
                  key={item._id}
                  to={`/complaints/${item._id}`}
                  className="flex flex-col md:flex-row md:items-center gap-3 p-4 hover:bg-surface-container-low transition-colors group"
                >
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="w-10 h-10 bg-secondary-container rounded-xl flex items-center justify-center flex-shrink-0">
                      <span className="material-symbols-outlined text-on-secondary-container" style={{ fontSize: 18 }}>
                        {item.type === 'complaint' ? 'report' : 'forum'}
                      </span>
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold text-on-surface text-sm truncate">{item.subject}</p>
                      <p className="text-xs text-on-surface-variant mt-0.5">
                        {item.type === 'complaint' ? 'Complaint' : 'Feedback'} · {item.department?.name || 'General'}
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
