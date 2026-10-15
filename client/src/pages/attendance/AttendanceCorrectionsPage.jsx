import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { attendanceService } from '../../services/attendanceService';
import { AttendanceStatusBadge } from '../../components/attendance/AttendanceStatusBadge';
import {
  FileCheck,
  Check,
  X,
  AlertCircle,
  Clock,
  User,
  Filter,
  RefreshCw,
  MessageSquare
} from 'lucide-react';

export const AttendanceCorrectionsPage = () => {
  const [requests, setRequests] = useState([]);
  const [statusFilter, setStatusFilter] = useState('PENDING');
  const [loading, setLoading] = useState(true);

  // Review Dialog State
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [actionType, setActionType] = useState(null); // 'APPROVE' or 'REJECT'
  const [reviewerComments, setReviewerComments] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState(null);

  const fetchCorrections = async () => {
    setLoading(true);
    try {
      const res = await attendanceService.getCorrections({
        status: statusFilter === 'ALL' ? undefined : statusFilter
      });
      setRequests(res.data?.requests || []);
    } catch (err) {
      console.error('Failed to load corrections queue:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCorrections();
  }, [statusFilter]);

  const handleOpenAction = (req, type) => {
    setSelectedRequest(req);
    setActionType(type);
    setReviewerComments(type === 'APPROVE' ? 'Approved based on verified attendance justification.' : '');
    setActionError(null);
  };

  const handleCloseAction = () => {
    setSelectedRequest(null);
    setActionType(null);
    setReviewerComments('');
    setActionError(null);
  };

  const handleConfirmAction = async (e) => {
    e.preventDefault();
    if (actionType === 'REJECT' && (!reviewerComments || reviewerComments.trim().length < 3)) {
      setActionError('Reviewer comments are mandatory when rejecting a correction request.');
      return;
    }

    setActionLoading(true);
    setActionError(null);

    try {
      if (actionType === 'APPROVE') {
        await attendanceService.approveCorrection(selectedRequest.requestId || selectedRequest._id, {
          reviewerComments: reviewerComments.trim()
        });
      } else {
        await attendanceService.rejectCorrection(selectedRequest.requestId || selectedRequest._id, {
          reviewerComments: reviewerComments.trim()
        });
      }

      handleCloseAction();
      fetchCorrections();
    } catch (err) {
      setActionError(err.response?.data?.message || err.message || 'Action failed.');
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="portal-page" style={{ padding: '2rem' }}>
      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '1.5rem',
          flexWrap: 'wrap',
          gap: '1rem'
        }}
      >
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: '700', color: '#f8fafc', margin: 0 }}>
            Attendance Correction Queue
          </h1>
          <p style={{ color: '#94a3b8', fontSize: '0.9rem', marginTop: '0.25rem' }}>
            Review, approve or reject staff punch dispute requests with full audit preservation.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            style={{
              padding: '0.55rem 0.85rem',
              borderRadius: '8px',
              background: 'var(--bg-card, #1e293b)',
              border: '1px solid var(--border-color, #334155)',
              color: '#f8fafc',
              fontSize: '0.875rem'
            }}
          >
            <option value="PENDING">Pending Review</option>
            <option value="APPROVED">Approved</option>
            <option value="REJECTED">Rejected</option>
            <option value="ALL">All Requests</option>
          </select>

          <button
            onClick={fetchCorrections}
            title="Refresh"
            style={{
              padding: '0.55rem 0.75rem',
              borderRadius: '8px',
              background: 'var(--bg-card, #1e293b)',
              border: '1px solid var(--border-color, #334155)',
              color: '#f8fafc',
              cursor: 'pointer'
            }}
          >
            <RefreshCw style={{ width: '16px', height: '16px' }} />
          </button>
        </div>
      </div>

      {/* Main Table */}
      <div
        className="card"
        style={{
          background: 'var(--bg-card, #1e293b)',
          border: '1px solid var(--border-color, #334155)',
          borderRadius: '12px',
          overflow: 'hidden'
        }}
      >
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
            <thead>
              <tr style={{ background: 'rgba(15, 23, 42, 0.7)', borderBottom: '1px solid var(--border-color, #334155)' }}>
                <th style={{ padding: '0.85rem 1.25rem', color: '#94a3b8' }}>Request ID</th>
                <th style={{ padding: '0.85rem 1.25rem', color: '#94a3b8' }}>Staff Member</th>
                <th style={{ padding: '0.85rem 1.25rem', color: '#94a3b8' }}>Attendance Date</th>
                <th style={{ padding: '0.85rem 1.25rem', color: '#94a3b8' }}>Original Punch</th>
                <th style={{ padding: '0.85rem 1.25rem', color: '#94a3b8' }}>Requested Punch</th>
                <th style={{ padding: '0.85rem 1.25rem', color: '#94a3b8' }}>Justification Reason</th>
                <th style={{ padding: '0.85rem 1.25rem', color: '#94a3b8' }}>Status</th>
                <th style={{ padding: '0.85rem 1.25rem', color: '#94a3b8', textAlign: 'center' }}>Review Action</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="8" style={{ padding: '3rem', textAlign: 'center', color: '#94a3b8' }}>
                    Loading correction queue...
                  </td>
                </tr>
              ) : requests.length === 0 ? (
                <tr>
                  <td colSpan="8" style={{ padding: '3rem', textAlign: 'center', color: '#94a3b8' }}>
                    No correction requests found for the selected filter.
                  </td>
                </tr>
              ) : (
                requests.map((req) => (
                  <tr
                    key={req._id || req.requestId}
                    style={{ borderBottom: '1px solid var(--border-color, #334155)' }}
                  >
                    <td style={{ padding: '0.85rem 1.25rem', color: '#38bdf8', fontWeight: '600' }}>
                      {req.requestId}
                    </td>
                    <td style={{ padding: '0.85rem 1.25rem' }}>
                      <div style={{ color: '#f8fafc', fontWeight: '500' }}>
                        {req.employeeId ? `${req.employeeId.firstName} ${req.employeeId.lastName}` : req.employeeIdCode}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                        {req.employeeId?.employeeId || req.employeeIdCode}
                      </div>
                    </td>
                    <td style={{ padding: '0.85rem 1.25rem', color: '#f8fafc' }}>
                      {req.attendanceId?.attendanceDate
                        ? new Date(req.attendanceId.attendanceDate).toLocaleDateString()
                        : '—'}
                    </td>
                    <td style={{ padding: '0.85rem 1.25rem', fontSize: '0.8rem', color: '#ef4444' }}>
                      <div>IN: {req.originalValues?.checkIn ? new Date(req.originalValues.checkIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Missing'}</div>
                      <div>OUT: {req.originalValues?.checkOut ? new Date(req.originalValues.checkOut).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Missing'}</div>
                    </td>
                    <td style={{ padding: '0.85rem 1.25rem', fontSize: '0.8rem', color: '#10b981', fontWeight: '500' }}>
                      <div>IN: {req.requestedValues?.checkIn ? new Date(req.requestedValues.checkIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Keep Original'}</div>
                      <div>OUT: {req.requestedValues?.checkOut ? new Date(req.requestedValues.checkOut).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Keep Original'}</div>
                    </td>
                    <td style={{ padding: '0.85rem 1.25rem', maxWidth: '280px' }}>
                      <p style={{ margin: 0, color: '#cbd5e1', fontSize: '0.85rem' }}>{req.reason}</p>
                      {req.reviewerComments && (
                        <p style={{ margin: '0.25rem 0 0', fontSize: '0.75rem', color: '#94a3b8' }}>
                          <em>Review: {req.reviewerComments}</em>
                        </p>
                      )}
                    </td>
                    <td style={{ padding: '0.85rem 1.25rem' }}>
                      <AttendanceStatusBadge status={req.status} />
                    </td>
                    <td style={{ padding: '0.85rem 1.25rem', textAlign: 'center' }}>
                      {req.status === 'PENDING' ? (
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                          <button
                            onClick={() => handleOpenAction(req, 'APPROVE')}
                            title="Approve Correction"
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '0.35rem',
                              padding: '0.4rem 0.75rem',
                              borderRadius: '6px',
                              background: '#10b981',
                              color: '#ffffff',
                              border: 'none',
                              fontSize: '0.8rem',
                              fontWeight: '600',
                              cursor: 'pointer'
                            }}
                          >
                            <Check style={{ width: '14px', height: '14px' }} />
                            Approve
                          </button>
                          <button
                            onClick={() => handleOpenAction(req, 'REJECT')}
                            title="Reject Correction"
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '0.35rem',
                              padding: '0.4rem 0.75rem',
                              borderRadius: '6px',
                              background: '#ef4444',
                              color: '#ffffff',
                              border: 'none',
                              fontSize: '0.8rem',
                              fontWeight: '600',
                              cursor: 'pointer'
                            }}
                          >
                            <X style={{ width: '14px', height: '14px' }} />
                            Reject
                          </button>
                        </div>
                      ) : (
                        <span style={{ fontSize: '0.75rem', color: '#64748b' }}>
                          Reviewed by {req.reviewedByName || 'HR'}
                        </span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Review Confirmation Modal */}
      {selectedRequest && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.75)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: '1rem'
          }}
        >
          <div
            className="card"
            style={{
              width: '100%',
              maxWidth: '500px',
              background: 'var(--bg-card, #1e293b)',
              border: '1px solid var(--border-color, #334155)',
              borderRadius: '12px',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.5)',
              overflow: 'hidden'
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '1.25rem 1.5rem',
                borderBottom: '1px solid var(--border-color, #334155)'
              }}
            >
              <h3 style={{ margin: 0, fontSize: '1.15rem', color: '#f8fafc' }}>
                {actionType === 'APPROVE' ? 'Approve Correction Request' : 'Reject Correction Request'}
              </h3>
              <button
                onClick={handleCloseAction}
                style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}
              >
                <X style={{ width: '20px', height: '20px' }} />
              </button>
            </div>

            <form onSubmit={handleConfirmAction} style={{ padding: '1.5rem' }}>
              {actionError && (
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.75rem',
                    padding: '0.75rem 1rem',
                    backgroundColor: 'rgba(239, 68, 68, 0.15)',
                    color: '#ef4444',
                    borderRadius: '8px',
                    marginBottom: '1rem',
                    fontSize: '0.85rem'
                  }}
                >
                  <AlertCircle style={{ width: '18px', height: '18px', flexShrink: 0 }} />
                  <span>{actionError}</span>
                </div>
              )}

              <p style={{ margin: '0 0 1rem', fontSize: '0.875rem', color: '#cbd5e1' }}>
                {actionType === 'APPROVE'
                  ? `You are approving correction ${selectedRequest.requestId}. The normalized attendance record will be recalculated and updated, preserving previous values in the audit trail.`
                  : `You are rejecting correction ${selectedRequest.requestId}. The original attendance record will remain unchanged.`}
              </p>

              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', fontSize: '0.8rem', color: '#94a3b8', marginBottom: '0.35rem' }}>
                  Reviewer Justification Comments {actionType === 'REJECT' && <span style={{ color: '#ef4444' }}>*</span>}
                </label>
                <textarea
                  rows="3"
                  value={reviewerComments}
                  onChange={(e) => setReviewerComments(e.target.value)}
                  placeholder="Provide approval basis or rejection grounds..."
                  required={actionType === 'REJECT'}
                  style={{
                    width: '100%',
                    padding: '0.6rem 0.75rem',
                    borderRadius: '6px',
                    background: 'var(--bg-input, #0f172a)',
                    border: '1px solid var(--border-color, #334155)',
                    color: '#f8fafc',
                    fontSize: '0.85rem',
                    resize: 'vertical'
                  }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                <button
                  type="button"
                  onClick={handleCloseAction}
                  disabled={actionLoading}
                  style={{
                    padding: '0.5rem 1rem',
                    borderRadius: '6px',
                    background: '#334155',
                    color: '#f8fafc',
                    border: 'none',
                    cursor: 'pointer'
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  style={{
                    padding: '0.5rem 1.25rem',
                    borderRadius: '6px',
                    background: actionType === 'APPROVE' ? '#10b981' : '#ef4444',
                    color: '#ffffff',
                    border: 'none',
                    fontWeight: '600',
                    cursor: 'pointer'
                  }}
                >
                  {actionLoading ? 'Processing...' : `Confirm ${actionType === 'APPROVE' ? 'Approval' : 'Rejection'}`}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AttendanceCorrectionsPage;
