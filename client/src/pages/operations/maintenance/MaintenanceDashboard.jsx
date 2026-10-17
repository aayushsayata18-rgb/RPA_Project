import React, { useState, useEffect } from 'react';
import {
  Wrench,
  AlertTriangle,
  Clock,
  CheckCircle2,
  Calendar,
  Layers,
  ShieldCheck,
  RefreshCw,
  PlusCircle,
  ArrowRight,
  TrendingUp,
  Cpu,
  Package,
  FileText,
  Activity,
  AlertOctagon,
  Search
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import maintenanceService from '../../../services/maintenanceService';
import { StatusBadge } from '../../../components/common/StatusBadge';
import { Modal } from '../../../components/common/Modal';

export const MaintenanceDashboard = () => {
  const navigate = useNavigate();
  const [metrics, setMetrics] = useState({
    assets: { total: 0, active: 0, underMaintenance: 0, outOfService: 0, pendingInspection: 0 },
    requests: { open: 0 },
    workOrders: { open: 0, inProgress: 0, waitingForParts: 0, waitingForVendor: 0, pendingVerification: 0, overdue: 0, slaBreaches: 0 },
    preventive: { dueThisWeek: 0, overdue: 0 },
    exceptions: { open: 0, critical: 0 },
    kpis: { mttrHours: '0.0', slaComplianceRate: '100%' }
  });

  const [recentWorkOrders, setRecentWorkOrders] = useState([]);
  const [criticalAssets, setCriticalAssets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Quick Action: Report Breakdown Modal
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [allAssets, setAllAssets] = useState([]);
  const [requestForm, setRequestForm] = useState({
    assetId: '',
    title: '',
    description: '',
    issueType: 'BREAKDOWN',
    priority: 'HIGH'
  });
  const [submittingReq, setSubmittingReq] = useState(false);

  const fetchDashboardData = async () => {
    try {
      setRefreshing(true);
      const [dashRes, woRes, astRes] = await Promise.all([
        maintenanceService.getDashboardMetrics().catch(() => ({ data: { data: {} } })),
        maintenanceService.getWorkOrders({ limit: 6, sort: '-createdAt' }).catch(() => ({ data: { items: [] } })),
        maintenanceService.getAssets({ limit: 6, status: 'UNDER_MAINTENANCE' }).catch(() => ({ data: { items: [] } }))
      ]);

      if (dashRes.data?.data) {
        setMetrics(dashRes.data.data);
      }
      setRecentWorkOrders(woRes.data?.items || []);
      setCriticalAssets(astRes.data?.items || []);
    } catch (err) {
      console.error('Failed to load maintenance dashboard:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const openBreakdownModal = async () => {
    try {
      const res = await maintenanceService.getAssets({ limit: 100 });
      setAllAssets(res.data?.items || []);
      setShowRequestModal(true);
    } catch (e) {
      console.error(e);
    }
  };

  const handleSubmitRequest = async (e) => {
    e.preventDefault();
    if (!requestForm.assetId || !requestForm.title) return;
    try {
      setSubmittingReq(true);
      await maintenanceService.createRequest(requestForm);
      setShowRequestModal(false);
      setRequestForm({ assetId: '', title: '', description: '', issueType: 'BREAKDOWN', priority: 'HIGH' });
      fetchDashboardData();
    } catch (err) {
      alert(err.response?.data?.message || err.message || 'Failed to submit maintenance request');
    } finally {
      setSubmittingReq(false);
    }
  };

  return (
    <div className="maintenance-dashboard p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b pb-4">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 text-blue-700 rounded-lg">
              <Wrench className="w-7 h-7" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-gray-900">
                Hospital Maintenance Operations Hub
              </h1>
              <p className="text-sm text-gray-500">
                Asset Master, Breakdown Reporting, Work Orders, Preventive Schedules & Biomedical SLA
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchDashboardData}
            disabled={refreshing}
            className="flex items-center gap-2 px-3 py-2 text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </button>

          <button
            onClick={openBreakdownModal}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium bg-red-600 hover:bg-red-700 text-white rounded-lg shadow-sm transition-colors"
          >
            <AlertTriangle className="w-4 h-4" />
            Report Breakdown
          </button>

          <Link
            to="/operations/maintenance/work-orders/new"
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow-sm transition-colors"
          >
            <PlusCircle className="w-4 h-4" />
            New Work Order
          </Link>
        </div>
      </div>

      {/* Critical Safety Notice Alert */}
      <div className="bg-amber-50 border-l-4 border-amber-500 p-4 rounded-r-lg flex items-start justify-between shadow-sm">
        <div className="flex items-start gap-3">
          <ShieldCheck className="w-5 h-5 text-amber-600 mt-0.5 shrink-0" />
          <div className="text-sm text-amber-800">
            <span className="font-semibold">Clinical & Engineering Safety Rule: </span>
            Completed work orders for critical medical equipment do not automatically declare assets ready for patient use.
            Authorized supervisor inspection and biomedical verification remain mandatory before changing status to Active.
          </div>
        </div>
        <Link
          to="/operations/maintenance/calibrations"
          className="text-xs font-semibold text-amber-900 hover:underline flex items-center gap-1 shrink-0 ml-4"
        >
          Check Calibrations <ArrowRight className="w-3 h-3" />
        </Link>
      </div>

      {/* Quick KPI Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Assets Stat */}
        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm hover:shadow transition-shadow">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">Asset Inventory</p>
              <h3 className="text-2xl font-bold text-gray-900 mt-1">{metrics.assets?.total || 0}</h3>
            </div>
            <div className="p-2.5 bg-blue-50 text-blue-600 rounded-lg">
              <Cpu className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4 flex items-center justify-between text-xs text-gray-500 border-t pt-3">
            <span className="text-emerald-600 font-medium">{metrics.assets?.active || 0} Active</span>
            <span className="text-amber-600 font-medium">{metrics.assets?.underMaintenance || 0} In Repair</span>
            <span className="text-red-600 font-medium">{metrics.assets?.outOfService || 0} OOS</span>
          </div>
        </div>

        {/* Work Orders Stat */}
        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm hover:shadow transition-shadow">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">Open Work Orders</p>
              <h3 className="text-2xl font-bold text-gray-900 mt-1">{metrics.workOrders?.open || 0}</h3>
            </div>
            <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-lg">
              <Wrench className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4 flex items-center justify-between text-xs text-gray-500 border-t pt-3">
            <span className="text-blue-600 font-medium">{metrics.workOrders?.inProgress || 0} In Progress</span>
            <span className="text-amber-600 font-medium">{metrics.workOrders?.waitingForParts || 0} Need Parts</span>
            <span className="text-purple-600 font-medium">{metrics.workOrders?.pendingVerification || 0} Verify</span>
          </div>
        </div>

        {/* Preventive Maintenance Stat */}
        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm hover:shadow transition-shadow">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">Preventive PM Due</p>
              <h3 className="text-2xl font-bold text-gray-900 mt-1">{metrics.preventive?.dueThisWeek || 0}</h3>
            </div>
            <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-lg">
              <Calendar className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4 flex items-center justify-between text-xs text-gray-500 border-t pt-3">
            <span className="text-emerald-700 font-medium">Due This Week: {metrics.preventive?.dueThisWeek || 0}</span>
            <span className="text-red-600 font-bold">Overdue: {metrics.preventive?.overdue || 0}</span>
          </div>
        </div>

        {/* SLA & MTTR Stat */}
        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm hover:shadow transition-shadow">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">SLA Compliance & MTTR</p>
              <h3 className="text-2xl font-bold text-gray-900 mt-1">{metrics.kpis?.slaComplianceRate || '100%'}</h3>
            </div>
            <div className="p-2.5 bg-violet-50 text-violet-600 rounded-lg">
              <Activity className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4 flex items-center justify-between text-xs text-gray-500 border-t pt-3">
            <span className="text-gray-600">MTTR: <strong className="text-gray-900">{metrics.kpis?.mttrHours || '0.0'} hrs</strong></span>
            <span className="text-red-600 font-medium">{metrics.workOrders?.slaBreaches || 0} Breaches</span>
          </div>
        </div>
      </div>

      {/* Quick Navigation Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
        {[
          { label: 'Asset Master', path: '/operations/maintenance/assets', icon: Cpu, color: 'text-blue-600 bg-blue-50' },
          { label: 'Requests', path: '/operations/maintenance/requests', icon: FileText, color: 'text-orange-600 bg-orange-50' },
          { label: 'Work Orders', path: '/operations/maintenance/work-orders', icon: Wrench, color: 'text-indigo-600 bg-indigo-50' },
          { label: 'PM Plans', path: '/operations/maintenance/preventive', icon: Calendar, color: 'text-emerald-600 bg-emerald-50' },
          { label: 'Calendar', path: '/operations/maintenance/calendar', icon: Clock, color: 'text-cyan-600 bg-cyan-50' },
          { label: 'Parts Requisition', path: '/operations/maintenance/parts', icon: Package, color: 'text-amber-600 bg-amber-50' },
          { label: 'Contracts / AMC', path: '/operations/maintenance/contracts', icon: ShieldCheck, color: 'text-violet-600 bg-violet-50' },
          { label: 'Calibrations', path: '/operations/maintenance/calibrations', icon: CheckCircle2, color: 'text-teal-600 bg-teal-50' },
          { label: 'Exceptions', path: '/operations/maintenance/exceptions', icon: AlertOctagon, color: 'text-red-600 bg-red-50' },
          { label: 'Checklists', path: '/operations/maintenance/checklists', icon: Layers, color: 'text-sky-600 bg-sky-50' },
          { label: 'Analytics & KPIs', path: '/operations/maintenance/analytics', icon: TrendingUp, color: 'text-pink-600 bg-pink-50' },
          { label: 'All Equipment', path: '/operations/maintenance/assets', icon: Search, color: 'text-gray-600 bg-gray-100' }
        ].map((item, idx) => (
          <Link
            key={idx}
            to={item.path}
            className="flex flex-col items-center justify-center p-3.5 bg-white border border-gray-200 rounded-xl hover:border-blue-400 hover:shadow-sm transition-all text-center group"
          >
            <div className={`p-2.5 rounded-lg mb-2 ${item.color} group-hover:scale-110 transition-transform`}>
              <item.icon className="w-5 h-5" />
            </div>
            <span className="text-xs font-semibold text-gray-800 group-hover:text-blue-600">{item.label}</span>
          </Link>
        ))}
      </div>

      {/* Main 2-column Grid: Recent Work Orders & Assets Under Maintenance */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Active Work Orders Queue */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
          <div className="flex items-center justify-between mb-4 pb-3 border-b">
            <div>
              <h2 className="text-base font-bold text-gray-900">Active Work Orders Queue</h2>
              <p className="text-xs text-gray-500">Live technician and vendor maintenance progress</p>
            </div>
            <Link
              to="/operations/maintenance/work-orders"
              className="text-xs font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-1"
            >
              View All <ArrowRight className="w-3 h-3" />
            </Link>
          </div>

          <div className="space-y-3">
            {recentWorkOrders.length === 0 ? (
              <p className="text-sm text-gray-400 py-6 text-center">No active work orders at this time.</p>
            ) : (
              recentWorkOrders.map((wo) => (
                <div
                  key={wo._id}
                  onClick={() => navigate(`/operations/maintenance/work-orders/${wo._id}`)}
                  className="p-3.5 border border-gray-100 rounded-lg hover:border-blue-200 hover:bg-blue-50/30 transition-all cursor-pointer flex items-center justify-between"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded">
                        {wo.workOrderId}
                      </span>
                      <span className="text-sm font-semibold text-gray-900 truncate max-w-[220px]">
                        {wo.title || wo.description}
                      </span>
                    </div>
                    <div className="text-xs text-gray-500 flex items-center gap-2">
                      <span>Asset: <strong>{wo.assetId?.name || 'N/A'}</strong></span>
                      <span>•</span>
                      <span>Type: {wo.maintenanceType}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <StatusBadge status={wo.status} />
                    <span className={`text-xs px-2 py-0.5 rounded font-semibold ${
                      wo.priority === 'CRITICAL' ? 'bg-red-100 text-red-700' :
                      wo.priority === 'HIGH' ? 'bg-orange-100 text-orange-700' :
                      'bg-gray-100 text-gray-700'
                    }`}>
                      {wo.priority}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Equipment Under Maintenance & Downtime Tracker */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
          <div className="flex items-center justify-between mb-4 pb-3 border-b">
            <div>
              <h2 className="text-base font-bold text-gray-900">Equipment in Repair / Downtime</h2>
              <p className="text-xs text-gray-500">Assets currently offline or requiring inspection</p>
            </div>
            <Link
              to="/operations/maintenance/assets"
              className="text-xs font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-1"
            >
              Asset Directory <ArrowRight className="w-3 h-3" />
            </Link>
          </div>

          <div className="space-y-3">
            {criticalAssets.length === 0 ? (
              <p className="text-sm text-gray-400 py-6 text-center">All maintainable assets are active & operational.</p>
            ) : (
              criticalAssets.map((ast) => (
                <div
                  key={ast._id}
                  onClick={() => navigate(`/operations/maintenance/assets/${ast._id}`)}
                  className="p-3.5 border border-gray-100 rounded-lg hover:border-red-200 hover:bg-red-50/30 transition-all cursor-pointer flex items-center justify-between"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-gray-700 bg-gray-100 px-2 py-0.5 rounded">
                        {ast.assetTag}
                      </span>
                      <span className="text-sm font-semibold text-gray-900">
                        {ast.name}
                      </span>
                    </div>
                    <div className="text-xs text-gray-500">
                      {ast.manufacturer} {ast.model ? `• ${ast.model}` : ''}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <StatusBadge status={ast.status} />
                    <span className="text-xs font-bold text-red-600 bg-red-50 px-2 py-0.5 rounded">
                      {ast.criticality}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Modal: Report Breakdown */}
      {showRequestModal && (
        <Modal
          title="Report Equipment Breakdown / Issue"
          onClose={() => setShowRequestModal(false)}
        >
          <form onSubmit={handleSubmitRequest} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Select Asset *</label>
              <select
                required
                value={requestForm.assetId}
                onChange={(e) => setRequestForm({ ...requestForm, assetId: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg text-sm bg-white"
              >
                <option value="">-- Choose Equipment --</option>
                {allAssets.map((a) => (
                  <option key={a._id} value={a._id}>
                    {a.name} ({a.assetTag}) - [{a.criticality}]
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Issue Headline / Title *</label>
              <input
                type="text"
                required
                placeholder="e.g. Suction pump loss of pressure"
                value={requestForm.title}
                onChange={(e) => setRequestForm({ ...requestForm, title: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg text-sm"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Issue Category</label>
                <select
                  value={requestForm.issueType}
                  onChange={(e) => setRequestForm({ ...requestForm, issueType: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg text-sm bg-white"
                >
                  <option value="BREAKDOWN">Breakdown</option>
                  <option value="MALFUNCTION">Malfunction</option>
                  <option value="DAMAGE">Physical Damage</option>
                  <option value="ELECTRICAL">Electrical Issue</option>
                  <option value="HVAC">HVAC / Cooling</option>
                  <option value="SAFETY">Safety Alarm</option>
                  <option value="INSPECTION">Inspection Needed</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Operational Priority</label>
                <select
                  value={requestForm.priority}
                  onChange={(e) => setRequestForm({ ...requestForm, priority: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg text-sm bg-white"
                >
                  <option value="LOW">Low</option>
                  <option value="MEDIUM">Medium</option>
                  <option value="HIGH">High</option>
                  <option value="URGENT">Urgent</option>
                  <option value="CRITICAL">Critical</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Detailed Description *</label>
              <textarea
                rows={3}
                required
                placeholder="Describe symptoms, alarms observed, error codes, and clinical impact..."
                value={requestForm.description}
                onChange={(e) => setRequestForm({ ...requestForm, description: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg text-sm"
              />
            </div>

            <div className="flex justify-end gap-3 pt-3 border-t">
              <button
                type="button"
                onClick={() => setShowRequestModal(false)}
                className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submittingReq}
                className="px-4 py-2 text-sm bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg shadow-sm"
              >
                {submittingReq ? 'Submitting...' : 'Submit Request'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};

export default MaintenanceDashboard;
