import React from 'react';

const statusConfig = {
  submitted:     { label: 'Submitted',      bg: 'bg-secondary-container',    text: 'text-on-secondary-container', icon: 'upload_file' },
  in_review:     { label: 'In Review',       bg: 'bg-primary-fixed',          text: 'text-on-primary-fixed',       icon: 'manage_search' },
  pending_info:  { label: 'Pending Info',    bg: 'bg-tertiary-fixed',         text: 'text-on-tertiary-fixed',      icon: 'info' },
  approved:      { label: 'Approved',        bg: 'bg-green-100',              text: 'text-green-800',              icon: 'check_circle' },
  resolved:      { label: 'Resolved',        bg: 'bg-green-100',              text: 'text-green-800',              icon: 'task_alt' },
  rejected:      { label: 'Rejected',        bg: 'bg-error-container',        text: 'text-on-error-container',     icon: 'cancel' },
};

const priorityConfig = {
  low:    { label: 'Low',    bg: 'bg-surface-container-high', text: 'text-on-surface-variant' },
  normal: { label: 'Normal', bg: 'bg-secondary-container',   text: 'text-on-secondary-container' },
  high:   { label: 'High',   bg: 'bg-primary-fixed',         text: 'text-on-primary-fixed' },
  urgent: { label: 'Urgent', bg: 'bg-error-container',       text: 'text-on-error-container' },
};

export const StatusBadge = ({ status }) => {
  const cfg = statusConfig[status] || statusConfig.submitted;
  return (
    <span className={`status-badge ${cfg.bg} ${cfg.text}`}>
      <span className="material-symbols-outlined" style={{ fontSize: 14 }}>{cfg.icon}</span>
      {cfg.label}
    </span>
  );
};

export const PriorityBadge = ({ priority }) => {
  const cfg = priorityConfig[priority] || priorityConfig.normal;
  return (
    <span className={`status-badge ${cfg.bg} ${cfg.text}`}>
      {cfg.label}
    </span>
  );
};

export default StatusBadge;
