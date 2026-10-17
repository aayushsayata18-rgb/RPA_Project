import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  Wrench,
  ArrowLeft,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Play,
  Pause,
  ShieldCheck,
  CheckSquare,
  Package,
  DollarSign,
  FileText,
  RotateCcw,
  Bot,
  UserCheck,
  XCircle
} from 'lucide-react';
import maintenanceService from '../../../services/maintenanceService';
import { StatusBadge } from '../../../components/common/StatusBadge';
import { Modal } from '../../../components/common/Modal';

export const WorkOrderDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [workOrder, setWorkOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  // Modals
  const [showPartModal, setShowPartModal] = useState(false);
  const [partForm, setPartForm] = useState({ partName: '', partNumber: '', quantityRequested: 1 });

  const [showHoldModal, setShowHoldModal] = useState(false);
  const [holdStatus, setHoldStatus] = useState('WAITING_FOR_PARTS');
  const [holdReason, setHoldReason] = useState('');

  const [showCompleteModal, setShowCompleteModal] = useState(false);
  const [completeForm, setCompleteForm] = useState({ completionNotes: '', laborCost: 0 });

  const [showVerifyModal, setShowVerifyModal] = useState(false);
  const [verifyNotes, setVerifyNotes] = useState('');

  const [showCloseModal, setShowCloseModal] = useState(false);
  const [returnStatus, setReturnStatus] = useState('ACTIVE');
  const [closeNotes, setCloseNotes] = useState('');

  const [showReopenModal, setShowReopenModal] = useState(false);
  const [reopenReason, setReopenReason] = useState('');

  // Checklist responses state
  const [checklistItems, setChecklistItems] = useState([]);

  const fetchWorkOrder = async () => {
    try {
      setLoading(true);
      const res = await maintenanceService.getWorkOrderById(id);
      const data = res.data?.data;
      setWorkOrder(data);

      if (data?.checklistResponses && data.checklistResponses.length > 0) {
        setChecklistItems(data.checklistResponses);
      } else if (data?.checklistId?.items) {
        setChecklistItems(
          data.checklistId.items.map((i) => ({
            itemId: i.itemId,
            description: i.description,
            result: 'PASS',
            notes: ''
          }))
        );
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWorkOrder();
  }, [id]);

  const handleStart = async () => {
    try {
      await maintenanceService.startWorkOrder(id);
      fetchWorkOrder();
    } catch (err) {
      alert(err.response?.data?.message || err.message || 'Failed to start');
    }
  };

  const handleHoldSubmit = async (e) => {
    e.preventDefault();
    try {
      await maintenanceService.holdWorkOrder(id, { status: holdStatus, holdReason });
      setShowHoldModal(false);
      fetchWorkOrder();
    } catch (err) {
      alert(err.response?.data?.message || err.message || 'Failed to hold');
    }
  };

  const handlePartSubmit = async (e) => {
    e.preventDefault();
    try {
      await maintenanceService.createPartRequest({ ...partForm, workOrderId: id });
      setShowPartModal(false);
      setPartForm({ partName: '', partNumber: '', quantityRequested: 1 });
      fetchWorkOrder();
    } catch (err) {
      alert(err.response?.data?.message || err.message || 'Part request failed');
    }
  };

  const handleCompleteSubmit = async (e) => {
    e.preventDefault();
    try {
      await maintenanceService.completeWorkOrder(id, {
        completionNotes: completeForm.completionNotes,
        checklistResponses: checklistItems,
        costBreakdown: { laborCost: Number(completeForm.laborCost) || 0 }
      });
      setShowCompleteModal(false);
      fetchWorkOrder();
    } catch (err) {
      alert(err.response?.data?.message || err.message || 'Completion failed');
    }
  };

  const handleVerifySubmit = async (verified) => {
    try {
      await maintenanceService.verifyWorkOrder(id, { verified, verificationNotes: verifyNotes });
      setShowVerifyModal(false);
      fetchWorkOrder();
    } catch (err) {
      alert(err.response?.data?.message || err.message || 'Verification failed');
    }
  };

  const handleCloseSubmit = async (e) => {
    e.preventDefault();
    try {
      await maintenanceService.closeWorkOrder(id, { returnAssetToStatus: returnStatus, notes: closeNotes });
      setShowCloseModal(false);
      fetchWorkOrder();
    } catch (err) {
      alert(err.response?.data?.message || err.message || 'Closure failed');
    }
  };

  const handleReopenSubmit = async (e) => {
    e.preventDefault();
    try {
      await maintenanceService.reopenWorkOrder(id, reopenReason);
      setShowReopenModal(false);
      fetchWorkOrder();
    } catch (err) {
      alert(err.response?.data?.message || err.message || 'Reopening failed');
    }
  };

  if (loading) {
    return <div className="p-8 text-center text-gray-500">Loading work order console...</div>;
  }

  if (!workOrder) {
    return <div className="p-8 text-center text-red-500">Work order not found.</div>;
  }

  return (
    <div className="work-order-details-page p-6 space-y-6">
      {/* Top Navigation */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <Link
          to="/operations/maintenance/work-orders"
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Work Orders
        </Link>

        {/* Dynamic Lifecycle Actions Bar */}
        <div className="flex items-center gap-2 flex-wrap">
          {(workOrder.status === 'ASSIGNED' || workOrder.status === 'SCHEDULED' || workOrder.status === 'ON_HOLD' || workOrder.status === 'WAITING_FOR_PARTS') && (
            <button
              onClick={handleStart}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-semibold shadow-sm transition-colors"
            >
              <Play className="w-4 h-4" />
              Start Work
            </button>
          )}

          {workOrder.status === 'IN_PROGRESS' && (
            <>
              <button
                onClick={() => setShowHoldModal(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-white rounded-lg text-sm font-medium shadow-sm transition-colors"
              >
                <Pause className="w-4 h-4" />
                Put On Hold
              </button>

              <button
                onClick={() => setShowPartModal(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium shadow-sm transition-colors"
              >
                <Package className="w-4 h-4" />
                Request Part
              </button>

              <button
                onClick={() => setShowCompleteModal(true)}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-semibold shadow-sm transition-colors"
              >
                <CheckCircle2 className="w-4 h-4" />
                Submit Completion
              </button>
            </>
          )}

          {workOrder.status === 'COMPLETED' && (
            <button
              onClick={() => setShowVerifyModal(true)}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-sm font-semibold shadow-sm transition-colors"
            >
              <ShieldCheck className="w-4 h-4" />
              Supervisor Verification
            </button>
          )}

          {workOrder.status === 'VERIFIED' && (
            <button
              onClick={() => setShowCloseModal(true)}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-sm font-semibold shadow-sm transition-colors"
            >
              <CheckCircle2 className="w-4 h-4" />
              Close Work Order & Release Asset
            </button>
          )}

          {workOrder.status === 'CLOSED' && (
            <button
              onClick={() => setShowReopenModal(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm font-medium"
            >
              <RotateCcw className="w-4 h-4" />
              Reopen
            </button>
          )}
        </div>
      </div>

      {/* Main WO Header Banner */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b pb-4">
          <div className="space-y-1">
            <div className="flex items-center gap-3">
              <span className="font-mono text-sm font-bold text-indigo-700 bg-indigo-50 px-2.5 py-1 rounded">
                {workOrder.workOrderId}
              </span>
              <h1 className="text-2xl font-bold text-gray-900">{workOrder.title || workOrder.description}</h1>
            </div>
            <p className="text-sm text-gray-500">
              Type: <strong className="text-gray-700">{workOrder.maintenanceType}</strong> • Created: {new Date(workOrder.createdAt).toLocaleString()}
            </p>
          </div>

          <div className="flex items-center gap-4">
            <div className="text-right">
              <span className="text-xs text-gray-400 block">Status</span>
              <StatusBadge status={workOrder.status} />
            </div>

            <div className="text-right pl-3 border-l">
              <span className="text-xs text-gray-400 block">Priority</span>
              <span className={`text-xs px-2.5 py-1 rounded font-bold ${
                workOrder.priority === 'CRITICAL' ? 'bg-red-100 text-red-700' :
                workOrder.priority === 'HIGH' ? 'bg-orange-100 text-orange-700' :
                'bg-gray-100 text-gray-700'
              }`}>
                {workOrder.priority}
              </span>
            </div>
          </div>
        </div>

        {/* Metadata Details Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 text-xs">
          <div>
            <span className="text-gray-400 block">Target Equipment</span>
            <Link
              to={`/operations/maintenance/assets/${workOrder.assetId?._id}`}
              className="font-bold text-blue-600 hover:underline block"
            >
              {workOrder.assetId?.name} ({workOrder.assetId?.assetTag})
            </Link>
          </div>

          <div>
            <span className="text-gray-400 block">Assigned Technician / Vendor</span>
            <span className="font-semibold text-gray-800">
              {workOrder.assignedTechnicianId?.firstName
                ? `${workOrder.assignedTechnicianId.firstName} ${workOrder.assignedTechnicianId.lastName}`
                : workOrder.assignedVendorId?.name || 'Unassigned'}
            </span>
          </div>

          <div>
            <span className="text-gray-400 block">Downtime Duration</span>
            <span className="font-mono font-bold text-red-600">
              {workOrder.downtimeDurationMinutes > 0 ? `${workOrder.downtimeDurationMinutes} minutes` : 'Active / None'}
            </span>
          </div>

          <div>
            <span className="text-gray-400 block">Recorded Total Cost</span>
            <span className="font-mono font-bold text-emerald-600">
              ₹{workOrder.actualCost || 0}
            </span>
          </div>
        </div>
      </div>

      {/* 2-Column Execution Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Checklist & Technician Task Area */}
        <div className="lg:col-span-2 space-y-6">
          {/* Instructions Box */}
          <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm space-y-2">
            <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
              <FileText className="w-4 h-4 text-blue-600" />
              Work Instructions & Problem Description
            </h3>
            <p className="text-sm text-gray-700 whitespace-pre-wrap">{workOrder.description}</p>
          </div>

          {/* Maintenance Checklist Card */}
          <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                <CheckSquare className="w-4 h-4 text-indigo-600" />
                Maintenance Safety & Inspection Checklist
              </h3>
              <span className="text-xs text-gray-500">
                {checklistItems.filter((i) => i.result === 'PASS').length} of {checklistItems.length} Passed
              </span>
            </div>

            {checklistItems.length === 0 ? (
              <p className="text-xs text-gray-400">No structured checklist items attached to this work order.</p>
            ) : (
              <div className="space-y-3">
                {checklistItems.map((item, idx) => (
                  <div
                    key={idx}
                    className="p-3 bg-gray-50 rounded-lg border flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                  >
                    <div className="text-xs">
                      <span className="font-bold text-gray-500 mr-2">[{item.itemId || idx + 1}]</span>
                      <span className="font-medium text-gray-800">{item.description}</span>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      {['PASS', 'FAIL', 'NOT_APPLICABLE'].map((res) => (
                        <button
                          key={res}
                          type="button"
                          onClick={() => {
                            const updated = [...checklistItems];
                            updated[idx].result = res;
                            setChecklistItems(updated);
                          }}
                          className={`px-2.5 py-1 text-xs rounded font-semibold transition-colors ${
                            item.result === res
                              ? res === 'PASS' ? 'bg-emerald-600 text-white' :
                                res === 'FAIL' ? 'bg-red-600 text-white' : 'bg-gray-700 text-white'
                              : 'bg-white border text-gray-600 hover:bg-gray-100'
                          }`}
                        >
                          {res === 'NOT_APPLICABLE' ? 'N/A' : res}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Spare Parts Requisition Card */}
          <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                <Package className="w-4 h-4 text-amber-600" />
                Spare Parts Requisition & Consumption
              </h3>
              {workOrder.status === 'IN_PROGRESS' && (
                <button
                  onClick={() => setShowPartModal(true)}
                  className="text-xs font-semibold text-blue-600 hover:text-blue-800"
                >
                  + Add Part
                </button>
              )}
            </div>

            {(!workOrder.parts || workOrder.parts.length === 0) ? (
              <p className="text-xs text-gray-400">No replacement parts logged for this repair.</p>
            ) : (
              <div className="space-y-2">
                {workOrder.parts.map((p) => (
                  <div key={p._id} className="p-3 bg-gray-50 rounded-lg border flex items-center justify-between text-xs">
                    <div>
                      <div className="font-bold text-gray-900">{p.partName}</div>
                      <div className="text-gray-500 font-mono">Code: {p.partNumber || 'N/A'} • Qty: {p.quantityRequested}</div>
                    </div>
                    <div className="text-right">
                      <StatusBadge status={p.status} />
                      <div className="font-mono font-bold text-gray-800 mt-1">₹{p.totalCost || 0}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Cost Summary, SLA & Verification */}
        <div className="space-y-6">
          {/* Cost Summary Box */}
          <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm space-y-3">
            <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2 border-b pb-2">
              <DollarSign className="w-4 h-4 text-emerald-600" />
              Maintenance Cost Ledger
            </h3>

            <div className="space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-gray-500">Labor Cost:</span>
                <span className="font-mono font-semibold">₹{workOrder.costBreakdown?.laborCost || 0}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Parts & Consumables:</span>
                <span className="font-mono font-semibold">₹{workOrder.costBreakdown?.partsCost || 0}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Vendor / Service Contract:</span>
                <span className="font-mono font-semibold">₹{workOrder.costBreakdown?.vendorCost || 0}</span>
              </div>
              <div className="flex justify-between border-t pt-2 text-sm font-bold">
                <span className="text-gray-900">Total Incurred:</span>
                <span className="font-mono text-emerald-600">₹{workOrder.actualCost || 0}</span>
              </div>
            </div>
          </div>

          {/* Verification Status Box */}
          <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm space-y-3">
            <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2 border-b pb-2">
              <ShieldCheck className="w-4 h-4 text-purple-600" />
              Supervisor Verification Gate
            </h3>

            <div className="text-xs space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-gray-500">Status:</span>
                <span className={`px-2 py-0.5 rounded font-bold ${
                  workOrder.verificationStatus === 'VERIFIED' ? 'bg-emerald-100 text-emerald-700' :
                  workOrder.verificationStatus === 'REJECTED' ? 'bg-red-100 text-red-700' :
                  'bg-amber-100 text-amber-700'
                }`}>
                  {workOrder.verificationStatus || 'PENDING'}
                </span>
              </div>

              {workOrder.verifiedBy && (
                <div className="text-gray-600">
                  Verified by: <strong>{workOrder.verifiedBy?.firstName} {workOrder.verifiedBy?.lastName}</strong> on {new Date(workOrder.verifiedAt).toLocaleDateString()}
                </div>
              )}

              {workOrder.verificationNotes && (
                <div className="p-2 bg-gray-50 border rounded text-[11px] text-gray-600">
                  Notes: {workOrder.verificationNotes}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Modal: Request Spare Part */}
      {showPartModal && (
        <Modal title="Request Spare Part from Inventory" onClose={() => setShowPartModal(false)}>
          <form onSubmit={handlePartSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Part Name *</label>
              <input
                type="text"
                required
                placeholder="e.g. O2 Cell Sensor"
                value={partForm.partName}
                onChange={(e) => setPartForm({ ...partForm, partName: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg text-sm"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Part / OEM Code</label>
                <input
                  type="text"
                  placeholder="e.g. 6872808"
                  value={partForm.partNumber}
                  onChange={(e) => setPartForm({ ...partForm, partNumber: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Quantity</label>
                <input
                  type="number"
                  min="1"
                  required
                  value={partForm.quantityRequested}
                  onChange={(e) => setPartForm({ ...partForm, quantityRequested: Number(e.target.value) })}
                  className="w-full px-3 py-2 border rounded-lg text-sm"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-3 border-t">
              <button
                type="button"
                onClick={() => setShowPartModal(false)}
                className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 text-sm bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg shadow-sm"
              >
                Submit Requisition
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Modal: Put on Hold */}
      {showHoldModal && (
        <Modal title="Place Work Order on Hold" onClose={() => setShowHoldModal(false)}>
          <form onSubmit={handleHoldSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Hold Reason Category</label>
              <select
                value={holdStatus}
                onChange={(e) => setHoldStatus(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg text-sm bg-white"
              >
                <option value="WAITING_FOR_PARTS">WAITING FOR PARTS</option>
                <option value="WAITING_FOR_VENDOR">WAITING FOR VENDOR</option>
                <option value="ON_HOLD">GENERAL OPERATIONAL HOLD</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Detailed Explanation *</label>
              <textarea
                rows={3}
                required
                placeholder="Reason work cannot proceed immediately..."
                value={holdReason}
                onChange={(e) => setHoldReason(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg text-sm"
              />
            </div>

            <div className="flex justify-end gap-3 pt-3 border-t">
              <button
                type="button"
                onClick={() => setShowHoldModal(false)}
                className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 text-sm bg-amber-600 hover:bg-amber-700 text-white font-medium rounded-lg shadow-sm"
              >
                Confirm Hold
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Modal: Submit Completion */}
      {showCompleteModal && (
        <Modal title="Complete Maintenance Activity" onClose={() => setShowCompleteModal(false)}>
          <form onSubmit={handleCompleteSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Completion Notes & Actions Done *</label>
              <textarea
                rows={3}
                required
                placeholder="Summarize diagnostics, repair work performed, and parts replaced..."
                value={completeForm.completionNotes}
                onChange={(e) => setCompleteForm({ ...completeForm, completionNotes: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Labor Cost (₹)</label>
              <input
                type="number"
                min="0"
                value={completeForm.laborCost}
                onChange={(e) => setCompleteForm({ ...completeForm, laborCost: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg text-sm"
              />
            </div>

            <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-800">
              <strong>Notice: </strong>
              Submitting completion will move this work order to <code>PENDING_VERIFICATION</code> and the asset will move to <code>PENDING_INSPECTION</code>.
            </div>

            <div className="flex justify-end gap-3 pt-3 border-t">
              <button
                type="button"
                onClick={() => setShowCompleteModal(false)}
                className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 text-sm bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg shadow-sm"
              >
                Submit Completion
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Modal: Supervisor Verification */}
      {showVerifyModal && (
        <Modal title="Supervisor Verification" onClose={() => setShowVerifyModal(false)}>
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Inspection Notes / Comments</label>
              <textarea
                rows={3}
                placeholder="Inspection results, electrical safety checks..."
                value={verifyNotes}
                onChange={(e) => setVerifyNotes(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg text-sm"
              />
            </div>

            <div className="flex justify-end gap-3 pt-3 border-t">
              <button
                type="button"
                onClick={() => handleVerifySubmit(false)}
                className="px-4 py-2 text-sm bg-red-100 hover:bg-red-200 text-red-700 font-medium rounded-lg"
              >
                Reject & Send Back
              </button>
              <button
                type="button"
                onClick={() => handleVerifySubmit(true)}
                className="px-4 py-2 text-sm bg-purple-600 hover:bg-purple-700 text-white font-medium rounded-lg shadow-sm"
              >
                Verify & Pass
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Modal: Close Work Order */}
      {showCloseModal && (
        <Modal title="Close Work Order & Release Equipment" onClose={() => setShowCloseModal(false)}>
          <form onSubmit={handleCloseSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Authorize Return Equipment Status *</label>
              <select
                value={returnStatus}
                onChange={(e) => setReturnStatus(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg text-sm bg-white"
              >
                <option value="ACTIVE">ACTIVE (Ready for clinical use)</option>
                <option value="AVAILABLE">AVAILABLE (Standby inventory)</option>
                <option value="OUT_OF_SERVICE">OUT OF SERVICE (Failed safety check)</option>
                <option value="PENDING_INSPECTION">PENDING INSPECTION (External inspection required)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Closure Notes</label>
              <textarea
                rows={2}
                placeholder="Final sign-off notes..."
                value={closeNotes}
                onChange={(e) => setCloseNotes(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg text-sm"
              />
            </div>

            <div className="flex justify-end gap-3 pt-3 border-t">
              <button
                type="button"
                onClick={() => setShowCloseModal(false)}
                className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 text-sm bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-lg shadow-sm"
              >
                Finalize Closure
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Modal: Reopen */}
      {showReopenModal && (
        <Modal title="Reopen Work Order" onClose={() => setShowReopenModal(false)}>
          <form onSubmit={handleReopenSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Reopen Reason *</label>
              <textarea
                rows={3}
                required
                placeholder="Explain why issue was not fully resolved..."
                value={reopenReason}
                onChange={(e) => setReopenReason(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg text-sm"
              />
            </div>

            <div className="flex justify-end gap-3 pt-3 border-t">
              <button
                type="button"
                onClick={() => setShowReopenModal(false)}
                className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 text-sm bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg shadow-sm"
              >
                Reopen Work Order
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};

export default WorkOrderDetails;
