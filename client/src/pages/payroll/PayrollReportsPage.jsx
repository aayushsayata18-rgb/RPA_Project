import React, { useState, useEffect } from 'react';
import {
  FileText,
  Download,
  Calendar,
  Printer,
  DollarSign,
  Users,
  Clock,
  RefreshCw,
  Search
} from 'lucide-react';
import payrollService from '../../services/payrollService';

export const PayrollReportsPage = () => {
  const [periods, setPeriods] = useState([]);
  const [selectedPeriodCode, setSelectedPeriodCode] = useState('');
  const [reportType, setReportType] = useState('REGISTER');
  const [results, setResults] = useState([]);
  const [inputs, setInputs] = useState([]);
  const [overtime, setOvertime] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadPeriods();
  }, []);

  useEffect(() => {
    if (selectedPeriodCode) {
      loadReportData(selectedPeriodCode);
    }
  }, [selectedPeriodCode, reportType]);

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

  const loadReportData = async (code) => {
    try {
      setLoading(true);
      const [resData, inpData, otData] = await Promise.all([
        payrollService.getPeriodResults(code),
        payrollService.getPeriodInputs(code),
        payrollService.getOvertimeRecords()
      ]);
      setResults(resData?.results || []);
      setInputs(inpData?.inputs || []);
      setOvertime(otData?.records || []);
    } catch (err) {
      console.error('Failed to load report data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleExportCSV = () => {
    let csvContent = 'data:text/csv;charset=utf-8,';

    if (reportType === 'REGISTER') {
      csvContent += 'PeriodCode,ResultID,EmployeeID,GrossEarnings,TotalDeductions,NetPay,Currency,Status\n';
      results.forEach((r) => {
        csvContent += `${r.periodCode},${r.resultId},${r.employeeIdCode},${r.grossEarnings},${r.totalDeductions},${r.netPay},${r.currency},${r.status}\n`;
      });
    } else if (reportType === 'ATTENDANCE') {
      csvContent += 'PeriodCode,EmployeeID,EmployeeName,ScheduledDays,WorkedDays,AbsentDays,PaidLeaveDays,UnpaidLeaveDays,ApprovedOTMinutes\n';
      inputs.forEach((inp) => {
        csvContent += `${inp.periodCode},${inp.employeeIdCode},"${inp.employeeSnapshot?.employeeName || ''}",${inp.attendanceSummary?.scheduledDays},${inp.attendanceSummary?.workedDays},${inp.attendanceSummary?.absentDays},${inp.leaveSummary?.paidLeaveDays},${inp.leaveSummary?.unpaidLeaveDays},${inp.overtime?.approvedMinutes}\n`;
      });
    } else {
      csvContent += 'OvertimeID,EmployeeID,Date,CandidateMinutes,ApprovedMinutes,Status,Reason\n';
      overtime.forEach((o) => {
        csvContent += `${o.overtimeId},${o.employeeIdCode},${new Date(o.date).toISOString().split('T')[0]},${o.candidateMinutes},${o.approvedMinutes},${o.status},"${o.reason}"\n`;
      });
    }

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `payroll_${reportType.toLowerCase()}_${selectedPeriodCode}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <FileText className="w-6 h-6 text-indigo-600" />
            Payroll Reports & Register Export
          </h1>
          <p className="text-sm text-slate-500">
            Generate official payroll registers, attendance input audit reports, and export compliance files.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <select
            value={selectedPeriodCode}
            onChange={(e) => setSelectedPeriodCode(e.target.value)}
            className="px-3.5 py-2 bg-white border border-slate-300 rounded-lg text-xs font-semibold text-slate-800 shadow-sm focus:outline-none"
          >
            {periods.map((p) => (
              <option key={p._id} value={p.periodCode}>
                {p.periodCode} ({p.status})
              </option>
            ))}
          </select>

          <button
            onClick={handleExportCSV}
            className="flex items-center gap-2 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold shadow transition"
          >
            <Download className="w-4 h-4" />
            Export CSV
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-slate-200 flex gap-4 text-xs font-semibold">
        <button
          onClick={() => setReportType('REGISTER')}
          className={`pb-3 border-b-2 transition ${
            reportType === 'REGISTER'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Payroll Register
        </button>
        <button
          onClick={() => setReportType('ATTENDANCE')}
          className={`pb-3 border-b-2 transition ${
            reportType === 'ATTENDANCE'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Attendance & Leave Input Audit
        </button>
        <button
          onClick={() => setReportType('OVERTIME')}
          className={`pb-3 border-b-2 transition ${
            reportType === 'OVERTIME'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Approved Overtime Log
        </button>
      </div>

      {/* Report Table Display */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        {reportType === 'REGISTER' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 uppercase font-semibold border-b border-slate-100">
                <tr>
                  <th className="px-5 py-3">Employee</th>
                  <th className="px-5 py-3 text-right">Gross Earnings</th>
                  <th className="px-5 py-3 text-right">Deductions</th>
                  <th className="px-5 py-3 text-right">Net Salary</th>
                  <th className="px-5 py-3">Currency</th>
                  <th className="px-5 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {results.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="text-center py-8 text-slate-400">
                      No calculated results available for {selectedPeriodCode}.
                    </td>
                  </tr>
                ) : (
                  results.map((r) => (
                    <tr key={r._id} className="hover:bg-slate-50/75 transition">
                      <td className="px-5 py-3 font-semibold text-slate-900">{r.employeeIdCode}</td>
                      <td className="px-5 py-3 text-right font-medium text-slate-900">${r.grossEarnings?.toFixed(2)}</td>
                      <td className="px-5 py-3 text-right font-medium text-rose-600">${r.totalDeductions?.toFixed(2)}</td>
                      <td className="px-5 py-3 text-right font-bold text-emerald-600">${r.netPay?.toFixed(2)}</td>
                      <td className="px-5 py-3 text-slate-500 font-mono">{r.currency}</td>
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
        )}

        {reportType === 'ATTENDANCE' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 uppercase font-semibold border-b border-slate-100">
                <tr>
                  <th className="px-5 py-3">Employee</th>
                  <th className="px-5 py-3 text-center">Scheduled</th>
                  <th className="px-5 py-3 text-center">Worked</th>
                  <th className="px-5 py-3 text-center">Absent</th>
                  <th className="px-5 py-3 text-center">Paid Leave</th>
                  <th className="px-5 py-3 text-center">Unpaid Leave</th>
                  <th className="px-5 py-3 text-center">Approved OT (Hrs)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {inputs.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="text-center py-8 text-slate-400">
                      No attendance inputs found for this period.
                    </td>
                  </tr>
                ) : (
                  inputs.map((inp) => (
                    <tr key={inp._id} className="hover:bg-slate-50/75 transition">
                      <td className="px-5 py-3 font-semibold text-slate-900">
                        <div>{inp.employeeSnapshot?.employeeName}</div>
                        <div className="text-[10px] text-slate-400 font-mono font-normal">{inp.employeeIdCode}</div>
                      </td>
                      <td className="px-5 py-3 text-center font-medium">{inp.attendanceSummary?.scheduledDays || 26}</td>
                      <td className="px-5 py-3 text-center text-emerald-600 font-semibold">{inp.attendanceSummary?.workedDays || 0}</td>
                      <td className="px-5 py-3 text-center text-slate-500">{inp.attendanceSummary?.absentDays || 0}</td>
                      <td className="px-5 py-3 text-center text-blue-600 font-medium">{inp.leaveSummary?.paidLeaveDays || 0}</td>
                      <td className="px-5 py-3 text-center text-rose-600 font-semibold">{inp.leaveSummary?.unpaidLeaveDays || 0}</td>
                      <td className="px-5 py-3 text-center text-indigo-700 font-bold">
                        {((inp.overtime?.approvedMinutes || 0) / 60).toFixed(1)}h
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {reportType === 'OVERTIME' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 uppercase font-semibold border-b border-slate-100">
                <tr>
                  <th className="px-5 py-3">Overtime ID</th>
                  <th className="px-5 py-3">Employee</th>
                  <th className="px-5 py-3">Date</th>
                  <th className="px-5 py-3 text-center">Candidate (Mins)</th>
                  <th className="px-5 py-3 text-center">Approved (Mins)</th>
                  <th className="px-5 py-3">Reason</th>
                  <th className="px-5 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {overtime.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="text-center py-8 text-slate-400">
                      No overtime records recorded.
                    </td>
                  </tr>
                ) : (
                  overtime.map((o) => (
                    <tr key={o._id} className="hover:bg-slate-50/75 transition">
                      <td className="px-5 py-3 font-mono text-slate-600 font-medium">{o.overtimeId}</td>
                      <td className="px-5 py-3 font-semibold text-slate-900">{o.employeeIdCode}</td>
                      <td className="px-5 py-3 text-slate-600">{new Date(o.date).toLocaleDateString()}</td>
                      <td className="px-5 py-3 text-center text-slate-500 font-medium">{o.candidateMinutes}m</td>
                      <td className="px-5 py-3 text-center font-bold text-indigo-700">{o.approvedMinutes}m</td>
                      <td className="px-5 py-3 text-slate-600">{o.reason}</td>
                      <td className="px-5 py-3">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            o.status === 'APPROVED'
                              ? 'bg-emerald-100 text-emerald-800'
                              : o.status === 'REJECTED'
                              ? 'bg-rose-100 text-rose-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {o.status}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default PayrollReportsPage;
