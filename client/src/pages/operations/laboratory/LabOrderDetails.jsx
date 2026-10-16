import React, { useState, useEffect } from 'react';
import { 
  useParams, 
  useNavigate 
} from 'react-router-dom';
import { 
  ArrowLeft, 
  ClipboardList, 
  User, 
  Stethoscope, 
  Calendar, 
  Clock, 
  FlaskConical, 
  FileText, 
  AlertTriangle, 
  CheckCircle2, 
  XCircle, 
  RefreshCw, 
  Send, 
  Download, 
  Printer,
  ChevronRight,
  ShieldCheck,
  Ban
} from 'lucide-react';
import { StatusBadge } from '../../../components/common/StatusBadge';
import { Modal } from '../../../components/common/Modal';
import laboratoryService from '../../../services/laboratoryService';

export const LabOrderDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [order, setOrder] = useState(null);
  const [samples, setSamples] = useState([]);
  const [results, setResults] = useState([]);
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [syncMessage, setSyncMessage] = useState(null);

  // Cancellation modal
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [cancelling, setCancelling] = useState(false);

  useEffect(() => {
    fetchOrderDetails();
  }, [id]);

  const fetchOrderDetails = async () => {
    try {
      setLoading(true);
      const res = await laboratoryService.getOrderById(id);
      if (res.success) {
        setOrder(res.data);
      }

      // Fetch related samples, results, reports
      const [sampleRes, resultRes, reportRes] = await Promise.allSettled([
        laboratoryService.listSamples({ labOrderId: id, limit: 50 }),
        // For results, we can filter or search by order if available
        laboratoryService.listReports({ labOrderId: id, limit: 10 })
      ]);

      if (sampleRes.status === 'fulfilled' && sampleRes.value?.success) {
        setSamples(sampleRes.value.data || []);
      }
      if (reportRes.status === 'fulfilled' && reportRes.value?.success) {
        setReports(reportRes.value.data || []);
      }
    } catch (err) {
      console.error('Failed to load lab order details:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSyncToExternalLis = async () => {
    try {
      setSyncing(true);
      setSyncMessage(null);
      const res = await laboratoryService.syncOrderToExternalLis({ labOrderId: order.labOrderId });
      if (res.success) {
        setSyncMessage({ type: 'success', text: `Synchronized with external LIS! External Order ID: ${res.data.externalOrderId}` });
        fetchOrderDetails();
      }
    } catch (err) {
      setSyncMessage({ type: 'error', text: err.response?.data?.message || 'External LIS synchronization failed.' });
    } finally {
      setSyncing(false);
    }
  };

  const handleCancelOrder = async (e) => {
    e.preventDefault();
    if (!cancelReason.trim()) return;

    try {
      setCancelling(true);
      const res = await laboratoryService.cancelOrder(order.labOrderId, cancelReason);
      if (res.success) {
        setShowCancelModal(false);
        setCancelReason('');
        fetchOrderDetails();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to cancel order.');
    } finally {
      setCancelling(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <RefreshCw className="h-8 w-8 animate-spin text-primary-600 mb-2" />
        <p className="text-gray-500">Loading order details...</p>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="card p-8 text-center max-w-lg mx-auto mt-8">
        <AlertTriangle className="h-12 w-12 text-amber-500 mx-auto mb-3" />
        <h2 className="text-xl font-bold text-gray-900 dark:text-white">Order Not Found</h2>
        <p className="text-gray-500 mt-1 mb-6">The laboratory order with ID {id} could not be found.</p>
        <button onClick={() => navigate('/operations/laboratory/orders')} className="btn btn-primary">
          Back to Orders
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Breadcrumb & Actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button 
            onClick={() => navigate('/operations/laboratory/orders')}
            className="btn btn-secondary btn-sm p-2"
            title="Back to Orders"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white font-mono">
                {order.labOrderId}
              </h1>
              <StatusBadge status={order.status} />
              <span className={`badge font-bold ${
                order.priority === 'STAT' ? 'badge-error animate-pulse' :
                order.priority === 'URGENT' ? 'badge-warning' : 'badge-info'
              }`}>
                {order.priority}
              </span>
            </div>
            <p className="text-xs text-gray-500">
              Ordered on {new Date(order.createdAt).toLocaleString()} • Type: {order.orderType}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button 
            onClick={fetchOrderDetails}
            className="btn btn-secondary btn-sm flex items-center gap-1.5"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            Refresh
          </button>

          {order.status !== 'CANCELLED' && order.status !== 'COMPLETED' && (
            <button
              onClick={handleSyncToExternalLis}
              disabled={syncing}
              className="btn btn-secondary btn-sm flex items-center gap-1.5"
            >
              <Send className={`h-3.5 w-3.5 ${syncing ? 'animate-spin' : ''}`} />
              {syncing ? 'Syncing...' : 'Sync to Ext LIS'}
            </button>
          )}

          {['ORDERED', 'DRAFT'].includes(order.status) && (
            <button
              onClick={() => setShowCancelModal(true)}
              className="btn btn-danger btn-sm flex items-center gap-1.5"
            >
              <Ban className="h-3.5 w-3.5" />
              Cancel Order
            </button>
          )}
        </div>
      </div>

      {/* Sync Status Banner */}
      {syncMessage && (
        <div className={`p-3 rounded-lg text-sm flex items-center gap-2 ${
          syncMessage.type === 'success' 
            ? 'bg-green-50 text-green-800 border border-green-200 dark:bg-green-950/30 dark:border-green-800' 
            : 'bg-red-50 text-red-800 border border-red-200 dark:bg-red-950/30 dark:border-red-800'
        }`}>
          {syncMessage.type === 'success' ? <CheckCircle2 className="h-4 w-4" /> : <AlertTriangle className="h-4 w-4" />}
          <span>{syncMessage.text}</span>
        </div>
      )}

      {/* Grid: Patient & Ordering Details */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Patient Card */}
        <div className="card p-5">
          <div className="flex items-center gap-2 font-semibold text-gray-900 dark:text-white border-b border-gray-100 dark:border-gray-800 pb-3 mb-3">
            <User className="h-5 w-5 text-primary-600" />
            Patient Information
          </div>
          <div className="space-y-2 text-sm">
            <div>
              <span className="text-gray-500 text-xs block">Full Name</span>
              <span className="font-semibold text-gray-900 dark:text-white">{order.patientName}</span>
            </div>
            <div>
              <span className="text-gray-500 text-xs block">Patient ID</span>
              <span className="font-mono text-gray-700 dark:text-gray-300">{order.patientId}</span>
            </div>
            <div>
              <span className="text-gray-500 text-xs block">Fasting Requirement</span>
              <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${
                order.fastingConfirmed ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'
              }`}>
                {order.fastingConfirmed ? 'Confirmed Fasting' : 'Not Required / Unconfirmed'}
              </span>
            </div>
          </div>
        </div>

        {/* Doctor Card */}
        <div className="card p-5">
          <div className="flex items-center gap-2 font-semibold text-gray-900 dark:text-white border-b border-gray-100 dark:border-gray-800 pb-3 mb-3">
            <Stethoscope className="h-5 w-5 text-indigo-600" />
            Ordering Physician
          </div>
          <div className="space-y-2 text-sm">
            <div>
              <span className="text-gray-500 text-xs block">Doctor Name</span>
              <span className="font-semibold text-gray-900 dark:text-white">{order.doctorName || 'Not specified'}</span>
            </div>
            <div>
              <span className="text-gray-500 text-xs block">Doctor ID</span>
              <span className="font-mono text-gray-700 dark:text-gray-300">{order.doctorId || 'N/A'}</span>
            </div>
            <div>
              <span className="text-gray-500 text-xs block">Order Category</span>
              <span className="font-medium text-gray-700 dark:text-gray-300">{order.orderType}</span>
            </div>
          </div>
        </div>

        {/* Clinical Notes Card */}
        <div className="card p-5">
          <div className="flex items-center gap-2 font-semibold text-gray-900 dark:text-white border-b border-gray-100 dark:border-gray-800 pb-3 mb-3">
            <ClipboardList className="h-5 w-5 text-emerald-600" />
            Clinical Notes & Indications
          </div>
          <p className="text-sm text-gray-700 dark:text-gray-300 italic">
            {order.clinicalNotes || 'No clinical notes provided for this diagnostic requisition.'}
          </p>
          {order.cancellationReason && (
            <div className="mt-3 p-2.5 rounded bg-red-50 text-red-800 dark:bg-red-950/30 dark:text-red-300 text-xs">
              <strong className="block">Cancellation Reason:</strong>
              {order.cancellationReason}
            </div>
          )}
        </div>
      </div>

      {/* Tests Ordered (LabOrderItems) */}
      <div className="card overflow-hidden">
        <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
          <h3 className="font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <FlaskConical className="h-5 w-5 text-primary-600" />
            Ordered Tests ({order.items?.length || 0})
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="table w-full">
            <thead>
              <tr>
                <th>Test Code</th>
                <th>Test Name</th>
                <th>Specimen</th>
                <th>Price</th>
                <th>Item Status</th>
                <th>Billing Status</th>
              </tr>
            </thead>
            <tbody>
              {order.items?.map((item, idx) => (
                <tr key={idx} className="hover:bg-gray-50 dark:hover:bg-gray-800/40">
                  <td className="font-mono font-bold text-primary-600">{item.testCode}</td>
                  <td className="font-medium text-gray-900 dark:text-white">{item.testName}</td>
                  <td>
                    <span className="text-xs px-2 py-0.5 rounded bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300">
                      {item.specimenType || 'N/A'}
                    </span>
                  </td>
                  <td className="font-semibold text-gray-900 dark:text-white">
                    ${item.priceAtOrder || 0}
                  </td>
                  <td>
                    <StatusBadge status={item.status} />
                  </td>
                  <td>
                    <span className={`inline-block px-2 py-0.5 rounded text-xs font-semibold ${
                      item.billingStatus === 'CHARGED' ? 'bg-green-100 text-green-800' :
                      item.billingStatus === 'REFUNDED' ? 'bg-amber-100 text-amber-800' :
                      item.billingStatus === 'WAIVED' ? 'bg-gray-100 text-gray-600' : 'bg-blue-100 text-blue-800'
                    }`}>
                      {item.billingStatus}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Associated Samples */}
      <div className="card overflow-hidden">
        <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
          <h3 className="font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <FlaskConical className="h-5 w-5 text-indigo-600" />
            Accessioned Samples ({samples.length})
          </h3>
          <button 
            onClick={() => navigate('/operations/laboratory/reception')}
            className="text-xs text-primary-600 hover:underline flex items-center gap-1 font-medium"
          >
            Go to Sample Reception <ChevronRight className="h-3 w-3" />
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="table w-full">
            <thead>
              <tr>
                <th>Accession #</th>
                <th>Barcode</th>
                <th>Specimen</th>
                <th>Container</th>
                <th>Status</th>
                <th>Collected At</th>
                <th>Bench Received</th>
              </tr>
            </thead>
            <tbody>
              {samples.length === 0 ? (
                <tr>
                  <td colSpan="7" className="text-center py-6 text-gray-400 text-sm">
                    No samples registered or collected for this order yet.
                  </td>
                </tr>
              ) : (
                samples.map((sample) => (
                  <tr key={sample.sampleId}>
                    <td className="font-mono font-bold text-indigo-600">{sample.accessionNumber}</td>
                    <td className="font-mono text-xs">{sample.barcode}</td>
                    <td className="text-sm font-medium">{sample.specimenType}</td>
                    <td className="text-xs text-gray-600 dark:text-gray-300">{sample.containerType}</td>
                    <td>
                      <StatusBadge status={sample.status} />
                    </td>
                    <td className="text-xs text-gray-500">
                      {sample.collectedAt ? new Date(sample.collectedAt).toLocaleString() : 'Pending'}
                    </td>
                    <td className="text-xs text-gray-500">
                      {sample.receivedAt ? new Date(sample.receivedAt).toLocaleString() : 'Not Received'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Associated Reports */}
      {reports.length > 0 && (
        <div className="card overflow-hidden">
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            <h3 className="font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <FileText className="h-5 w-5 text-emerald-600" />
              Generated Laboratory Reports ({reports.length})
            </h3>
          </div>
          <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
            {reports.map((rep) => (
              <div key={rep.labReportId} className="p-4 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/40 flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold font-mono text-gray-900 dark:text-white">
                      {rep.reportNumber || rep.labReportId}
                    </span>
                    <StatusBadge status={rep.status} />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Released: {rep.releasedAt ? new Date(rep.releasedAt).toLocaleString() : 'Not Released'}
                  </p>
                </div>
                <button
                  onClick={() => navigate('/operations/laboratory/reports')}
                  className="btn btn-secondary btn-sm flex items-center gap-1.5"
                >
                  <FileText className="h-3.5 w-3.5" />
                  View Reports
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Cancellation Modal */}
      <Modal
        isOpen={showCancelModal}
        onClose={() => setShowCancelModal(false)}
        title="Cancel Laboratory Order"
      >
        <form onSubmit={handleCancelOrder} className="space-y-4">
          <p className="text-sm text-gray-600 dark:text-gray-300">
            Are you sure you want to cancel order <strong>{order.labOrderId}</strong>? This action will mark all pending test items and samples as cancelled.
          </p>
          <div>
            <label className="label">Cancellation Reason *</label>
            <textarea
              required
              rows="3"
              placeholder="e.g. Duplicate order placed by mistake, patient declined test, clinical condition changed..."
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              className="input w-full"
            />
          </div>
          <div className="flex items-center justify-end gap-3 pt-3">
            <button
              type="button"
              onClick={() => setShowCancelModal(false)}
              className="btn btn-secondary"
            >
              Abort
            </button>
            <button
              type="submit"
              disabled={cancelling || !cancelReason.trim()}
              className="btn btn-danger flex items-center gap-2"
            >
              {cancelling ? 'Cancelling...' : 'Confirm Cancellation'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default LabOrderDetails;
