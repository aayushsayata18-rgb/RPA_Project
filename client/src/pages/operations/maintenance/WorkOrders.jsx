import React, { useState, useEffect } from 'react';
import {
  Wrench,
  Search,
  Filter,
  PlusCircle,
  Eye,
  Clock,
  UserCheck,
  Calendar,
  CheckCircle,
  Play,
  Pause,
  AlertTriangle,
  RotateCcw,
  Bot
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import maintenanceService from '../../../services/maintenanceService';
import { StatusBadge } from '../../../components/common/StatusBadge';
import { Modal } from '../../../components/common/Modal';

export const WorkOrders = () => {
  const navigate = useNavigate();

  const [workOrders, setWorkOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Filters
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');

  // Quick Action Modal: Assign Modal
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedWO, setSelectedWO] = useState(null);
  const [assignForm, setAssignForm] = useState({
    technicianId: '',
    vendorId: '',
    reason: ''
  });
  const [submittingAssign, setSubmittingAssign] = useState(false);

  // Quick Action Modal: Schedule Modal
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [scheduleForm, setScheduleForm] = useState({
    scheduledStart: '',
    scheduledEnd: ''
  });
  const [submittingSchedule, setSubmittingSchedule] = useState(false);

  const fetchWorkOrders = async () => {
    try {
      setLoading(true);
      const res = await maintenanceService.getWorkOrders({
        page,
        limit: 12,
        search,
        status: statusFilter,
        priority: priorityFilter,
        maintenanceType: typeFilter
      });
      setWorkOrders(res.data?.items || []);
      setTotal(res.data?.total || 0);
      setTotalPages(res.data?.totalPages || 1);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWorkOrders();
  }, [page, statusFilter, priorityFilter, typeFilter]);

  const handleStartWork = async (id) => {
    try {
      await maintenanceService.startWorkOrder(id);
      fetchWorkOrders();
    } catch (err) {
      alert(err.response?.data?.message || err.message || 'Failed to start work order');
    }
  };

  const handleAssignSubmit = async (e) => {
    e.preventDefault();
    if (!selectedWO) return;
    try {
      setSubmittingAssign(true);
      await maintenanceService.assignWorkOrder(selectedWO._id, assignForm);
      setShowAssignModal(false);
      fetchWorkOrders();
    } catch (err) {
      alert(err.response?.data?.message || err.message || 'Assignment failed');
    } finally {
      setSubmittingAssign(false);
    }
  };

  const handleScheduleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedWO) return;
    try {
      setSubmittingSchedule(true);
      await maintenanceService.scheduleWorkOrder(selectedWO._id, scheduleForm);
      setShowScheduleModal(false);
      fetchWorkOrders();
    } catch (err) {
      alert(err.response?.data?.message || err.message || 'Scheduling failed');
    } finally {
      setSubmittingSchedule(false);
    }
  };

  const handleExportCmms = async (id) => {
    try {
      const res = await maintenanceService.exportWorkOrderToCmms(id);
      alert(`Exported to external CMMS: ${res.data?.data?.externalWorkOrderId}`);
      fetchWorkOrders();
    } catch (err) {
      alert(err.response?.data?.message || err.message || 'CMMS export failed');
    }
  };

  return (
    <div className="work-orders-page p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b pb-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Wrench className="w-6 h-6 text-indigo-600" />
            Maintenance Work Orders Console
          </h1>
          <p className="text-sm text-gray-500">
            Dispatch, assignment, technician execution, verification, and closure lifecycle
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            to="/operations/maintenance/calendar"
            className="flex items-center gap-2 px-3.5 py-2 text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors"
          >
            <Calendar className="w-4 h-4" />
            Calendar Grid
          </Link>

          <Link
            to="/operations/maintenance/requests"
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium shadow-sm transition-colors"
          >
            <PlusCircle className="w-4 h-4" />
            Create Work Order
          </Link>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex flex-wrap gap-4 items-center justify-between">
        <div className="flex items-center gap-2 flex-1 min-w-[260px]">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
            <input
              type="text"
              placeholder="Search by WO#, equipment, instructions, or external CMMS ID..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') { setPage(1); fetchWorkOrders(); } }}
              className="w-full pl-9 pr-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <button
            onClick={() => { setPage(1); fetchWorkOrders(); }}
            className="px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-medium rounded-lg"
          >
            Search
          </button>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <select
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
            className="px-3 py-2 border rounded-lg text-sm bg-white"
          >
            <option value="">All Statuses</option>
            <option value="OPEN">OPEN</option>
            <option value="ASSIGNED">ASSIGNED</option>
            <option value="SCHEDULED">SCHEDULED</option>
            <option value="IN_PROGRESS">IN PROGRESS</option>
            <option value="ON_HOLD">ON HOLD</option>
            <option value="WAITING_FOR_PARTS">WAITING FOR PARTS</option>
            <option value="COMPLETED">COMPLETED</option>
            <option value="PENDING_VERIFICATION">PENDING VERIFICATION</option>
            <option value="VERIFIED">VERIFIED</option>
            <option value="CLOSED">CLOSED</option>
            <option value="REOPENED">REOPENED</option>
          </select>

          <select
            value={typeFilter}
            onChange={(e) => { setTypeFilter(e.target.value); setPage(1); }}
            className="px-3 py-2 border rounded-lg text-sm bg-white"
          >
            <option value="">All Types</option>
            <option value="CORRECTIVE">Corrective</option>
            <option value="PREVENTIVE">Preventive</option>
            <option value="BREAKDOWN">Breakdown</option>
            <option value="EMERGENCY">Emergency</option>
            <option value="INSPECTION">Inspection</option>
          </select>

          <select
            value={priorityFilter}
            onChange={(e) => { setPriorityFilter(e.target.value); setPage(1); }}
            className="px-3 py-2 border rounded-lg text-sm bg-white"
          >
            <option value="">All Priorities</option>
            <option value="LOW">Low</option>
            <option value="MEDIUM">Medium</option>
            <option value="HIGH">High</option>
            <option value="URGENT">Urgent</option>
            <option value="CRITICAL">Critical</option>
          </select>

          <button
            onClick={() => { setSearch(''); setStatusFilter(''); setTypeFilter(''); setPriorityFilter(''); setPage(1); }}
            className="px-3 py-2 text-sm text-gray-500 hover:text-gray-700"
          >
            Reset
          </button>
        </div>
      </div>

      {/* Work Orders Table */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="bg-gray-50 border-b text-xs font-semibold uppercase tracking-wider text-gray-500">
                <th className="py-3 px-4">WO Number</th>
                <th className="py-3 px-4">Equipment / Asset</th>
                <th className="py-3 px-4">Type & Priority</th>
                <th className="py-3 px-4">Assigned To</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">SLA / Downtime</th>
                <th className="py-3 px-4 text-right">Quick Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-gray-400">Loading work orders...</td>
                </tr>
              ) : workOrders.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-gray-400">No work orders found matching filters.</td>
                </tr>
              ) : (
                workOrders.map((wo) => (
                  <tr key={wo._id} className="hover:bg-indigo-50/20 transition-colors">
                    <td className="py-3 px-4">
                      <div className="font-mono text-xs font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded inline-block">
                        {wo.workOrderId}
                      </div>
                      {wo.externalWorkOrderId && (
                        <div className="text-[10px] text-gray-400 font-mono mt-0.5">
                          Ext: {wo.externalWorkOrderId}
                        </div>
                      )}
                    </td>

                    <td className="py-3 px-4">
                      <div className="font-semibold text-gray-900">{wo.assetId?.name || 'N/A'}</div>
                      <div className="text-xs text-gray-500 font-mono">{wo.assetId?.assetTag}</div>
                    </td>

                    <td className="py-3 px-4">
                      <div className="text-xs font-semibold text-gray-700">{wo.maintenanceType}</div>
                      <span className={`text-[11px] px-1.5 py-0.2 rounded font-bold ${
                        wo.priority === 'CRITICAL' ? 'bg-red-100 text-red-700' :
                        wo.priority === 'HIGH' ? 'bg-orange-100 text-orange-700' :
                        'bg-gray-100 text-gray-700'
                      }`}>
                        {wo.priority}
                      </span>
                    </td>

                    <td className="py-3 px-4 text-xs">
                      {wo.assignedTechnicianId ? (
                        <div className="font-medium text-gray-800">
                          {wo.assignedTechnicianId.firstName} {wo.assignedTechnicianId.lastName}
                        </div>
                      ) : wo.assignedVendorId ? (
                        <div className="font-medium text-blue-700">Vendor: {wo.assignedVendorId.name}</div>
                      ) : (
                        <span className="text-gray-400 italic">Unassigned</span>
                      )}
                    </td>

                    <td className="py-3 px-4">
                      <StatusBadge status={wo.status} />
                    </td>

                    <td className="py-3 px-4 text-xs">
                      <div className="flex items-center gap-1.5">
                        <span className={`w-2 h-2 rounded-full ${
                          wo.slaStatus === 'BREACHED' ? 'bg-red-500' :
                          wo.slaStatus === 'COMPLETED' ? 'bg-emerald-500' :
                          wo.slaStatus === 'WITHIN_SLA' ? 'bg-blue-500' : 'bg-gray-300'
                        }`} />
                        <span>{wo.slaStatus.replace(/_/g, ' ')}</span>
                      </div>
                      {wo.downtimeDurationMinutes > 0 && (
                        <div className="text-[11px] text-gray-400 font-mono">
                          Downtime: {wo.downtimeDurationMinutes}m
                        </div>
                      )}
                    </td>

                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {wo.status === 'OPEN' && (
                          <button
                            onClick={() => { setSelectedWO(wo); setShowAssignModal(true); }}
                            className="px-2 py-1 text-xs bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded font-medium"
                          >
                            Assign
                          </button>
                        )}

                        {(wo.status === 'ASSIGNED' || wo.status === 'SCHEDULED') && (
                          <button
                            onClick={() => handleStartWork(wo._id)}
                            className="inline-flex items-center gap-1 px-2 py-1 text-xs bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded font-medium"
                          >
                            <Play className="w-3 h-3" />
                            Start
                          </button>
                        )}

                        {!wo.externalWorkOrderId && (
                          <button
                            title="Export to CMMS via RPA"
                            onClick={() => handleExportCmms(wo._id)}
                            className="p-1 text-gray-400 hover:text-blue-600 rounded"
                          >
                            <Bot className="w-4 h-4" />
                          </button>
                        )}

                        <Link
                          to={`/operations/maintenance/work-orders/${wo._id}`}
                          className="inline-flex items-center gap-1 px-2.5 py-1 text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 rounded font-semibold"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          Console
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="p-4 border-t flex items-center justify-between text-xs text-gray-500">
          <span>Showing {workOrders.length} of {total} work orders</span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="px-3 py-1.5 border rounded hover:bg-gray-50 disabled:opacity-50"
            >
              Previous
            </button>
            <span>Page {page} of {totalPages}</span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className="px-3 py-1.5 border rounded hover:bg-gray-50 disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </div>
      </div>

      {/* Modal: Quick Assign Technician */}
      {showAssignModal && selectedWO && (
        <Modal
          title={`Assign Work Order: ${selectedWO.workOrderId}`}
          onClose={() => setShowAssignModal(false)}
        >
          <form onSubmit={handleAssignSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Assignment Type & Reason</label>
              <input
                type="text"
                placeholder="Reason for routing or special instructions"
                value={assignForm.reason}
                onChange={(e) => setAssignForm({ ...assignForm, reason: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg text-sm"
              />
            </div>

            <div>
              <p className="text-xs text-gray-500 mb-3">
                Select internal biomedical / facility technician or external authorized AMC vendor for equipment:
                <strong> {selectedWO.assetId?.name}</strong>.
              </p>
            </div>

            <div className="flex justify-end gap-3 pt-3 border-t">
              <button
                type="button"
                onClick={() => setShowAssignModal(false)}
                className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submittingAssign}
                className="px-4 py-2 text-sm bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg shadow-sm"
              >
                {submittingAssign ? 'Assigning...' : 'Confirm Assignment'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};

export default WorkOrders;
