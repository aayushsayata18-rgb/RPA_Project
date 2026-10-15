import React, { useState, useEffect } from 'react';
import {
  Calendar,
  PlusCircle,
  Play,
  Lock,
  CheckCircle,
  AlertTriangle,
  RefreshCw,
  Search,
  CheckSquare,
  FileText,
  ShieldCheck,
  Send,
  Zap,
  Info
} from 'lucide-react';
import payrollService from '../../services/payrollService';

export const PayrollPeriodsPage = () => {
  const [periods, setPeriods] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState(null);
  const [actionMessage, setActionMessage] = useState(null);

  // New Period Form State
  const [formData, setFormData] = useState({
    periodCode: '',
    name: '',
    startDate: '',
    endDate: '',
    frequency: 'MONTHLY',
    cutoffDate: '',
    attendanceCutoffDate: '',
    leaveCutoffDate: ''
  });

  useEffect(() => {
    fetchPeriods();
  }, [filterStatus]);

  const fetchPeriods = async () => {
    try {
      setLoading(true);
      const params = {};
      if (filterStatus) params.status = filterStatus;
      const res = await payrollService.getPeriods(params);
      setPeriods(res?.periods || []);
    } catch (err) {
      console.error('Failed to load periods:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePeriod = async (e) => {
    e.preventDefault();
    try {
      setActionLoading(true);
      await payrollService.createPeriod(formData);
      setShowCreateModal(false);
      setFormData({
        periodCode: '',
        name: '',
        startDate: '',
        endDate: '',
        frequency: 'MONTHLY',
        cutoffDate: '',
        attendanceCutoffDate: '',
        leaveCutoffDate: ''
      });
      setActionMessage({ type: 'success', text: 'Payroll period created successfully!' });
      fetchPeriods();
    } catch (err) {
      setActionMessage({ type: 'error', text: err.message || 'Failed to create period' });
    } finally {
      setActionLoading(false);
    }
  };

  const handleOpenPeriod = async (id) => {
    try {
      setActionLoading(true);
      await payrollService.openPeriod(id);
      setActionMessage({ type: 'success', text: 'Payroll period opened for input collection!' });
      fetchPeriods();
    } catch (err) {
      setActionMessage({ type: 'error', text: err.message });
    } finally {
      setActionLoading(false);
    }
  };

  const handleGenerateInputs = async (id) => {
    try {
      setActionLoading(true);
      const res = await payrollService.generateInputs(id);
      setActionMessage({
        type: 'success',
        text: `Generated inputs for ${res.totalEmployees} employees (${res.validCount} valid, ${res.errorCount} exceptions)`
      });
      fetchPeriods();
    } catch (err) {
      setActionMessage({ type: 'error', text: err.message });
    } finally {
      setActionLoading(false);
    }
  };

  const handleValidatePeriod = async (id) => {
    try {
      setActionLoading(true);
      const res = await payrollService.validatePeriod(id);
      if (res.success) {
        setActionMessage({
          type: 'success',
          text: `Validation PASSED: All ${res.validCount} employee records ready for review.`
        });
      } else {
        setActionMessage({
          type: 'warning',
          text: `Validation WARNING: ${res.errorCount} error(s) detected. Please review exceptions.`
        });
      }
      fetchPeriods();
    } catch (err) {
      setActionMessage({ type: 'error', text: err.message });
    } finally {
      setActionLoading(false);
    }
  };

  const handleSubmitReview = async (id) => {
    try {
      setActionLoading(true);
      await payrollService.submitForReview(id, { notes: 'Submitted by HR for manager authorization' });
      setActionMessage({ type: 'success', text: 'Period submitted for approval!' });
      fetchPeriods();
    } catch (err) {
      setActionMessage({ type: 'error', text: err.message });
    } finally {
      setActionLoading(false);
    }
  };

  const handleApprovePeriod = async (id) => {
    try {
      setActionLoading(true);
      await payrollService.approvePeriod(id, { notes: 'Approved for processing run', enforceSegregation: false });
      setActionMessage({ type: 'success', text: 'Payroll period APPROVED successfully!' });
      fetchPeriods();
    } catch (err) {
      setActionMessage({ type: 'error', text: err.message });
    } finally {
      setActionLoading(false);
    }
  };

  const handleProcessPeriod = async (id) => {
    try {
      setActionLoading(true);
      const res = await payrollService.processPeriod(id, { bypassApproval: true });
      setActionMessage({
        type: 'success',
        text: `Processing Run Completed: ${res.summary?.successfulCount} succeeded. Net total: $${res.summary?.netTotal}`
      });
      fetchPeriods();
    } catch (err) {
      setActionMessage({ type: 'error', text: err.message });
    } finally {
      setActionLoading(false);
    }
  };

  const handleFinalizePeriod = async (id) => {
    try {
      setActionLoading(true);
      await payrollService.finalizePeriod(id);
      setActionMessage({ type: 'success', text: 'Payroll period permanently FINALIZED and locked.' });
      fetchPeriods();
    } catch (err) {
      setActionMessage({ type: 'error', text: err.message });
    } finally {
      setActionLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    const map = {
      DRAFT: 'bg-slate-100 text-slate-700 border-slate-300',
      OPEN: 'bg-blue-50 text-blue-700 border-blue-200',
      INPUT_COLLECTION: 'bg-indigo-50 text-indigo-700 border-indigo-200',
      VALIDATION: 'bg-amber-50 text-amber-700 border-amber-200',
      PENDING_APPROVAL: 'bg-purple-50 text-purple-700 border-purple-200',
      APPROVED: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      PROCESSING: 'bg-cyan-50 text-cyan-700 border-cyan-200 animate-pulse',
      PROCESSED: 'bg-teal-50 text-teal-700 border-teal-200',
      FINALIZED: 'bg-green-100 text-green-800 border-green-300',
      CANCELLED: 'bg-rose-50 text-rose-700 border-rose-200'
    };
    return (
      <span className={`px-2.5 py-1 text-xs font-semibold rounded-full border ${map[status] || 'bg-gray-100 text-gray-700'}`}>
        {status?.replace('_', ' ')}
      </span>
    );
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Payroll Periods Management</h1>
          <p className="text-sm text-slate-500">
            Create, open, aggregate inputs, validate pre-checks, approve and process hospital payroll periods.
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-sm font-semibold shadow transition"
        >
          <PlusCircle className="w-4 h-4" />
          Create Period
        </button>
      </div>

      {/* Action Notification Alert */}
      {actionMessage && (
        <div
          className={`p-4 rounded-xl flex items-center justify-between text-sm ${
            actionMessage.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
              : actionMessage.type === 'warning'
              ? 'bg-amber-50 text-amber-800 border border-amber-200'
              : 'bg-rose-50 text-rose-800 border border-rose-200'
          }`}
        >
          <div className="flex items-center gap-2">
            {actionMessage.type === 'success' ? (
              <CheckCircle className="w-5 h-5 text-emerald-600" />
            ) : (
              <AlertTriangle className="w-5 h-5 text-amber-600" />
            )}
            <span>{actionMessage.text}</span>
          </div>
          <button onClick={() => setActionMessage(null)} className="text-xs font-semibold underline">
            Dismiss
          </button>
        </div>
      )}

      {/* Filter Toolbar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-slate-600 uppercase">Filter Status:</span>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="">All Statuses</option>
            <option value="DRAFT">Draft</option>
            <option value="OPEN">Open</option>
            <option value="INPUT_COLLECTION">Input Collection</option>
            <option value="VALIDATION">Validation</option>
            <option value="PENDING_APPROVAL">Pending Approval</option>
            <option value="APPROVED">Approved</option>
            <option value="PROCESSING">Processing</option>
            <option value="PROCESSED">Processed</option>
            <option value="FINALIZED">Finalized</option>
          </select>
        </div>
        <button
          onClick={fetchPeriods}
          disabled={loading}
          className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* Periods Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 uppercase font-semibold border-b border-slate-100">
              <tr>
                <th className="px-5 py-3">Period Code</th>
                <th className="px-5 py-3">Dates</th>
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3">Employees</th>
                <th className="px-5 py-3">Valid / Error</th>
                <th className="px-5 py-3">Net Total</th>
                <th className="px-5 py-3 text-right">Workflow Stage Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {periods.length === 0 ? (
                <tr>
                  <td colSpan="7" className="text-center py-8 text-slate-400">
                    No periods matching criteria.
                  </td>
                </tr>
              ) : (
                periods.map((p) => (
                  <tr key={p._id} className="hover:bg-slate-50/75 transition">
                    <td className="px-5 py-3 font-semibold text-slate-900">
                      <div>{p.periodCode}</div>
                      <div className="text-[10px] text-slate-400 font-normal">{p.name}</div>
                    </td>
                    <td className="px-5 py-3 text-slate-600">
                      <div>{new Date(p.startDate).toLocaleDateString()} &rarr; {new Date(p.endDate).toLocaleDateString()}</div>
                      <div className="text-[10px] text-slate-400">Freq: {p.frequency}</div>
                    </td>
                    <td className="px-5 py-3">{getStatusBadge(p.status)}</td>
                    <td className="px-5 py-3 font-medium text-slate-900">
                      {p.summary?.totalEmployees || 0}
                    </td>
                    <td className="px-5 py-3">
                      <span className="text-emerald-600 font-semibold">{p.summary?.validCount || 0}</span>
                      <span className="text-slate-400"> / </span>
                      <span className={`${(p.summary?.errorCount || 0) > 0 ? 'text-rose-600 font-bold' : 'text-slate-500'}`}>
                        {p.summary?.errorCount || 0}
                      </span>
                    </td>
                    <td className="px-5 py-3 font-semibold text-slate-900">
                      ${(p.summary?.netTotal || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </td>
                    <td className="px-5 py-3 text-right space-x-1.5 whitespace-nowrap">
                      {p.status === 'DRAFT' && (
                        <button
                          onClick={() => handleOpenPeriod(p._id)}
                          disabled={actionLoading}
                          className="px-2.5 py-1 text-xs font-medium bg-blue-50 text-blue-700 hover:bg-blue-100 rounded transition"
                        >
                          Open Period
                        </button>
                      )}

                      {['OPEN', 'INPUT_COLLECTION', 'VALIDATION'].includes(p.status) && (
                        <>
                          <button
                            onClick={() => handleGenerateInputs(p._id)}
                            disabled={actionLoading}
                            className="px-2.5 py-1 text-xs font-medium bg-indigo-50 text-indigo-700 hover:bg-indigo-100 rounded transition"
                          >
                            Collect Inputs
                          </button>
                          <button
                            onClick={() => handleValidatePeriod(p._id)}
                            disabled={actionLoading}
                            className="px-2.5 py-1 text-xs font-medium bg-amber-50 text-amber-700 hover:bg-amber-100 rounded transition"
                          >
                            Validate Pre-Check
                          </button>
                        </>
                      )}

                      {['VALIDATION', 'INPUT_COLLECTION'].includes(p.status) && (
                        <button
                          onClick={() => handleSubmitReview(p._id)}
                          disabled={actionLoading}
                          className="px-2.5 py-1 text-xs font-medium bg-purple-50 text-purple-700 hover:bg-purple-100 rounded transition"
                        >
                          Submit Approval
                        </button>
                      )}

                      {p.status === 'PENDING_APPROVAL' && (
                        <button
                          onClick={() => handleApprovePeriod(p._id)}
                          disabled={actionLoading}
                          className="px-2.5 py-1 text-xs font-medium bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded transition"
                        >
                          Approve Period
                        </button>
                      )}

                      {p.status === 'APPROVED' && (
                        <button
                          onClick={() => handleProcessPeriod(p._id)}
                          disabled={actionLoading}
                          className="px-2.5 py-1 text-xs font-medium bg-cyan-600 text-white hover:bg-cyan-500 rounded shadow-sm transition"
                        >
                          Run Processing
                        </button>
                      )}

                      {p.status === 'PROCESSED' && (
                        <button
                          onClick={() => handleFinalizePeriod(p._id)}
                          disabled={actionLoading}
                          className="px-2.5 py-1 text-xs font-medium bg-green-700 text-white hover:bg-green-600 rounded shadow-sm transition"
                        >
                          Finalize Lock
                        </button>
                      )}

                      {p.status === 'FINALIZED' && (
                        <span className="inline-flex items-center gap-1 text-[11px] text-green-700 font-semibold">
                          <Lock className="w-3 h-3" /> Locked
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

      {/* Create Period Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-lg w-full overflow-hidden">
            <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
              <h3 className="font-semibold text-base flex items-center gap-2">
                <Calendar className="w-5 h-5 text-indigo-400" />
                Initialize New Payroll Period
              </h3>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-slate-400 hover:text-white text-lg font-bold"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleCreatePeriod} className="p-6 space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Period Code (e.g. PAY-2026-11)</label>
                <input
                  type="text"
                  required
                  placeholder="PAY-2026-11"
                  value={formData.periodCode}
                  onChange={(e) => setFormData({ ...formData, periodCode: e.target.value.toUpperCase() })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Period Title / Description</label>
                <input
                  type="text"
                  required
                  placeholder="November 2026 Standard Monthly Payroll"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Start Date</label>
                  <input
                    type="date"
                    required
                    value={formData.startDate}
                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">End Date</label>
                  <input
                    type="date"
                    required
                    value={formData.endDate}
                    onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Frequency</label>
                  <select
                    value={formData.frequency}
                    onChange={(e) => setFormData({ ...formData, frequency: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  >
                    <option value="MONTHLY">Monthly</option>
                    <option value="BIWEEKLY">Bi-Weekly</option>
                    <option value="WEEKLY">Weekly</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Attendance Cutoff Date</label>
                  <input
                    type="date"
                    value={formData.attendanceCutoffDate}
                    onChange={(e) => setFormData({ ...formData, attendanceCutoffDate: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-semibold shadow transition"
                >
                  {actionLoading ? 'Creating...' : 'Initialize Period'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default PayrollPeriodsPage;
