import React from 'react';
import { AlertCircle, AlertTriangle, Info, CheckCircle2, ShieldAlert } from 'lucide-react';

export const AnalyticsAlertCard = ({
  rule,
  onAcknowledge = () => {},
  onResolve = () => {}
}) => {
  const isTriggered = rule.status === 'TRIGGERED';
  const isAck = rule.status === 'ACKNOWLEDGED';
  const isResolved = rule.status === 'RESOLVED';

  const severityConfig = {
    CRITICAL: {
      border: 'border-rose-200 bg-rose-50/40',
      badge: 'bg-rose-100 text-rose-700',
      icon: AlertCircle,
      iconColor: 'text-rose-600'
    },
    WARNING: {
      border: 'border-amber-200 bg-amber-50/40',
      badge: 'bg-amber-100 text-amber-700',
      icon: AlertTriangle,
      iconColor: 'text-amber-600'
    },
    INFO: {
      border: 'border-blue-200 bg-blue-50/40',
      badge: 'bg-blue-100 text-blue-700',
      icon: Info,
      iconColor: 'text-blue-600'
    }
  };

  const current = severityConfig[rule.severity] || severityConfig.INFO;
  const Icon = current.icon;

  return (
    <div className={`p-4 rounded-xl border ${current.border} shadow-sm space-y-3`}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          <Icon className={`w-5 h-5 flex-shrink-0 ${current.iconColor}`} />
          <div>
            <h4 className="font-semibold text-gray-900 text-sm">
              {rule.metricCode.replace(/_/g, ' ')}
            </h4>
            <p className="text-xs text-gray-500 mt-0.5">
              Condition: {rule.operator} {rule.threshold}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${current.badge}`}>
            {rule.severity}
          </span>
          <span
            className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${
              isTriggered
                ? 'bg-rose-100 text-rose-800 border-rose-300'
                : isAck
                ? 'bg-amber-100 text-amber-800 border-amber-300'
                : 'bg-emerald-100 text-emerald-800 border-emerald-300'
            }`}
          >
            {rule.status}
          </span>
        </div>
      </div>

      {rule.lastEvaluatedValue !== undefined && (
        <div className="text-xs text-gray-600 bg-white/70 p-2 rounded-lg border border-gray-100 flex justify-between">
          <span>Observed Value:</span>
          <span className="font-bold text-gray-900">{rule.lastEvaluatedValue}</span>
        </div>
      )}

      {/* Action Controls */}
      <div className="flex items-center justify-end gap-2 pt-1 border-t border-gray-100">
        {isTriggered && (
          <button
            type="button"
            onClick={() => onAcknowledge(rule._id)}
            className="text-xs px-3 py-1 bg-amber-600 hover:bg-amber-700 text-white font-medium rounded-lg shadow-sm transition"
          >
            Acknowledge
          </button>
        )}
        {(isTriggered || isAck) && (
          <button
            type="button"
            onClick={() => {
              const note = prompt('Enter resolution note:', 'Issue verified and operational threshold restored');
              if (note) onResolve(rule._id, note);
            }}
            className="text-xs px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-lg shadow-sm transition"
          >
            Resolve Alert
          </button>
        )}
        {isResolved && (
          <span className="text-xs text-emerald-700 font-medium flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5" /> Resolved
          </span>
        )}
      </div>
    </div>
  );
};

export default AnalyticsAlertCard;
