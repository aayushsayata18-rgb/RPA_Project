import React from 'react';
import { Shield, ShieldAlert, AlertTriangle } from 'lucide-react';

export const VendorRiskBadge = ({ riskLevel }) => {
  const getRiskConfig = () => {
    switch (riskLevel) {
      case 'LOW':
        return {
          label: 'Low Risk',
          bg: 'rgba(16, 185, 129, 0.12)',
          color: '#10b981',
          border: 'rgba(16, 185, 129, 0.25)',
          icon: Shield
        };
      case 'MEDIUM':
        return {
          label: 'Medium Risk',
          bg: 'rgba(234, 179, 8, 0.12)',
          color: '#eab308',
          border: 'rgba(234, 179, 8, 0.25)',
          icon: AlertTriangle
        };
      case 'HIGH':
        return {
          label: 'High Risk',
          bg: 'rgba(249, 115, 22, 0.15)',
          color: '#f97316',
          border: 'rgba(249, 115, 22, 0.3)',
          icon: AlertTriangle
        };
      case 'CRITICAL':
        return {
          label: 'Critical Risk',
          bg: 'rgba(239, 68, 68, 0.2)',
          color: '#ef4444',
          border: 'rgba(239, 68, 68, 0.4)',
          icon: ShieldAlert
        };
      default:
        return {
          label: riskLevel || 'Standard',
          bg: 'rgba(148, 163, 184, 0.1)',
          color: '#94a3b8',
          border: 'rgba(148, 163, 184, 0.2)',
          icon: Shield
        };
    }
  };

  const config = getRiskConfig();
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
