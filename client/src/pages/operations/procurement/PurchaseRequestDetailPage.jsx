import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  FileText,
  ArrowLeft,
  CheckCircle,
  XCircle,
  RotateCcw,
  Clock,
  AlertTriangle,
  Send,
  Building,
  DollarSign,
  Calendar,
  Layers,
  ChevronRight,
  ShieldAlert,
  User,
  Info
} from 'lucide-react';
import ProcurementService from '../../../services/procurementService';

export const PurchaseRequestDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [request, setRequest] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  // Modals
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [showReturnModal, setShowReturnModal] = useState(false);
  const [returnComments, setReturnComments] = useState('');
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [approvalComments, setApprovalComments] = useState('');

  const fetchRequestDetails = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await ProcurementService.getRequestById(id);
      if (res.data?.success && res.data?.data) {
        setRequest(res.data.data);
      } else {
        setError('Purchase Request details not found.');
      }
    } catch (err) {
      console.error('Error fetching PR details:', err);
      setError(err.response?.data?.message || err.message || 'Failed to load Purchase Request');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) {
      fetchRequestDetails();
    }
  }, [id]);

  const handleApprove = async () => {
    try {
      setActionLoading(true);
      setError(null);
      await ProcurementService.approveRequest(id, {
        comments: approvalComments || 'Approved in review queue'
      });
      setSuccessMsg('Purchase Request approved successfully.');
      setShowApproveModal(false);
      await fetchRequestDetails();
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Approval failed');
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async () => {
    if (!rejectReason.trim()) {
      setError('A mandatory reason is required to reject a Purchase Request.');
      return;
    }
    try {
      setActionLoading(true);
      setError(null);
      await ProcurementService.rejectRequest(id, { reason: rejectReason.trim() });
      setSuccessMsg('Purchase Request rejected.');
      setShowRejectModal(false);
      setRejectReason('');
      await fetchRequestDetails();
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Rejection failed');
    } finally {
      setActionLoading(false);
    }
  };

  const handleReturn = async () => {
    if (!returnComments.trim()) {
      setError('Comments describing required corrections are mandatory.');
      return;
    }
    try {
      setActionLoading(true);
      setError(null);
      await ProcurementService.returnRequest(id, { comments: returnComments.trim() });
      setSuccessMsg('Purchase Request returned for revisions.');
      setShowReturnModal(false);
      setReturnComments('');
      await fetchRequestDetails();
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Return failed');
    } finally {
      setActionLoading(false);
    }
  };

  const handleSubmit = async () => {
    try {
      setActionLoading(true);
      setError(null);
      await ProcurementService.submitRequest(id);
      setSuccessMsg('Purchase Request submitted for approval.');
      await fetchRequestDetails();
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Submission failed');
    } finally {
      setActionLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'APPROVED':
        return <span className="badge badge-success"><CheckCircle size={14} className="mr-1" /> Approved</span>;
      case 'SUBMITTED':
      case 'UNDER_REVIEW':
        return <span className="badge badge-warning"><Clock size={14} className="mr-1" /> Under Review</span>;
      case 'REJECTED':
        return <span className="badge badge-danger"><XCircle size={14} className="mr-1" /> Rejected</span>;
      case 'RETURNED':
        return <span className="badge badge-secondary"><RotateCcw size={14} className="mr-1" /> Returned</span>;
      case 'CONVERTED_TO_PO':
      case 'RFQ_ISSUED':
        return <span className="badge badge-info"><Layers size={14} className="mr-1" /> In Procurement</span>;
      default:
        return <span className="badge badge-neutral">{status}</span>;
    }
  };

  const getPriorityBadge = (priority) => {
    switch (priority) {
      case 'EMERGENCY':
        return <span className="badge badge-danger">Emergency</span>;
      case 'URGENT':
        return <span className="badge badge-warning">Urgent</span>;
      case 'HIGH':
        return <span className="badge badge-info">High</span>;
      default:
        return <span className="badge badge-neutral">Normal</span>;
    }
  };

  if (loading) {
    return (
      <div className="p-8 text-center text-secondary">
        <Clock className="animate-spin inline-block mb-3" size={32} />
        <p>Loading Purchase Request details...</p>
      </div>
    );
  }

  if (!request) {
    return (
      <div className="p-8 text-center">
        <AlertTriangle className="text-warning inline-block mb-3" size={36} />
        <h2 className="text-xl font-bold mb-2">Purchase Request Not Found</h2>
        <p className="text-secondary mb-4">{error || 'The requested PR could not be loaded.'}</p>
        <button onClick={() => navigate('/operations/procurement/requests')} className="btn btn-outline">
          <ArrowLeft size={16} className="mr-2" /> Back to Requests
        </button>
      </div>
    );
  }

  return (
    <div className="page-container p-6 max-w-7xl mx-auto space-y-6">
      {/* Top Navigation & Breadcrumbs */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border pb-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/operations/procurement/requests')}
            className="btn btn-sm btn-ghost"
            title="Back to PR List"
          >
            <ArrowLeft size={18} />
          </button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-main">{request.requestId}</h1>
              {getStatusBadge(request.status)}
              {getPriorityBadge(request.priority)}
            </div>
            <p className="text-sm text-secondary">
              Created {new Date(request.createdAt).toLocaleDateString()} • Required by{' '}
              {new Date(request.requiredByDate).toLocaleDateString()}
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          {request.status === 'DRAFT' || request.status === 'RETURNED' ? (
            <button
              onClick={handleSubmit}
              disabled={actionLoading}
              className="btn btn-primary"
            >
              <Send size={16} className="mr-2" /> Submit for Approval
            </button>
          ) : null}

          {request.status === 'SUBMITTED' || request.status === 'UNDER_REVIEW' ? (
            <>
              <button
                onClick={() => setShowApproveModal(true)}
                disabled={actionLoading}
                className="btn btn-success"
              >
                <CheckCircle size={16} className="mr-2" /> Approve
              </button>
              <button
                onClick={() => setShowReturnModal(true)}
                disabled={actionLoading}
                className="btn btn-warning"
              >
                <RotateCcw size={16} className="mr-2" /> Return for Revision
              </button>
              <button
                onClick={() => setShowRejectModal(true)}
                disabled={actionLoading}
                className="btn btn-danger"
              >
                <XCircle size={16} className="mr-2" /> Reject
              </button>
            </>
          ) : null}

          {request.status === 'APPROVED' ? (
            <Link
              to="/operations/procurement/rfqs"
              className="btn btn-primary"
            >
              <Layers size={16} className="mr-2" /> Create RFQ from this PR
            </Link>
          ) : null}
        </div>
      </div>

      {/* Notifications */}
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

      {/* Core Details Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="card p-4 bg-surface border border-border rounded-xl">
          <div className="flex items-center gap-3 text-secondary text-sm mb-1">
            <Building size={16} /> Department
          </div>
          <div className="font-semibold text-main">{request.departmentName || request.departmentId}</div>
          <div className="text-xs text-secondary mt-1">Category: {request.category?.replace('_', ' ')}</div>
        </div>

        <div className="card p-4 bg-surface border border-border rounded-xl">
          <div className="flex items-center gap-3 text-secondary text-sm mb-1">
            <DollarSign size={16} /> Total Estimated Value
          </div>
          <div className="text-xl font-bold text-primary">
            ₹{(request.totalEstimatedAmount || 0).toLocaleString()}
          </div>
          <div className="text-xs text-secondary mt-1">{request.items?.length || 0} line items</div>
        </div>

        <div className="card p-4 bg-surface border border-border rounded-xl">
          <div className="flex items-center gap-3 text-secondary text-sm mb-1">
            <User size={16} /> Requester
          </div>
          <div className="font-semibold text-main">
            {request.requestedBy?.name || request.requestedBy || 'Hospital Staff'}
          </div>
          <div className="text-xs text-secondary mt-1">ID: {request.requestedBy?.employeeId || 'STAFF'}</div>
        </div>

        <div className="card p-4 bg-surface border border-border rounded-xl">
          <div className="flex items-center gap-3 text-secondary text-sm mb-1">
            <Calendar size={16} /> Target Delivery Date
          </div>
          <div className="font-semibold text-main">
            {new Date(request.requiredByDate).toLocaleDateString()}
          </div>
          <div className="text-xs text-secondary mt-1">
            Lead time: ~{Math.ceil((new Date(request.requiredByDate) - new Date(request.createdAt)) / (1000 * 60 * 60 * 24))} days
          </div>
        </div>
      </div>

      {/* Justification & Clinical Need */}
      <div className="card p-5 bg-surface border border-border rounded-xl">
        <h3 className="font-semibold text-main mb-2 flex items-center gap-2">
          <Info size={18} className="text-primary" /> Reason & Clinical Justification
        </h3>
        <p className="text-sm text-secondary mb-2">{request.reason || 'Routine replenishment of stock.'}</p>
        {request.justification && (
          <div className="bg-subtle p-3 rounded-lg text-sm text-secondary border border-border">
            <strong>Clinical Justification: </strong> {request.justification}
          </div>
        )}
      </div>

      {/* Line Items Table */}
      <div className="card bg-surface border border-border rounded-xl overflow-hidden shadow-sm">
        <div className="p-4 border-b border-border flex justify-between items-center">
          <h3 className="font-semibold text-main flex items-center gap-2">
            <Layers size={18} /> Requested Line Items ({request.items?.length || 0})
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
                <th className="py-3 px-4 text-center">Quantity</th>
                <th className="py-3 px-4 text-right">Est. Unit Price</th>
                <th className="py-3 px-4 text-right">Est. Line Total</th>
                <th className="py-3 px-4">Preferred Specs</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border text-sm">
              {request.items?.map((item, idx) => (
                <tr key={idx} className="hover:bg-subtle/50">
                  <td className="py-3 px-4 text-secondary">{idx + 1}</td>
                  <td className="py-3 px-4">
                    <div className="font-medium text-main">{item.itemNameSnapshot}</div>
                    {item.description && <div className="text-xs text-secondary">{item.description}</div>}
                  </td>
                  <td className="py-3 px-4">
                    <code className="text-xs bg-subtle px-2 py-1 rounded border border-border">
                      {item.inventoryItemId || 'N/A'}
                    </code>
                  </td>
                  <td className="py-3 px-4 text-center font-medium">
                    {item.quantity} <span className="text-xs text-secondary">{item.unit}</span>
                  </td>
                  <td className="py-3 px-4 text-right text-secondary">
                    ₹{(item.estimatedUnitPrice || 0).toLocaleString()}
                  </td>
                  <td className="py-3 px-4 text-right font-semibold text-main">
                    ₹{((item.quantity || 0) * (item.estimatedUnitPrice || 0)).toLocaleString()}
                  </td>
                  <td className="py-3 px-4 text-xs text-secondary">
                    {item.preferredSpecification || 'Standard Grade'}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="bg-subtle/50 font-bold">
                <td colSpan="5" className="py-3 px-4 text-right">Grand Total:</td>
                <td className="py-3 px-4 text-right text-primary text-base">
                  ₹{(request.totalEstimatedAmount || 0).toLocaleString()}
                </td>
                <td></td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* Approval & Audit History */}
      <div className="card p-5 bg-surface border border-border rounded-xl">
        <h3 className="font-semibold text-main mb-4 flex items-center gap-2">
          <Clock size={18} className="text-primary" /> Lifecycle & Approval Audit Trail
        </h3>
        <div className="space-y-4">
          {request.history && request.history.length > 0 ? (
            request.history.map((h, i) => (
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
            <p className="text-sm text-secondary">No additional history recorded yet.</p>
          )}

          {request.rejectionReason && (
            <div className="alert alert-danger mt-4 text-sm">
              <strong>Rejection Reason: </strong> {request.rejectionReason}
            </div>
          )}
        </div>
      </div>

      {/* Modal: Approve */}
      {showApproveModal && (
        <div className="modal-backdrop fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="card bg-surface max-w-md w-full p-6 rounded-2xl shadow-xl border border-border space-y-4">
            <h3 className="text-lg font-bold text-main flex items-center gap-2">
              <CheckCircle className="text-success" size={20} /> Authorize Purchase Request
            </h3>
            <p className="text-sm text-secondary">
              By authorizing this request, you confirm that the requested supplies are validated against clinical necessity and budgetary allocation. Segregation of duties applies.
            </p>
            <div>
              <label className="text-xs font-semibold text-secondary block mb-1">Approval Comments (Optional)</label>
              <textarea
                rows={3}
                className="input w-full p-2 text-sm"
                placeholder="e.g., Verified department clinical demand and budget quota."
                value={approvalComments}
                onChange={(e) => setApprovalComments(e.target.value)}
              />
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowApproveModal(false)}
                className="btn btn-outline"
                disabled={actionLoading}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleApprove}
                className="btn btn-success"
                disabled={actionLoading}
              >
                {actionLoading ? 'Approving...' : 'Confirm Approval'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Reject (Mandatory Reason) */}
      {showRejectModal && (
        <div className="modal-backdrop fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="card bg-surface max-w-md w-full p-6 rounded-2xl shadow-xl border border-border space-y-4">
            <h3 className="text-lg font-bold text-main flex items-center gap-2">
              <XCircle className="text-danger" size={20} /> Reject Purchase Request
            </h3>
            <p className="text-sm text-secondary">
              A clear, mandatory justification is required when rejecting a request to maintain hospital audit compliance.
            </p>
            <div>
              <label className="text-xs font-semibold text-secondary block mb-1">
                Rejection Reason <span className="text-danger">*</span>
              </label>
              <textarea
                rows={3}
                required
                className="input w-full p-2 text-sm border-danger"
                placeholder="e.g., Budget ceiling reached for Q3; existing buffer stock in Central Store suffices."
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

      {/* Modal: Return for Correction */}
      {showReturnModal && (
        <div className="modal-backdrop fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="card bg-surface max-w-md w-full p-6 rounded-2xl shadow-xl border border-border space-y-4">
            <h3 className="text-lg font-bold text-main flex items-center gap-2">
              <RotateCcw className="text-warning" size={20} /> Return for Correction
            </h3>
            <p className="text-sm text-secondary">
              The request will return to the requester in 'RETURNED' status so they can amend line items or specifications.
            </p>
            <div>
              <label className="text-xs font-semibold text-secondary block mb-1">
                Required Corrections / Feedback <span className="text-danger">*</span>
              </label>
              <textarea
                rows={3}
                required
                className="input w-full p-2 text-sm"
                placeholder="e.g., Please specify ISO grade and reduce quantity from 500 to 200 based on monthly burn rate."
                value={returnComments}
                onChange={(e) => setReturnComments(e.target.value)}
              />
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowReturnModal(false)}
                className="btn btn-outline"
                disabled={actionLoading}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleReturn}
                className="btn btn-warning"
                disabled={actionLoading || !returnComments.trim()}
              >
                {actionLoading ? 'Returning...' : 'Return Request'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PurchaseRequestDetailPage;
