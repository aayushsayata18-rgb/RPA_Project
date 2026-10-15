import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  ShieldCheck,
  Search,
  Filter,
  CheckCircle,
  AlertTriangle,
  Clock,
  Calendar,
  Layers,
  ArrowRight,
  RefreshCw,
  FileText,
  Eye,
  AlertCircle
} from 'lucide-react';
import payrollService from '../../services/payrollService';

export const PayrollReviewPage = () => {
  const [searchParams] = useSearchParams();
  const initialPeriod = searchParams.get('period') || '';

  const [periods, setPeriods] = useState([]);
  const [selectedPeriodCode, setSelectedPeriodCode] = useState(initialPeriod);
  const [inputs, setInputs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [selectedInput, setSelectedInput] = useState(null);

  useEffect(() => {
    loadPeriods();
  }, []);

  useEffect(() => {
    if (selectedPeriodCode) {
      loadInputs(selectedPeriodCode);
    }
  }, [selectedPeriodCode]);

  const loadPeriods = async () => {
    try {
      const res = await payrollService.getPeriods();
      const list = res?.periods || [];
      setPeriods(list);
      if (!selectedPeriodCode && list.length > 0) {
        setSelectedPeriodCode(list[0].periodCode);
      }
    } catch (err) {
      console.error('Failed to load periods:', err);
    }
  };

  const loadInputs = async (periodCode) => {
    try {
      setLoading(true);
      const res = await payrollService.getPeriodInputs(periodCode);
      setInputs(res?.inputs || []);
    } catch (err) {
      console.error('Failed to load period inputs:', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredInputs = inputs.filter((inp) => {
    const name = inp.employeeSnapshot?.employeeName || '';
    const code = inp.employeeIdCode || '';
    const dept = inp.employeeSnapshot?.departmentName || '';
    const matchesSearch =
      name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      dept.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter ? inp.status === statusFilter : true;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <ShieldCheck className="w-6 h-6 text-indigo-600" />
            Payroll Review & Input Audit
          </h1>
          <p className="text-sm text-slate-500">
            Audit worked days, approved leave, validated overtime minutes, and earnings before final authorization.
          </p>
        </div>

        {/* Period Selector */}
        <div className="flex items-center gap-3">
          <span className="text-xs font-semibold text-slate-600 uppercase">Select Period:</span>
          <select
            value={selectedPeriodCode}
            onChange={(e) => setSelectedPeriodCode(e.target.value)}
            className="px-3.5 py-2 bg-white border border-slate-300 rounded-lg text-sm font-semibold text-slate-800 shadow-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
          >
            {periods.map((p) => (
              <option key={p._id} value={p.periodCode}>
                {p.periodCode} ({p.status})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3 flex-1 max-w-md">
          <div className="relative w-full">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search by Employee ID, Name, or Department..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </div>

        <div className="flex items-center gap-3">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-700 focus:outline-none"
          >
            <option value="">All Statuses</option>
            <option value="CALCULATED">Calculated</option>
            <option value="REVIEWED">Reviewed</option>
            <option value="APPROVED">Approved</option>
            <option value="EXCEPTION">Exception</option>
            <option value="LOCKED">Locked</option>
          </select>
          <button
            onClick={() => loadInputs(selectedPeriodCode)}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-1.5 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* Inputs Review Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 uppercase font-semibold border-b border-slate-100">
              <tr>
                <th className="px-4 py-3">Employee</th>
                <th className="px-4 py-3">Department</th>
                <th className="px-4 py-3 text-center">Scheduled</th>
                <th className="px-4 py-3 text-center">Worked</th>
                <th className="px-4 py-3 text-center">Paid / Unpaid Lv</th>
                <th className="px-4 py-3 text-center">Approved OT</th>
                <th className="px-4 py-3">Allowances</th>
                <th className="px-4 py-3">Deductions</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {filteredInputs.length === 0 ? (
                <tr>
                  <td colSpan="10" className="text-center py-8 text-slate-400">
                    {loading ? 'Loading payroll inputs...' : 'No inputs found for this period. Click "Collect Inputs" in Periods management.'}
                  </td>
                </tr>
              ) : (
                filteredInputs.map((inp) => (
                  <tr key={inp._id} className="hover:bg-slate-50/75 transition">
                    <td className="px-4 py-3 font-semibold text-slate-900">
                      <div>{inp.employeeSnapshot?.employeeName}</div>
                      <div className="text-[10px] text-slate-400 font-mono font-normal">{inp.employeeIdCode}</div>
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      <div>{inp.employeeSnapshot?.departmentName}</div>
                      <div className="text-[10px] text-slate-400">{inp.employeeSnapshot?.designation}</div>
                    </td>
                    <td className="px-4 py-3 text-center font-medium">
                      {inp.attendanceSummary?.scheduledDays || 26}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className="font-semibold text-emerald-600">{inp.attendanceSummary?.workedDays || 0}</span>
                      {(inp.attendanceSummary?.lateMinutes || 0) > 0 && (
                        <div className="text-[10px] text-amber-600 font-medium">{inp.attendanceSummary.lateMinutes}m late</div>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className="text-blue-600 font-medium">{inp.leaveSummary?.paidLeaveDays || 0}d</span>
                      <span className="text-slate-400"> / </span>
                      <span className={`${(inp.leaveSummary?.unpaidLeaveDays || 0) > 0 ? 'text-rose-600 font-semibold' : 'text-slate-400'}`}>
                        {inp.leaveSummary?.unpaidLeaveDays || 0}d
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className="font-semibold text-indigo-700">
                        {((inp.overtime?.approvedMinutes || 0) / 60).toFixed(1)}h
                      </span>
                      {inp.overtime?.candidateMinutes > inp.overtime?.approvedMinutes && (
                        <div className="text-[10px] text-slate-400">
                          req {((inp.overtime.candidateMinutes || 0) / 60).toFixed(1)}h
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3 font-medium text-slate-900">
                      ${inp.allowances?.reduce((sum, a) => sum + (a.amount || 0), 0).toFixed(2)}
                    </td>
                    <td className="px-4 py-3 font-medium text-slate-700">
                      ${inp.deductions?.reduce((sum, d) => sum + (d.amount || 0), 0).toFixed(2)}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-col gap-1 items-start">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                            inp.status === 'EXCEPTION'
                              ? 'bg-rose-100 text-rose-800'
                              : inp.status === 'APPROVED'
                              ? 'bg-emerald-100 text-emerald-800'
                              : inp.status === 'REVIEWED'
                              ? 'bg-purple-100 text-purple-800'
                              : 'bg-slate-100 text-slate-700'
                          }`}
                        >
                          {inp.status}
                        </span>
                        {inp.isStale && (
                          <span className="px-1.5 py-0.2 text-[9px] bg-amber-100 text-amber-800 font-bold rounded">
                            STALE
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => setSelectedInput(inp)}
                        className="p-1 hover:bg-slate-100 rounded text-slate-500 hover:text-indigo-600 transition"
                        title="View Traceability Details"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Input Traceability Modal */}
      {selectedInput && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-xl w-full overflow-hidden">
            <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-base">{selectedInput.employeeSnapshot?.employeeName}</h3>
                <p className="text-xs text-indigo-300 font-mono">
                  {selectedInput.employeeIdCode} &bull; Input ID: {selectedInput.inputId} (v{selectedInput.version})
                </p>
              </div>
              <button
                onClick={() => setSelectedInput(null)}
                className="text-slate-400 hover:text-white text-lg font-bold"
              >
                &times;
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs max-h-[75vh] overflow-y-auto">
              {/* Warnings / Exceptions */}
              {selectedInput.validationStatus?.errors?.length > 0 && (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg space-y-1">
                  <div className="font-semibold text-amber-800 flex items-center gap-1.5">
                    <AlertTriangle className="w-4 h-4" /> Validation Alerts:
                  </div>
                  {selectedInput.validationStatus.errors.map((err, i) => (
                    <div key={i} className="text-amber-700 text-xs">
                      &bull; <span className="font-semibold">{err.code}</span>: {err.message}
                    </div>
                  ))}
                </div>
              )}

              {/* Attendance & Leave Summaries */}
              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 bg-slate-50 rounded-lg space-y-1.5 border border-slate-200">
                  <span className="font-semibold text-slate-800 block text-xs">Attendance Metrics</span>
                  <div>Worked Days: <span className="font-semibold">{selectedInput.attendanceSummary?.workedDays}</span></div>
                  <div>Absent Days: <span className="font-semibold">{selectedInput.attendanceSummary?.absentDays}</span></div>
                  <div>Late Minutes: <span className="font-semibold">{selectedInput.attendanceSummary?.lateMinutes}m</span></div>
                  <div>Worked Minutes: <span className="font-semibold">{selectedInput.attendanceSummary?.workedMinutes}m</span></div>
                </div>

                <div className="p-3 bg-slate-50 rounded-lg space-y-1.5 border border-slate-200">
                  <span className="font-semibold text-slate-800 block text-xs">Leave & Overtime</span>
                  <div>Paid Leave: <span className="font-semibold text-blue-700">{selectedInput.leaveSummary?.paidLeaveDays} days</span></div>
                  <div>Unpaid Leave: <span className="font-semibold text-rose-700">{selectedInput.leaveSummary?.unpaidLeaveDays} days</span></div>
                  <div>Candidate OT: <span className="font-semibold">{selectedInput.overtime?.candidateMinutes}m</span></div>
                  <div>Approved OT: <span className="font-semibold text-emerald-700">{selectedInput.overtime?.approvedMinutes}m</span></div>
                </div>
              </div>

              {/* Source References (Traceability) */}
              <div className="space-y-1.5">
                <span className="font-semibold text-slate-800 block text-xs">Authoritative Source Traceability</span>
                <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 space-y-1">
                  {selectedInput.sourceReferences?.map((src, i) => (
                    <div key={i} className="flex items-center justify-between font-mono text-[11px] text-slate-600">
                      <span className="font-semibold text-slate-800">{src.sourceType}</span>
                      <span>{src.sourceId || 'N/A'} (v{src.sourceVersion})</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Allowances & Deductions Details */}
              <div className="space-y-2">
                <span className="font-semibold text-slate-800 block text-xs">Configured Components</span>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <span className="text-[11px] text-slate-500 font-semibold block mb-1">Allowances</span>
                    <ul className="space-y-1">
                      {selectedInput.allowances?.map((a, idx) => (
                        <li key={idx} className="flex justify-between p-1.5 bg-slate-50 rounded border border-slate-100">
                          <span>{a.name}</span>
                          <span className="font-semibold">${a.amount}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <span className="text-[11px] text-slate-500 font-semibold block mb-1">Deductions</span>
                    <ul className="space-y-1">
                      {selectedInput.deductions?.map((d, idx) => (
                        <li key={idx} className="flex justify-between p-1.5 bg-slate-50 rounded border border-slate-100">
                          <span>{d.name}</span>
                          <span className="font-semibold">${d.amount}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end">
              <button
                onClick={() => setSelectedInput(null)}
                className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-semibold transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PayrollReviewPage;
