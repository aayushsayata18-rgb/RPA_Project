import React from 'react';
import { CheckCircle2, Clock, XCircle, AlertCircle } from 'lucide-react';

export const VendorVerificationBadge = ({ status }) => {
  const getConfig = () => {
    switch (status) {
      case 'PASSED':
      case 'VERIFIED':
        return {
          label: 'Verified',
          bg: 'rgba(16, 185, 129, 0.12)',
          color: '#10b981',
          border: 'rgba(16, 185, 129, 0.3)',
          icon: CheckCircle2
        };
      case 'IN_PROGRESS':
        return {
          label: 'In Progress',
          bg: 'rgba(56, 189, 248, 0.15)',
          color: '#38bdf8',
          border: 'rgba(56, 189, 248, 0.3)',
          icon: Clock
        };
      case 'PARTIAL':
        return {
          label: 'Partial',
          bg: 'rgba(234, 179, 8, 0.12)',
          color: '#eab308',
          border: 'rgba(234, 179, 8, 0.3)',
          icon: AlertCircle
        };
      case 'PENDING_HUMAN_REVIEW':
        return {
          label: 'Review Req.',
          bg: 'rgba(168, 85, 247, 0.15)',
          color: '#a855f7',
          border: 'rgba(168, 85, 247, 0.3)',
          icon: Clock
        };
      case 'FAILED':
      case 'REJECTED':
        return {
          label: 'Failed',
          bg: 'rgba(239, 68, 68, 0.15)',
          color: '#ef4444',
          border: 'rgba(239, 68, 68, 0.3)',
          icon: XCircle
        };
      case 'EXPIRED':
        return {
          label: 'Expired',
          bg: 'rgba(244, 63, 94, 0.15)',
          color: '#f43f5e',
          border: 'rgba(244, 63, 94, 0.3)',
          icon: AlertCircle
        };
      default:
        return {
          label: 'Not Started',
          bg: 'rgba(148, 163, 184, 0.1)',
          color: '#94a3b8',
          border: 'rgba(148, 163, 184, 0.2)',
          icon: Clock
        };
    }
  };

  const config = getConfig();
  const Icon = config.icon;

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '0.3rem',
        padding: '0.2rem 0.55rem',
        borderRadius: '6px',
        fontSize: '0.72rem',
        fontWeight: '600',
        textTransform: 'uppercase',
        letterSpacing: '0.04em',
        background: config.bg,
        color: config.color,
        border: `1px solid ${config.border}`
      }}
    >
      <Icon size={11} />
      <span>{config.label}</span>
    </span>
  );
};
