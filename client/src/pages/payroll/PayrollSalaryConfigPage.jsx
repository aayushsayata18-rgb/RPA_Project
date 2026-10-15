import React, { useState, useEffect } from 'react';
import {
  FileText,
  PlusCircle,
  Users,
  ShieldCheck,
  CheckCircle,
  Layers,
  History,
  DollarSign,
  TrendingUp,
  RefreshCw,
  Search
} from 'lucide-react';
import payrollService from '../../services/payrollService';

export const PayrollSalaryConfigPage = () => {
  const [structures, setStructures] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showStructureModal, setShowStructureModal] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [notification, setNotification] = useState(null);

  // Structure Form
  const [structForm, setStructForm] = useState({
    code: '',
    name: '',
    description: '',
    effectiveFrom: '',
    components: [
      { code: 'BASIC', name: 'Basic Salary', type: 'EARNING', calculationType: 'FIXED', defaultValue: 3500 },
      { code: 'HRA', name: 'Housing Allowance', type: 'EARNING', calculationType: 'PERCENTAGE', percentageValue: 20, defaultValue: 700 },
      { code: 'TRANSPORT', name: 'Transport Allowance', type: 'EARNING', calculationType: 'FIXED', defaultValue: 200 },
      { code: 'PF', name: 'Provident Fund', type: 'DEDUCTION', calculationType: 'PERCENTAGE', percentageValue: 5, defaultValue: 175 }
    ]
  });

  // Assign Salary Form
  const [assignForm, setAssignForm] = useState({
    employeeIdCode: '',
    salaryStructureId: '',
    baseAmount: '',
    effectiveFrom: '',
    changeReason: 'Initial Assignment'
  });

  useEffect(() => {
    fetchStructures();
  }, []);

  const fetchStructures = async () => {
    try {
      setLoading(true);
      const res = await payrollService.getSalaryStructures();
      setStructures(res?.structures || []);
    } catch (err) {
      console.error('Failed to load salary structures:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateStructure = async (e) => {
    e.preventDefault();
    try {
      setActionLoading(true);
      await payrollService.createSalaryStructure(structForm);
      setShowStructureModal(false);
      setNotification({ type: 'success', text: 'Salary structure configured and versioned successfully!' });
      fetchStructures();
    } catch (err) {
      setNotification({ type: 'error', text: err.message });
    } finally {
      setActionLoading(false);
    }
  };

  const handleAssignSalary = async (e) => {
    e.preventDefault();
    try {
      setActionLoading(true);
      await payrollService.assignSalary({
        ...assignForm,
        baseAmount: Number(assignForm.baseAmount)
      });
      setShowAssignModal(false);
      setNotification({ type: 'success', text: `Salary successfully assigned to ${assignForm.employeeIdCode}!` });
      setAssignForm({
        employeeIdCode: '',
        salaryStructureId: '',
        baseAmount: '',
        effectiveFrom: '',
        changeReason: 'Salary Revision'
      });
    } catch (err) {
      setNotification({ type: 'error', text: err.message });
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <FileText className="w-6 h-6 text-purple-600" />
            Salary Structures & Assignments
          </h1>
          <p className="text-sm text-slate-500">
            Define configurable compensation structures, allowances, deductions, and versioned employee assignments.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowStructureModal(true)}
            className="flex items-center gap-2 px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-semibold shadow transition"
          >
            <PlusCircle className="w-4 h-4" />
            New Salary Structure
          </button>
          <button
            onClick={() => setShowAssignModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-lg text-xs font-semibold shadow transition"
          >
            <Users className="w-4 h-4" />
            Assign Employee Salary
          </button>
        </div>
      </div>

      {notification && (
        <div
          className={`p-4 rounded-xl flex items-center justify-between text-sm ${
            notification.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
              : 'bg-rose-50 text-rose-800 border border-rose-200'
          }`}
        >
          <div className="flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-emerald-600" />
            <span>{notification.text}</span>
          </div>
          <button onClick={() => setNotification(null)} className="text-xs font-semibold underline">
            Dismiss
          </button>
        </div>
      )}

      {/* Salary Structures Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {structures.length === 0 ? (
          <div className="col-span-full bg-white p-8 rounded-xl border border-slate-200 text-center text-slate-400">
            {loading ? 'Loading structures...' : 'No active salary structures configured.'}
          </div>
        ) : (
          structures.map((s) => (
            <div
              key={s._id}
              className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm hover:shadow transition flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded">
                    {s.code} (v{s.version})
                  </span>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                      s.status === 'ACTIVE'
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-slate-100 text-slate-700'
                    }`}
                  >
                    {s.status}
                  </span>
                </div>
                <h3 className="font-semibold text-slate-900 text-base mt-2">{s.name}</h3>
                <p className="text-xs text-slate-500 mt-1">{s.description || 'Standard compensation structure'}</p>

                <div className="mt-4 pt-3 border-t border-slate-100 space-y-1.5">
                  <span className="text-[11px] font-semibold text-slate-700 uppercase tracking-wider block">
                    Components Breakdown ({s.components?.length || 0})
                  </span>
                  <div className="space-y-1 text-xs">
                    {s.components?.map((c, i) => (
                      <div key={i} className="flex justify-between items-center text-slate-600 py-0.5">
                        <span className="font-medium text-slate-800">{c.name}</span>
                        <span className={`text-[11px] font-mono ${c.type === 'EARNING' ? 'text-emerald-700' : 'text-rose-600'}`}>
                          {c.calculationType === 'PERCENTAGE' ? `${c.percentageValue}%` : `$${c.defaultValue}`}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 text-[10px] text-slate-400 flex justify-between">
                <span>Effective: {new Date(s.effectiveFrom).toLocaleDateString()}</span>
                <span>By: {s.createdBy}</span>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Structure Modal */}
      {showStructureModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-lg w-full overflow-hidden">
            <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
              <h3 className="font-semibold text-base">Configure Salary Structure</h3>
              <button onClick={() => setShowStructureModal(false)} className="text-slate-400 hover:text-white font-bold">&times;</button>
            </div>
            <form onSubmit={handleCreateStructure} className="p-6 space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Structure Code (e.g. SAL-DOC-001)</label>
                <input
                  type="text"
                  required
                  placeholder="SAL-DOC-001"
                  value={structForm.code}
                  onChange={(e) => setStructForm({ ...structForm, code: e.target.value.toUpperCase() })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Structure Name</label>
                <input
                  type="text"
                  required
                  placeholder="Clinical Specialist Salary Structure"
                  value={structForm.name}
                  onChange={(e) => setStructForm({ ...structForm, name: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Effective Date</label>
                <input
                  type="date"
                  required
                  value={structForm.effectiveFrom}
                  onChange={(e) => setStructForm({ ...structForm, effectiveFrom: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:outline-none"
                />
              </div>
              <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowStructureModal(false)}
                  className="px-4 py-2 border rounded-lg text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-5 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-lg font-semibold"
                >
                  Save Structure
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Assign Salary Modal */}
      {showAssignModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-lg w-full overflow-hidden">
            <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
              <h3 className="font-semibold text-base">Assign Salary to Employee</h3>
              <button onClick={() => setShowAssignModal(false)} className="text-slate-400 hover:text-white font-bold">&times;</button>
            </div>
            <form onSubmit={handleAssignSalary} className="p-6 space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Employee ID Code (e.g. EMP00125)</label>
                <input
                  type="text"
                  required
                  placeholder="EMP00125"
                  value={assignForm.employeeIdCode}
                  onChange={(e) => setAssignForm({ ...assignForm, employeeIdCode: e.target.value.toUpperCase() })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Salary Structure</label>
                <select
                  required
                  value={assignForm.salaryStructureId}
                  onChange={(e) => setAssignForm({ ...assignForm, salaryStructureId: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:outline-none"
                >
                  <option value="">Select Structure</option>
                  {structures.map((s) => (
                    <option key={s._id} value={s._id}>
                      {s.code} - {s.name} (v{s.version})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Monthly Base Salary ($)</label>
                <input
                  type="number"
                  required
                  min="0"
                  step="0.01"
                  placeholder="4000.00"
                  value={assignForm.baseAmount}
                  onChange={(e) => setAssignForm({ ...assignForm, baseAmount: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Effective Date</label>
                  <input
                    type="date"
                    required
                    value={assignForm.effectiveFrom}
                    onChange={(e) => setAssignForm({ ...assignForm, effectiveFrom: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Change Reason</label>
                  <input
                    type="text"
                    value={assignForm.changeReason}
                    onChange={(e) => setAssignForm({ ...assignForm, changeReason: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAssignModal(false)}
                  className="px-4 py-2 border rounded-lg text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-5 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-lg font-semibold"
                >
                  Assign Salary
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default PayrollSalaryConfigPage;
