import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  CheckSquare,
  Search,
  Filter,
  CheckCircle,
  XCircle,
  RotateCcw,
  Clock,
  AlertTriangle,
  Building,
  DollarSign,
  User,
  Eye,
  ShieldCheck,
  ChevronRight
} from 'lucide-react';
import ProcurementService from '../../../services/procurementService';

export const ApprovalQueuePage = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('');
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState('');

  // Modals
  const [selectedPR, setSelectedPR] = useState(null);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [approvalComments, setApprovalComments] = useState('');

  const fetchQueue = async () => {
    try {
      setLoading(true);
      setError(null);
      // Fetch requests that are SUBMITTED or UNDER_REVIEW
      const res = await ProcurementService.getRequests({
        status: 'SUBMITTED',
        limit: 50
      });
      if (res.data?.success && res.data?.data) {
        setRequests(res.data.data);
      }
    } catch (err) {
      console.error('Failed to load approval queue:', err);
      setError(err.response?.data?.message || err.message || 'Failed to load approval queue');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQueue();
  }, []);

  const handleApprove = async () => {
    if (!selectedPR) return;
    try {
      setActionLoading(true);
      setError(null);
      await ProcurementService.approveRequest(selectedPR._id || selectedPR.requestId, {
        comments: approvalComments || 'Approved via Procurement Authorization Queue'
      });
      setSuccessMsg(`Purchase Request ${selectedPR.requestId} approved successfully.`);
      setShowApproveModal(false);
      setSelectedPR(null);
      setApprovalComments('');
      await fetchQueue();
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Approval failed');
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async () => {
    if (!selectedPR || !rejectReason.trim()) {
      setError('A mandatory reason is required to reject a request.');
      return;
    }
    try {
      setActionLoading(true);
      setError(null);
      await ProcurementService.rejectRequest(selectedPR._id || selectedPR.requestId, {
        reason: rejectReason.trim()
      });
      setSuccessMsg(`Purchase Request ${selectedPR.requestId} rejected.`);
      setShowRejectModal(false);
      setSelectedPR(null);
      setRejectReason('');
      await fetchQueue();
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Rejection failed');
    } finally {
      setActionLoading(false);
    }
  };

  const filteredRequests = requests.filter((r) => {
    const matchesSearch =
      r.requestId?.toLowerCase().includes(search.toLowerCase()) ||
      r.departmentName?.toLowerCase().includes(search.toLowerCase()) ||
      r.reason?.toLowerCase().includes(search.toLowerCase());
    const matchesPriority = priorityFilter ? r.priority === priorityFilter : true;
    const matchesDept = departmentFilter ? r.departmentId === departmentFilter : true;
    return matchesSearch && matchesPriority && matchesDept;
  });

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

  return (
    <div className="page-container p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border pb-4">
        <div>
          <h1 className="text-2xl font-bold text-main flex items-center gap-2">
            <CheckSquare className="text-primary" size={26} /> Procurement Approval Queue
          </h1>
          <p className="text-sm text-secondary">
            Multi-tier validation for pending department requests. Segregation of duties applies strictly.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={fetchQueue} className="btn btn-outline btn-sm">
            Refresh Queue
          </button>
        </div>
      </div>

      {/* Segregation of Duties banner */}
      <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 flex items-start gap-3">
        <ShieldCheck className="text-primary mt-0.5 shrink-0" size={20} />
        <div className="text-xs text-secondary leading-relaxed">
          <strong>Segregation of Duties Enforced:</strong> Requesters cannot approve their own requests.
          Requests exceeding tier thresholds require dual authorization (Department Head &amp; Procurement Officer).
          All actions are timestamped and logged in the immutable audit ledger.
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

      {/* Filters Bar */}
      <div className="card p-4 bg-surface border border-border rounded-xl flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3 flex-1 min-w-[280px]">
          <div className="relative w-full max-w-md">
            <Search className="absolute left-3 top-2.5 text-secondary" size={16} />
            <input
              type="text"
              placeholder="Search by PR #, department, or clinical reason..."
              className="input pl-9 pr-4 py-2 w-full text-sm"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        <div className="flex items-center gap-3">
          <select
            className="input py-2 px-3 text-sm"
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
          >
            <option value="">All Priorities</option>
            <option value="EMERGENCY">Emergency</option>
            <option value="URGENT">Urgent</option>
            <option value="HIGH">High</option>
            <option value="NORMAL">Normal</option>
          </select>
        </div>
      </div>

      {/* Pending Items List */}
      <div className="space-y-4">
        {loading ? (
          <div className="p-8 text-center text-secondary">
            <Clock className="animate-spin inline-block mb-3" size={28} />
            <p>Loading pending authorization queue...</p>
          </div>
        ) : filteredRequests.length === 0 ? (
          <div className="card p-12 text-center bg-surface border border-border rounded-xl">
            <CheckCircle className="text-success inline-block mb-3" size={36} />
            <h3 className="text-lg font-bold text-main mb-1">Queue is Clear!</h3>
            <p className="text-sm text-secondary">There are no pending Purchase Requests awaiting your review right now.</p>
          </div>
        ) : (
          filteredRequests.map((pr) => (
            <div
              key={pr._id}
              className="card p-5 bg-surface border border-border hover:border-primary/50 transition-all rounded-xl shadow-sm"
            >
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="space-y-2 flex-1 min-w-[300px]">
                  <div className="flex items-center gap-3">
                    <Link
                      to={`/operations/procurement/requests/${pr.requestId}`}
                      className="text-base font-bold text-primary hover:underline"
                    >
                      {pr.requestId}
                    </Link>
                    {getPriorityBadge(pr.priority)}
                    <span className="badge badge-warning text-xs">Awaiting Approval</span>
                  </div>

                  <p className="text-sm text-main font-medium">{pr.reason || 'Routine replenishment'}</p>

                  <div className="flex flex-wrap items-center gap-4 text-xs text-secondary">
                    <span className="flex items-center gap-1">
                      <Building size={14} /> {pr.departmentName || pr.departmentId}
                    </span>
                    <span className="flex items-center gap-1">
                      <User size={14} /> Requested by: {pr.requestedBy?.name || 'Staff'}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock size={14} /> Submitted: {new Date(pr.submittedAt || pr.createdAt).toLocaleDateString()}
                    </span>
                    <span className="flex items-center gap-1 font-semibold text-main">
                      <DollarSign size={14} /> ₹{(pr.totalEstimatedAmount || 0).toLocaleString()}
                    </span>
                  </div>

                  {/* Line items mini preview */}
                  <div className="bg-subtle p-2.5 rounded-lg text-xs space-y-1 mt-2">
                    <div className="font-semibold text-secondary mb-1">
                      {pr.items?.length || 0} Line Items Requested:
                    </div>
                    {pr.items?.slice(0, 3).map((item, i) => (
                      <div key={i} className="flex justify-between text-secondary">
                        <span>• {item.itemNameSnapshot} ({item.quantity} {item.unit})</span>
                        <span>₹{((item.quantity || 0) * (item.estimatedUnitPrice || 0)).toLocaleString()}</span>
                      </div>
                    ))}
                    {(pr.items?.length || 0) > 3 && (
                      <div className="text-xs text-primary italic">
                        + {(pr.items?.length || 0) - 3} more items...
                      </div>
                    )}
                  </div>
                </div>

                {/* Queue Actions */}
                <div className="flex flex-col sm:flex-row items-center gap-2">
                  <Link
                    to={`/operations/procurement/requests/${pr.requestId}`}
                    className="btn btn-sm btn-outline w-full sm:w-auto"
                  >
                    <Eye size={14} className="mr-1" /> View Dossier
                  </Link>
                  <button
                    onClick={() => {
                      setSelectedPR(pr);
                      setShowApproveModal(true);
                    }}
                    className="btn btn-sm btn-success w-full sm:w-auto"
                  >
                    <CheckCircle size={14} className="mr-1" /> Approve
                  </button>
                  <button
                    onClick={() => {
                      setSelectedPR(pr);
                      setShowRejectModal(true);
                    }}
                    className="btn btn-sm btn-danger w-full sm:w-auto"
                  >
                    <XCircle size={14} className="mr-1" /> Reject
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modal: Approve */}
      {showApproveModal && selectedPR && (
        <div className="modal-backdrop fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="card bg-surface max-w-md w-full p-6 rounded-2xl shadow-xl border border-border space-y-4">
            <h3 className="text-lg font-bold text-main flex items-center gap-2">
              <CheckCircle className="text-success" size={20} /> Authorize PR {selectedPR.requestId}
            </h3>
            <p className="text-sm text-secondary">
              Total Amount: <strong>₹{(selectedPR.totalEstimatedAmount || 0).toLocaleString()}</strong> for {selectedPR.departmentName}.
            </p>
            <div>
              <label className="text-xs font-semibold text-secondary block mb-1">Approval Notes</label>
              <textarea
                rows={3}
                className="input w-full p-2 text-sm"
                placeholder="Verified budget allocation and clinical urgency."
                value={approvalComments}
                onChange={(e) => setApprovalComments(e.target.value)}
              />
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => {
                  setShowApproveModal(false);
                  setSelectedPR(null);
                }}
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
      {showRejectModal && selectedPR && (
        <div className="modal-backdrop fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="card bg-surface max-w-md w-full p-6 rounded-2xl shadow-xl border border-border space-y-4">
            <h3 className="text-lg font-bold text-main flex items-center gap-2">
              <XCircle className="text-danger" size={20} /> Reject PR {selectedPR.requestId}
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
                placeholder="State specific audit, budget, or duplication reason..."
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
              />
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => {
                  setShowRejectModal(false);
                  setSelectedPR(null);
                }}
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
    </div>
  );
};

export default ApprovalQueuePage;
