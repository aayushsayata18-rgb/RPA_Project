import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  DollarSign,
  Calendar,
  Users,
  AlertTriangle,
  CheckCircle,
  Clock,
  FileText,
  ShieldCheck,
  TrendingUp,
  ArrowRight,
  RefreshCw,
  PlusCircle,
  HelpCircle
} from 'lucide-react';
import payrollService from '../../services/payrollService';

export const PayrollDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [periods, setPeriods] = useState([]);
  const [activePeriod, setActivePeriod] = useState(null);
  const [queries, setQueries] = useState([]);
  const [overtimeList, setOvertimeList] = useState([]);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [periodsRes, queriesRes, otRes] = await Promise.all([
        payrollService.getPeriods(),
        payrollService.getQueries({ status: 'OPEN' }),
        payrollService.getOvertimeRecords({ status: 'PENDING' })
      ]);

      const periodList = periodsRes?.periods || [];
      setPeriods(periodList);
      const current = periodList.find(p => ['OPEN', 'INPUT_COLLECTION', 'VALIDATION', 'PENDING_APPROVAL', 'APPROVED', 'PROCESSING'].includes(p.status)) || periodList[0] || null;
      setActivePeriod(current);
      setQueries(queriesRes?.queries || []);
      setOvertimeList(otRes?.records || []);
    } catch (err) {
      console.error('Failed to load payroll dashboard data:', err);
    } finally {
      setLoading(false);
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
      {/* Top Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 p-6 rounded-2xl text-white shadow-xl">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="p-2 bg-indigo-500/20 rounded-lg text-indigo-300 border border-indigo-500/30">
              <DollarSign className="w-6 h-6" />
            </span>
            <h1 className="text-2xl font-bold tracking-tight">Hospital Payroll Administration</h1>
          </div>
          <p className="text-slate-300 text-sm">
            Workforce reconciliation, overtime governance, segregation of duties & financial payroll support.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={fetchDashboardData}
            disabled={loading}
            className="flex items-center gap-2 px-3.5 py-2 bg-slate-800/80 hover:bg-slate-700 text-slate-200 rounded-lg text-sm font-medium border border-slate-700 transition"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          <Link
            to="/payroll/periods"
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-sm font-semibold shadow-md transition"
          >
            <PlusCircle className="w-4 h-4" />
            Manage Periods
          </Link>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Active Period Card */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm hover:shadow transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Active Period</span>
            <Calendar className="w-5 h-5 text-indigo-600" />
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-xl font-bold text-slate-900">{activePeriod?.periodCode || 'No Active Period'}</span>
          </div>
          <div className="mt-2 flex items-center justify-between text-xs">
            <span className="text-slate-500">{activePeriod ? getStatusBadge(activePeriod.status) : '—'}</span>
            <Link to={`/payroll/periods`} className="text-indigo-600 hover:text-indigo-800 font-medium">View &rarr;</Link>
          </div>
        </div>

        {/* Validated Employees Card */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm hover:shadow transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Employees Processed</span>
            <Users className="w-5 h-5 text-emerald-600" />
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-900">{activePeriod?.summary?.validCount || 0}</span>
            <span className="text-xs text-slate-500">/ {activePeriod?.summary?.totalEmployees || 0} eligible</span>
          </div>
          <div className="mt-2 text-xs text-slate-500">
            {activePeriod?.summary?.errorCount || 0} exceptions detected
          </div>
        </div>

        {/* Pending Approvals / Overtime Card */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm hover:shadow transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Pending Overtime</span>
            <Clock className="w-5 h-5 text-amber-500" />
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-900">{overtimeList.length}</span>
            <span className="text-xs text-slate-500">awaiting review</span>
          </div>
          <div className="mt-2 text-xs text-slate-500">
            Candidate hours require supervisor approval
          </div>
        </div>

        {/* Open Queries Card */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm hover:shadow transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Payroll Queries</span>
            <HelpCircle className="w-5 h-5 text-purple-600" />
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-900">{queries.length}</span>
            <span className="text-xs text-slate-500">open tickets</span>
          </div>
          <div className="mt-2 text-xs text-slate-500">
            Employee payslip & discrepancy disputes
          </div>
        </div>
      </div>

      {/* Quick Navigation Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <Link
          to="/payroll/review"
          className="group p-5 bg-white rounded-xl border border-slate-200 shadow-sm hover:border-indigo-400 hover:shadow-md transition flex flex-col justify-between"
        >
          <div className="space-y-2">
            <div className="w-10 h-10 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <h3 className="font-semibold text-slate-900 text-base">Payroll Review & Input Audit</h3>
            <p className="text-slate-600 text-xs leading-relaxed">
              Inspect worked days, approved leave, verified overtime minutes, and earnings before final authorization.
            </p>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center text-xs font-semibold text-indigo-600 group-hover:text-indigo-800">
            Open Review Table <ArrowRight className="w-3.5 h-3.5 ml-1" />
          </div>
        </Link>

        <Link
          to="/payroll/results"
          className="group p-5 bg-white rounded-xl border border-slate-200 shadow-sm hover:border-emerald-400 hover:shadow-md transition flex flex-col justify-between"
        >
          <div className="space-y-2">
            <div className="w-10 h-10 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white transition">
              <TrendingUp className="w-5 h-5" />
            </div>
            <h3 className="font-semibold text-slate-900 text-base">Processing & Reconciliation</h3>
            <p className="text-slate-600 text-xs leading-relaxed">
              Execute idempotent payroll runs, compare internal vs external payroll results, and publish payslips.
            </p>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center text-xs font-semibold text-emerald-600 group-hover:text-emerald-800">
            View Processing Center <ArrowRight className="w-3.5 h-3.5 ml-1" />
          </div>
        </Link>

        <Link
          to="/payroll/salary-config"
          className="group p-5 bg-white rounded-xl border border-slate-200 shadow-sm hover:border-purple-400 hover:shadow-md transition flex flex-col justify-between"
        >
          <div className="space-y-2">
            <div className="w-10 h-10 rounded-lg bg-purple-50 flex items-center justify-center text-purple-600 group-hover:bg-purple-600 group-hover:text-white transition">
              <FileText className="w-5 h-5" />
            </div>
            <h3 className="font-semibold text-slate-900 text-base">Salary Structures & Versioning</h3>
            <p className="text-slate-600 text-xs leading-relaxed">
              Configure components, manage base amounts, and track immutable salary assignment revisions.
            </p>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center text-xs font-semibold text-purple-600 group-hover:text-purple-800">
            Manage Salary Rules <ArrowRight className="w-3.5 h-3.5 ml-1" />
          </div>
        </Link>
      </div>

      {/* Recent Periods & Status Pipeline */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h2 className="font-semibold text-slate-900 text-base">Payroll Period Pipeline</h2>
            <p className="text-xs text-slate-500">Chronological history and lifecycle stage of hospital periods</p>
          </div>
          <Link to="/payroll/periods" className="text-xs font-semibold text-indigo-600 hover:underline">
            View All Periods
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 uppercase font-semibold border-b border-slate-100">
              <tr>
                <th className="px-5 py-3">Period Code</th>
                <th className="px-5 py-3">Date Range</th>
                <th className="px-5 py-3">Frequency</th>
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3">Valid / Total</th>
                <th className="px-5 py-3">Net Total</th>
                <th className="px-5 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {periods.length === 0 ? (
                <tr>
                  <td colSpan="7" className="text-center py-6 text-slate-400">
                    No payroll periods recorded. Click "Manage Periods" to open a period.
                  </td>
                </tr>
              ) : (
                periods.slice(0, 5).map((p) => (
                  <tr key={p._id} className="hover:bg-slate-50/75 transition">
                    <td className="px-5 py-3 font-semibold text-slate-900">{p.periodCode}</td>
                    <td className="px-5 py-3 text-slate-600">
                      {new Date(p.startDate).toLocaleDateString()} — {new Date(p.endDate).toLocaleDateString()}
                    </td>
                    <td className="px-5 py-3 font-medium">{p.frequency}</td>
                    <td className="px-5 py-3">{getStatusBadge(p.status)}</td>
                    <td className="px-5 py-3">
                      <span className="font-semibold text-emerald-600">{p.summary?.validCount || 0}</span>
                      <span className="text-slate-400"> / {p.summary?.totalEmployees || 0}</span>
                    </td>
                    <td className="px-5 py-3 font-semibold text-slate-900">
                      ${(p.summary?.netTotal || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </td>
                    <td className="px-5 py-3 text-right">
                      <Link
                        to={`/payroll/review?period=${p.periodCode}`}
                        className="px-2.5 py-1 text-xs font-medium text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50 rounded transition"
                      >
                        Inspect
                      </Link>
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

export default PayrollDashboard;
