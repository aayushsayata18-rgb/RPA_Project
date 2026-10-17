import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  TrendingUp,
  TrendingDown,
  Minus,
  Activity,
  DollarSign,
  Users,
  Bot,
  RotateCw,
  AlertTriangle,
  CheckCircle2,
  BellRing,
  ArrowRight,
  ShieldAlert,
  Calendar,
  Layers,
  FileSpreadsheet
} from 'lucide-react';
import reportClientService from '../../../../services/reportClientService';

const DASHBOARD_TABS = [
  { id: 'management', label: 'Executive Management', icon: TrendingUp },
  { id: 'operations', label: 'Operations & Clinical', icon: Activity },
  { id: 'finance', label: 'Finance & Claims', icon: DollarSign },
  { id: 'hr', label: 'Workforce & HR', icon: Users },
  { id: 'rpa', label: 'RPA Automation', icon: Bot }
];

export const ManagementDashboard = () => {
  const { type } = useParams();
  const navigate = useNavigate();

  const activeTab = type || 'management';
  const [data, setData] = useState(null);
  const [kpis, setKpis] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [calculating, setCalculating] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadDashboardData();
  }, [activeTab]);

  const loadDashboardData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [dashRes, kpiRes, alertRes] = await Promise.all([
        reportClientService.getDashboard(activeTab),
        reportClientService.listKPIs(),
        reportClientService.listAlerts()
      ]);
      setData(dashRes.data?.data || null);
      setKpis(kpiRes.data?.data || []);
      setAlerts(alertRes.data?.data || []);
    } catch (err) {
      console.error('Failed to load dashboard:', err);
      setError('Failed to fetch dashboard intelligence.');
    } finally {
      setLoading(false);
    }
  };

  const handleRecalculateKPIs = async () => {
    setCalculating(true);
    try {
      await reportClientService.calculateKPIs();
      await loadDashboardData();
    } catch (err) {
      alert('Failed to recalculate KPIs.');
    } finally {
      setCalculating(false);
    }
  };

  const handleAcknowledgeAlert = async (id) => {
    try {
      await reportClientService.acknowledgeAlert(id);
      await loadDashboardData();
    } catch (err) {
      alert('Failed to acknowledge alert.');
    }
  };

  const handleResolveAlert = async (id) => {
    const note = prompt('Enter resolution summary note:');
    if (!note) return;
    try {
      await reportClientService.resolveAlert(id, note);
      await loadDashboardData();
    } catch (err) {
      alert('Failed to resolve alert.');
    }
  };

  return (
    <div className="space-y-6 p-6">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <TrendingUp className="w-7 h-7 text-indigo-600" />
            Executive Departmental Dashboards
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            Real-time business intelligence, dynamic KPI snapshots, and predictive alerts.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleRecalculateKPIs}
            disabled={calculating}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold shadow-sm transition"
          >
            <RotateCw className={`w-3.5 h-3.5 ${calculating ? 'animate-spin' : ''}`} />
            Recalculate KPIs
          </button>
          <button
            onClick={loadDashboardData}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg text-xs font-medium text-gray-700 bg-white hover:bg-gray-50 transition"
          >
            <RotateCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-gray-200 overflow-x-auto">
        {DASHBOARD_TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => navigate(`/reports/dashboard/${tab.id}`)}
              className={`flex items-center gap-2 px-4 py-3 border-b-2 text-sm font-semibold whitespace-nowrap transition ${
                isActive
                  ? 'border-indigo-600 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Triggered Alerts Banner */}
      {alerts.some((a) => a.status === 'TRIGGERED') && (
        <div className="p-4 bg-amber-50 border border-amber-300 rounded-xl space-y-2">
          <div className="flex items-center gap-2 font-bold text-amber-900 text-sm">
            <BellRing className="w-5 h-5 text-amber-600 animate-pulse" />
            Critical Analytics Threshold Alerts Triggered
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-2">
            {alerts
              .filter((a) => a.status === 'TRIGGERED')
              .map((alert) => (
                <div
                  key={alert._id || alert.ruleId}
                  className="bg-white p-3 rounded-lg border border-amber-200 shadow-sm flex items-center justify-between"
                >
                  <div>
                    <span className="font-bold text-xs text-gray-900">{alert.metricCode}</span>
                    <p className="text-xs text-gray-500">
                      Threshold {alert.operator} {alert.threshold} | Current: <b className="text-amber-700">{alert.lastTriggeredValue}</b>
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => handleAcknowledgeAlert(alert._id)}
                      className="px-2 py-1 bg-amber-100 hover:bg-amber-200 text-amber-800 text-[11px] font-semibold rounded"
                    >
                      Acknowledge
                    </button>
                    <button
                      onClick={() => handleResolveAlert(alert._id)}
                      className="px-2 py-1 bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-semibold rounded"
                    >
                      Resolve
                    </button>
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* Standard KPI Cards Strip */}
      <div>
        <h2 className="text-base font-bold text-gray-900 mb-3">Enterprise Key Performance Indicators (KPIs)</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {kpis.map((kpi) => {
            const isUp = kpi.trend?.direction === 'UP';
            const isDown = kpi.trend?.direction === 'DOWN';
            return (
              <div
                key={kpi.kpiCode}
                className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between text-xs text-gray-500 font-semibold mb-1">
                    <span className="uppercase">{kpi.category}</span>
                    <span className="font-mono text-[10px] text-gray-400">{kpi.kpiCode}</span>
                  </div>
                  <h4 className="font-medium text-gray-800 text-sm truncate" title={kpi.name}>
                    {kpi.name}
                  </h4>
                  <div className="text-2xl font-bold text-gray-900 mt-2">
                    {kpi.unit === 'CURRENCY_INR' && '₹'}
                    {Number(kpi.currentValue || 0).toLocaleString()}
                    {kpi.unit === 'PERCENTAGE' && '%'}
                    {kpi.unit === 'RATING' && ' / 5.0'}
                  </div>
                </div>

                <div className="mt-3 pt-2 border-t border-gray-100 flex items-center justify-between text-xs">
                  <span className="text-gray-400">Target: {kpi.targetValue}</span>
                  <div
                    className={`inline-flex items-center gap-1 font-semibold ${
                      isUp ? 'text-emerald-600' : isDown ? 'text-red-500' : 'text-gray-500'
                    }`}
                  >
                    {isUp && <TrendingUp className="w-3.5 h-3.5" />}
                    {isDown && <TrendingDown className="w-3.5 h-3.5" />}
                    {!isUp && !isDown && <Minus className="w-3.5 h-3.5" />}
                    <span>{Math.abs(kpi.trend?.changePercent || 0)}%</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Tab Specific Content */}
      <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
        <h3 className="text-lg font-bold text-gray-900 mb-4 capitalize">
          {activeTab} Analytics Overview
        </h3>

        {loading ? (
          <div className="text-center py-12 text-gray-500">
            <RotateCw className="w-7 h-7 animate-spin mx-auto text-indigo-600 mb-2" />
            <p className="text-sm">Loading departmental intelligence...</p>
          </div>
        ) : !data ? (
          <div className="text-center py-12 text-gray-400 text-sm">
            No aggregated data available for this dashboard.
          </div>
        ) : (
          <div className="space-y-6">
            <pre className="bg-gray-50 p-4 rounded-xl border border-gray-200 text-xs font-mono text-gray-800 overflow-x-auto max-h-96">
              {JSON.stringify(data, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
};

export default ManagementDashboard;
