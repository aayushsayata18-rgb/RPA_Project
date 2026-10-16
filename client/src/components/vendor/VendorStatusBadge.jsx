import React from 'react';
import { CheckCircle2, Clock, AlertCircle, AlertTriangle, XCircle, PauseCircle, ShieldAlert, Ban } from 'lucide-react';

export const VendorStatusBadge = ({ status }) => {
  const getBadgeConfig = () => {
    switch (status) {
      case 'ACTIVE':
        return {
          label: 'Active',
          bg: 'rgba(16, 185, 129, 0.15)',
          color: '#10b981',
          border: 'rgba(16, 185, 129, 0.3)',
          icon: CheckCircle2
        };
      case 'DRAFT':
        return {
          label: 'Draft',
          bg: 'rgba(148, 163, 184, 0.15)',
          color: '#94a3b8',
          border: 'rgba(148, 163, 184, 0.3)',
          icon: Clock
        };
      case 'PENDING_VERIFICATION':
        return {
          label: 'Pending Verification',
          bg: 'rgba(56, 189, 248, 0.15)',
          color: '#38bdf8',
          border: 'rgba(56, 189, 248, 0.3)',
          icon: Clock
        };
      case 'PENDING_APPROVAL':
        return {
          label: 'Pending Approval',
          bg: 'rgba(234, 179, 8, 0.15)',
          color: '#eab308',
          border: 'rgba(234, 179, 8, 0.3)',
          icon: AlertCircle
        };
      case 'ON_HOLD':
        return {
          label: 'On Hold',
          bg: 'rgba(249, 115, 22, 0.15)',
          color: '#f97316',
          border: 'rgba(249, 115, 22, 0.3)',
          icon: PauseCircle
        };
      case 'SUSPENDED':
        return {
          label: 'Suspended',
          bg: 'rgba(239, 68, 68, 0.18)',
          color: '#ef4444',
          border: 'rgba(239, 68, 68, 0.4)',
          icon: ShieldAlert
        };
      case 'REJECTED':
        return {
          label: 'Rejected',
          bg: 'rgba(244, 63, 94, 0.15)',
          color: '#f43f5e',
          border: 'rgba(244, 63, 94, 0.3)',
          icon: XCircle
        };
      case 'DEACTIVATED':
      case 'INACTIVE':
        return {
          label: status === 'DEACTIVATED' ? 'Deactivated' : 'Inactive',
          bg: 'rgba(100, 116, 139, 0.15)',
          color: '#64748b',
          border: 'rgba(100, 116, 139, 0.3)',
          icon: Ban
        };
      default:
        return {
          label: status || 'Unknown',
          bg: 'rgba(148, 163, 184, 0.12)',
          color: '#94a3b8',
          border: 'rgba(148, 163, 184, 0.2)',
          icon: Clock
        };
    }
  };

  const config = getBadgeConfig();
  const Icon = config.icon;

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '0.35rem',
        padding: '0.25rem 0.65rem',
        borderRadius: '9999px',
        fontSize: '0.75rem',
        fontWeight: '600',
        textTransform: 'uppercase',
        letterSpacing: '0.04em',
        background: config.bg,
        color: config.color,
        border: `1px solid ${config.border}`
      }}
    >
      <Icon size={12} />
      <span>{config.label}</span>
    </span>
  );
};
