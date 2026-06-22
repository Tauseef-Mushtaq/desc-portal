import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import NotificationBell from './NotificationBell';
import Avatar from '../common/Avatar';

const navLinks = [
  { to: '/home', icon: 'home', label: 'Home' },
  { to: '/dashboard', icon: 'grid_view', label: 'My Dashboard' },
  { to: '/submit-request', icon: 'add_circle', label: 'Submit Request' },
  { to: '/track-status', icon: 'history', label: 'Track Status' },
  { to: '/profile', icon: 'person', label: 'Profile' },
];

const adminLinks = [
  { to: '/admin', icon: 'monitoring', label: 'Overview' },
  { to: '/admin/requests', icon: 'folder_open', label: 'All Requests' },
];

export default function AppLayout({ children, title }) {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const isSuperAdmin = user?.role === 'admin' && !user?.department;
  const links = user?.role === 'admin'
    ? isSuperAdmin ? [...adminLinks, { to: '/admin/staff', icon: 'groups', label: 'Staff & Departments' }] : adminLinks
    : navLinks;
  const isActive = (to) => {
    if (to === '/admin') return location.pathname === '/admin';
    if (to === '/home') return location.pathname === '/home';
    return location.pathname === to || location.pathname.startsWith(to + '/');
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Top Bar */}
      <header className="fixed top-0 left-0 right-0 z-50 h-16 bg-surface-container-lowest border-b border-outline-variant flex items-center justify-between px-4 md:px-16">
        <div className="flex items-center gap-3">
          <button className="lg:hidden mr-1 text-on-surface-variant" onClick={() => setSidebarOpen(!sidebarOpen)}>
            <span className="material-symbols-outlined">menu</span>
          </button>
          <Link to={user?.role === 'admin' ? '/admin' : '/home'} className="flex items-center gap-2">
            <span className="material-symbols-outlined text-primary" style={{ fontSize: 28 }}>account_balance</span>
            <span className="font-bold text-primary text-lg hidden sm:block">DESC Citizen Portal</span>
          </Link>
        </div>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-1 h-full">
          {links.map((l) => (
            <Link
              key={l.to}
              to={l.to}
              className={`h-full flex items-center px-4 text-sm font-medium transition-colors border-b-2 ${
                isActive(l.to)
                  ? 'text-primary border-primary'
                  : 'text-on-surface-variant border-transparent hover:text-primary'
              }`}
            >
              {l.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          <NotificationBell />
          <div className="hidden md:flex items-center gap-2 text-sm text-on-surface-variant">
            <Avatar user={user} size={32} />
            <span className="font-medium text-on-surface">{user?.fullName?.split(' ')[0]}</span>
          </div>
          <button
            onClick={handleLogout}
            className="bg-primary text-white text-sm font-semibold px-4 py-2 rounded-lg hover:bg-primary-container transition-all active:scale-95"
          >
            Logout
          </button>
        </div>
      </header>

      {/* Sidebar */}
      <>
        {/* Overlay */}
        {sidebarOpen && (
          <div className="fixed inset-0 bg-black/40 z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />
        )}
        <aside
          className={`fixed left-0 top-0 h-full z-40 w-64 bg-surface-container border-r border-outline-variant pt-16 transition-transform duration-300 ${
            sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
          }`}
        >
          {/* User info */}
          <div className="p-6 border-b border-outline-variant/50">
            <div className="flex items-center gap-3">
              <Avatar user={user} size={48} />
              <div className="min-w-0">
                <p className="font-semibold text-primary truncate">{user?.fullName}</p>
                <p className="text-xs text-on-surface-variant">{user?.city || 'Mardan'}, KPK</p>
                {user?.role === 'admin' && (
                  <span className="text-xs bg-primary text-white px-2 py-0.5 rounded-full mt-1 inline-block">
                    {user?.department?.name || 'Super Admin'}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Nav links */}
          <nav className="p-2 space-y-1">
            {links.map((l) => (
              <Link
                key={l.to}
                to={l.to}
                onClick={() => setSidebarOpen(false)}
                className={isActive(l.to) ? 'nav-link-active' : 'nav-link'}
              >
                <span className="material-symbols-outlined" style={{ fontSize: 20 }}>{l.icon}</span>
                {l.label}
              </Link>
            ))}
          </nav>

          {/* Bottom logout */}
          <div className="absolute bottom-8 left-0 right-0 px-2">
            <button
              onClick={handleLogout}
              className="nav-link w-full text-error hover:bg-error-container/30"
            >
              <span className="material-symbols-outlined" style={{ fontSize: 20 }}>logout</span>
              Sign Out
            </button>
          </div>
        </aside>
      </>

      {/* Main Content */}
      <main className="lg:ml-64 pt-16 min-h-screen">
        {children}
      </main>

      {/* Mobile bottom nav */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-surface-container-lowest border-t border-outline-variant z-30 flex">
        {links.slice(0, 4).map((l) => (
          <Link
            key={l.to}
            to={l.to}
            className={`flex-1 flex flex-col items-center py-2 gap-1 text-xs transition-colors ${
              isActive(l.to) ? 'text-primary' : 'text-on-surface-variant'
            }`}
          >
            <span className="material-symbols-outlined" style={{ fontSize: 22 }}>{l.icon}</span>
            <span className="text-[10px]">{l.label.split(' ')[0]}</span>
          </Link>
        ))}
      </nav>
    </div>
  );
}
