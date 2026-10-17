import React, { useState, useEffect } from 'react';
import { housekeepingService } from '../../../services/housekeepingService';
import {
  BarChart3,
  TrendingUp,
  ShieldCheck,
  BedDouble,
  RefreshCw,
  Users,
  CheckCircle,
  Clock,
  Sparkles
} from 'lucide-react';

export const HousekeepingAnalytics = () => {
  const [metrics, setMetrics] = useState(null);
  const [taskData, setTaskData] = useState(null);
  const [staffData, setStaffData] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [metricsRes, taskRes, staffRes] = await Promise.all([
        housekeepingService.getDashboardMetrics(),
        housekeepingService.getTaskAnalytics(),
        housekeepingService.getStaffAnalytics()
      ]);
      if (metricsRes.data?.data) setMetrics(metricsRes.data.data);
      if (taskRes.data?.data) setTaskData(taskRes.data.data);
      if (staffRes.data?.data) setStaffData(staffRes.data.data);
    } catch (err) {
      console.error('Failed to load housekeeping analytics:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-slate-900 border border-slate-800 p-6 rounded-2xl">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-pink-500/10 border border-pink-500/20 rounded-xl text-pink-400">
            <BarChart3 className="w-7 h-7" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight">Housekeeping Performance & Sanitation KPIs</h1>
            <p className="text-sm text-slate-400">
              Cleanliness audit metrics, bed turnaround times, SLA compliance, and workforce efficiency analytics.
            </p>
          </div>
        </div>

        <button
          onClick={fetchData}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-sm font-medium rounded-xl border border-slate-700 transition"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh Metrics
        </button>
      </div>

      {/* Top Level Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl space-y-1">
          <span className="text-xs font-semibold uppercase text-slate-400">Total Sanitation Tasks</span>
          <div className="text-3xl font-extrabold text-white">{metrics?.totalTasks || 0}</div>
          <span className="text-xs text-blue-400 flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5" /> All recorded tasks
          </span>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl space-y-1">
          <span className="text-xs font-semibold uppercase text-slate-400">Supervisor Audit Pass Rate</span>
          <div className="text-3xl font-extrabold text-emerald-400">{metrics?.inspectionPassRate || 100}%</div>
          <span className="text-xs text-emerald-300 flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5" /> Quality rating {metrics?.avgRating || '5.0'} / 5
          </span>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl space-y-1">
          <span className="text-xs font-semibold uppercase text-slate-400">Active Bed Turnovers</span>
          <div className="text-3xl font-extrabold text-white">{metrics?.totalTurnovers || 0}</div>
          <span className="text-xs text-amber-400 flex items-center gap-1">
            <BedDouble className="w-3.5 h-3.5" /> Synchronized with Bed Management
          </span>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl space-y-1">
          <span className="text-xs font-semibold uppercase text-slate-400">Open Exceptions</span>
          <div className="text-3xl font-extrabold text-rose-400">{metrics?.openExceptions || 0}</div>
          <span className="text-xs text-rose-300 flex items-center gap-1">
            <Clock className="w-3.5 h-3.5" /> Spills & supply shortages
          </span>
        </div>
      </div>

      {/* Analysis Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Tasks by Task Type */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
          <h3 className="font-bold text-white text-sm flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-blue-400" />
            Sanitation Distribution by Task Type
          </h3>
          <div className="space-y-3">
            {taskData?.tasksByType?.map((item, idx) => (
              <div key={idx} className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-300 font-medium">{item._id?.replace(/_/g, ' ')}</span>
                  <span className="font-bold text-white">{item.count} tasks</span>
                </div>
                <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-blue-500 rounded-full"
                    style={{ width: `${Math.min(100, item.count * 15)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Staff Workload Analytics */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
          <h3 className="font-bold text-white text-sm flex items-center gap-2">
            <Users className="w-4 h-4 text-emerald-400" />
            Housekeeping Workforce Load Distribution
          </h3>
          <div className="space-y-3">
            {staffData?.staffWorkload?.length === 0 ? (
              <p className="text-xs text-slate-500 py-6 text-center">No assigned staff tasks to display.</p>
            ) : (
              staffData?.staffWorkload?.map((st, idx) => (
                <div key={idx} className="p-3 bg-slate-800/60 border border-slate-800 rounded-xl flex justify-between items-center">
                  <div>
                    <div className="font-bold text-white text-xs">{st._id?.name || st._id?.userId || 'Staff'}</div>
                    <div className="text-[11px] text-slate-400">Total assigned: {st.totalAssigned}</div>
                  </div>
                  <div className="flex gap-2">
                    <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-blue-500/10 text-blue-400 border border-blue-500/20">
                      In Progress: {st.inProgress}
                    </span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                      Completed: {st.completed}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
