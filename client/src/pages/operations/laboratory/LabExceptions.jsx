import React, { useState, useEffect } from 'react';
import { 
  AlertTriangle, 
  Search, 
  CheckCircle2, 
  Clock, 
  RefreshCw, 
  ShieldAlert, 
  UserCheck, 
  Filter,
  FileCheck2,
  ExternalLink
} from 'lucide-react';
import { StatusBadge } from '../../../components/common/StatusBadge';
import { Modal } from '../../../components/common/Modal';
import laboratoryService from '../../../services/laboratoryService';

export const LabExceptions = () => {
  const [exceptions, setExceptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [severityFilter, setSeverityFilter] = useState('');
  const [search, setSearch] = useState('');

  // Resolve Exception Modal
  const [selectedException, setSelectedException] = useState(null);
  const [showResolveModal, setShowResolveModal] = useState(false);
  const [resolving, setResolving] = useState(false);
  const [resolveData, setResolveData] = useState({
    resolvedBy: 'Lab Supervisor Dr. Arthur Campbell',
    resolutionNotes: '',
    correctiveActionTaken: 'PATIENT_RECOLLECTED'
  });

  useEffect(() => {
    fetchExceptions();
  }, [statusFilter, severityFilter]);

  const fetchExceptions = async () => {
    try {
      setLoading(true);
      const res = await laboratoryService.listExceptions({
        status: statusFilter,
        severity: severityFilter,
        limit: 100
      });
      if (res.success) {
        setExceptions(res.data);
      }
    } catch (err) {
      console.error('Failed to load lab exceptions:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenResolve = (ex) => {
    setSelectedException(ex);
    setResolveData({
      resolvedBy: 'Lab Supervisor Dr. Arthur Campbell',
      resolutionNotes: '',
      correctiveActionTaken: 'PATIENT_RECOLLECTED'
    });
    setShowResolveModal(true);
  };

  const handleConfirmResolve = async (e) => {
    e.preventDefault();
    if (!selectedException) return;
    if (!resolveData.resolutionNotes.trim()) {
      alert('Resolution notes are mandatory for quality audit compliance.');
      return;
    }

    try {
      setResolving(true);
      const res = await laboratoryService.resolveException(selectedException.labExceptionId, {
        resolvedBy: resolveData.resolvedBy,
        resolutionNotes: resolveData.resolutionNotes,
        correctiveActionTaken: resolveData.correctiveActionTaken
      });
      if (res.success) {
        setShowResolveModal(false);
        setSelectedException(null);
        fetchExceptions();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to resolve exception.');
    } finally {
      setResolving(false);
    }
  };

  const getSeverityBadge = (sev) => {
    switch (sev) {
      case 'CRITICAL':
        return <span className="badge badge-error animate-pulse font-bold">CRITICAL</span>;
      case 'HIGH':
        return <span className="badge badge-error font-semibold">HIGH</span>;
      case 'MEDIUM':
        return <span className="badge badge-warning font-semibold">MEDIUM</span>;
      default:
        return <span className="badge badge-info">LOW</span>;
    }
  };

  const filteredExceptions = exceptions.filter(ex => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      ex.labExceptionId?.toLowerCase().includes(q) ||
      ex.exceptionType?.toLowerCase().includes(q) ||
      ex.description?.toLowerCase().includes(q) ||
      (ex.labOrderId || '').toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <ShieldAlert className="h-7 w-7 text-amber-600 dark:text-amber-400" />
            Laboratory Operational Exceptions
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Track operational anomalies, specimen rejections, external LIS sync failures, and log corrective actions.
          </p>
        </div>

        <button 
          onClick={fetchExceptions}
          className="btn btn-secondary flex items-center gap-2"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh Exceptions
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="card p-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="relative md:col-span-2">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search by Exception ID, Type, Order ID, or Description..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="input pl-9 w-full"
            />
          </div>

          <div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="input w-full font-medium"
            >
              <option value="">All Statuses</option>
              <option value="OPEN">OPEN</option>
              <option value="INVESTIGATING">INVESTIGATING</option>
              <option value="RESOLVED">RESOLVED</option>
              <option value="CLOSED">CLOSED</option>
            </select>
          </div>

          <div>
            <select
              value={severityFilter}
              onChange={(e) => setSeverityFilter(e.target.value)}
              className="input w-full font-medium"
            >
              <option value="">All Severities</option>
              <option value="CRITICAL">Critical</option>
              <option value="HIGH">High</option>
              <option value="MEDIUM">Medium</option>
              <option value="LOW">Low</option>
            </select>
          </div>
        </div>
      </div>

      {/* Exceptions Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="table w-full">
            <thead>
              <tr>
                <th>Exception ID</th>
                <th>Type</th>
                <th>Severity</th>
                <th>Reference Entity</th>
                <th>Description</th>
                <th>Status</th>
                <th>Logged At</th>
                <th className="text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="8" className="text-center py-8 text-gray-500">
                    <RefreshCw className="h-6 w-6 animate-spin mx-auto mb-2 text-primary-500" />
                    Loading exceptions...
                  </td>
                </tr>
              ) : filteredExceptions.length === 0 ? (
                <tr>
                  <td colSpan="8" className="text-center py-8 text-gray-500">
                    No operational exceptions found.
                  </td>
                </tr>
              ) : (
                filteredExceptions.map((ex) => (
                  <tr key={ex.labExceptionId} className="hover:bg-gray-50 dark:hover:bg-gray-800/40">
                    <td className="font-mono font-bold text-amber-600 dark:text-amber-400">
                      {ex.labExceptionId}
                    </td>
                    <td>
                      <span className="font-semibold text-gray-800 dark:text-gray-200">
                        {ex.exceptionType}
                      </span>
                    </td>
                    <td>{getSeverityBadge(ex.severity)}</td>
                    <td className="text-xs font-mono text-gray-600 dark:text-gray-400">
                      {ex.labOrderId || ex.sampleId || ex.referenceId || 'N/A'}
                    </td>
                    <td className="text-xs text-gray-700 dark:text-gray-300 max-w-xs truncate">
                      {ex.description}
                    </td>
                    <td>
                      <StatusBadge status={ex.status} />
                    </td>
                    <td className="text-xs text-gray-500">
                      {new Date(ex.createdAt).toLocaleString()}
                    </td>
                    <td className="text-right">
                      {ex.status !== 'RESOLVED' && ex.status !== 'CLOSED' ? (
                        <button
                          onClick={() => handleOpenResolve(ex)}
                          className="btn btn-primary btn-sm flex items-center gap-1 ml-auto"
                        >
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          Resolve
                        </button>
                      ) : (
                        <span className="text-xs text-green-600 dark:text-green-400 font-semibold flex items-center gap-1 justify-end">
                          <CheckCircle2 className="h-3.5 w-3.5" /> Resolved
                        </span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Resolve Modal */}
      <Modal
        isOpen={showResolveModal}
        onClose={() => setShowResolveModal(false)}
        title="Resolve Laboratory Operational Exception"
      >
        {selectedException && (
          <form onSubmit={handleConfirmResolve} className="space-y-4">
            <div className="p-3 rounded-lg bg-gray-50 dark:bg-gray-800/50 space-y-1 text-sm border border-gray-200 dark:border-gray-700">
              <div className="font-bold text-gray-900 dark:text-white">
                Exception ID: {selectedException.labExceptionId} ({selectedException.exceptionType})
              </div>
              <p className="text-xs text-gray-600 dark:text-gray-300">
                {selectedException.description}
              </p>
            </div>

            <div>
              <label className="label">Resolved By Staff Name *</label>
              <input
                type="text"
                required
                value={resolveData.resolvedBy}
                onChange={(e) => setResolveData({ ...resolveData, resolvedBy: e.target.value })}
                className="input w-full font-semibold"
              />
            </div>

            <div>
              <label className="label">Corrective Action Taken</label>
              <select
                value={resolveData.correctiveActionTaken}
                onChange={(e) => setResolveData({ ...resolveData, correctiveActionTaken: e.target.value })}
                className="input w-full"
              >
                <option value="PATIENT_RECOLLECTED">Patient Specimen Recollected</option>
                <option value="EQUIPMENT_RECALIBRATED">Equipment Serviced & Recalibrated</option>
                <option value="LIS_INTERFACE_RESET">LIS Interface Reset & Order Re-sent</option>
                <option value="ORDER_CANCELLED_WITH_REFUND">Order Cancelled with Fee Waiver</option>
                <option value="OTHER_CORRECTIVE_ACTION">Other Documented Corrective Action</option>
              </select>
            </div>

            <div>
              <label className="label">Resolution Audit Notes *</label>
              <textarea
                required
                rows="3"
                placeholder="Explain the investigative root cause and corrective resolution..."
                value={resolveData.resolutionNotes}
                onChange={(e) => setResolveData({ ...resolveData, resolutionNotes: e.target.value })}
                className="input w-full"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
              <button
                type="button"
                onClick={() => setShowResolveModal(false)}
                className="btn btn-secondary"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={resolving || !resolveData.resolutionNotes.trim()}
                className="btn btn-primary flex items-center gap-2"
              >
                {resolving ? 'Resolving...' : 'Confirm Resolution'}
              </button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
};

export default LabExceptions;
