import React from 'react';
import { CheckCircle2, Clock, AlertTriangle, XCircle, RefreshCw } from 'lucide-react';

export const ReportStatusBadge = ({ status = 'COMPLETED' }) => {
  const norm = String(status).toUpperCase();

  const config = {
    COMPLETED: {
      label: 'Completed',
      bg: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      icon: CheckCircle2
    },
    RUNNING: {
      label: 'Running',
      bg: 'bg-blue-50 text-blue-700 border-blue-200',
      icon: RefreshCw,
      spin: true
    },
    QUEUED: {
      label: 'Queued',
      bg: 'bg-amber-50 text-amber-700 border-amber-200',
      icon: Clock
    },
    PARTIAL: {
      label: 'Partial',
      bg: 'bg-orange-50 text-orange-700 border-orange-200',
      icon: AlertTriangle
    },
    FAILED: {
      label: 'Failed',
      bg: 'bg-rose-50 text-rose-700 border-rose-200',
      icon: XCircle
    },
    CANCELLED: {
      label: 'Cancelled',
      bg: 'bg-gray-50 text-gray-700 border-gray-200',
      icon: XCircle
    },
    EXPIRED: {
      label: 'Expired',
      bg: 'bg-gray-50 text-gray-500 border-gray-200',
      icon: Clock
    }
  };

  const current = config[norm] || config.COMPLETED;
  const Icon = current.icon;

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${current.bg}`}
    >
      <Icon className={`w-3.5 h-3.5 ${current.spin ? 'animate-spin' : ''}`} />
      <span>{current.label}</span>
    </span>
  );
};

export default ReportStatusBadge;
