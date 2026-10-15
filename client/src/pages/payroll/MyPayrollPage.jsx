import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  DollarSign,
  FileText,
  Calendar,
  Clock,
  HelpCircle,
  TrendingUp,
  Download,
  AlertCircle,
  Eye,
  ArrowRight
} from 'lucide-react';
import payrollService from '../../services/payrollService';

export const MyPayrollPage = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMyPayroll();
  }, []);

  const fetchMyPayroll = async () => {
    try {
      setLoading(true);
      const res = await payrollService.getMyPayroll();
      setData(res);
    } catch (err) {
      console.error('Failed to load my payroll profile:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="p-8 text-center text-slate-500 text-sm">
        Loading your personal payroll records...
      </div>
    );
  }

  const employee = data?.employee;
  const recentPayslips = data?.recentPayslips || [];
  const openQueries = data?.openQueries || [];
  const latestPayslip = recentPayslips[0] || null;

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 p-6 rounded-2xl text-white shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="text-xs uppercase font-bold tracking-wider text-indigo-300">Employee Self-Service</span>
          <h1 className="text-2xl font-bold tracking-tight mt-1">{employee?.name || 'My Payroll'}</h1>
          <p className="text-xs text-slate-300 mt-1">
            {employee?.designation} &bull; {employee?.department} &bull; ID: {employee?.employeeId}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            to="/my-payslips"
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold shadow transition"
          >
            <FileText className="w-4 h-4" />
            View All Payslips
          </Link>
          <Link
            to="/my-payroll/queries"
            className="flex items-center gap-2 px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-medium border border-slate-700 transition"
          >
            <HelpCircle className="w-4 h-4" />
            Raise Query
          </Link>
        </div>
      </div>

      {/* Latest Payslip Highlight */}
      {latestPayslip ? (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="p-2 bg-emerald-50 rounded-lg text-emerald-600">
                <DollarSign className="w-6 h-6" />
              </span>
              <div>
                <h2 className="text-base font-bold text-slate-900">Latest Processed Payslip</h2>
                <span className="text-xs text-slate-500">Period: {latestPayslip.periodCode} ({latestPayslip.payslipNumber})</span>
              </div>
            </div>
            <Link
              to={`/my-payslips?id=${latestPayslip._id}`}
              className="text-xs font-semibold text-indigo-600 hover:underline flex items-center gap-1"
            >
              Inspect Breakdown <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-4 bg-slate-50 rounded-xl border border-slate-100">
            <div>
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">Gross Earnings</span>
              <span className="text-xl font-bold text-slate-900 mt-1 block">
                ${latestPayslip.grossAmount?.toFixed(2)}
              </span>
            </div>
            <div>
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">Total Deductions</span>
              <span className="text-xl font-bold text-rose-600 mt-1 block">
                ${latestPayslip.deductionAmount?.toFixed(2)}
              </span>
            </div>
            <div>
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">Net Take-Home Pay</span>
              <span className="text-xl font-bold text-emerald-600 mt-1 block">
                ${latestPayslip.netAmount?.toFixed(2)}
              </span>
            </div>
          </div>

          {/* Attendance and Leave snapshot on payslip */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs text-slate-600 pt-2 border-t border-slate-100">
            <div>
              <span className="text-slate-400 block text-[10px] uppercase font-semibold">Worked Days</span>
              <span className="font-bold text-slate-800">{latestPayslip.attendanceSummary?.workedDays} days</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px] uppercase font-semibold">Paid Leave</span>
              <span className="font-bold text-blue-700">{latestPayslip.attendanceSummary?.paidLeaveDays || 0} days</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px] uppercase font-semibold">Approved Overtime</span>
              <span className="font-bold text-indigo-700">
                {((latestPayslip.attendanceSummary?.overtimeMinutes || 0) / 60).toFixed(1)} hrs
              </span>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px] uppercase font-semibold">Disbursed To</span>
              <span className="font-mono text-slate-800">{latestPayslip.bankDetailsMasked?.accountNumberMasked || 'Direct Deposit'}</span>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 text-center text-slate-400 text-sm">
          No published payslips on record yet.
        </div>
      )}

      {/* Two Column Layout: Recent Payslips & Open Queries */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Recent Payslips */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <h3 className="font-semibold text-slate-900 text-sm flex items-center gap-2">
              <Calendar className="w-4 h-4 text-indigo-600" />
              Past Payslips History
            </h3>
            <Link to="/my-payslips" className="text-xs text-indigo-600 hover:underline">
              View All
            </Link>
          </div>

          <div className="divide-y divide-slate-100 text-xs">
            {recentPayslips.length === 0 ? (
              <p className="text-slate-400 py-3 text-center">No previous payslips found.</p>
            ) : (
              recentPayslips.map((slip) => (
                <div key={slip._id} className="py-2.5 flex items-center justify-between">
                  <div>
                    <span className="font-semibold text-slate-900 block">{slip.periodCode}</span>
                    <span className="text-[10px] text-slate-400 font-mono">{slip.payslipNumber}</span>
                  </div>
                  <div className="text-right">
                    <span className="font-bold text-emerald-600 block">${slip.netAmount?.toFixed(2)}</span>
                    <span className="text-[10px] text-slate-400">{new Date(slip.generatedAt).toLocaleDateString()}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Open Queries */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <h3 className="font-semibold text-slate-900 text-sm flex items-center gap-2">
              <HelpCircle className="w-4 h-4 text-purple-600" />
              My Payroll Queries
            </h3>
            <Link to="/my-payroll/queries" className="text-xs text-indigo-600 hover:underline">
              New Ticket
            </Link>
          </div>

          <div className="divide-y divide-slate-100 text-xs">
            {openQueries.length === 0 ? (
              <p className="text-slate-400 py-3 text-center">No active queries or disputed tickets.</p>
            ) : (
              openQueries.map((q) => (
                <div key={q._id} className="py-2.5 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-slate-900">{q.subject}</span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800">
                      {q.status}
                    </span>
                  </div>
                  <p className="text-slate-500 text-[11px] line-clamp-1">{q.description}</p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MyPayrollPage;
