import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { staffService } from '../../services/staffService';
import {
  Shield,
  CheckCircle,
  XCircle,
  AlertTriangle,
  RefreshCw,
  Search,
  Filter,
  UserCheck,
  Lock,
  ArrowRight
} from 'lucide-react';

export const StaffAccessRequestsPage = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);

  // Reject modal
  const [selectedReqId, setSelectedReqId] = useState(null);
  const [rejectReason, setRejectReason] = useState('');
  const [showRejectModal, setShowRejectModal] = useState(false);

  const fetchAccessRequests = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await staffService.getAccessRequests({ status: statusFilter });
      if (res.requests) {
        setRequests(res.requests);
      }
    } catch (err) {
      setError(err.message || 'Failed to fetch access requests.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAccessRequests();
  }, [statusFilter]);

  const handleApprove = async (requestId) => {
    setActionLoading(true);
    setError(null);
    try {
      await staffService.approveAccessRequest(requestId);
      setSuccessMessage(`Access request ${requestId} approved.`);
      fetchAccessRequests();
    } catch (err) {
      setError(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async () => {
    if (!rejectReason.trim()) {
      setError('Rejection reason is required.');
      return;
    }
    setActionLoading(true);
    try {
      await staffService.rejectAccessRequest(selectedReqId, rejectReason);
      setSuccessMessage(`Access request ${selectedReqId} rejected.`);
      setShowRejectModal(false);
      setRejectReason('');
      fetchAccessRequests();
    } catch (err) {
      setError(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleProvision = async (requestId) => {
    setActionLoading(true);
    setError(null);
    try {
      await staffService.provisionAccess(requestId);
      setSuccessMessage(`System account provisioned for request ${requestId}.`);
      fetchAccessRequests();
    } catch (err) {
      setError(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleRevoke = async (requestId) => {
    setActionLoading(true);
    setError(null);
    try {
      await staffService.revokeAccess(requestId, 'Administrative revocation');
      setSuccessMessage(`Access revoked for request ${requestId}.`);
      fetchAccessRequests();
    } catch (err) {
      setError(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="container-fluid py-4" style={{ color: 'var(--text-primary)' }}>
      {/* Header */}
      <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-2">
        <div>
          <h2 className="h4 mb-1" style={{ fontWeight: '700' }}>Hospital Application Access Request Queue</h2>
          <p className="text-muted mb-0" style={{ fontSize: '0.85rem' }}>
            Controlled RBAC role provisioning and Separation of Duties review authority for administrative staff.
          </p>
        </div>
        <div className="d-flex gap-2">
          <Link to="/administration/staff" className="btn btn-outline-secondary btn-sm">
            Staff Directory
          </Link>
          <button className="btn btn-outline-secondary btn-sm" onClick={fetchAccessRequests}>
            <RefreshCw size={14} /> Refresh
          </button>
        </div>
      </div>

      {successMessage && (
        <div className="alert alert-success d-flex align-items-center gap-2 mb-3" role="alert">
          <CheckCircle size={18} />
          <span>{successMessage}</span>
          <button type="button" className="btn-close ms-auto" onClick={() => setSuccessMessage(null)}></button>
        </div>
      )}

      {error && (
        <div className="alert alert-danger d-flex align-items-center gap-2 mb-3" role="alert">
          <AlertTriangle size={18} />
          <span>{error}</span>
          <button type="button" className="btn-close ms-auto" onClick={() => setError(null)}></button>
        </div>
      )}

      {/* Filter Card */}
      <div
        className="card p-3 mb-4"
        style={{
          background: 'var(--bg-card, #1e293b)',
          border: '1px solid var(--border-color, #334155)',
          borderRadius: '12px'
        }}
      >
        <div className="row g-2 align-items-center">
          <div className="col-12 col-md-4">
            <select
              className="form-select bg-dark border-secondary text-white"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="">All Request Statuses</option>
              <option value="PENDING_APPROVAL">PENDING_APPROVAL (Awaiting Managerial Review)</option>
              <option value="APPROVED">APPROVED (Ready for Provisioning)</option>
              <option value="PROVISIONED">PROVISIONED (Account Active)</option>
              <option value="REJECTED">REJECTED</option>
              <option value="REVOKED">REVOKED (Account Deactivated)</option>
            </select>
          </div>
          <div className="col-12 col-md-8 text-md-end text-muted" style={{ fontSize: '0.85rem' }}>
            <span>Note: System rules enforce Separation of Duties. Employees cannot approve their own requests.</span>
          </div>
        </div>
      </div>

      {/* Table */}
      <div
        className="card p-3"
        style={{
          background: 'var(--bg-card, #1e293b)',
          border: '1px solid var(--border-color, #334155)',
          borderRadius: '12px'
        }}
      >
        <div className="table-responsive">
          <table className="table table-hover align-middle mb-0" style={{ color: 'var(--text-primary)' }}>
            <thead style={{ borderBottom: '2px solid var(--border-color, #334155)', color: 'var(--text-muted)' }}>
              <tr>
                <th>Request ID</th>
                <th>Staff ID</th>
                <th>Role Code</th>
                <th>Source</th>
                <th>Status</th>
                <th>Requested By</th>
                <th>Approved By</th>
                <th>Requested Date</th>
                <th className="text-end">Actions</th>
              </tr>
            </thead>
            <tbody>
              {requests.length > 0 ? (
                requests.map((r) => (
                  <tr key={r.requestId}>
                    <td>
                      <span className="badge bg-dark border text-info font-monospace" style={{ fontSize: '0.85rem' }}>
                        {r.requestId}
                      </span>
                    </td>
                    <td>
                      <Link to={`/administration/staff/${r.employeeId}`} className="text-decoration-none fw-semibold text-info">
                        {r.employeeId}
                      </Link>
                    </td>
                    <td className="fw-semibold">{r.requestedRoleCode}</td>
                    <td><span className="badge bg-secondary">{r.source}</span></td>
                    <td>
                      <span
                        className="badge"
                        style={{
                          fontSize: '0.75rem',
                          background:
                            r.status === 'PROVISIONED'
                              ? 'rgba(74, 222, 128, 0.15)'
                              : r.status === 'PENDING_APPROVAL'
                              ? 'rgba(250, 204, 21, 0.15)'
                              : r.status === 'APPROVED'
                              ? 'rgba(56, 189, 248, 0.15)'
                              : 'rgba(239, 68, 68, 0.15)',
                          color:
                            r.status === 'PROVISIONED'
                              ? '#4ade80'
                              : r.status === 'PENDING_APPROVAL'
                              ? '#facc15'
                              : r.status === 'APPROVED'
                              ? '#38bdf8'
                              : '#ef4444'
                        }}
                      >
                        {r.status}
                      </span>
                    </td>
                    <td>{r.requestedBy}</td>
                    <td>{r.approvedBy || '-'}</td>
                    <td>{new Date(r.createdAt).toLocaleDateString()}</td>
                    <td className="text-end">
                      <div className="d-flex justify-content-end gap-1">
                        {r.status === 'PENDING_APPROVAL' && (
                          <>
                            <button
                              className="btn btn-sm btn-success d-flex align-items-center gap-1"
                              onClick={() => handleApprove(r.requestId)}
                              disabled={actionLoading}
                            >
                              <CheckCircle size={14} /> Approve
                            </button>
                            <button
                              className="btn btn-sm btn-danger d-flex align-items-center gap-1"
                              onClick={() => {
                                setSelectedReqId(r.requestId);
                                setShowRejectModal(true);
                              }}
                              disabled={actionLoading}
                            >
                              <XCircle size={14} /> Reject
                            </button>
                          </>
                        )}
                        {r.status === 'APPROVED' && (
                          <button
                            className="btn btn-sm btn-primary d-flex align-items-center gap-1"
                            onClick={() => handleProvision(r.requestId)}
                            disabled={actionLoading}
                          >
                            <UserCheck size={14} /> Provision
                          </button>
                        )}
                        {r.status === 'PROVISIONED' && (
                          <button
                            className="btn btn-sm btn-outline-danger d-flex align-items-center gap-1"
                            onClick={() => handleRevoke(r.requestId)}
                            disabled={actionLoading}
                          >
                            <Lock size={14} /> Revoke
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="9" className="text-center py-4 text-muted">
                    {loading ? 'Loading requests...' : 'No access requests matching current filter.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Reject Modal */}
      {showRejectModal && (
        <div className="modal show d-block" tabIndex="-1" style={{ background: 'rgba(0,0,0,0.6)' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content bg-dark text-white border-secondary">
              <div className="modal-header border-secondary">
                <h5 className="modal-title">Reject Access Request</h5>
                <button type="button" className="btn-close btn-close-white" onClick={() => setShowRejectModal(false)}></button>
              </div>
              <div className="modal-body">
                <p>Provide rejection reason for access request <strong>{selectedReqId}</strong>:</p>
                <div className="mb-3">
                  <label className="form-label" style={{ fontSize: '0.85rem' }}>Reason *</label>
                  <textarea
                    required
                    rows="3"
                    className="form-control bg-dark text-white border-secondary"
                    placeholder="e.g. Unverified role requirements, unauthorized clearance..."
                    value={rejectReason}
                    onChange={(e) => setRejectReason(e.target.value)}
                  />
                </div>
              </div>
              <div className="modal-footer border-secondary">
                <button className="btn btn-secondary" onClick={() => setShowRejectModal(false)}>Cancel</button>
                <button className="btn btn-danger" onClick={handleReject} disabled={actionLoading}>Confirm Rejection</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StaffAccessRequestsPage;
