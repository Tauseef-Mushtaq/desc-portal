import React, { useRef, useState } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import AppLayout from '../components/layout/AppLayout';
import Avatar from '../components/common/Avatar';
import toast from 'react-hot-toast';

export default function ProfilePage() {
  const { user, updateUser } = useAuth();
  const [tab, setTab] = useState('profile');
  const [saving, setSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const fileInputRef = useRef(null);
  const [form, setForm] = useState({
    fullName: user?.fullName || '',
    phone: user?.phone || '',
    cnic: user?.cnic || '',
    address: user?.address || '',
    city: user?.city || 'Mardan',
    province: user?.province || 'KPK',
  });
  const [pwdForm, setPwdForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });

  const update = (k) => (e) => setForm({ ...form, [k]: e.target.value });
  const updatePwd = (k) => (e) => setPwdForm({ ...pwdForm, [k]: e.target.value });

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const { data } = await axios.put('/api/auth/profile', form);
      updateUser(data.user);
      toast.success('Profile updated successfully');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Update failed');
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (pwdForm.newPassword !== pwdForm.confirmPassword) {
      toast.error('New passwords do not match');
      return;
    }
    setSaving(true);
    try {
      await axios.put('/api/auth/change-password', {
        currentPassword: pwdForm.currentPassword,
        newPassword: pwdForm.newPassword,
      });
      toast.success('Password changed successfully');
      setPwdForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Password change failed');
    } finally {
      setSaving(false);
    }
  };

  const handleAvatarSelect = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = ''; // allow re-selecting the same file later
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      toast.error('Image must be smaller than 2MB');
      return;
    }

    const formData = new FormData();
    formData.append('avatar', file);

    setUploadingAvatar(true);
    try {
      const { data } = await axios.post('/api/auth/avatar', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      updateUser(data.user);
      toast.success('Profile picture updated');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Upload failed');
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleRemoveAvatar = async () => {
    setUploadingAvatar(true);
    try {
      const { data } = await axios.delete('/api/auth/avatar');
      updateUser(data.user);
      toast.success('Profile picture removed');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not remove avatar');
    } finally {
      setUploadingAvatar(false);
    }
  };

  return (
    <AppLayout>
      <div className="px-4 md:px-8 py-8 max-w-portal mx-auto pb-24 lg:pb-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl md:text-3xl font-bold text-primary mb-2">My Profile</h1>
          <p className="text-on-surface-variant text-sm">Manage your account information and security settings.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left: Avatar Card */}
          <div className="space-y-4">
            <div className="card p-6 text-center">
              <div className="relative w-20 h-20 mx-auto mb-4">
                <Avatar user={user} size={80} className="border-2 border-outline-variant" />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploadingAvatar}
                  className="absolute bottom-0 right-0 w-7 h-7 rounded-full bg-primary text-white flex items-center justify-center border-2 border-surface-container-lowest hover:bg-primary-container transition-colors disabled:opacity-60"
                  aria-label="Change profile picture"
                >
                  <span className="material-symbols-outlined" style={{ fontSize: 14 }}>
                    {uploadingAvatar ? 'hourglass_empty' : 'photo_camera'}
                  </span>
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  onChange={handleAvatarSelect}
                  className="hidden"
                />
              </div>
              {user?.avatar && (
                <button
                  onClick={handleRemoveAvatar}
                  disabled={uploadingAvatar}
                  className="text-xs text-error hover:underline mb-3 disabled:opacity-60"
                >
                  Remove photo
                </button>
              )}
              <h2 className="font-bold text-on-surface text-lg">{user?.fullName}</h2>
              <p className="text-sm text-on-surface-variant mt-1">{user?.email}</p>
              <span className={`inline-flex items-center gap-1 mt-3 px-3 py-1 rounded-full text-xs font-semibold ${
                user?.role === 'admin' ? 'bg-primary text-white' : 'bg-secondary-container text-on-secondary-container'
              }`}>
                <span className="material-symbols-outlined" style={{ fontSize: 13 }}>
                  {user?.role === 'admin' ? 'admin_panel_settings' : 'person'}
                </span>
                {user?.role === 'admin' ? 'Administrator' : 'Citizen'}
              </span>

              <div className="mt-6 pt-6 border-t border-outline-variant space-y-3 text-left">
                {[
                  { icon: 'location_on', label: `${user?.city || 'Mardan'}, ${user?.province || 'KPK'}` },
                  { icon: 'phone', label: user?.phone || 'Not provided' },
                  { icon: 'badge', label: user?.cnic || 'Not provided' },
                ].map(({ icon, label }) => (
                  <div key={icon} className="flex items-center gap-3 text-sm text-on-surface-variant">
                    <span className="material-symbols-outlined text-primary" style={{ fontSize: 16 }}>{icon}</span>
                    <span className="truncate">{label}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Tab Nav */}
            <div className="card overflow-hidden">
              {[
                { key: 'profile', icon: 'person', label: 'Edit Profile' },
                { key: 'security', icon: 'lock', label: 'Security' },
              ].map((t) => (
                <button
                  key={t.key}
                  onClick={() => setTab(t.key)}
                  className={`w-full flex items-center gap-3 px-5 py-3.5 text-sm font-medium transition-colors ${
                    tab === t.key
                      ? 'bg-secondary-container text-on-secondary-container'
                      : 'text-on-surface-variant hover:bg-surface-container'
                  }`}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: 18 }}>{t.icon}</span>
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {/* Right: Forms */}
          <div className="lg:col-span-2">
            {tab === 'profile' && (
              <div className="card p-6">
                <h2 className="font-semibold text-on-surface text-lg mb-6 flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary" style={{ fontSize: 20 }}>edit</span>
                  Edit Profile Information
                </h2>
                <form onSubmit={handleSaveProfile} className="space-y-5">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-on-surface-variant uppercase tracking-wide">Full Name *</label>
                      <input type="text" required className="input-field" value={form.fullName} onChange={update('fullName')} />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-on-surface-variant uppercase tracking-wide">Email (cannot change)</label>
                      <input type="email" className="input-field bg-surface-container-high cursor-not-allowed" value={user?.email} readOnly />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-on-surface-variant uppercase tracking-wide">Phone Number</label>
                      <input type="tel" className="input-field" placeholder="0300-0000000" value={form.phone} onChange={update('phone')} />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-on-surface-variant uppercase tracking-wide">CNIC</label>
                      <input type="text" className="input-field" placeholder="16101-1234567-1" value={form.cnic} onChange={update('cnic')} />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-on-surface-variant uppercase tracking-wide">City</label>
                      <input type="text" className="input-field" value={form.city} onChange={update('city')} />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-on-surface-variant uppercase tracking-wide">Province</label>
                      <select className="input-field" value={form.province} onChange={update('province')}>
                        <option>KPK</option>
                        <option>Punjab</option>
                        <option>Sindh</option>
                        <option>Balochistan</option>
                        <option>Islamabad</option>
                        <option>AJK</option>
                        <option>GB</option>
                      </select>
                    </div>
                    <div className="space-y-1.5 md:col-span-2">
                      <label className="text-xs font-semibold text-on-surface-variant uppercase tracking-wide">Address</label>
                      <input type="text" className="input-field" placeholder="House No., Street, Area" value={form.address} onChange={update('address')} />
                    </div>
                  </div>
                  <button type="submit" disabled={saving} className="btn-primary flex items-center gap-2 disabled:opacity-60">
                    {saving ? 'Saving...' : (
                      <>
                        <span className="material-symbols-outlined" style={{ fontSize: 18 }}>save</span>
                        Save Changes
                      </>
                    )}
                  </button>
                </form>
              </div>
            )}

            {tab === 'security' && (
              <div className="card p-6">
                <h2 className="font-semibold text-on-surface text-lg mb-6 flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary" style={{ fontSize: 20 }}>lock</span>
                  Change Password
                </h2>
                <form onSubmit={handleChangePassword} className="space-y-5 max-w-md">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-on-surface-variant uppercase tracking-wide">Current Password</label>
                    <input type="password" required className="input-field" placeholder="Enter current password" value={pwdForm.currentPassword} onChange={updatePwd('currentPassword')} />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-on-surface-variant uppercase tracking-wide">New Password</label>
                    <input type="password" required minLength={6} className="input-field" placeholder="Min. 6 characters" value={pwdForm.newPassword} onChange={updatePwd('newPassword')} />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-on-surface-variant uppercase tracking-wide">Confirm New Password</label>
                    <input type="password" required className="input-field" placeholder="Repeat new password" value={pwdForm.confirmPassword} onChange={updatePwd('confirmPassword')} />
                  </div>
                  <div className="p-4 bg-primary-fixed rounded-xl text-sm text-on-primary-fixed space-y-1">
                    <p className="font-semibold">Password requirements:</p>
                    <p>• Minimum 6 characters</p>
                    <p>• Use a mix of letters and numbers for better security</p>
                  </div>
                  <button type="submit" disabled={saving} className="btn-primary flex items-center gap-2 disabled:opacity-60">
                    {saving ? 'Updating...' : (
                      <>
                        <span className="material-symbols-outlined" style={{ fontSize: 18 }}>lock_reset</span>
                        Update Password
                      </>
                    )}
                  </button>
                </form>
              </div>
            )}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
