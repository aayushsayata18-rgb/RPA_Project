import React, { useState, useEffect } from 'react';
import { ShieldAlert, RefreshCw, AlertTriangle, CheckCircle2 } from 'lucide-react';
import reportClientService from '../../../services/reportClientService';
import { AnalyticsAlertCard } from '../../../components/reports/AnalyticsAlertCard';

export const AnalyticsAlerts = () => {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchAlerts();
  }, []);

  const fetchAlerts = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await reportClientService.listAlerts();
      setAlerts(res.data?.data || []);
    } catch (err) {
      setError('Failed to fetch analytics threshold alert rules.');
    } finally {
      setLoading(false);
    }
  };

  const handleAcknowledge = async (ruleId) => {
    try {
      await reportClientService.acknowledgeAlert(ruleId);
      fetchAlerts();
    } catch (err) {
      alert('Failed to acknowledge alert.');
    }
  };

  const handleResolve = async (ruleId, note) => {
    try {
      await reportClientService.resolveAlert(ruleId, note);
      fetchAlerts();
    } catch (err) {
      alert('Failed to resolve alert.');
    }
  };

  const activeCount = alerts.filter((a) => a.status === 'TRIGGERED' || a.status === 'ACKNOWLEDGED').length;

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <ShieldAlert className="w-7 h-7 text-indigo-600" />
            Analytics Threshold Alert Rules
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            Automated operational surveillance rules triggered when KPIs exceed safe thresholds.
          </p>
        </div>
        <button
          onClick={fetchAlerts}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-indigo-600' : ''}`} />
          Refresh
        </button>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm flex items-center gap-2">
          <AlertTriangle className="w-5 h-5" />
          <span>{error}</span>
        </div>
      )}

      {/* Summary Banner */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
          <span className="text-xs uppercase text-gray-500 font-semibold">Total Rules</span>
          <div className="text-2xl font-bold text-gray-900 mt-1">{alerts.length}</div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-rose-200 shadow-sm bg-rose-50/20">
          <span className="text-xs uppercase text-rose-600 font-semibold">Active Breaches</span>
          <div className="text-2xl font-bold text-rose-700 mt-1">{activeCount}</div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-emerald-200 shadow-sm bg-emerald-50/20">
          <span className="text-xs uppercase text-emerald-600 font-semibold">Resolved</span>
          <div className="text-2xl font-bold text-emerald-700 mt-1">
            {alerts.filter((a) => a.status === 'RESOLVED').length}
          </div>
        </div>
      </div>

      {/* Alerts Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {loading ? (
          <div className="col-span-2 py-12 text-center text-gray-400">Loading alert rules...</div>
        ) : alerts.length === 0 ? (
          <div className="col-span-2 py-12 text-center text-gray-500">
            No threshold alert rules currently configured.
          </div>
        ) : (
          alerts.map((rule) => (
            <AnalyticsAlertCard
              key={rule._id}
              rule={rule}
              onAcknowledge={handleAcknowledge}
              onResolve={handleResolve}
            />
          ))
        )}
      </div>
    </div>
  );
};

export default AnalyticsAlerts;
