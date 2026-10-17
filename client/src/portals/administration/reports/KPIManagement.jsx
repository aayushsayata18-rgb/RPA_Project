import React, { useState, useEffect } from 'react';
import { Target, RefreshCw, TrendingUp, TrendingDown, Minus, CheckCircle2, AlertTriangle, Layers } from 'lucide-react';
import reportClientService from '../../../services/reportClientService';
import { KPIWidget } from '../../../components/reports/KPIWidget';

export const KPIManagement = () => {
  const [kpis, setKpis] = useState([]);
  const [loading, setLoading] = useState(true);
  const [recalculating, setRecalculating] = useState(false);
  const [selectedKpi, setSelectedKpi] = useState(null);
  const [trendData, setTrendData] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchKPIs();
  }, []);

  const fetchKPIs = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await reportClientService.listKPIs();
      setKpis(res.data?.data || []);
      if (res.data?.data?.length > 0 && !selectedKpi) {
        loadTrend(res.data.data[0].kpiCode);
      }
    } catch (err) {
      setError('Failed to fetch KPI catalog.');
    } finally {
      setLoading(false);
    }
  };

  const handleRecalculate = async () => {
    setRecalculating(true);
    try {
      await reportClientService.calculateKPIs();
      await fetchKPIs();
    } catch (err) {
      alert('Failed to recalculate KPI snapshots.');
    } finally {
      setRecalculating(false);
    }
  };

  const loadTrend = async (code) => {
    setSelectedKpi(code);
    try {
      const res = await reportClientService.getKPITrend(code);
      setTrendData(res.data?.data || []);
    } catch (err) {
      console.warn('Failed to load KPI trend:', err);
    }
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Target className="w-7 h-7 text-indigo-600" />
            Enterprise KPI Management & Snapshot Engine
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            Authoritative KPI definitions, version control, and real-time operational calculations.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleRecalculate}
            disabled={recalculating || loading}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium shadow-sm transition disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${recalculating ? 'animate-spin' : ''}`} />
            Recalculate Snapshots
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm flex items-center gap-2">
          <AlertTriangle className="w-5 h-5" />
          <span>{error}</span>
        </div>
      )}

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((kpi) => (
          <KPIWidget
            key={kpi.kpiCode}
            title={kpi.name}
            value={
              kpi.unit === 'INR'
                ? `₹${Number(kpi.currentValue).toLocaleString()}`
                : kpi.unit === '%'
                ? `${kpi.currentValue}%`
                : kpi.currentValue
            }
            subtext={`v${kpi.version || 1} • ${kpi.category}`}
            trend={kpi.trend}
            onClick={() => loadTrend(kpi.kpiCode)}
            color={selectedKpi === kpi.kpiCode ? 'indigo' : 'blue'}
          />
        ))}
      </div>

      {/* KPI Definitions Table */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
          <h3 className="font-semibold text-gray-900 text-sm flex items-center gap-2">
            <Layers className="w-4 h-4 text-indigo-600" />
            Registered KPI Formula Definitions
          </h3>
          <span className="text-xs text-gray-500">{kpis.length} KPIs monitored</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-gray-600">
            <thead className="bg-gray-50 text-xs uppercase text-gray-700 font-semibold border-b border-gray-200">
              <tr>
                <th className="px-4 py-3">Code</th>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Category</th>
                <th className="px-4 py-3">Current Value</th>
                <th className="px-4 py-3">Unit</th>
                <th className="px-4 py-3">Formula Version</th>
                <th className="px-4 py-3">Last Computed</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {kpis.map((kpi) => (
                <tr key={kpi.kpiCode} className="hover:bg-indigo-50/30 transition">
                  <td className="px-4 py-3 font-mono font-medium text-indigo-600 text-xs">
                    {kpi.kpiCode}
                  </td>
                  <td className="px-4 py-3 font-semibold text-gray-900">{kpi.name}</td>
                  <td className="px-4 py-3">
                    <span className="text-xs px-2 py-0.5 bg-gray-100 text-gray-700 rounded-md font-medium">
                      {kpi.category}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-bold text-gray-900">
                    {kpi.currentValue !== undefined ? kpi.currentValue : '—'}
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-500">{kpi.unit || 'COUNT'}</td>
                  <td className="px-4 py-3 text-xs text-gray-600 font-medium">v{kpi.version || 1}</td>
                  <td className="px-4 py-3 text-xs text-gray-500">
                    {kpi.lastUpdated ? new Date(kpi.lastUpdated).toLocaleTimeString() : 'Recent'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default KPIManagement;
