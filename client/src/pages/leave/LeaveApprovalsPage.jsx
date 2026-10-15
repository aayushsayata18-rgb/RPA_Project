import React, { useState, useEffect } from 'react';
import {
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
  Eye,
  Filter,
  Check,
  X,
  FileText
} from 'lucide-react';
import leaveService from '../../services/leaveService';

export const LeaveApprovalsPage = () => {
  const [activeTab, setActiveTab] = useState('PENDING'); // 'PENDING', 'CANCEL_REQUESTS', 'APPROVED', 'REJECTED'
  const [loading, setLoading] = useState(true);
  const [requests, setRequests] = useState([]);
  const [actionLoading, setActionLoading] = useState(false);
  const [alertMsg, setAlertMsg] = useState(null);

  // Review Modals
  const [selectedReq, setSelectedReq] = useState(null);
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [approvalNotes, setApprovalNotes] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');

  useEffect(() => {
    fetchRequests();
  }, [activeTab]);

  const fetchRequests = async () => {
    try {
      setLoading(true);
      let queryStatus = activeTab;
      if (activeTab === 'CANCEL_REQUESTS') {
        queryStatus = 'CANCEL_REQUESTED';
      }

      const res = await leaveService.getLeaveRequests({ status: queryStatus, limit: 50 });
      setRequests(res.data?.requests || []);
    } catch (err) {
      console.error('Failed to load leave requests:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async () => {
    if (!selectedReq) return;
    try {
      setActionLoading(true);
      await leaveService.approveLeaveRequest(selectedReq._id, { notes: approvalNotes });
      setAlertMsg({ type: 'success', text: `Leave request ${selectedReq.requestNumber} approved successfully.` });
      setShowApproveModal(false);
      setApprovalNotes('');
      fetchRequests();
    } catch (err) {
      setAlertMsg({ type: 'danger', text: err.response?.data?.error || err.message });
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async () => {
    if (!selectedReq || !rejectionReason.trim()) return;
    try {
      setActionLoading(true);
      await leaveService.rejectLeaveRequest(selectedReq._id, { reason: rejectionReason });
      setAlertMsg({ type: 'success', text: `Leave request ${selectedReq.requestNumber} rejected.` });
      setShowRejectModal(false);
      setRejectionReason('');
      fetchRequests();
    } catch (err) {
      setAlertMsg({ type: 'danger', text: err.response?.data?.error || err.message });
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="container" style={{ padding: '2rem' }}>
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '1.75rem', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '0.25rem' }}>
          Leave Approval & Review Queue
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
          Review pending leave submissions, verify balances and rosters, and process cancellation reversals.
        </p>
      </div>

      {alertMsg && (
        <div className={`alert alert-${alertMsg.type}`} style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between' }}>
          <span>{alertMsg.text}</span>
          <button onClick={() => setAlertMsg(null)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>×</button>
        </div>
      )}

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '0.5rem', borderBottom: '1px solid var(--border-color)', marginBottom: '1.5rem' }}>
        {[
          { key: 'PENDING', label: 'Pending Approvals', icon: Clock },
          { key: 'CANCEL_REQUESTS', label: 'Cancellation Requests', icon: XCircle },
          { key: 'APPROVED', label: 'Approved Requests', icon: CheckCircle },
          { key: 'REJECTED', label: 'Rejected History', icon: XCircle }
        ].map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.75rem 1.25rem',
                border: 'none',
                background: 'none',
                color: isActive ? '#38bdf8' : 'var(--text-secondary)',
                borderBottom: isActive ? '3px solid #38bdf8' : '3px solid transparent',
                fontWeight: isActive ? '600' : '500',
                cursor: 'pointer',
                fontSize: '0.95rem'
              }}
            >
              <Icon size={16} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Table Content */}
      <div className="card" style={{ padding: '1.5rem' }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)' }}>Loading review queue...</div>
        ) : requests.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
            No requests found under {activeTab.replace('_', ' ').toLowerCase()}.
          </div>
        ) : (
          <div className="table-responsive">
            <table className="table" style={{ width: '100%' }}>
              <thead>
                <tr>
                  <th>Request #</th>
                  <th>Employee</th>
                  <th>Department</th>
                  <th>Leave Type</th>
                  <th>Date Range</th>
                  <th>Duration</th>
                  <th>Reason</th>
                  <th>Submitted</th>
                  {activeTab === 'PENDING' && <th>Review Actions</th>}
                </tr>
              </thead>
              <tbody>
                {requests.map(req => (
                  <tr key={req._id}>
                    <td style={{ fontWeight: '600' }}>{req.requestNumber}</td>
                    <td>
                      <div style={{ fontWeight: '500' }}>{req.employeeName || req.employeeCode}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{req.employeeCode}</div>
                    </td>
                    <td>{req.departmentName || 'General'}</td>
                    <td><span className="badge badge-secondary">{req.leaveTypeCode}</span></td>
                    <td style={{ fontSize: '0.85rem' }}>
                      {new Date(req.startDate).toLocaleDateString()} - {new Date(req.endDate).toLocaleDateString()}
                    </td>
                    <td><strong>{req.duration}</strong> {req.unit?.toLowerCase() || 'days'}</td>
                    <td style={{ fontSize: '0.85rem', maxWidth: '200px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {req.reason}
                    </td>
                    <td style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                      {new Date(req.submittedAt || req.createdAt).toLocaleDateString()}
                    </td>
                    {activeTab === 'PENDING' && (
                      <td>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                          <button
                            onClick={() => { setSelectedReq(req); setShowApproveModal(true); }}
                            className="btn btn-sm btn-success"
                            style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}
                          >
                            <Check size={14} /> Approve
                          </button>
                          <button
                            onClick={() => { setSelectedReq(req); setShowRejectModal(true); }}
                            className="btn btn-sm btn-outline-danger"
                            style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}
                          >
                            <X size={14} /> Reject
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Approval Modal */}
      {showApproveModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.6)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000
        }}>
          <div className="card" style={{ width: '450px', padding: '2rem' }}>
            <h3 style={{ fontSize: '1.2rem', fontWeight: '600', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <CheckCircle size={20} color="#4ade80" /> Approve Leave Request
            </h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>
              Approve request <strong>{selectedReq?.requestNumber}</strong> for {selectedReq?.employeeName} ({selectedReq?.duration} days).
              Approving will consume balance from the ledger and trigger shift/attendance reconciliation.
            </p>

            <div className="form-group" style={{ marginBottom: '1.5rem' }}>
              <label className="form-label">Approval Comments / Note (Optional)</label>
              <textarea
                className="form-control"
                rows={2}
                placeholder="Approved according to department roster requirements..."
                value={approvalNotes}
                onChange={(e) => setApprovalNotes(e.target.value)}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
              <button className="btn btn-secondary" onClick={() => setShowApproveModal(false)}>Cancel</button>
              <button className="btn btn-success" onClick={handleApprove} disabled={actionLoading}>
                {actionLoading ? 'Approving...' : 'Confirm Approval'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Rejection Modal */}
      {showRejectModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.6)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000
        }}>
          <div className="card" style={{ width: '450px', padding: '2rem' }}>
            <h3 style={{ fontSize: '1.2rem', fontWeight: '600', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <XCircle size={20} color="#f87171" /> Reject Leave Request
            </h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>
              Reject request <strong>{selectedReq?.requestNumber}</strong> for {selectedReq?.employeeName}.
              Reserved pending days will be returned to the employee's available balance.
            </p>

            <div className="form-group" style={{ marginBottom: '1.5rem' }}>
              <label className="form-label">Mandatory Rejection Reason *</label>
              <textarea
                className="form-control"
                rows={3}
                required
                placeholder="State the operational reason for rejecting this leave..."
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
              <button className="btn btn-secondary" onClick={() => setShowRejectModal(false)}>Cancel</button>
              <button className="btn btn-danger" onClick={handleReject} disabled={actionLoading || !rejectionReason.trim()}>
                {actionLoading ? 'Rejecting...' : 'Confirm Rejection'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LeaveApprovalsPage;
