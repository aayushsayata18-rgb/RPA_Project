import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BarChart3,
  TrendingUp,
  FileText,
  Activity,
  DollarSign,
  Users,
  Bot,
  Download,
  Play,
  Calendar,
  AlertTriangle,
  RotateCw,
  Search,
  ExternalLink,
  CheckCircle2,
  Clock
} from 'lucide-react';
import reportClientService from '../../../services/reportClientService';

export const ReportsHome = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [managementKpis, setManagementKpis] = useState(null);
  const [executions, setExecutions] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadHomeData();
  }, []);

  const loadHomeData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [dashRes, execRes] = await Promise.all([
        reportClientService.getManagementDashboard(),
        reportClientService.getExecutions({ limit: 8 })
      ]);
      setManagementKpis(dashRes.data?.data?.kpiSummary || null);
      setExecutions(execRes.data?.data || []);
    } catch (err) {
      console.error('Failed to load reports home data:', err);
      setError('Failed to fetch executive analytics. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async (executionId, format) => {
    try {
      await reportClientService.downloadReportFile(executionId, format);
    } catch (err) {
      alert('Failed to download report export.');
    }
  };

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <BarChart3 className="w-7 h-7 text-indigo-600" />
            Reports & Management Analytics Hub
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            Executive oversight, cross-module business intelligence, automated exports, and KPI surveillance.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={loadHomeData}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition"
          >
            <RotateCw className={`w-4 h-4 ${loading ? 'animate-spin text-indigo-600' : ''}`} />
            Refresh
          </button>
          <button
            onClick={() => navigate('/reports/catalog')}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium shadow-sm transition"
          >
            <Play className="w-4 h-4" />
            Run Standard Report
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Real-time Executive KPIs Banner */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Patient Influx</p>
            <h3 className="text-2xl font-bold text-gray-900 mt-1">
              {managementKpis ? managementKpis.totalPatients : '—'}
            </h3>
            <p className="text-xs text-indigo-600 mt-1 font-medium">
              +{managementKpis ? managementKpis.patientsRegisteredToday : 0} registered today
            </p>
          </div>
          <div className="w-12 h-12 bg-indigo-50 rounded-lg flex items-center justify-center text-indigo-600">
            <Activity className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Bed Occupancy</p>
            <h3 className="text-2xl font-bold text-gray-900 mt-1">
              {managementKpis ? `${managementKpis.bedOccupancyRate}%` : '—'}
            </h3>
            <p className="text-xs text-gray-500 mt-1">
              {managementKpis ? `${managementKpis.occupiedBeds} / ${managementKpis.totalBeds} Active Beds` : ''}
            </p>
          </div>
          <div className="w-12 h-12 bg-amber-50 rounded-lg flex items-center justify-center text-amber-600">
            <TrendingUp className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Total Revenue Billed</p>
            <h3 className="text-2xl font-bold text-gray-900 mt-1">
              ₹{managementKpis ? Number(managementKpis.totalBilledINR || 0).toLocaleString() : '—'}
            </h3>
            <p className="text-xs text-emerald-600 mt-1 font-medium">
              ₹{managementKpis ? Number(managementKpis.totalCollectedINR || 0).toLocaleString() : 0} collected
            </p>
          </div>
          <div className="w-12 h-12 bg-emerald-50 rounded-lg flex items-center justify-center text-emerald-600">
            <DollarSign className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">RPA Success Rate</p>
            <h3 className="text-2xl font-bold text-gray-900 mt-1">
              {managementKpis ? `${managementKpis.rpaSuccessRate}%` : '100%'}
            </h3>
            <p className="text-xs text-gray-500 mt-1 font-medium flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block"></span>
              Healthy Execution
            </p>
          </div>
          <div className="w-12 h-12 bg-purple-50 rounded-lg flex items-center justify-center text-purple-600">
            <Bot className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Executive Hub Quick Navigation */}
      <div>
        <h2 className="text-lg font-bold text-gray-900 mb-3">Executive Dashboards & Reporting Suites</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
          <div
            onClick={() => navigate('/reports/dashboard/management')}
            className="group cursor-pointer bg-white p-5 rounded-xl border border-gray-200 hover:border-indigo-400 hover:shadow-md transition duration-200"
          >
            <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-lg flex items-center justify-center mb-3 group-hover:scale-110 transition">
              <TrendingUp className="w-5 h-5" />
            </div>
            <h4 className="font-semibold text-gray-900 text-sm">Management Hub</h4>
            <p className="text-xs text-gray-500 mt-1">Executive summaries, cross-department trends & KPIs.</p>
          </div>

          <div
            onClick={() => navigate('/reports/dashboard/operations')}
            className="group cursor-pointer bg-white p-5 rounded-xl border border-gray-200 hover:border-blue-400 hover:shadow-md transition duration-200"
          >
            <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center mb-3 group-hover:scale-110 transition">
              <Activity className="w-5 h-5" />
            </div>
            <h4 className="font-semibold text-gray-900 text-sm">Operations Hub</h4>
            <p className="text-xs text-gray-500 mt-1">OPD queues, admissions, bed turnover & diagnostics.</p>
          </div>

          <div
            onClick={() => navigate('/reports/dashboard/finance')}
            className="group cursor-pointer bg-white p-5 rounded-xl border border-gray-200 hover:border-emerald-400 hover:shadow-md transition duration-200"
          >
            <div className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-lg flex items-center justify-center mb-3 group-hover:scale-110 transition">
              <DollarSign className="w-5 h-5" />
            </div>
            <h4 className="font-semibold text-gray-900 text-sm">Finance & Claims</h4>
            <p className="text-xs text-gray-500 mt-1">Billing, payment settlements, and insurance claims.</p>
          </div>

          <div
            onClick={() => navigate('/reports/dashboard/hr')}
            className="group cursor-pointer bg-white p-5 rounded-xl border border-gray-200 hover:border-amber-400 hover:shadow-md transition duration-200"
          >
            <div className="w-10 h-10 bg-amber-50 text-amber-600 rounded-lg flex items-center justify-center mb-3 group-hover:scale-110 transition">
              <Users className="w-5 h-5" />
            </div>
            <h4 className="font-semibold text-gray-900 text-sm">Workforce & HR</h4>
            <p className="text-xs text-gray-500 mt-1">Staff attendance, shifts, leave balances & duty rosters.</p>
          </div>

          <div
            onClick={() => navigate('/reports/dashboard/rpa')}
            className="group cursor-pointer bg-white p-5 rounded-xl border border-gray-200 hover:border-purple-400 hover:shadow-md transition duration-200"
          >
            <div className="w-10 h-10 bg-purple-50 text-purple-600 rounded-lg flex items-center justify-center mb-3 group-hover:scale-110 transition">
              <Bot className="w-5 h-5" />
            </div>
            <h4 className="font-semibold text-gray-900 text-sm">RPA Automation</h4>
            <p className="text-xs text-gray-500 mt-1">Bot execution metrics, exception counts & job runs.</p>
          </div>
        </div>
      </div>

      {/* Quick Launch Catalog Banner */}
      <div className="bg-gradient-to-r from-indigo-900 via-indigo-800 to-indigo-950 rounded-xl p-6 text-white shadow-sm flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-indigo-500/30 text-indigo-200 border border-indigo-400/30">
            24 Standard Reports Catalog
          </div>
          <h3 className="text-xl font-bold">Comprehensive Cross-Functional Hospital Intelligence</h3>
          <p className="text-indigo-200 text-sm max-w-2xl">
            Execute clinical audits, financial reconciliation, diagnostic efficiency reports, inventory stock valuations, and RPA bots audits with role-based masking and SHA-256 exports.
          </p>
        </div>
        <div className="flex items-center gap-3 flex-shrink-0">
          <button
            onClick={() => navigate('/reports/catalog')}
            className="px-5 py-2.5 bg-white text-indigo-900 font-semibold rounded-lg hover:bg-indigo-50 shadow-sm transition text-sm flex items-center gap-2"
          >
            <Search className="w-4 h-4" />
            Explore Report Catalog
          </button>
        </div>
      </div>

      {/* Recent Executions & Audits */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-gray-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-gray-500" />
            <h3 className="font-bold text-gray-900">Recent Report Executions & Downloads</h3>
          </div>
          <button
            onClick={() => navigate('/reports/catalog')}
            className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
          >
            Generate New Report <ExternalLink className="w-3.5 h-3.5" />
          </button>
        </div>

        {executions.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <FileText className="w-12 h-12 mx-auto text-gray-300 mb-3" />
            <p className="font-medium">No recent report executions found</p>
            <p className="text-sm mt-1">Generate a report from the catalog to see exports and logs here.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left font-semibold text-gray-600">Execution ID</th>
                  <th className="px-6 py-3 text-left font-semibold text-gray-600">Report Code</th>
                  <th className="px-6 py-3 text-left font-semibold text-gray-600">Format</th>
                  <th className="px-6 py-3 text-left font-semibold text-gray-600">Rows</th>
                  <th className="px-6 py-3 text-left font-semibold text-gray-600">Duration</th>
                  <th className="px-6 py-3 text-left font-semibold text-gray-600">Status</th>
                  <th className="px-6 py-3 text-left font-semibold text-gray-600">Executed At</th>
                  <th className="px-6 py-3 text-right font-semibold text-gray-600">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
                {executions.map((exec) => (
                  <tr key={exec._id || exec.executionId} className="hover:bg-gray-50/80 transition">
                    <td className="px-6 py-4 font-mono font-medium text-indigo-600">
                      {exec.executionId}
                    </td>
                    <td className="px-6 py-4 font-semibold text-gray-900">
                      {exec.reportCode}
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-2 py-0.5 text-xs font-semibold rounded bg-gray-100 text-gray-800">
                        {exec.outputFormat || 'CSV'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-gray-700">
                      {exec.rowCount !== undefined ? exec.rowCount : '—'}
                    </td>
                    <td className="px-6 py-4 text-gray-500 font-mono text-xs">
                      {exec.durationMs ? `${exec.durationMs}ms` : '—'}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                          exec.status === 'COMPLETED'
                            ? 'bg-emerald-50 text-emerald-700'
                            : exec.status === 'FAILED'
                            ? 'bg-red-50 text-red-700'
                            : 'bg-amber-50 text-amber-700'
                        }`}
                      >
                        {exec.status === 'COMPLETED' && <CheckCircle2 className="w-3 h-3" />}
                        {exec.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-gray-500 text-xs">
                      {new Date(exec.createdAt).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 text-right space-x-2">
                      <button
                        onClick={() => handleDownload(exec.executionId, 'csv')}
                        className="px-2.5 py-1 text-xs font-medium text-indigo-600 hover:text-indigo-800 border border-indigo-200 rounded hover:bg-indigo-50 transition inline-flex items-center gap-1"
                        title="Download CSV"
                      >
                        <Download className="w-3 h-3" /> CSV
                      </button>
                      <button
                        onClick={() => handleDownload(exec.executionId, 'pdf')}
                        className="px-2.5 py-1 text-xs font-medium text-emerald-600 hover:text-emerald-800 border border-emerald-200 rounded hover:bg-emerald-50 transition inline-flex items-center gap-1"
                        title="Download PDF"
                      >
                        <Download className="w-3 h-3" /> PDF
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default ReportsHome;
