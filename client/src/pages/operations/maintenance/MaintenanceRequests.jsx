import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  FileText,
  Search,
  Filter,
  PlusCircle,
  CheckCircle,
  XCircle,
  Wrench,
  AlertTriangle,
  Clock,
  Layers,
  User,
  ArrowRight
} from 'lucide-react';
import maintenanceService from '../../../services/maintenanceService';
import { StatusBadge } from '../../../components/common/StatusBadge';
import { Modal } from '../../../components/common/Modal';

export const MaintenanceRequests = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Filters
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [issueTypeFilter, setIssueTypeFilter] = useState('');

  // New Request Modal State
  const [showNewModal, setShowNewModal] = useState(false);
  const [assetsList, setAssetsList] = useState([]);
  const [newForm, setNewForm] = useState({
    assetId: location.state?.defaultAssetId || '',
    title: '',
    description: '',
    issueType: 'BREAKDOWN',
    priority: 'HIGH'
  });
  const [submitting, setSubmitting] = useState(false);

  // Review / Work Order Generation Modal State
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [woForm, setWoForm] = useState({
    title: '',
    description: '',
    maintenanceType: 'CORRECTIVE',
    priority: 'HIGH',
    assignedTechnicianId: '',
    assignedVendorId: '',
    scheduledStart: '',
    estimatedCost: 0
  });
  const [processingAction, setProcessingAction] = useState(false);

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const res = await maintenanceService.getRequests({
        page,
        limit: 12,
        search,
        status: statusFilter,
        priority: priorityFilter,
        issueType: issueTypeFilter
      });
      setRequests(res.data?.items || []);
      setTotal(res.data?.total || 0);
      setTotalPages(res.data?.totalPages || 1);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const loadAssets = async () => {
    try {
      const res = await maintenanceService.getAssets({ limit: 100 });
      setAssetsList(res.data?.items || []);
    } catch (e) {}
  };

  useEffect(() => {
    loadAssets();
    if (location.state?.defaultAssetId) {
      setShowNewModal(true);
    }
  }, []);

  useEffect(() => {
    fetchRequests();
  }, [page, statusFilter, priorityFilter, issueTypeFilter]);

  const handleCreateRequest = async (e) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      await maintenanceService.createRequest(newForm);
      setShowNewModal(false);
      setNewForm({
        assetId: '',
        title: '',
        description: '',
        issueType: 'BREAKDOWN',
        priority: 'HIGH'
      });
      fetchRequests();
    } catch (err) {
      alert(err.response?.data?.message || err.message || 'Failed to submit request');
    } finally {
      setSubmitting(false);
    }
  };

  const openReviewModal = (req) => {
    setSelectedRequest(req);
    setWoForm({
      title: req.title,
      description: req.description,
      maintenanceType: req.issueType === 'BREAKDOWN' ? 'BREAKDOWN' : 'CORRECTIVE',
      priority: req.priority,
      assignedTechnicianId: '',
      assignedVendorId: '',
      scheduledStart: '',
      estimatedCost: 0
    });
    setShowReviewModal(true);
  };

  const handleApproveOnly = async () => {
    if (!selectedRequest) return;
    try {
      setProcessingAction(true);
      await maintenanceService.approveRequest(selectedRequest._id, { notes: 'Approved by supervisor' });
      setShowReviewModal(false);
      fetchRequests();
    } catch (err) {
      alert(err.response?.data?.message || err.message || 'Approval failed');
    } finally {
      setProcessingAction(false);
    }
  };

  const handleReject = async () => {
    if (!selectedRequest) return;
    const reason = prompt('Specify rejection reason:');
    if (!reason) return;
    try {
      setProcessingAction(true);
      await maintenanceService.rejectRequest(selectedRequest._id, { reason });
      setShowReviewModal(false);
      fetchRequests();
    } catch (err) {
      alert(err.response?.data?.message || err.message || 'Rejection failed');
    } finally {
      setProcessingAction(false);
    }
  };

  const handleCreateWorkOrder = async (e) => {
    e.preventDefault();
    if (!selectedRequest) return;
    try {
      setProcessingAction(true);
      const res = await maintenanceService.createWorkOrderFromRequest(selectedRequest._id, woForm);
      setShowReviewModal(false);
      fetchRequests();
      navigate(`/operations/maintenance/work-orders/${res.data?.data?._id}`);
    } catch (err) {
      alert(err.response?.data?.message || err.message || 'Failed to create work order');
    } finally {
      setProcessingAction(false);
    }
  };

  return (
    <div className="requests-page p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b pb-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <FileText className="w-6 h-6 text-orange-600" />
            Maintenance Requests Queue
          </h1>
          <p className="text-sm text-gray-500">
            Intake, clinical breakdown reports, supervisor triage, and conversion to work orders
          </p>
        </div>

        <button
          onClick={() => setShowNewModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg text-sm font-medium shadow-sm transition-colors"
        >
          <PlusCircle className="w-4 h-4" />
          Submit Maintenance Request
        </button>
      </div>

      {/* Filters Bar */}
      <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex flex-wrap gap-4 items-center justify-between">
        <div className="flex items-center gap-2 flex-1 min-w-[260px]">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
            <input
              type="text"
              placeholder="Search by request ID, title, description..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') { setPage(1); fetchRequests(); } }}
              className="w-full pl-9 pr-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
          </div>
          <button
            onClick={() => { setPage(1); fetchRequests(); }}
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
            <option value="SUBMITTED">SUBMITTED</option>
            <option value="UNDER_REVIEW">UNDER REVIEW</option>
            <option value="APPROVED">APPROVED</option>
            <option value="WORK_ORDER_CREATED">WORK ORDER CREATED</option>
            <option value="RESOLVED">RESOLVED</option>
            <option value="REJECTED">REJECTED</option>
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

          <select
            value={issueTypeFilter}
            onChange={(e) => { setIssueTypeFilter(e.target.value); setPage(1); }}
            className="px-3 py-2 border rounded-lg text-sm bg-white"
          >
            <option value="">All Issue Types</option>
            <option value="BREAKDOWN">Breakdown</option>
            <option value="MALFUNCTION">Malfunction</option>
            <option value="ELECTRICAL">Electrical</option>
            <option value="HVAC">HVAC</option>
            <option value="PLUMBING">Plumbing</option>
            <option value="SAFETY">Safety</option>
          </select>

          <button
            onClick={() => { setSearch(''); setStatusFilter(''); setPriorityFilter(''); setIssueTypeFilter(''); setPage(1); }}
            className="px-3 py-2 text-sm text-gray-500 hover:text-gray-700"
          >
            Reset
          </button>
        </div>
      </div>

      {/* Requests Table */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="bg-gray-50 border-b text-xs font-semibold uppercase tracking-wider text-gray-500">
                <th className="py-3 px-4">Request ID</th>
                <th className="py-3 px-4">Equipment / Asset</th>
                <th className="py-3 px-4">Title & Issue</th>
                <th className="py-3 px-4">Priority</th>
                <th className="py-3 px-4">Reported By</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-gray-400">Loading requests...</td>
                </tr>
              ) : requests.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-gray-400">No maintenance requests match current filters.</td>
                </tr>
              ) : (
                requests.map((req) => (
                  <tr key={req._id} className="hover:bg-orange-50/20 transition-colors">
                    <td className="py-3 px-4">
                      <div className="font-mono text-xs font-bold text-orange-700 bg-orange-50 px-2 py-0.5 rounded inline-block">
                        {req.requestId}
                      </div>
                      <div className="text-[11px] text-gray-400 mt-0.5">
                        {new Date(req.requestedAt || req.createdAt).toLocaleString()}
                      </div>
                    </td>

                    <td className="py-3 px-4">
                      <div className="font-semibold text-gray-900">{req.assetId?.name || 'Unknown Equipment'}</div>
                      <div className="text-xs text-gray-500 font-mono">{req.assetId?.assetTag}</div>
                    </td>

                    <td className="py-3 px-4">
                      <div className="font-medium text-gray-900">{req.title}</div>
                      <div className="text-xs text-gray-500 line-clamp-1">{req.description}</div>
                    </td>

                    <td className="py-3 px-4">
                      <span className={`text-xs px-2 py-0.5 rounded font-bold ${
                        req.priority === 'CRITICAL' ? 'bg-red-100 text-red-700' :
                        req.priority === 'HIGH' ? 'bg-orange-100 text-orange-700' :
                        'bg-gray-100 text-gray-700'
                      }`}>
                        {req.priority}
                      </span>
                    </td>

                    <td className="py-3 px-4 text-xs text-gray-600">
                      {req.requesterId?.firstName ? `${req.requesterId.firstName} ${req.requesterId.lastName}` : 'Staff'}
                      <div className="text-[11px] text-gray-400">{req.departmentId?.name || 'Hospital Ward'}</div>
                    </td>

                    <td className="py-3 px-4">
                      <StatusBadge status={req.status} />
                    </td>

                    <td className="py-3 px-4 text-right">
                      {req.status === 'WORK_ORDER_CREATED' && req.workOrderId ? (
                        <Link
                          to={`/operations/maintenance/work-orders/${req.workOrderId?._id || req.workOrderId}`}
                          className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-800 bg-blue-50 px-2.5 py-1.5 rounded"
                        >
                          <Wrench className="w-3.5 h-3.5" />
                          Work Order
                        </Link>
                      ) : req.status === 'SUBMITTED' || req.status === 'UNDER_REVIEW' || req.status === 'APPROVED' ? (
                        <button
                          onClick={() => openReviewModal(req)}
                          className="inline-flex items-center gap-1 text-xs font-semibold text-orange-700 bg-orange-100 hover:bg-orange-200 px-3 py-1.5 rounded transition-colors"
                        >
                          Triage & WO
                        </button>
                      ) : (
                        <span className="text-xs text-gray-400">—</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="p-4 border-t flex items-center justify-between text-xs text-gray-500">
          <span>Showing {requests.length} of {total} requests</span>
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

      {/* Modal: New Maintenance Request */}
      {showNewModal && (
        <Modal
          title="Create Maintenance Request"
          onClose={() => setShowNewModal(false)}
        >
          <form onSubmit={handleCreateRequest} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Target Equipment / Asset *</label>
              <select
                required
                value={newForm.assetId}
                onChange={(e) => setNewForm({ ...newForm, assetId: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg text-sm bg-white"
              >
                <option value="">-- Select Asset --</option>
                {assetsList.map((a) => (
                  <option key={a._id} value={a._id}>
                    {a.name} ({a.assetTag}) - [{a.criticality}]
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Request Title *</label>
              <input
                type="text"
                required
                placeholder="Brief summary of fault or observation"
                value={newForm.title}
                onChange={(e) => setNewForm({ ...newForm, title: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg text-sm"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Issue Type</label>
                <select
                  value={newForm.issueType}
                  onChange={(e) => setNewForm({ ...newForm, issueType: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg text-sm bg-white"
                >
                  <option value="BREAKDOWN">BREAKDOWN</option>
                  <option value="MALFUNCTION">MALFUNCTION</option>
                  <option value="DAMAGE">DAMAGE</option>
                  <option value="ELECTRICAL">ELECTRICAL</option>
                  <option value="HVAC">HVAC</option>
                  <option value="PLUMBING">PLUMBING</option>
                  <option value="SAFETY">SAFETY</option>
                  <option value="INSPECTION">INSPECTION</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Operational Priority</label>
                <select
                  value={newForm.priority}
                  onChange={(e) => setNewForm({ ...newForm, priority: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg text-sm bg-white"
                >
                  <option value="LOW">LOW</option>
                  <option value="MEDIUM">MEDIUM</option>
                  <option value="HIGH">HIGH</option>
                  <option value="URGENT">URGENT</option>
                  <option value="CRITICAL">CRITICAL</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Detailed Description *</label>
              <textarea
                rows={3}
                required
                placeholder="Explain the specific issue, error code, location, or circumstances..."
                value={newForm.description}
                onChange={(e) => setNewForm({ ...newForm, description: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg text-sm"
              />
            </div>

            <div className="flex justify-end gap-3 pt-3 border-t">
              <button
                type="button"
                onClick={() => setShowNewModal(false)}
                className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-4 py-2 text-sm bg-orange-600 hover:bg-orange-700 text-white font-medium rounded-lg shadow-sm"
              >
                {submitting ? 'Submitting...' : 'Submit Request'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Modal: Supervisor Triage & Convert to Work Order */}
      {showReviewModal && selectedRequest && (
        <Modal
          title={`Triage Request: ${selectedRequest.requestId}`}
          onClose={() => setShowReviewModal(false)}
        >
          <div className="space-y-4">
            <div className="p-3 bg-gray-50 border rounded-lg text-xs space-y-1">
              <div><strong>Asset:</strong> {selectedRequest.assetId?.name} ({selectedRequest.assetId?.assetTag})</div>
              <div><strong>Headline:</strong> {selectedRequest.title}</div>
              <div><strong>Description:</strong> {selectedRequest.description}</div>
              <div><strong>Priority:</strong> {selectedRequest.priority}</div>
            </div>

            <form onSubmit={handleCreateWorkOrder} className="space-y-3">
              <h4 className="text-xs font-bold uppercase text-gray-600 border-b pb-1">
                Generate Maintenance Work Order
              </h4>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Maintenance Type</label>
                  <select
                    value={woForm.maintenanceType}
                    onChange={(e) => setWoForm({ ...woForm, maintenanceType: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg text-xs bg-white"
                  >
                    <option value="CORRECTIVE">CORRECTIVE</option>
                    <option value="BREAKDOWN">BREAKDOWN</option>
                    <option value="EMERGENCY">EMERGENCY</option>
                    <option value="INSPECTION">INSPECTION</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Priority Override</label>
                  <select
                    value={woForm.priority}
                    onChange={(e) => setWoForm({ ...woForm, priority: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg text-xs bg-white"
                  >
                    <option value="LOW">LOW</option>
                    <option value="MEDIUM">MEDIUM</option>
                    <option value="HIGH">HIGH</option>
                    <option value="URGENT">URGENT</option>
                    <option value="CRITICAL">CRITICAL</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Work Order Instructions</label>
                <textarea
                  rows={2}
                  value={woForm.description}
                  onChange={(e) => setWoForm({ ...woForm, description: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg text-xs"
                />
              </div>

              <div className="flex items-center justify-between pt-3 border-t">
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={handleReject}
                    disabled={processingAction}
                    className="px-3 py-1.5 text-xs text-red-600 border border-red-300 hover:bg-red-50 rounded"
                  >
                    Reject
                  </button>
                  <button
                    type="button"
                    onClick={handleApproveOnly}
                    disabled={processingAction}
                    className="px-3 py-1.5 text-xs text-gray-700 border hover:bg-gray-50 rounded"
                  >
                    Approve Only
                  </button>
                </div>

                <button
                  type="submit"
                  disabled={processingAction}
                  className="px-4 py-2 text-xs bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg shadow-sm"
                >
                  {processingAction ? 'Processing...' : 'Create & Dispatch Work Order'}
                </button>
              </div>
            </form>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default MaintenanceRequests;
