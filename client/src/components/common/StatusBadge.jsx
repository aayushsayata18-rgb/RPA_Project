import React from 'react';

export const StatusBadge = ({ status }) => {
  if (!status) return null;

  const normalized = status.toUpperCase();

  let badgeClass = 'badge-secondary';

  if (['ACTIVE', 'SUCCESS', 'CONFIRMED', 'DELIVERED', 'RESOLVED', 'AVAILABLE', 'APPROVED', 'COMPLETED', 'PAID'].includes(normalized)) {
    badgeClass = 'badge-success';
  } else if (['PENDING', 'QUEUED', 'WAITING', 'UNDER_REVIEW', 'RETRYING', 'RESERVED', 'IN_PROGRESS'].includes(normalized)) {
    badgeClass = 'badge-warning';
  } else if (['FAILED', 'CANCELLED', 'REJECTED', 'EXCEPTION', 'BLOCKED', 'OVERDUE', 'NO_SHOW', 'INACTIVE'].includes(normalized)) {
    badgeClass = 'badge-danger';
  } else if (['RUNNING', 'CREATED', 'CHECKED_IN', 'OCCUPIED', 'CLEANING_REQUIRED'].includes(normalized)) {
    badgeClass = 'badge-info';
  }

  return (
    <span className={`badge ${badgeClass}`}>
      {status.replace(/_/g, ' ')}
    </span>
  );
};
