import React, { useState, useEffect } from 'react';
import { housekeepingService } from '../../../services/housekeepingService';
import {
  AlertTriangle,
  Plus,
  RefreshCw,
  Search,
  CheckCircle,
  Clock,
  ShieldAlert
} from 'lucide-react';

export const HousekeepingExceptions = () => {
  const [exceptions, setExceptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [resolveModal, setResolveModal] = useState(null);
  const [resolutionData, setResolutionData] = useState({
    resolutionNotes: '',
    correctiveActionTaken: ''
  });
  const [formData, setFormData] = useState({
    exceptionType: 'BIOHAZARD_SPILL',
    severity: 'HIGH',
    description: '',
    reportedBy: 'Staff Member'
  });

  const fetchExceptions = async () => {
    setLoading(true);
    try {
      const res = await housekeepingService.listExceptions();
      if (res.data?.data) {
        setExceptions(res.data.data);
      }
    } catch (err) {
      console.error('Failed to load exceptions:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExceptions();
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await housekeepingService.createException(formData);
      setShowModal(false);
      setFormData({
        exceptionType: 'BIOHAZARD_SPILL',
        severity: 'HIGH',
        description: '',
        reportedBy: 'Staff Member'
      });
      fetchExceptions();
    } catch (err) {
      alert(err.response?.data?.message || err.message);
    }
  };

  const handleResolve = async (e) => {
    e.preventDefault();
    if (!resolveModal) return;
    try {
      await housekeepingService.resolveException(resolveModal._id, resolutionData);
      setResolveModal(null);
      setResolutionData({ resolutionNotes: '', correctiveActionTaken: '' });
      fetchExceptions();
    } catch (err) {
      alert(err.response?.data?.message || err.message);
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-slate-900 border border-slate-800 p-6 rounded-2xl">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-400">
            <ShieldAlert className="w-7 h-7" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight">Operational Exceptions & Incidents</h1>
            <p className="text-sm text-slate-400">
              Biohazard spills, stock shortages, SLA escalations, and facility maintenance blocks.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchExceptions}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-sm font-medium rounded-xl border border-slate-700 transition"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-rose-600 hover:bg-rose-500 text-white text-sm font-semibold rounded-xl shadow-lg shadow-rose-600/20 transition"
          >
            <Plus className="w-4 h-4" />
            Report Exception
          </button>
        </div>
      </div>

      {/* Exceptions Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-800/60 text-slate-400 font-semibold uppercase tracking-wider">
              <tr>
                <th className="px-4 py-3">Exception ID</th>
                <th className="px-4 py-3">Type</th>
                <th className="px-4 py-3">Severity</th>
                <th className="px-4 py-3">Description</th>
                <th className="px-4 py-3">Reported By</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-200">
              {loading ? (
                <tr>
                  <td colSpan={7} className="text-center py-10 text-slate-400">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-rose-400" />
                    Loading exceptions...
                  </td>
                </tr>
              ) : exceptions.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-10 text-slate-500">
                    No active operational exceptions.
                  </td>
                </tr>
              ) : (
                exceptions.map((ex) => (
                  <tr key={ex._id} className="hover:bg-slate-800/40 transition">
                    <td className="px-4 py-3.5 font-mono text-rose-400 font-medium">{ex.exceptionId}</td>
                    <td className="px-4 py-3.5 text-white font-medium">
                      {(ex.exceptionType || ex.type)?.replace(/_/g, ' ')}
                    </td>
                    <td className="px-4 py-3.5">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                          ex.severity === 'CRITICAL'
                            ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                            : ex.severity === 'HIGH'
                            ? 'bg-orange-500/20 text-orange-300 border border-orange-500/30'
                            : 'bg-amber-500/10 text-amber-300 border border-amber-500/20'
                        }`}
                      >
                        {ex.severity}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-slate-300 max-w-sm truncate">{ex.description}</td>
                    <td className="px-4 py-3.5 text-slate-400">{ex.reportedBy || 'Staff'}</td>
                    <td className="px-4 py-3.5">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                          ex.status === 'RESOLVED'
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                            : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                        }`}
                      >
                        {ex.status}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-right">
                      {ex.status === 'OPEN' && (
                        <button
                          onClick={() => setResolveModal(ex)}
                          className="px-2.5 py-1 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 border border-emerald-500/30 rounded text-[11px] font-semibold transition"
                        >
                          Resolve
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Report Exception */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-6 space-y-4">
            <h2 className="text-lg font-bold text-white">Log Operational Exception</h2>
            <form onSubmit={handleCreate} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Exception Type</label>
                  <select
                    value={formData.exceptionType}
                    onChange={(e) => setFormData({ ...formData, exceptionType: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-rose-500"
                  >
                    <option value="BIOHAZARD_SPILL">Biohazard Spill</option>
                    <option value="SUPPLY_UNAVAILABLE">Supply Stockout</option>
                    <option value="SLA_BREACH">SLA Breach</option>
                    <option value="MAINTENANCE_DEPENDENCY">Maintenance Block</option>
                    <option value="RESTRICTED_AREA">Restricted Zone</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Severity</label>
                  <select
                    value={formData.severity}
                    onChange={(e) => setFormData({ ...formData, severity: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-rose-500"
                  >
                    <option value="CRITICAL">Critical</option>
                    <option value="HIGH">High</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="LOW">Low</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Incident Description</label>
                <textarea
                  rows={3}
                  required
                  placeholder="Detail the incident, spill, or restriction..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-rose-500"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-medium rounded-xl transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white text-sm font-semibold rounded-xl transition"
                >
                  Submit Report
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Resolve Exception */}
      {resolveModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-6 space-y-4">
            <h2 className="text-lg font-bold text-white">Resolve Exception {resolveModal.exceptionId}</h2>
            <form onSubmit={handleResolve} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Resolution Summary</label>
                <textarea
                  rows={3}
                  required
                  placeholder="Explain how the incident was neutralized and resolved..."
                  value={resolutionData.resolutionNotes}
                  onChange={(e) => setResolutionData({ ...resolutionData, resolutionNotes: e.target.value })}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Corrective Action Taken</label>
                <input
                  type="text"
                  placeholder="e.g. Biohazard kit restocked, floor sanitized"
                  value={resolutionData.correctiveActionTaken}
                  onChange={(e) => setFormData({ ...resolutionData, correctiveActionTaken: e.target.value })}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setResolveModal(null)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-medium rounded-xl transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-semibold rounded-xl transition"
                >
                  Mark Resolved
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
