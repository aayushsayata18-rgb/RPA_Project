import React from 'react';
import { Clock, AlertTriangle, AlertOctagon, PauseCircle, CheckCircle } from 'lucide-react';

export const SLAIndicator = ({ dueAt, slaStatus, status }) => {
  if (!dueAt && !slaStatus) {
    return <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>No SLA</span>;
  }

  const isResolvedOrClosed = ['RESOLVED', 'CLOSED', 'WITHDRAWN'].includes(status);

  if (isResolvedOrClosed) {
    return (
      <span
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '0.3rem',
          padding: '0.2rem 0.5rem',
          borderRadius: '4px',
          background: 'rgba(16, 185, 129, 0.1)',
          color: '#10b981',
          border: '1px solid rgba(16, 185, 129, 0.3)',
          fontSize: '0.75rem',
          fontWeight: '600'
        }}
      >
        <CheckCircle size={12} />
        Completed
      </span>
    );
  }

  if (slaStatus === 'PAUSED' || status === 'WAITING_FOR_INFORMATION') {
    return (
      <span
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '0.3rem',
          padding: '0.2rem 0.5rem',
          borderRadius: '4px',
          background: 'rgba(234, 88, 12, 0.12)',
          color: '#ea580c',
          border: '1px solid rgba(234, 88, 12, 0.3)',
          fontSize: '0.75rem',
          fontWeight: '600'
        }}
      >
        <PauseCircle size={12} />
        SLA Paused
      </span>
    );
  }

  const now = new Date();
  const target = new Date(dueAt);
  const diffMs = target.getTime() - now.getTime();
  const isOverdue = diffMs <= 0 || slaStatus === 'BREACHED';

  const formatDuration = (ms) => {
    const absMs = Math.abs(ms);
    const totalMinutes = Math.floor(absMs / (1000 * 60));
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days}d ${hours % 24}h`;
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  };

  const durationStr = formatDuration(diffMs);

  if (isOverdue) {
    return (
      <span
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '0.3rem',
          padding: '0.2rem 0.5rem',
          borderRadius: '4px',
          background: 'rgba(239, 68, 68, 0.15)',
          color: '#ef4444',
          border: '1px solid rgba(239, 68, 68, 0.4)',
          fontSize: '0.75rem',
          fontWeight: '700'
        }}
        title={`Due: ${target.toLocaleString()}`}
      >
        <AlertOctagon size={12} />
        Breached ({durationStr} ago)
      </span>
    );
  }

  const isAtRisk = slaStatus === 'AT_RISK' || diffMs < 4 * 60 * 60 * 1000;

  if (isAtRisk) {
    return (
      <span
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '0.3rem',
          padding: '0.2rem 0.5rem',
          borderRadius: '4px',
          background: 'rgba(245, 158, 11, 0.15)',
          color: '#f59e0b',
          border: '1px solid rgba(245, 158, 11, 0.4)',
          fontSize: '0.75rem',
          fontWeight: '600'
        }}
        title={`Due: ${target.toLocaleString()}`}
      >
        <AlertTriangle size={12} />
        At Risk ({durationStr} left)
      </span>
    );
  }

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '0.3rem',
        padding: '0.2rem 0.5rem',
        borderRadius: '4px',
        background: 'rgba(14, 165, 233, 0.1)',
        color: '#0ea5e9',
        border: '1px solid rgba(14, 165, 233, 0.3)',
        fontSize: '0.75rem',
        fontWeight: '500'
      }}
      title={`Due: ${target.toLocaleString()}`}
    >
      <Clock size={12} />
      {durationStr} left
    </span>
  );
};
