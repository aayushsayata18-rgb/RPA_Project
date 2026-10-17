import React, { useState, useEffect } from 'react';
import { AlertOctagon, Search, Filter, CheckCircle2, ArrowLeft, ShieldAlert } from 'lucide-react';
import { Link } from 'react-router-dom';
import maintenanceService from '../../../services/maintenanceService';
import { StatusBadge } from '../../../components/common/StatusBadge';
import { Modal } from '../../../components/common/Modal';

export const MaintenanceExceptions = () => {
  const [exceptions, setExceptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [severityFilter, setSeverityFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Resolve Modal
  const [selectedEx, setSelectedEx] = useState(null);
  const [showResolveModal, setShowResolveModal] = useState(false);
  const [resolution, setResolution] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchExceptions = async () => {
    try {
      setLoading(true);
      const res = await maintenanceService.getExceptions({
        severity: severityFilter,
        status: statusFilter
      });
      setExceptions(res.data?.items || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExceptions();
  }, [severityFilter, statusFilter]);

  const handleResolveSubmit = async (e) => {
    e.preventDefault();
    if (!selectedEx) return;
    try {
      setSubmitting(true);
      await maintenanceService.resolveException(selectedEx._id, { resolution });
      setShowResolveModal(false);
      setResolution('');
      fetchExceptions();
    } catch (err) {
      alert(err.response?.data?.message || err.message || 'Failed to resolve exception');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="maintenance-exceptions-page p-6 space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b pb-4">
        <div>
          <div className="flex items-center gap-2">
            <Link to="/operations/maintenance" className="text-gray-400 hover:text-gray-600">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <AlertOctagon className="w-6 h-6 text-red-600" />
              Maintenance Operational Exceptions Queue
            </h1>
          </div>
          <p className="text-sm text-gray-500 ml-7">
            Critical bottlenecks, unavailable spare parts, technician shortages, CMMS sync errors, and contract alerts
          </p>
        </div>

        <div className="flex items-center gap-3">
          <select
            value={severityFilter}
            onChange={(e) => setSeverityFilter(e.target.value)}
            className="px-3 py-2 border rounded-lg text-sm bg-white"
          >
            <option value="">All Severities</option>
            <option value="CRITICAL">Critical</option>
            <option value="HIGH">High</option>
            <option value="MEDIUM">Medium</option>
            <option value="LOW">Low</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 border rounded-lg text-sm bg-white"
          >
            <option value="">All Statuses</option>
            <option value="OPEN">OPEN</option>
            <option value="UNDER_REVIEW">UNDER REVIEW</option>
            <option value="RESOLVED">RESOLVED</option>
          </select>
        </div>
      </div>

      {/* Exceptions Table */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="bg-gray-50 border-b text-xs font-semibold uppercase tracking-wider text-gray-500">
                <th className="py-3 px-4">Exception ID</th>
                <th className="py-3 px-4">Type</th>
                <th className="py-3 px-4">Severity</th>
                <th className="py-3 px-4">Description</th>
                <th className="py-3 px-4">Linked Asset / WO</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-gray-400">Loading exceptions...</td>
                </tr>
              ) : exceptions.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-gray-400">No operational exceptions found.</td>
                </tr>
              ) : (
                exceptions.map((ex) => (
                  <tr key={ex._id} className="hover:bg-red-50/20 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-red-700">{ex.exceptionId}</td>
                    <td className="py-3 px-4 text-xs font-semibold">{ex.type.replace(/_/g, ' ')}</td>
                    <td className="py-3 px-4">
                      <span className={`text-xs px-2 py-0.5 rounded font-bold ${
                        ex.severity === 'CRITICAL' ? 'bg-red-100 text-red-800' :
                        ex.severity === 'HIGH' ? 'bg-orange-100 text-orange-800' :
                        'bg-amber-100 text-amber-800'
                      }`}>
                        {ex.severity}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-xs text-gray-800 max-w-sm">
                      <div className="font-medium">{ex.description}</div>
                      {ex.resolution && (
                        <div className="text-[11px] text-emerald-700 font-semibold mt-0.5">
                          Resolution: {ex.resolution}
                        </div>
                      )}
                    </td>
                    <td className="py-3 px-4 text-xs">
                      {ex.assetId ? <div>{ex.assetId.name} ({ex.assetId.assetTag})</div> : '—'}
                      {ex.workOrderId && <div className="font-mono text-blue-600">{ex.workOrderId.workOrderId}</div>}
                    </td>
                    <td className="py-3 px-4"><StatusBadge status={ex.status} /></td>
                    <td className="py-3 px-4 text-right">
                      {ex.status !== 'RESOLVED' && (
                        <button
                          onClick={() => { setSelectedEx(ex); setShowResolveModal(true); }}
                          className="px-2.5 py-1 text-xs bg-red-50 hover:bg-red-100 text-red-700 rounded font-semibold"
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

      {/* Modal: Resolve Exception */}
      {showResolveModal && selectedEx && (
        <Modal title={`Resolve Exception: ${selectedEx.exceptionId}`} onClose={() => setShowResolveModal(false)}>
          <form onSubmit={handleResolveSubmit} className="space-y-4">
            <div className="p-3 bg-gray-50 border rounded text-xs text-gray-700">
              <strong>{selectedEx.type.replace(/_/g, ' ')}: </strong>
              {selectedEx.description}
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Resolution Summary *</label>
              <textarea
                rows={3}
                required
                placeholder="Describe corrective actions taken to resolve this bottleneck..."
                value={resolution}
                onChange={(e) => setResolution(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg text-sm"
              />
            </div>

            <div className="flex justify-end gap-3 pt-3 border-t">
              <button
                type="button"
                onClick={() => setShowResolveModal(false)}
                className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-4 py-2 text-sm bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg shadow-sm"
              >
                {submitting ? 'Resolving...' : 'Confirm Resolution'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};

export default MaintenanceExceptions;
