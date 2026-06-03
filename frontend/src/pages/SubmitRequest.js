import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import AppLayout from '../components/layout/AppLayout';
import toast from 'react-hot-toast';

const SERVICE_TYPES = [
  { value: 'water_supply', label: 'Water Supply', icon: 'water_drop' },
  { value: 'electricity', label: 'Electricity', icon: 'bolt' },
  { value: 'road_maintenance', label: 'Road Maintenance', icon: 'road' },
  { value: 'sewerage', label: 'Sewerage', icon: 'plumbing' },
  { value: 'birth_certificate', label: 'Birth Certificate', icon: 'description' },
  { value: 'death_certificate', label: 'Death Certificate', icon: 'description' },
  { value: 'property_tax', label: 'Property Tax', icon: 'receipt_long' },
  { value: 'business_license', label: 'Business License', icon: 'store' },
  { value: 'building_permit', label: 'Building Permit', icon: 'domain' },
  { value: 'other', label: 'Other', icon: 'more_horiz' },
];

export default function SubmitRequest() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [files, setFiles] = useState([]);
  const [form, setForm] = useState({
    serviceType: '',
    subject: '',
    description: '',
    priority: 'normal',
    applicantCnic: user?.cnic || '',
    applicantPhone: user?.phone || '',
    applicantAddress: user?.address || '',
    district: 'Mardan',
    tehsil: '',
    village: '',
  });

  const update = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.serviceType) { toast.error('Please select a service type'); return; }
    setLoading(true);
    try {
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => fd.append(k, v));
      files.forEach((f) => fd.append('attachments', f));
      const { data } = await axios.post('/api/requests', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      toast.success(`Request ${data.request.requestId} submitted successfully!`);
      navigate('/track-status');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Submission failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AppLayout>
      <div className="px-4 md:px-8 py-8 max-w-portal mx-auto pb-24 lg:pb-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl md:text-3xl font-bold text-primary mb-2">Submit New Service Request</h1>
          <p className="text-on-surface-variant text-sm max-w-2xl">
            Complete the form below to initiate your official request. Ensure all information is accurate to avoid processing delays.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          {/* Main Form */}
          <form onSubmit={handleSubmit} className="lg:col-span-2 space-y-6">
            {/* Service Type */}
            <div className="card p-6">
              <h2 className="font-semibold text-on-surface flex items-center gap-2 mb-4">
                <span className="material-symbols-outlined text-primary" style={{ fontSize: 20 }}>category</span>
                Service Category
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {SERVICE_TYPES.map((s) => (
                  <button
                    key={s.value}
                    type="button"
                    onClick={() => setForm({ ...form, serviceType: s.value })}
                    className={`p-3 rounded-xl border-2 flex flex-col items-center gap-2 transition-all text-sm font-medium ${
                      form.serviceType === s.value
                        ? 'border-primary bg-primary-fixed text-primary'
                        : 'border-outline-variant bg-surface hover:border-primary/40 text-on-surface-variant'
                    }`}
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: 22 }}>{s.icon}</span>
                    <span className="text-xs text-center leading-tight">{s.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Applicant Info */}
            <div className="card p-6">
              <h2 className="font-semibold text-on-surface flex items-center gap-2 mb-4">
                <span className="material-symbols-outlined text-primary" style={{ fontSize: 20 }}>person</span>
                Applicant Information
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-on-surface-variant uppercase tracking-wide">Full Name</label>
                  <input className="input-field bg-surface-container-high cursor-not-allowed" value={user?.fullName} readOnly />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-on-surface-variant uppercase tracking-wide">Email</label>
                  <input className="input-field bg-surface-container-high cursor-not-allowed" value={user?.email} readOnly />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-on-surface-variant uppercase tracking-wide">CNIC *</label>
                  <input type="text" required className="input-field" placeholder="16101-1234567-1" value={form.applicantCnic} onChange={update('applicantCnic')} />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-on-surface-variant uppercase tracking-wide">Phone *</label>
                  <input type="tel" required className="input-field" placeholder="0300-0000000" value={form.applicantPhone} onChange={update('applicantPhone')} />
                </div>
                <div className="space-y-1.5 md:col-span-2">
                  <label className="text-xs font-semibold text-on-surface-variant uppercase tracking-wide">Complete Address *</label>
                  <input type="text" required className="input-field" placeholder="House No., Street, Area" value={form.applicantAddress} onChange={update('applicantAddress')} />
                </div>
              </div>
            </div>

            {/* Request Details */}
            <div className="card p-6">
              <h2 className="font-semibold text-on-surface flex items-center gap-2 mb-4">
                <span className="material-symbols-outlined text-primary" style={{ fontSize: 20 }}>edit_note</span>
                Request Details
              </h2>
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-on-surface-variant uppercase tracking-wide">Subject *</label>
                  <input type="text" required maxLength={150} className="input-field" placeholder="Brief subject of your request" value={form.subject} onChange={update('subject')} />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-on-surface-variant uppercase tracking-wide">Description *</label>
                  <textarea
                    required
                    rows={4}
                    className="input-field resize-none"
                    placeholder="Describe your issue in detail. Include location, nature of problem, and any relevant history..."
                    value={form.description}
                    onChange={update('description')}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-on-surface-variant uppercase tracking-wide">Priority</label>
                  <select className="input-field" value={form.priority} onChange={update('priority')}>
                    <option value="low">Low</option>
                    <option value="normal">Normal</option>
                    <option value="high">High</option>
                    <option value="urgent">Urgent</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Location */}
            <div className="card p-6">
              <h2 className="font-semibold text-on-surface flex items-center gap-2 mb-4">
                <span className="material-symbols-outlined text-primary" style={{ fontSize: 20 }}>location_on</span>
                Location Details
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-on-surface-variant uppercase tracking-wide">District</label>
                  <input className="input-field bg-surface-container-high cursor-not-allowed" value="Mardan" readOnly />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-on-surface-variant uppercase tracking-wide">Tehsil</label>
                  <input type="text" className="input-field" placeholder="e.g. Mardan City" value={form.tehsil} onChange={update('tehsil')} />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-on-surface-variant uppercase tracking-wide">Village / Area</label>
                  <input type="text" className="input-field" placeholder="e.g. Kalpani" value={form.village} onChange={update('village')} />
                </div>
              </div>
            </div>

            {/* Attachments */}
            <div className="card p-6">
              <h2 className="font-semibold text-on-surface flex items-center gap-2 mb-4">
                <span className="material-symbols-outlined text-primary" style={{ fontSize: 20 }}>attach_file</span>
                Attachments <span className="text-xs font-normal text-on-surface-variant">(Optional, max 5 files, 5MB each)</span>
              </h2>
              <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-outline-variant rounded-xl cursor-pointer hover:border-primary hover:bg-primary-fixed/30 transition-all">
                <span className="material-symbols-outlined text-on-surface-variant mb-2" style={{ fontSize: 28 }}>cloud_upload</span>
                <span className="text-sm text-on-surface-variant">Click to upload or drag and drop</span>
                <span className="text-xs text-on-surface-variant mt-1">PDF, PNG, JPG (max 5MB)</span>
                <input type="file" className="hidden" multiple accept=".pdf,.png,.jpg,.jpeg" onChange={(e) => setFiles(Array.from(e.target.files))} />
              </label>
              {files.length > 0 && (
                <div className="mt-3 space-y-2">
                  {files.map((f, i) => (
                    <div key={i} className="flex items-center gap-2 text-sm text-on-surface-variant bg-surface-container p-2 rounded-lg">
                      <span className="material-symbols-outlined" style={{ fontSize: 16 }}>attach_file</span>
                      <span className="flex-1 truncate">{f.name}</span>
                      <span className="text-xs">{(f.size / 1024).toFixed(1)} KB</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading || !form.serviceType}
              className="w-full bg-primary text-white font-semibold py-4 rounded-xl flex items-center justify-center gap-2 hover:bg-primary-container transition-all active:scale-[0.99] shadow-lg disabled:opacity-60 disabled:cursor-not-allowed text-base"
            >
              {loading ? (
                <>
                  <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Submitting...
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined" style={{ fontSize: 20 }}>send</span>
                  Submit Request
                </>
              )}
            </button>
          </form>

          {/* Sidebar */}
          <div className="space-y-4">
            <div className="card p-6">
              <h3 className="font-semibold text-on-surface mb-3 flex items-center gap-2">
                <span className="material-symbols-outlined text-primary" style={{ fontSize: 18 }}>info</span>
                Submission Guidelines
              </h3>
              <ul className="space-y-3 text-sm text-on-surface-variant">
                {[
                  'Provide accurate personal information to avoid delays.',
                  'Select the most appropriate service category.',
                  'Describe the issue clearly with location details.',
                  'Attach supporting documents if available.',
                  'You will receive updates via your dashboard.',
                ].map((tip, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="material-symbols-outlined text-primary mt-0.5" style={{ fontSize: 14 }}>check_circle</span>
                    {tip}
                  </li>
                ))}
              </ul>
            </div>

            <div className="card p-6 bg-primary text-white">
              <h3 className="font-semibold mb-2 flex items-center gap-2">
                <span className="material-symbols-outlined" style={{ fontSize: 18 }}>support_agent</span>
                Need Help?
              </h3>
              <p className="text-sm text-white/80 mb-3">Contact our support team for assistance with your requests.</p>
              <p className="text-sm font-mono text-white/90">0937-123456</p>
              <p className="text-xs text-white/70 mt-1">Mon – Fri, 9AM – 5PM</p>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
