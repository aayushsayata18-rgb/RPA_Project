import React from 'react';

export const AttendanceStatusBadge = ({ status, type = 'status' }) => {
  if (!status) return null;

  const getStatusStyle = () => {
    switch (status.toUpperCase()) {
      case 'PRESENT':
      case 'MATCHED':
      case 'APPROVED':
      case 'CORRECTION_APPROVED':
      case 'COMPLETED':
        return {
          bg: 'rgba(16, 185, 129, 0.15)',
          color: '#10b981',
          border: '1px solid rgba(16, 185, 129, 0.3)'
        };

      case 'LATE':
      case 'MATCHED_WITH_LATE':
      case 'HALF_DAY':
      case 'COMPLETED_WITH_ERRORS':
        return {
          bg: 'rgba(245, 158, 11, 0.15)',
          color: '#f59e0b',
          border: '1px solid rgba(245, 158, 11, 0.3)'
        };

      case 'MISSED_PUNCH':
      case 'MISSING_PUNCH':
      case 'ABSENT':
      case 'FAILED':
      case 'REJECTED':
      case 'CORRECTION_REJECTED':
      case 'INVALID':
      case 'LEAVE_CONFLICT':
        return {
          bg: 'rgba(239, 68, 68, 0.15)',
          color: '#ef4444',
          border: '1px solid rgba(239, 68, 68, 0.3)'
        };

      case 'ON_LEAVE':
      case 'WEEK_OFF':
      case 'HOLIDAY':
        return {
          bg: 'rgba(59, 130, 246, 0.15)',
          color: '#3b82f6',
          border: '1px solid rgba(59, 130, 246, 0.3)'
        };

      case 'PENDING':
      case 'PENDING_REVIEW':
      case 'PENDING_CORRECTION':
      case 'PROCESSING':
      case 'VALIDATING':
      case 'UPLOADED':
        return {
          bg: 'rgba(168, 85, 247, 0.15)',
          color: '#a855f7',
          border: '1px solid rgba(168, 85, 247, 0.3)'
        };

      default:
        return {
          bg: 'rgba(100, 116, 139, 0.15)',
          color: '#94a3b8',
          border: '1px solid rgba(100, 116, 139, 0.3)'
        };
    }
  };

  const style = getStatusStyle();

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        padding: '0.2rem 0.65rem',
        borderRadius: '9999px',
        fontSize: '0.75rem',
        fontWeight: '600',
        textTransform: 'uppercase',
        letterSpacing: '0.04em',
        background: style.bg,
        color: style.color,
        border: style.border
      }}
    >
      {status.replace(/_/g, ' ')}
    </span>
  );
};

export default AttendanceStatusBadge;
