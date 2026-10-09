import React from 'react';

export const QueueStatusBadge = ({ status, priority }) => {
  const getBadgeStyle = () => {
    if (priority === 'EMERGENCY') {
      return {
        bg: 'rgba(239, 68, 68, 0.15)',
        color: '#ef4444',
        border: '1px solid rgba(239, 68, 68, 0.4)',
        label: 'EMERGENCY'
      };
    }
    if (priority === 'URGENT') {
      return {
        bg: 'rgba(245, 158, 11, 0.15)',
        color: '#f59e0b',
        border: '1px solid rgba(245, 158, 11, 0.4)',
        label: 'URGENT'
      };
    }

    switch (status) {
      case 'WAITING':
        return {
          bg: 'rgba(56, 189, 248, 0.12)',
          color: '#38bdf8',
          border: '1px solid rgba(56, 189, 248, 0.3)',
          label: 'Waiting in Queue'
        };
      case 'CALLED':
        return {
          bg: 'rgba(168, 85, 247, 0.15)',
          color: '#a855f7',
          border: '1px solid rgba(168, 85, 247, 0.4)',
          label: 'Now Called'
        };
      case 'IN_SERVICE':
        return {
          bg: 'rgba(16, 185, 129, 0.15)',
          color: '#10b981',
          border: '1px solid rgba(16, 185, 129, 0.4)',
          label: 'In Consultation'
        };
      case 'COMPLETED':
        return {
          bg: 'rgba(34, 197, 94, 0.12)',
          color: '#22c55e',
          border: '1px solid rgba(34, 197, 94, 0.3)',
          label: 'Completed'
        };
      case 'SKIPPED':
        return {
          bg: 'rgba(245, 158, 11, 0.15)',
          color: '#f59e0b',
          border: '1px solid rgba(245, 158, 11, 0.3)',
          label: 'Skipped'
        };
      case 'TRANSFERRED':
        return {
          bg: 'rgba(99, 102, 241, 0.15)',
          color: '#818cf8',
          border: '1px solid rgba(99, 102, 241, 0.3)',
          label: 'Transferred'
        };
      case 'CANCELLED':
        return {
          bg: 'rgba(239, 68, 68, 0.12)',
          color: '#ef4444',
          border: '1px solid rgba(239, 68, 68, 0.3)',
          label: 'Cancelled'
        };
      case 'NO_SHOW':
        return {
          bg: 'rgba(107, 114, 128, 0.15)',
          color: '#9ca3af',
          border: '1px solid rgba(107, 114, 128, 0.3)',
          label: 'No-Show'
        };
      case 'OPEN':
        return {
          bg: 'rgba(16, 185, 129, 0.15)',
          color: '#10b981',
          border: '1px solid rgba(16, 185, 129, 0.4)',
          label: 'Active (Open)'
        };
      case 'PAUSED':
        return {
          bg: 'rgba(245, 158, 11, 0.15)',
          color: '#f59e0b',
          border: '1px solid rgba(245, 158, 11, 0.4)',
          label: 'Paused'
        };
      case 'CLOSED':
        return {
          bg: 'rgba(239, 68, 68, 0.12)',
          color: '#ef4444',
          border: '1px solid rgba(239, 68, 68, 0.3)',
          label: 'Closed'
        };
      default:
        return {
          bg: 'rgba(255, 255, 255, 0.05)',
          color: 'var(--text-secondary)',
          border: '1px solid var(--border-color)',
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
        gap: '0.35rem',
        padding: '0.3rem 0.65rem',
        borderRadius: '9999px',
        fontSize: '0.75rem',
        fontWeight: '600',
        letterSpacing: '0.02em',
        background: style.bg,
        color: style.color,
        border: style.border
      }}
    >
      <span
        style={{
          width: '6px',
          height: '6px',
          borderRadius: '50%',
          background: style.color,
          display: 'inline-block'
        }}
      />
      {style.label}
    </span>
  );
};

export default QueueStatusBadge;
