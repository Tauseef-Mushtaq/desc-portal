import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import toast from 'react-hot-toast';
import AppLayout from '../components/layout/AppLayout';
import Avatar from '../components/common/Avatar';
import { useAuth } from '../context/AuthContext';

export default function AdminStaff() {
  const { user: currentUser } = useAuth();
  const [departments, setDepartments] = useState([]);
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({ fullName: '', email: '', password: '', phone: '', department: '' });

  const loadData = () => {
    setLoading(true);
    Promise.all([axios.get('/api/admin/departments'), axios.get('/api/admin/staff')])
      .then(([deptRes, staffRes]) => {
        setDepartments(deptRes.data.departments);
        setStaff(staffRes.data.staff);
      })
      .catch(() => toast.error('Failed to load staff data'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadData();
  }, []);

  const staffCountByDept = (deptId) => staff.filter((s) => s.department?._id === deptId).length;
  const superAdminCount = staff.filter((s) => !s.department).length;

  const handleCreateStaff = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await axios.post('/api/admin/staff', form);
      toast.success('Staff account created');
      setForm({ fullName: '', email: '', password: '', phone: '', department: '' });
      setShowForm(false);
      loadData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not create staff account');
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleActive = async (member) => {
    try {
      const { data } = await axios.put(`/api/admin/staff/${member._id}`, { isActive: !member.isActive });
      setStaff((prev) => prev.map((s) => (s._id === member._id ? { ...s, isActive: data.staff.isActive } : s)));
      toast.success(data.staff.isActive ? 'Account reactivated' : 'Account deactivated');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not update account');
    }
  };

  const handleChangeDepartment = async (member, departmentId) => {
    try {
      const { data } = await axios.put(`/api/admin/staff/${member._id}`, { department: departmentId || null });
      setStaff((prev) => prev.map((s) => (s._id === member._id ? data.staff : s)));
      toast.success('Department updated');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not update department');
    }
  };

  return (
    <AppLayout>
      <div className="px-4 md:px-8 py-8 max-w-portal mx-auto pb-24 lg:pb-8">

        {/* Page Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-primary">Staff & Departments</h1>
            <p className="text-on-surface-variant text-sm mt-1">
              Manage which admin accounts handle which service requests
            </p>
          </div>
          <div className="flex gap-2">
            <Link to="/admin" className="btn-secondary flex items-center gap-2 self-start">
              <span className="material-symbols-outlined" style={{ fontSize: 18 }}>monitoring</span>
              Back to Overview
            </Link>
            <button onClick={() => setShowForm((v) => !v)} className="btn-primary flex items-center gap-2 self-start">
              <span className="material-symbols-outlined" style={{ fontSize: 18 }}>person_add</span>
              New Staff
            </button>
          </div>
        </div>

        {/* New staff form */}
        {showForm && (
          <div className="card p-6 mb-8">
            <h2 className="font-semibold text-on-surface mb-4">Create Staff Account</h2>
            <form onSubmit={handleCreateStaff} className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-on-surface-variant uppercase tracking-wide">Full Name *</label>
                <input
                  type="text" required className="input-field"
                  value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })}
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-on-surface-variant uppercase tracking-wide">Email *</label>
                <input
                  type="email" required className="input-field"
                  value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })}
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-on-surface-variant uppercase tracking-wide">Password *</label>
                <input
                  type="password" required minLength={6} className="input-field" placeholder="Min. 6 characters"
                  value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })}
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-on-surface-variant uppercase tracking-wide">Phone</label>
                <input
                  type="tel" className="input-field"
                  value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })}
                />
              </div>
              <div className="space-y-1.5 md:col-span-2">
                <label className="text-xs font-semibold text-on-surface-variant uppercase tracking-wide">Department</label>
                <select
                  className="input-field"
                  value={form.department}
                  onChange={(e) => setForm({ ...form, department: e.target.value })}
                >
                  <option value="">No department — Super Admin (sees every request)</option>
                  {departments.map((d) => (
                    <option key={d._id} value={d._id}>{d.name}</option>
                  ))}
                </select>
              </div>
              <div className="md:col-span-2 flex gap-3">
                <button type="submit" disabled={submitting} className="btn-primary disabled:opacity-60">
                  {submitting ? 'Creating...' : 'Create Account'}
                </button>
                <button type="button" onClick={() => setShowForm(false)} className="btn-secondary">Cancel</button>
              </div>
            </form>
          </div>
        )}

        {loading ? (
          <div className="flex justify-center py-20">
            <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <>
            {/* Departments overview */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              <div className="card p-4">
                <span className="material-symbols-outlined text-primary mb-2 block" style={{ fontSize: 22 }}>shield_person</span>
                <p className="text-2xl font-bold text-primary">{superAdminCount}</p>
                <p className="text-xs text-on-surface-variant">Super Admin{superAdminCount !== 1 ? 's' : ''}</p>
              </div>
              {departments.map((d) => (
                <div key={d._id} className="card p-4">
                  <span className="material-symbols-outlined text-primary mb-2 block" style={{ fontSize: 22 }}>{d.icon}</span>
                  <p className="text-2xl font-bold text-primary">{staffCountByDept(d._id)}</p>
                  <p className="text-xs text-on-surface-variant truncate" title={d.name}>{d.name}</p>
                </div>
              ))}
            </div>

            {/* Staff roster */}
            <div className="card overflow-hidden">
              <div className="px-6 py-4 border-b border-outline-variant">
                <h2 className="font-semibold text-on-surface">Staff Accounts ({staff.length})</h2>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-xs text-on-surface-variant uppercase tracking-wide bg-surface-container">
                      <th className="px-6 py-3 font-semibold">Name</th>
                      <th className="px-6 py-3 font-semibold">Email</th>
                      <th className="px-6 py-3 font-semibold">Department</th>
                      <th className="px-6 py-3 font-semibold">Status</th>
                      <th className="px-6 py-3 font-semibold text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-outline-variant/50">
                    {staff.map((member) => {
                      const isSelf = member._id === currentUser?._id;
                      return (
                      <tr key={member._id}>
                        <td className="px-6 py-3">
                          <div className="flex items-center gap-2">
                            <Avatar user={member} size={28} />
                            <span className="font-medium text-on-surface">
                              {member.fullName}{isSelf && <span className="text-xs text-on-surface-variant font-normal"> (You)</span>}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-3 text-on-surface-variant">{member.email}</td>
                        <td className="px-6 py-3">
                          <select
                            disabled={isSelf}
                            className="text-xs border border-outline-variant rounded-lg px-2 py-1.5 bg-surface-container-lowest disabled:opacity-50 disabled:cursor-not-allowed"
                            value={member.department?._id || ''}
                            onChange={(e) => handleChangeDepartment(member, e.target.value)}
                          >
                            <option value="">Super Admin</option>
                            {departments.map((d) => (
                              <option key={d._id} value={d._id}>{d.name}</option>
                            ))}
                          </select>
                        </td>
                        <td className="px-6 py-3">
                          <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                            member.isActive ? 'bg-green-100 text-green-800' : 'bg-error-container text-on-error-container'
                          }`}>
                            {member.isActive ? 'Active' : 'Deactivated'}
                          </span>
                        </td>
                        <td className="px-6 py-3 text-right">
                          <button
                            onClick={() => handleToggleActive(member)}
                            disabled={isSelf}
                            className="text-xs font-medium text-primary hover:underline disabled:opacity-50 disabled:no-underline disabled:cursor-not-allowed"
                          >
                            {member.isActive ? 'Deactivate' : 'Reactivate'}
                          </button>
                        </td>
                      </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </div>
    </AppLayout>
  );
}
