import React, { useEffect, useRef, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { useSocket } from '../../context/SocketContext';

export default function NotificationBell() {
  const { notifications, unreadCount, setInitialNotifications, markAsRead, markAllAsRead } = useSocket();
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    axios
      .get('/api/notifications?limit=10')
      .then(({ data }) => setInitialNotifications(data.notifications, data.unreadCount))
      .catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  const handleSelect = async (notification) => {
    if (!notification.read) {
      markAsRead(notification._id);
      axios.put(`/api/notifications/${notification._id}/read`).catch(() => {});
    }
    setOpen(false);
    if (notification.link) navigate(notification.link);
  };

  const handleMarkAllRead = (e) => {
    e.stopPropagation();
    markAllAsRead();
    axios.put('/api/notifications/read-all').catch(() => {});
  };

  return (
    <div className="relative" ref={wrapperRef}>
      <button
        onClick={() => setOpen((o) => !o)}
        className="relative w-9 h-9 flex items-center justify-center rounded-full hover:bg-surface-container transition-colors"
        aria-label="Notifications"
      >
        <span className="material-symbols-outlined text-on-surface-variant" style={{ fontSize: 22 }}>
          notifications
        </span>
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 min-w-[16px] h-4 px-1 bg-error text-white text-[10px] font-bold rounded-full flex items-center justify-center leading-none">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-80 max-h-[28rem] overflow-y-auto bg-surface-container-lowest border border-outline-variant rounded-lg shadow-xl z-50">
          <div className="flex items-center justify-between px-4 py-3 border-b border-outline-variant sticky top-0 bg-surface-container-lowest">
            <h3 className="font-semibold text-on-surface text-sm">Notifications</h3>
            {unreadCount > 0 && (
              <button onClick={handleMarkAllRead} className="text-xs text-primary hover:underline font-medium">
                Mark all read
              </button>
            )}
          </div>

          {notifications.length === 0 ? (
            <div className="py-10 px-4 text-center text-sm text-on-surface-variant">
              <span className="material-symbols-outlined block mx-auto mb-2 text-outline-variant" style={{ fontSize: 32 }}>
                notifications_off
              </span>
              No notifications yet
            </div>
          ) : (
            notifications.map((n) => (
              <button
                key={n._id}
                onClick={() => handleSelect(n)}
                className={`w-full text-left px-4 py-3 border-b border-outline-variant/50 hover:bg-surface-container transition-colors ${
                  !n.read ? 'bg-primary-fixed/40' : ''
                }`}
              >
                <div className="flex items-start gap-2">
                  {!n.read && <span className="w-2 h-2 mt-1.5 rounded-full bg-primary flex-shrink-0" />}
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-on-surface">{n.title}</p>
                    <p className="text-xs text-on-surface-variant mt-0.5 line-clamp-2">{n.message}</p>
                    <p className="text-[10px] text-on-surface-variant mt-1">
                      {new Date(n.createdAt).toLocaleDateString('en-PK', {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                  </div>
                </div>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}
