import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  FileText,
  ArrowLeft,
  CheckCircle,
  XCircle,
  Clock,
  Send,
  Truck,
  Building,
  DollarSign,
  Calendar,
  AlertTriangle,
  RotateCcw,
  CheckSquare,
  ShieldCheck,
  History,
  Info,
  Layers,
  MapPin
} from 'lucide-react';
import ProcurementService from '../../../services/procurementService';

export const PurchaseOrderDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  // Modals
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [showAckModal, setShowAckModal] = useState(false);
  const [ackRef, setAckRef] = useState('');
  const [showRevisionModal, setShowRevisionModal] = useState(false);
  const [revisionReason, setRevisionReason] = useState('');

  const fetchOrder = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await ProcurementService.getPurchaseOrderById(id);
      if (res.data?.success && res.data?.data) {
        setOrder(res.data.data);
      } else {
        setError('Purchase Order details not found.');
      }
    } catch (err) {
      console.error('Error fetching PO details:', err);
      setError(err.response?.data?.message || err.message || 'Failed to load Purchase Order');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) {
      fetchOrder();
    }
  }, [id]);

  const handleSubmitForApproval = async () => {
    try {
      setActionLoading(true);
      setError(null);
      await ProcurementService.submitPoForApproval(id);
      setSuccessMsg('Purchase Order submitted for management authorization.');
      await fetchOrder();
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Submission failed');
    } finally {
      setActionLoading(false);
    }
  };

  const handleApprove = async () => {
    try {
      setActionLoading(true);
      setError(null);
      await ProcurementService.approvePurchaseOrder(id, {
        comments: 'Authorized under delegated procurement threshold'
      });
      setSuccessMsg('Purchase Order formally approved.');
      await fetchOrder();
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Approval failed');
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async () => {
    if (!rejectReason.trim()) {
      setError('A mandatory reason is required to reject a Purchase Order.');
      return;
    }
    try {
      setActionLoading(true);
      setError(null);
      await ProcurementService.rejectPurchaseOrder(id, { reason: rejectReason.trim() });
      setSuccessMsg('Purchase Order rejected.');
      setShowRejectModal(false);
      setRejectReason('');
      await fetchOrder();
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Rejection failed');
    } finally {
      setActionLoading(false);
    }
  };

  const handleSendToVendor = async () => {
    try {
      setActionLoading(true);
      setError(null);
      await ProcurementService.sendPoToVendor(id);
      setSuccessMsg('Purchase Order transmitted to vendor via secure EDI/email channel.');
      await fetchOrder();
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Transmission failed');
    } finally {
      setActionLoading(false);
    }
  };

  const handleAcknowledge = async () => {
    if (!ackRef.trim()) {
      setError('Vendor confirmation reference code is required.');
      return;
    }
    try {
      setActionLoading(true);
      setError(null);
      await ProcurementService.recordVendorAcknowledgement(id, {
        confirmationReference: ackRef.trim(),
        confirmedDeliveryDate: order.expectedDeliveryDate
      });
      setSuccessMsg('Vendor acknowledgement recorded.');
      setShowAckModal(false);
      setAckRef('');
      await fetchOrder();
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Acknowledgement recording failed');
    } finally {
      setActionLoading(false);
    }
  };

  const handleRevise = async () => {
    if (!revisionReason.trim()) {
      setError('Mandatory reason for PO revision is required.');
      return;
    }
    try {
      setActionLoading(true);
      setError(null);
      await ProcurementService.createPoRevision(id, {
        reason: revisionReason.trim(),
        proposedChanges: { notes: `Revision: ${revisionReason.trim()}` }
      });
      setSuccessMsg('New Purchase Order revision version generated.');
      setShowRevisionModal(false);
      setRevisionReason('');
      await fetchOrder();
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Revision failed');
    } finally {
      setActionLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'APPROVED':
        return <span className="badge badge-success"><CheckCircle size={14} className="mr-1" /> Approved</span>;
      case 'ISSUED':
        return <span className="badge badge-primary"><Send size={14} className="mr-1" /> Sent to Vendor</span>;
      case 'ACKNOWLEDGED':
        return <span className="badge badge-info"><CheckSquare size={14} className="mr-1" /> Acknowledged</span>;
      case 'PARTIALLY_DELIVERED':
        return <span className="badge badge-warning"><Truck size={14} className="mr-1" /> Partial Delivery</span>;
      case 'DELIVERED':
        return <span className="badge badge-success"><CheckCircle size={14} className="mr-1" /> Fully Delivered</span>;
      case 'PENDING_APPROVAL':
        return <span className="badge badge-warning"><Clock size={14} className="mr-1" /> Awaiting Management Approval</span>;
      case 'REJECTED':
      case 'CANCELLED':
        return <span className="badge badge-danger">{status}</span>;
      default:
        return <span className="badge badge-neutral">{status}</span>;
    }
  };

  if (loading) {
    return (
      <div className="p-8 text-center text-secondary">
        <Clock className="animate-spin inline-block mb-3" size={32} />
        <p>Loading Purchase Order dossier...</p>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="p-8 text-center">
        <AlertTriangle className="text-warning inline-block mb-3" size={36} />
        <h2 className="text-xl font-bold mb-2">Purchase Order Not Found</h2>
        <p className="text-secondary mb-4">{error || 'Could not locate PO record.'}</p>
        <button onClick={() => navigate('/operations/procurement/purchase-orders')} className="btn btn-outline">
          <ArrowLeft size={16} className="mr-2" /> Back to Purchase Orders
        </button>
      </div>
    );
  }

  return (
    <div className="page-container p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border pb-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/operations/procurement/purchase-orders')}
            className="btn btn-sm btn-ghost"
            title="Back to Purchase Orders"
          >
            <ArrowLeft size={18} />
          </button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-main">{order.poNumber}</h1>
              {getStatusBadge(order.status)}
              {order.revisionsCount > 0 && (
                <span className="badge badge-warning text-xs">v{order.revisionsCount + 1}</span>
              )}
            </div>
            <p className="text-sm text-secondary">
              Vendor: <strong>{order.vendorName}</strong> ({order.vendorId}) • Created{' '}
              {new Date(order.createdAt).toLocaleDateString()}
            </p>
          </div>
        </div>

        {/* Workflow Actions */}
        <div className="flex flex-wrap items-center gap-2">
          {order.status === 'DRAFT' && (
            <button
              onClick={handleSubmitForApproval}
              disabled={actionLoading}
              className="btn btn-primary"
            >
              <Send size={16} className="mr-2" /> Submit for Approval
            </button>
          )}

          {order.status === 'PENDING_APPROVAL' && (
            <>
              <button
                onClick={handleApprove}
                disabled={actionLoading}
                className="btn btn-success"
              >
                <CheckCircle size={16} className="mr-2" /> Authorize PO
              </button>
              <button
                onClick={() => setShowRejectModal(true)}
                disabled={actionLoading}
                className="btn btn-danger"
              >
                <XCircle size={16} className="mr-2" /> Reject PO
              </button>
            </>
          )}

          {order.status === 'APPROVED' && (
            <button
              onClick={handleSendToVendor}
              disabled={actionLoading}
              className="btn btn-primary"
            >
              <Send size={16} className="mr-2" /> Transmit to Vendor
            </button>
          )}

          {order.status === 'ISSUED' && (
            <button
              onClick={() => setShowAckModal(true)}
              disabled={actionLoading}
              className="btn btn-info"
            >
              <CheckSquare size={16} className="mr-2" /> Record Vendor Ack
            </button>
          )}

          {(order.status === 'ACKNOWLEDGED' || order.status === 'ISSUED') && (
            <button
              onClick={() => setShowRevisionModal(true)}
              disabled={actionLoading}
              className="btn btn-outline"
            >
              <RotateCcw size={16} className="mr-2" /> Revise PO
            </button>
          )}

          <Link
            to={`/operations/procurement/deliveries?poNumber=${order.poNumber}`}
            className="btn btn-outline"
          >
            <Truck size={16} className="mr-2" /> Delivery Tracker
          </Link>
        </div>
      </div>

      {/* Alerts */}
      {error && (
        <div className="alert alert-danger flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle size={18} />
            <span>{error}</span>
          </div>
          <button onClick={() => setError(null)} className="btn btn-xs btn-ghost">Dismiss</button>
        </div>
      )}
      {successMsg && (
        <div className="alert alert-success flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle size={18} />
            <span>{successMsg}</span>
          </div>
          <button onClick={() => setSuccessMsg('')} className="btn btn-xs btn-ghost">Dismiss</button>
        </div>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="card p-4 bg-surface border border-border rounded-xl">
          <div className="flex items-center gap-2 text-secondary text-sm mb-1">
            <DollarSign size={16} /> Total Net Commitment
          </div>
          <div className="text-xl font-bold text-primary">
            ₹{(order.totalAmount || 0).toLocaleString()}
          </div>
          <div className="text-xs text-secondary mt-1">
            Subtotal: ₹{(order.subtotal || 0).toLocaleString()} • Tax: ₹{(order.taxAmount || 0).toLocaleString()}
          </div>
        </div>

        <div className="card p-4 bg-surface border border-border rounded-xl">
          <div className="flex items-center gap-2 text-secondary text-sm mb-1">
            <Building size={16} /> Vendor Partner
          </div>
          <div className="font-semibold text-main">{order.vendorName}</div>
          <div className="text-xs text-secondary mt-1 font-mono">{order.vendorContactEmail || 'orders@vendor.com'}</div>
        </div>

        <div className="card p-4 bg-surface border border-border rounded-xl">
          <div className="flex items-center gap-2 text-secondary text-sm mb-1">
            <Calendar size={16} /> Expected Delivery Date
          </div>
          <div className="font-semibold text-main">
            {new Date(order.expectedDeliveryDate).toLocaleDateString()}
          </div>
          <div className="text-xs text-secondary mt-1">Payment: {order.paymentTerms?.replace('_', ' ')}</div>
        </div>

        <div className="card p-4 bg-surface border border-border rounded-xl">
          <div className="flex items-center gap-2 text-secondary text-sm mb-1">
            <MapPin size={16} /> Receiving Destination
          </div>
          <div className="text-xs text-main font-medium line-clamp-2">
            {order.deliveryAddress || 'Hospital Central Store'}
          </div>
        </div>
      </div>

      {/* Items Table */}
      <div className="card bg-surface border border-border rounded-xl overflow-hidden shadow-sm">
        <div className="p-4 border-b border-border flex justify-between items-center">
          <h3 className="font-semibold text-main flex items-center gap-2">
            <Layers size={18} /> Committed Line Items ({order.items?.length || 0})
          </h3>
          <span className="text-sm text-secondary">Currency: INR (₹)</span>
        </div>
        <div className="overflow-x-auto">
          <table className="table w-full">
            <thead>
              <tr className="bg-subtle text-left text-xs uppercase text-secondary">
                <th className="py-3 px-4">#</th>
                <th className="py-3 px-4">Item Details</th>
                <th className="py-3 px-4">Inventory Ref</th>
                <th className="py-3 px-4 text-center">Ordered</th>
                <th className="py-3 px-4 text-center">Delivered</th>
                <th className="py-3 px-4 text-right">Unit Price</th>
                <th className="py-3 px-4 text-right">Tax %</th>
                <th className="py-3 px-4 text-right">Line Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border text-sm">
              {order.items?.map((item, idx) => (
                <tr key={idx} className="hover:bg-subtle/50">
                  <td className="py-3 px-4 text-secondary">{idx + 1}</td>
                  <td className="py-3 px-4">
                    <div className="font-medium text-main">{item.itemName}</div>
                    {item.specification && (
                      <div className="text-xs text-secondary">{item.specification}</div>
                    )}
                  </td>
                  <td className="py-3 px-4">
                    <code className="text-xs bg-subtle px-2 py-0.5 rounded border border-border">
                      {item.inventoryItemId || 'N/A'}
                    </code>
                  </td>
                  <td className="py-3 px-4 text-center font-semibold">
                    {item.quantityOrdered} <span className="text-xs text-secondary font-normal">{item.unit}</span>
                  </td>
                  <td className="py-3 px-4 text-center">
                    <span
                      className={`text-xs font-semibold ${
                        (item.quantityDelivered || 0) >= item.quantityOrdered
                          ? 'text-success'
                          : (item.quantityDelivered || 0) > 0
                          ? 'text-warning'
                          : 'text-secondary'
                      }`}
                    >
                      {item.quantityDelivered || 0} / {item.quantityOrdered}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right text-secondary">
                    ₹{(item.unitPrice || 0).toLocaleString()}
                  </td>
                  <td className="py-3 px-4 text-right text-secondary">
                    {item.taxPercent || 0}%
                  </td>
                  <td className="py-3 px-4 text-right font-bold text-main">
                    ₹{(item.lineTotal || (item.quantityOrdered * item.unitPrice)).toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="bg-subtle/50 font-bold">
                <td colSpan="7" className="py-3 px-4 text-right">Total Net Commitment:</td>
                <td className="py-3 px-4 text-right text-primary text-base">
                  ₹{(order.totalAmount || 0).toLocaleString()}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* Revisions & Audit Log */}
      <div className="card p-5 bg-surface border border-border rounded-xl">
        <h3 className="font-semibold text-main mb-4 flex items-center gap-2">
          <History size={18} className="text-primary" /> Controlled Versioning &amp; Lifecycle Audit
        </h3>
        <div className="space-y-4">
          {order.history && order.history.length > 0 ? (
            order.history.map((h, i) => (
              <div key={i} className="flex items-start gap-3 border-l-2 border-primary/30 pl-4 py-1">
                <div className="w-2.5 h-2.5 rounded-full bg-primary -ml-[21px] mt-1.5" />
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-main text-sm">{h.action || h.status}</span>
                    <span className="text-xs text-secondary">{new Date(h.timestamp || h.date).toLocaleString()}</span>
                  </div>
                  <p className="text-xs text-secondary mt-0.5">
                    By: {h.performedBy?.name || h.performedBy || 'System'} {h.notes ? `— "${h.notes}"` : ''}
                  </p>
                </div>
              </div>
            ))
          ) : (
            <p className="text-sm text-secondary">No additional history recorded.</p>
          )}

          {order.rejectionReason && (
            <div className="alert alert-danger mt-4 text-sm">
              <strong>Rejection Reason: </strong> {order.rejectionReason}
            </div>
          )}
        </div>
      </div>

      {/* Modal: Reject PO */}
      {showRejectModal && (
        <div className="modal-backdrop fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="card bg-surface max-w-md w-full p-6 rounded-2xl shadow-xl border border-border space-y-4">
            <h3 className="text-lg font-bold text-main flex items-center gap-2">
              <XCircle className="text-danger" size={20} /> Reject Purchase Order
            </h3>
            <p className="text-sm text-secondary">
              A mandatory justification is recorded in the permanent audit ledger.
            </p>
            <div>
              <label className="text-xs font-semibold text-secondary block mb-1">
                Rejection Reason <span className="text-danger">*</span>
              </label>
              <textarea
                rows={3}
                required
                className="input w-full p-2 text-sm border-danger"
                placeholder="State specific audit, pricing, or compliance reason..."
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
              />
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowRejectModal(false)}
                className="btn btn-outline"
                disabled={actionLoading}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleReject}
                className="btn btn-danger"
                disabled={actionLoading || !rejectReason.trim()}
              >
                {actionLoading ? 'Rejecting...' : 'Confirm Rejection'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Vendor Acknowledgement */}
      {showAckModal && (
        <div className="modal-backdrop fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="card bg-surface max-w-md w-full p-6 rounded-2xl shadow-xl border border-border space-y-4">
            <h3 className="text-lg font-bold text-main flex items-center gap-2">
              <CheckSquare className="text-info" size={20} /> Record Vendor Acknowledgement
            </h3>
            <p className="text-sm text-secondary">
              Record the vendor's formal order acceptance and booking confirmation reference.
            </p>
            <div>
              <label className="text-xs font-semibold text-secondary block mb-1">
                Vendor Confirmation Reference <span className="text-danger">*</span>
              </label>
              <input
                type="text"
                required
                className="input w-full p-2 text-sm"
                placeholder="e.g., CONF-APEX-9981"
                value={ackRef}
                onChange={(e) => setAckRef(e.target.value)}
              />
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowAckModal(false)}
                className="btn btn-outline"
                disabled={actionLoading}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleAcknowledge}
                className="btn btn-primary"
                disabled={actionLoading || !ackRef.trim()}
              >
                {actionLoading ? 'Saving...' : 'Record Acknowledgement'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Revise PO */}
      {showRevisionModal && (
        <div className="modal-backdrop fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="card bg-surface max-w-md w-full p-6 rounded-2xl shadow-xl border border-border space-y-4">
            <h3 className="text-lg font-bold text-main flex items-center gap-2">
              <RotateCcw className="text-warning" size={20} /> Create Purchase Order Revision
            </h3>
            <p className="text-sm text-secondary">
              A snapshot of version {order.revisionsCount + 1} will be preserved in the revision history before applying changes.
            </p>
            <div>
              <label className="text-xs font-semibold text-secondary block mb-1">
                Revision Justification Reason <span className="text-danger">*</span>
              </label>
              <textarea
                rows={3}
                required
                className="input w-full p-2 text-sm border-warning"
                placeholder="e.g., Vendor requested 3-day delivery schedule extension due to courier flight delays."
                value={revisionReason}
                onChange={(e) => setRevisionReason(e.target.value)}
              />
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowRevisionModal(false)}
                className="btn btn-outline"
                disabled={actionLoading}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleRevise}
                className="btn btn-warning"
                disabled={actionLoading || !revisionReason.trim()}
              >
                {actionLoading ? 'Creating Revision...' : 'Generate Revision'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PurchaseOrderDetailPage;
