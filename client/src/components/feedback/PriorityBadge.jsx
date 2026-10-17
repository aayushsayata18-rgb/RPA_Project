import React from 'react';
import { Shield, AlertCircle, Flame } from 'lucide-react';

const PRIORITY_CONFIG = {
  LOW: { label: 'Low', bg: '#0284c715', text: '#38bdf8', border: '#0284c750' },
  MEDIUM: { label: 'Medium', bg: '#ca8a0415', text: '#facc15', border: '#ca8a0450' },
  HIGH: { label: 'High', bg: '#ea580c20', text: '#fb923c', border: '#ea580c60' },
  URGENT: { label: 'Urgent', bg: '#e11d4825', text: '#fb7185', border: '#e11d4880' },
  CRITICAL: { label: 'Critical', bg: '#dc262635', text: '#f87171', border: '#ef4444' }
};

export const PriorityBadge = ({ priority }) => {
  const config = PRIORITY_CONFIG[priority] || PRIORITY_CONFIG.MEDIUM;
  const isEmergency = priority === 'URGENT' || priority === 'CRITICAL';

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '0.3rem',
        padding: '0.2rem 0.55rem',
        borderRadius: '6px',
        fontSize: '0.72rem',
        fontWeight: '700',
        textTransform: 'uppercase',
        letterSpacing: '0.04em',
        backgroundColor: config.bg,
        color: config.text,
        border: `1px solid ${config.border}`
      }}
    >
      {isEmergency ? <Flame size={11} /> : <AlertCircle size={11} />}
      <span>{config.label}</span>
    </span>
  );
};
