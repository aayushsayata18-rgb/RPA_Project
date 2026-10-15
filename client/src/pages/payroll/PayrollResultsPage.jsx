import React, { useState, useEffect } from 'react';
import {
  TrendingUp,
  DollarSign,
  CheckCircle,
  AlertTriangle,
  RefreshCw,
  FileText,
  Send,
  Zap,
  Layers,
  ArrowRight
} from 'lucide-react';
import payrollService from '../../services/payrollService';

export const PayrollResultsPage = () => {
  const [periods, setPeriods] = useState([]);
  const [selectedPeriodCode, setSelectedPeriodCode] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [reconciliation, setReconciliation] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [notification, setNotification] = useState(null);

  useEffect(() => {
    loadPeriods();
  }, []);

  useEffect(() => {
    if (selectedPeriodCode) {
      loadResults(selectedPeriodCode);
      loadReconciliation(selectedPeriodCode);
    }
  }, [selectedPeriodCode]);

  const loadPeriods = async () => {
    try {
      const res = await payrollService.getPeriods();
      const list = res?.periods || [];
      setPeriods(list);
      const ready = list.find((p) => ['PROCESSING', 'PROCESSED', 'FINALIZED'].includes(p.status)) || list[0];
      if (ready) setSelectedPeriodCode(ready.periodCode);
    } catch (err) {
      console.error('Failed to load periods:', err);
    }
  };

  const loadResults = async (code) => {
    try {
      setLoading(true);
      const res = await payrollService.getPeriodResults(code);
      setResults(res?.results || []);
    } catch (err) {
      console.error('Failed to load results:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadReconciliation = async (code) => {
    try {
      const res = await payrollService.reconcileInternal(code);
      setReconciliation(res);
    } catch (err) {
      console.error('Failed to load reconciliation:', err);
    }
  };

  const handleGeneratePayslips = async () => {
    try {
      setActionLoading(true);
      const res = await payrollService.generatePayslips(selectedPeriodCode);
      setNotification({
        type: 'success',
        text: `Successfully generated and published ${res.count} employee payslips!`
      });
    } catch (err) {
      setNotification({ type: 'error', text: err.message });
    } finally {
      setActionLoading(false);
    }
  };

  const handleReconcileExternal = async () => {
    try {
      setActionLoading(true);
      // Simulate external payroll sync contract
      const externalRecords = results.map(r => ({
        employeeIdCode: r.employeeIdCode,
        gross: r.grossEarnings,
        net: r.netPay
      }));
      const res = await payrollService.reconcileExternal(selectedPeriodCode, {
        records: externalRecords,
        correlationId: `RPA-EXT-${Date.now()}`
      });

      if (res.success) {
        setNotification({
          type: 'success',
          text: `External reconciliation 100% MATCHED for ${res.submittedCount} employees.`
        });
      } else {
        setNotification({
          type: 'warning',
          text: `External reconciliation MISMATCH: Missing ${res.missingInExternal?.length} records.`
        });
      }
    } catch (err) {
      setNotification({ type: 'error', text: err.message });
    } finally {
      setActionLoading(false);
    }
  };

  const grossSum = results.reduce((sum, r) => sum + (r.grossEarnings || 0), 0);
  const dedSum = results.reduce((sum, r) => sum + (r.totalDeductions || 0), 0);
  const netSum = results.reduce((sum, r) => sum + (r.netPay || 0), 0);

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <TrendingUp className="w-6 h-6 text-emerald-600" />
            Payroll Processing & Reconciliation
          </h1>
          <p className="text-sm text-slate-500">
            Audit calculated payroll results, execute data reconciliations, and generate employee payslips.
          </p>
        </div>

        {/* Period Dropdown */}
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
              : 'bg-amber-50 text-amber-800 border border-amber-200'
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

      {/* Financial KPI Banner */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">Total Gross Earnings</span>
          <div className="text-2xl font-bold text-slate-900 mt-2">
            ${grossSum.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <span className="text-xs text-slate-400 mt-1 block">Hospital gross commitment</span>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">Total Deductions</span>
          <div className="text-2xl font-bold text-rose-600 mt-2">
            ${dedSum.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <span className="text-xs text-slate-400 mt-1 block">PF, unpaid leave, benefits</span>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">Net Pay Total</span>
          <div className="text-2xl font-bold text-emerald-600 mt-2">
            ${netSum.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <span className="text-xs text-slate-400 mt-1 block">Net bank transfer sum</span>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">Internal Reconciliation</span>
            <div className="mt-2 flex items-center gap-1.5">
              {reconciliation?.status === 'MATCHED' ? (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-bold bg-emerald-100 text-emerald-800 rounded-full">
                  <CheckCircle className="w-3.5 h-3.5" /> MATCHED
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-bold bg-amber-100 text-amber-800 rounded-full">
                  <AlertTriangle className="w-3.5 h-3.5" /> DISCREPANCY
                </span>
              )}
            </div>
          </div>
          <div className="text-xs text-slate-500 mt-2">
            {reconciliation?.resultCount || 0} results verified
          </div>
        </div>
      </div>

      {/* Action Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              loadResults(selectedPeriodCode);
              loadReconciliation(selectedPeriodCode);
            }}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-1.5 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          <button
            onClick={handleReconcileExternal}
            disabled={actionLoading}
            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg text-xs font-semibold transition"
          >
            <Zap className="w-3.5 h-3.5 text-indigo-600" />
            Simulate External Reconciliation
          </button>
        </div>

        <button
          onClick={handleGeneratePayslips}
          disabled={actionLoading || results.length === 0}
          className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold shadow transition"
        >
          <FileText className="w-4 h-4" />
          Generate & Publish Payslips
        </button>
      </div>

      {/* Results Ledger Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100">
          <h2 className="font-semibold text-slate-900 text-sm">Calculated Financial Results Ledger</h2>
          <p className="text-xs text-slate-500">Financial records calculated according to approved salary assignments</p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 uppercase font-semibold border-b border-slate-100">
              <tr>
                <th className="px-5 py-3">Result ID</th>
                <th className="px-5 py-3">Employee</th>
                <th className="px-5 py-3 text-right">Gross Earnings</th>
                <th className="px-5 py-3 text-right">Deductions</th>
                <th className="px-5 py-3 text-right">Net Pay</th>
                <th className="px-5 py-3">Currency</th>
                <th className="px-5 py-3">Source</th>
                <th className="px-5 py-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {results.length === 0 ? (
                <tr>
                  <td colSpan="8" className="text-center py-8 text-slate-400">
                    No results calculated yet for {selectedPeriodCode}. Click "Run Processing" in Periods page.
                  </td>
                </tr>
              ) : (
                results.map((r) => (
                  <tr key={r._id} className="hover:bg-slate-50/75 transition">
                    <td className="px-5 py-3 font-mono font-medium text-slate-600">{r.resultId}</td>
                    <td className="px-5 py-3 font-semibold text-slate-900">{r.employeeIdCode}</td>
                    <td className="px-5 py-3 text-right font-medium text-slate-900">
                      ${r.grossEarnings?.toFixed(2)}
                    </td>
                    <td className="px-5 py-3 text-right font-medium text-rose-600">
                      ${r.totalDeductions?.toFixed(2)}
                    </td>
                    <td className="px-5 py-3 text-right font-bold text-emerald-600">
                      ${r.netPay?.toFixed(2)}
                    </td>
                    <td className="px-5 py-3 text-slate-500 font-mono">{r.currency}</td>
                    <td className="px-5 py-3">
                      <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-700">
                        {r.source}
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        {r.status}
                      </span>
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

export default PayrollResultsPage;
