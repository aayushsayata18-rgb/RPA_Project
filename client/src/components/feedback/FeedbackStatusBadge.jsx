import React from 'react';
import {
  Clock,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Send,
  Search,
  PauseCircle,
  FileCheck,
  XCircle,
  ShieldAlert
} from 'lucide-react';

const STATUS_CONFIG = {
  DRAFT: { label: 'Draft', bg: '#334155', text: '#cbd5e1', border: '#475569', icon: Clock },
  SUBMITTED: { label: 'Submitted', bg: '#0284c720', text: '#38bdf8', border: '#0284c7', icon: Clock },
  ACKNOWLEDGED: { label: 'Acknowledged', bg: '#4f46e520', text: '#818cf8', border: '#4f46e5', icon: FileCheck },
  ASSIGNED: { label: 'Assigned', bg: '#0d948820', text: '#2dd4bf', border: '#0d9488', icon: Clock },
  UNDER_REVIEW: { label: 'Under Review', bg: '#d9770620', text: '#fbbf24', border: '#d97706', icon: Search },
  INVESTIGATION: { label: 'In Investigation', bg: '#7c3aed20', text: '#c084fc', border: '#7c3aed', icon: Search },
  WAITING_FOR_INFORMATION: { label: 'Waiting Info', bg: '#ea580c20', text: '#fb923c', border: '#ea580c', icon: PauseCircle },
  RESPONSE_DRAFT: { label: 'Draft Response', bg: '#47556920', text: '#94a3b8', border: '#475569', icon: Clock },
  RESPONSE_PENDING_APPROVAL: { label: 'Pending Approval', bg: '#ca8a0420', text: '#fde047', border: '#ca8a04', icon: AlertTriangle },
  RESPONSE_SENT: { label: 'Response Sent', bg: '#0891b220', text: '#22d3ee', border: '#0891b2', icon: Send },
  RESOLVED: { label: 'Resolved', bg: '#05966920', text: '#34d399', border: '#059669', icon: CheckCircle2 },
  CLOSED: { label: 'Closed', bg: '#1e293b', text: '#64748b', border: '#334155', icon: CheckCircle2 },
  REOPENED: { label: 'Reopened', bg: '#e11d4820', text: '#fb7185', border: '#e11d48', icon: RotateCcw },
  ESCALATED: { label: 'Escalated', bg: '#b91c1c30', text: '#f87171', border: '#ef4444', icon: ShieldAlert },
  WITHDRAWN: { label: 'Withdrawn', bg: '#1f2937', text: '#9ca3af', border: '#374151', icon: XCircle },
  REJECTED: { label: 'Rejected', bg: '#991b1b20', text: '#fca5a5', border: '#991b1b', icon: XCircle }
};

export const FeedbackStatusBadge = ({ status }) => {
  const config = STATUS_CONFIG[status] || {
    label: status || 'Unknown',
    bg: '#334155',
    text: '#cbd5e1',
    border: '#475569',
    icon: Clock
  };

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
        backgroundColor: config.bg,
        color: config.text,
        border: `1px solid ${config.border}`,
        whiteSpace: 'nowrap',
        letterSpacing: '0.02em'
      }}
    >
      <Icon size={12} />
      <span>{config.label}</span>
    </span>
  );
};
