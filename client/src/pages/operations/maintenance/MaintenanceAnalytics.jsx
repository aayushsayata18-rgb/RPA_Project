import React, { useState, useEffect } from 'react';
import {
  TrendingUp,
  Clock,
  DollarSign,
  Activity,
  ArrowLeft,
  RefreshCw,
  Cpu,
  ShieldCheck,
  AlertTriangle,
  BarChart3
} from 'lucide-react';
import { Link } from 'react-router-dom';
import maintenanceService from '../../../services/maintenanceService';

export const MaintenanceAnalytics = () => {
  const [metrics, setMetrics] = useState(null);
  const [costs, setCosts] = useState(null);
  const [downtime, setDowntime] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const [mRes, cRes, dRes] = await Promise.all([
        maintenanceService.getDashboardMetrics().catch(() => ({ data: { data: {} } })),
        maintenanceService.getCostAnalytics().catch(() => ({ data: { data: {} } })),
        maintenanceService.getDowntimeAnalytics().catch(() => ({ data: { data: {} } }))
      ]);
      setMetrics(mRes.data?.data || null);
      setCosts(cRes.data?.data || null);
      setDowntime(dRes.data?.data || null);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, []);

  return (
    <div className="maintenance-analytics-page p-6 space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b pb-4">
        <div>
          <div className="flex items-center gap-2">
            <Link to="/operations/maintenance" className="text-gray-400 hover:text-gray-600">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <TrendingUp className="w-6 h-6 text-pink-600" />
              Maintenance & Clinical Equipment Analytics
            </h1>
          </div>
          <p className="text-sm text-gray-500 ml-7">
            MTTR, MTBF, SLA performance, downtime impact, and financial cost distribution
          </p>
        </div>

        <button
          onClick={fetchAnalytics}
          className="flex items-center gap-1.5 px-3 py-2 border bg-white rounded-lg text-sm font-medium shadow-sm hover:bg-gray-50 text-gray-700"
        >
          <RefreshCw className="w-4 h-4" />
          Refresh Metrics
        </button>
      </div>

      {loading ? (
        <p className="text-sm text-gray-400 py-12 text-center">Loading maintenance analytics...</p>
      ) : (
        <>
          {/* Executive KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
              <div className="flex justify-between items-start">
                <div>
                  <span className="text-xs font-semibold text-gray-500 uppercase">Mean Time To Repair (MTTR)</span>
                  <h3 className="text-2xl font-bold text-gray-900 mt-1">{metrics?.kpis?.mttrHours || '0.0'} hrs</h3>
                </div>
                <div className="p-2.5 bg-blue-50 text-blue-600 rounded-lg">
                  <Clock className="w-5 h-5" />
                </div>
              </div>
              <p className="text-xs text-gray-400 mt-3">Average time from failure to repair completion</p>
            </div>

            <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
              <div className="flex justify-between items-start">
                <div>
                  <span className="text-xs font-semibold text-gray-500 uppercase">SLA Compliance Rate</span>
                  <h3 className="text-2xl font-bold text-emerald-600 mt-1">{metrics?.kpis?.slaComplianceRate || '100%'}</h3>
                </div>
                <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-lg">
                  <ShieldCheck className="w-5 h-5" />
                </div>
              </div>
              <p className="text-xs text-gray-400 mt-3">Work orders resolved within guaranteed time</p>
            </div>

            <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
              <div className="flex justify-between items-start">
                <div>
                  <span className="text-xs font-semibold text-gray-500 uppercase">Total Maintenance Spend</span>
                  <h3 className="text-2xl font-bold text-indigo-600 mt-1">₹{costs?.totalCost?.toLocaleString() || 0}</h3>
                </div>
                <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-lg">
                  <DollarSign className="w-5 h-5" />
                </div>
              </div>
              <p className="text-xs text-gray-400 mt-3">Incurred labor, parts, and external AMC fees</p>
            </div>

            <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
              <div className="flex justify-between items-start">
                <div>
                  <span className="text-xs font-semibold text-gray-500 uppercase">Operational Asset Ratio</span>
                  <h3 className="text-2xl font-bold text-purple-600 mt-1">
                    {metrics?.assets?.total > 0
                      ? `${Math.round((metrics.assets.active / metrics.assets.total) * 100)}%`
                      : '100%'}
                  </h3>
                </div>
                <div className="p-2.5 bg-purple-50 text-purple-600 rounded-lg">
                  <Cpu className="w-5 h-5" />
                </div>
              </div>
              <p className="text-xs text-gray-400 mt-3">Active assets vs total inventory</p>
            </div>
          </div>

          {/* 2-Column Analytics: Cost Distribution & Downtime Leaderboard */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Cost Breakdown */}
            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm space-y-4">
              <h3 className="text-base font-bold text-gray-900 flex items-center gap-2 border-b pb-3">
                <DollarSign className="w-5 h-5 text-emerald-600" />
                Expenditure Distribution
              </h3>

              <div className="space-y-3">
                {[
                  { label: 'Biomedical & Engineering Labor', value: costs?.breakdown?.laborCost || 0, color: 'bg-blue-600' },
                  { label: 'Spare Parts & Consumables', value: costs?.breakdown?.partsCost || 0, color: 'bg-amber-500' },
                  { label: 'External Vendor & AMC Fees', value: costs?.breakdown?.vendorCost || 0, color: 'bg-purple-600' },
                  { label: 'Facility & Ancillary Costs', value: costs?.breakdown?.otherCost || 0, color: 'bg-gray-400' }
                ].map((item, idx) => {
                  const pct = costs?.totalCost > 0 ? Math.round((item.value / costs.totalCost) * 100) : 0;
                  return (
                    <div key={idx} className="space-y-1">
                      <div className="flex justify-between text-xs font-semibold">
                        <span className="text-gray-700">{item.label}</span>
                        <span className="font-mono text-gray-900">₹{item.value?.toLocaleString()} ({pct}%)</span>
                      </div>
                      <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div className={`h-full ${item.color}`} style={{ width: `${pct}%` }}></div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Top Downtime Assets */}
            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm space-y-4">
              <h3 className="text-base font-bold text-gray-900 flex items-center gap-2 border-b pb-3">
                <AlertTriangle className="w-5 h-5 text-red-600" />
                Equipment Clinical Downtime Leaderboard
              </h3>

              <div className="space-y-3">
                {(!downtime?.topDowntimeWorkOrders || downtime.topDowntimeWorkOrders.length === 0) ? (
                  <p className="text-xs text-gray-400 py-6 text-center">No major equipment downtime logged.</p>
                ) : (
                  downtime.topDowntimeWorkOrders.map((d, idx) => (
                    <div key={idx} className="p-3 bg-gray-50 rounded-lg border flex items-center justify-between text-xs">
                      <div>
                        <div className="font-bold text-gray-900">{d.assetId?.name || 'Equipment'}</div>
                        <div className="text-gray-500 font-mono">{d.assetId?.assetTag} • WO: {d.workOrderId}</div>
                      </div>
                      <div className="text-right">
                        <div className="font-mono font-bold text-red-600">{d.downtimeDurationMinutes} minutes</div>
                        <div className="text-[10px] text-gray-400">{d.departmentId?.name || 'Ward'}</div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default MaintenanceAnalytics;
