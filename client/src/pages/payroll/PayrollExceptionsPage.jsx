import React, { useState, useEffect } from 'react';
import {
  AlertTriangle,
  CheckCircle,
  Clock,
  RefreshCw,
  Search,
  ExternalLink,
  ShieldAlert,
  ArrowRight
} from 'lucide-react';
import payrollService from '../../services/payrollService';

export const PayrollExceptionsPage = () => {
  const [periods, setPeriods] = useState([]);
  const [selectedPeriodCode, setSelectedPeriodCode] = useState('');
  const [exceptions, setExceptions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [notification, setNotification] = useState(null);

  useEffect(() => {
    loadPeriods();
  }, []);

  useEffect(() => {
    if (selectedPeriodCode) {
      loadExceptions(selectedPeriodCode);
    }
  }, [selectedPeriodCode]);

  const loadPeriods = async () => {
    try {
      const res = await payrollService.getPeriods();
      const list = res?.periods || [];
      setPeriods(list);
      if (list.length > 0) setSelectedPeriodCode(list[0].periodCode);
    } catch (err) {
      console.error('Failed to load periods:', err);
    }
  };

  const loadExceptions = async (periodCode) => {
    try {
      setLoading(true);
      const res = await payrollService.getPeriodInputs(periodCode, { status: 'EXCEPTION' });
      const excInputs = res?.inputs || [];

      // Extract error items
      const items = [];
      for (const inp of excInputs) {
        const errors = inp.validationStatus?.errors || [];
        if (errors.length === 0) {
          items.push({
            employeeIdCode: inp.employeeIdCode,
            employeeName: inp.employeeSnapshot?.employeeName,
            code: 'GENERAL_EXCEPTION',
            message: 'Input marked in exception state',
            severity: 'ERROR',
            inputId: inp.inputId
          });
        } else {
          for (const err of errors) {
            items.push({
              employeeIdCode: inp.employeeIdCode,
              employeeName: inp.employeeSnapshot?.employeeName,
              code: err.code,
              message: err.message,
              severity: err.severity,
              inputId: inp.inputId
            });
          }
        }
      }
      setExceptions(items);
    } catch (err) {
      console.error('Failed to load exceptions:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleResolveRecalculate = async () => {
    try {
      setLoading(true);
      await payrollService.generateInputs(selectedPeriodCode, { recalculationReason: 'Manual exception recalculation trigger' });
      await payrollService.validatePeriod(selectedPeriodCode);
      setNotification({ type: 'success', text: 'Inputs re-aggregated and validated!' });
      loadExceptions(selectedPeriodCode);
    } catch (err) {
      setNotification({ type: 'error', text: err.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <ShieldAlert className="w-6 h-6 text-rose-600" />
            Payroll Exceptions & Pre-Check Governance
          </h1>
          <p className="text-sm text-slate-500">
            Audit critical payroll blocking conditions: unassigned salaries, invalid punches, stale inputs.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-xs font-semibold text-slate-600 uppercase">Period:</span>
          <select
            value={selectedPeriodCode}
            onChange={(e) => setSelectedPeriodCode(e.target.value)}
            className="px-3.5 py-2 bg-white border border-slate-300 rounded-lg text-sm font-semibold text-slate-800 shadow-sm focus:outline-none"
          >
            {periods.map((p) => (
              <option key={p._id} value={p.periodCode}>
                {p.periodCode} ({p.status})
              </option>
            ))}
          </select>
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

      {/* Action Banner */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
        <div className="text-xs text-slate-600">
          Showing <span className="font-bold text-rose-600">{exceptions.length}</span> blocking or warning item(s) for period <span className="font-semibold text-slate-900">{selectedPeriodCode}</span>.
        </div>
        <button
          onClick={handleResolveRecalculate}
          disabled={loading}
          className="flex items-center gap-1.5 px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold transition"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          Recalculate & Revalidate
        </button>
      </div>

      {/* Exceptions Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 uppercase font-semibold border-b border-slate-100">
              <tr>
                <th className="px-5 py-3">Employee</th>
                <th className="px-5 py-3">Exception Code</th>
                <th className="px-5 py-3">Description & Impact</th>
                <th className="px-5 py-3">Severity</th>
                <th className="px-5 py-3 text-right">Action Resolution</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {exceptions.length === 0 ? (
                <tr>
                  <td colSpan="5" className="text-center py-8 text-slate-400">
                    <CheckCircle className="w-6 h-6 text-emerald-500 mx-auto mb-2" />
                    No active payroll exceptions detected for this period. Clean validation!
                  </td>
                </tr>
              ) : (
                exceptions.map((exc, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/75 transition">
                    <td className="px-5 py-3 font-semibold text-slate-900">
                      <div>{exc.employeeName || 'Unknown'}</div>
                      <div className="text-[10px] text-slate-400 font-mono font-normal">{exc.employeeIdCode}</div>
                    </td>
                    <td className="px-5 py-3 font-mono font-semibold text-rose-700">{exc.code}</td>
                    <td className="px-5 py-3 text-slate-600 max-w-md">{exc.message}</td>
                    <td className="px-5 py-3">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          exc.severity === 'ERROR'
                            ? 'bg-rose-100 text-rose-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {exc.severity}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-right">
                      {exc.code === 'MISSING_SALARY_ASSIGNMENT' ? (
                        <a
                          href="/payroll/salary-config"
                          className="px-2.5 py-1 text-xs font-semibold text-purple-700 bg-purple-50 hover:bg-purple-100 rounded transition inline-flex items-center gap-1"
                        >
                          Assign Salary <ArrowRight className="w-3 h-3" />
                        </a>
                      ) : (
                        <span className="text-[11px] text-slate-400 font-medium">Auto-check</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default PayrollExceptionsPage;
