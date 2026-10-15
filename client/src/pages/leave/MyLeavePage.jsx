import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Calendar,
  Clock,
  PlusCircle,
  XCircle,
  AlertCircle,
  CheckCircle,
  Undo2,
  FileText
} from 'lucide-react';
import leaveService from '../../services/leaveService';
import { useAuth } from '../../context/AuthContext';

export const MyLeavePage = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [employeeInfo, setEmployeeInfo] = useState(null);
  const [balances, setBalances] = useState([]);
  const [requests, setRequests] = useState([]);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [cancelReason, setCancelReason] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [alertMsg, setAlertMsg] = useState(null);

  useEffect(() => {
    fetchMyLeave();
  }, []);

  const fetchMyLeave = async () => {
    try {
      setLoading(true);
      const res = await leaveService.getMyLeave();
      setEmployeeInfo(res.data?.employee || {});
      setBalances(res.data?.balances || []);
      setRequests(res.data?.requests || []);
    } catch (err) {
      console.error('Failed to load employee leave details:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleWithdraw = async (requestId) => {
    if (!window.confirm('Are you sure you want to withdraw this pending leave request?')) return;
    try {
      setActionLoading(true);
      await leaveService.withdrawLeaveRequest(requestId);
      setAlertMsg({ type: 'success', text: 'Leave request withdrawn successfully.' });
      fetchMyLeave();
    } catch (err) {
      setAlertMsg({ type: 'danger', text: err.response?.data?.error || err.message });
    } finally {
      setActionLoading(false);
    }
  };

  const handleCancelSubmit = async (e) => {
    e.preventDefault();
    if (!selectedRequest || !cancelReason.trim()) return;

    try {
      setActionLoading(true);
      await leaveService.requestCancellation(selectedRequest._id, { reason: cancelReason });
      setAlertMsg({ type: 'success', text: 'Cancellation request submitted for supervisor review.' });
      setShowCancelModal(false);
      setCancelReason('');
      fetchMyLeave();
    } catch (err) {
      setAlertMsg({ type: 'danger', text: err.response?.data?.error || err.message });
    } finally {
      setActionLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'APPROVED':
        return <span className="badge badge-success">Approved</span>;
      case 'PENDING':
        return <span className="badge badge-warning">Pending</span>;
      case 'REJECTED':
        return <span className="badge badge-danger">Rejected</span>;
      case 'CANCEL_REQUESTED':
        return <span className="badge badge-warning">Cancel Requested</span>;
      case 'CANCELLED':
        return <span className="badge badge-secondary">Cancelled</span>;
      case 'WITHDRAWN':
        return <span className="badge badge-secondary">Withdrawn</span>;
      default:
        return <span className="badge badge-secondary">{status}</span>;
    }
  };

  return (
    <div className="container" style={{ padding: '2rem' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '0.25rem' }}>
            My Leave Portal & Balances
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
            View your real-time leave entitlement balances, submit requests, and monitor approval statuses.
          </p>
        </div>
        <div>
          <Link to="/leave/request" className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <PlusCircle size={18} /> Apply For Leave
          </Link>
        </div>
      </div>

      {alertMsg && (
        <div className={`alert alert-${alertMsg.type}`} style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between' }}>
          <span>{alertMsg.text}</span>
          <button onClick={() => setAlertMsg(null)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>×</button>
        </div>
      )}

      {/* Leave Balance Cards */}
      <h3 style={{ fontSize: '1.15rem', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '1rem' }}>
        Current Leave Balances ({new Date().getFullYear()})
      </h3>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
        {balances.map(b => (
          <div key={b._id} className="card" style={{ padding: '1.25rem', borderTop: `4px solid ${b.leaveType?.colorCode || '#38bdf8'}` }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontWeight: '600', fontSize: '0.95rem' }}>{b.leaveType?.name || b.leaveTypeCode}</span>
              <span className="badge badge-secondary">{b.leaveTypeCode}</span>
            </div>

            <div style={{ marginTop: '1rem', marginBottom: '0.75rem' }}>
              <div style={{ fontSize: '2rem', fontWeight: '700', color: b.available > 0 ? '#38bdf8' : 'var(--text-muted)' }}>
                {b.available}
                <span style={{ fontSize: '0.85rem', fontWeight: '400', color: 'var(--text-secondary)', marginLeft: '0.35rem' }}>days available</span>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', fontSize: '0.8rem', color: 'var(--text-secondary)', borderTop: '1px solid var(--border-color)', paddingTop: '0.75rem' }}>
              <div>Opening: <strong>{b.openingBalance}</strong></div>
              <div>Accrued: <strong>{b.accrued}</strong></div>
              <div>Used: <strong style={{ color: '#f87171' }}>{b.used}</strong></div>
              <div>Pending: <strong style={{ color: '#f59e0b' }}>{b.pending}</strong></div>
            </div>
          </div>
        ))}
      </div>

      {/* My Leave Requests History */}
      <div className="card" style={{ padding: '1.5rem' }}>
        <h3 style={{ fontSize: '1.15rem', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '1.25rem' }}>
          My Leave Request History
        </h3>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)' }}>Loading your leave requests...</div>
        ) : requests.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>You have not submitted any leave requests yet.</div>
        ) : (
          <div className="table-responsive">
            <table className="table" style={{ width: '100%' }}>
              <thead>
                <tr>
                  <th>Request #</th>
                  <th>Leave Type</th>
                  <th>Dates</th>
                  <th>Duration</th>
                  <th>Reason</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {requests.map(req => (
                  <tr key={req._id}>
                    <td style={{ fontWeight: '600' }}>{req.requestNumber}</td>
                    <td><span className="badge badge-secondary">{req.leaveTypeCode}</span></td>
                    <td style={{ fontSize: '0.85rem' }}>
                      {new Date(req.startDate).toLocaleDateString()} - {new Date(req.endDate).toLocaleDateString()}
                    </td>
                    <td><strong>{req.duration}</strong> {req.unit?.toLowerCase() || 'days'}</td>
                    <td style={{ fontSize: '0.85rem', maxWidth: '250px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {req.reason}
                    </td>
                    <td>{getStatusBadge(req.status)}</td>
                    <td>
                      {req.status === 'PENDING' && (
                        <button
                          onClick={() => handleWithdraw(req._id)}
                          className="btn btn-sm btn-outline-danger"
                          disabled={actionLoading}
                          style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}
                        >
                          <Undo2 size={14} /> Withdraw
                        </button>
                      )}
                      {req.status === 'APPROVED' && (
                        <button
                          onClick={() => { setSelectedRequest(req); setShowCancelModal(true); }}
                          className="btn btn-sm btn-outline-secondary"
                          disabled={actionLoading}
                          style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}
                        >
                          <XCircle size={14} /> Cancel
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Cancellation Modal */}
      {showCancelModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.6)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000
        }}>
          <div className="card" style={{ width: '450px', padding: '2rem' }}>
            <h3 style={{ fontSize: '1.2rem', fontWeight: '600', marginBottom: '1rem' }}>
              Request Leave Cancellation
            </h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>
              Submitting cancellation for request <strong>{selectedRequest?.requestNumber}</strong> ({selectedRequest?.duration} days).
              Upon manager approval, consumed balance will be returned to your ledger.
            </p>

            <form onSubmit={handleCancelSubmit}>
              <div className="form-group" style={{ marginBottom: '1.25rem' }}>
                <label className="form-label">Cancellation Reason *</label>
                <textarea
                  className="form-control"
                  rows={3}
                  required
                  placeholder="Explain why you wish to cancel this approved leave..."
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowCancelModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={actionLoading}>
                  {actionLoading ? 'Submitting...' : 'Submit Cancellation'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default MyLeavePage;
