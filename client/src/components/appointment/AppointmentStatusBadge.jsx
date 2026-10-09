import React from 'react';

export const AppointmentStatusBadge = ({ status }) => {
  const getBadgeStyle = () => {
    switch (status) {
      case 'CONFIRMED':
        return {
          bg: 'rgba(34, 197, 94, 0.15)',
          color: '#4ade80',
          border: '1px solid rgba(34, 197, 94, 0.3)',
          label: 'Confirmed'
        };
      case 'CHECKED_IN':
        return {
          bg: 'rgba(56, 189, 248, 0.15)',
          color: '#38bdf8',
          border: '1px solid rgba(56, 189, 248, 0.3)',
          label: 'Checked In'
        };
      case 'IN_PROGRESS':
        return {
          bg: 'rgba(168, 85, 247, 0.15)',
          color: '#c084fc',
          border: '1px solid rgba(168, 85, 247, 0.3)',
          label: 'In Progress'
        };
      case 'COMPLETED':
        return {
          bg: 'rgba(16, 185, 129, 0.15)',
          color: '#34d399',
          border: '1px solid rgba(16, 185, 129, 0.3)',
          label: 'Completed'
        };
      case 'CANCELLED':
        return {
          bg: 'rgba(239, 68, 68, 0.15)',
          color: '#f87171',
          border: '1px solid rgba(239, 68, 68, 0.3)',
          label: 'Cancelled'
        };
      case 'RESCHEDULED':
        return {
          bg: 'rgba(245, 158, 11, 0.15)',
          color: '#fbbf24',
          border: '1px solid rgba(245, 158, 11, 0.3)',
          label: 'Rescheduled'
        };
      case 'NO_SHOW':
        return {
          bg: 'rgba(100, 116, 139, 0.2)',
          color: '#94a3b8',
          border: '1px solid rgba(100, 116, 139, 0.3)',
          label: 'No Show'
        };
      case 'REQUESTED':
      case 'PENDING_REVIEW':
        return {
          bg: 'rgba(234, 179, 8, 0.15)',
          color: '#facc15',
          border: '1px solid rgba(234, 179, 8, 0.3)',
          label: 'Pending Review'
        };
      default:
        return {
          bg: 'rgba(148, 163, 184, 0.15)',
          color: '#94a3b8',
          border: '1px solid rgba(148, 163, 184, 0.3)',
          label: status || 'Unknown'
        };
    }
  };

  const style = getBadgeStyle();

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        padding: '0.25rem 0.65rem',
        borderRadius: '9999px',
        fontSize: '0.75rem',
        fontWeight: '600',
        letterSpacing: '0.02em',
        background: style.bg,
        color: style.color,
        border: style.border,
        whiteSpace: 'nowrap'
      }}
    >
      <span
        style={{
          width: '6px',
          height: '6px',
          borderRadius: '50%',
          background: style.color,
          marginRight: '0.4rem',
          display: 'inline-block'
        }}
      />
      {style.label}
    </span>
  );
};
