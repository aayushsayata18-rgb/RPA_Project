import React from 'react';

export const DocumentStatusBadge = ({ status }) => {
  const getBadgeStyle = (st) => {
    switch (String(st).toUpperCase()) {
      case 'RELEASED':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200 ring-1 ring-emerald-600/20';
      case 'GENERATED':
        return 'bg-blue-50 text-blue-700 border-blue-200 ring-1 ring-blue-600/20';
      case 'APPROVED':
        return 'bg-teal-50 text-teal-700 border-teal-200 ring-1 ring-teal-600/20';
      case 'PENDING_REVIEW':
        return 'bg-amber-50 text-amber-700 border-amber-200 ring-1 ring-amber-600/20';
      case 'DRAFT':
        return 'bg-slate-50 text-slate-700 border-slate-200 ring-1 ring-slate-600/20';
      case 'GENERATING':
        return 'bg-indigo-50 text-indigo-700 border-indigo-200 ring-1 ring-indigo-600/20 animate-pulse';
      case 'SUPERSEDED':
        return 'bg-purple-50 text-purple-700 border-purple-200 ring-1 ring-purple-600/20';
      case 'ARCHIVED':
        return 'bg-gray-100 text-gray-600 border-gray-300 ring-1 ring-gray-500/20';
      case 'CANCELLED':
      case 'REJECTED':
      case 'FAILED':
        return 'bg-rose-50 text-rose-700 border-rose-200 ring-1 ring-rose-600/20';
      default:
        return 'bg-gray-50 text-gray-700 border-gray-200';
    }
  };

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold uppercase tracking-wider border ${getBadgeStyle(
        status
      )}`}
    >
      {status || 'UNKNOWN'}
    </span>
  );
};

export default DocumentStatusBadge;
