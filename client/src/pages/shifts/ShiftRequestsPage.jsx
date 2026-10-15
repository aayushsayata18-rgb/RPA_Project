import React, { useState, useEffect } from 'react';
import {
  Repeat,
  ArrowRightLeft,
  Check,
  X,
  Clock,
  User,
  Filter,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import shiftService from '../../services/shiftService';

export const ShiftRequestsPage = () => {
  const [activeTab, setActiveTab] = useState('CHANGES'); // 'CHANGES' or 'SWAPS'
  const [changeRequests, setChangeRequests] = useState([]);
  const [swapRequests, setSwapRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    fetchRequests();
  }, [activeTab]);

  const fetchRequests = async () => {
    try {
      setLoading(true);
      if (activeTab === 'CHANGES') {
        const res = await shiftService.getChangeRequests();
        setChangeRequests(res.data?.requests || []);
      } else {
        const res = await shiftService.getSwapRequests();
        setSwapRequests(res.data?.swaps || []);
      }
    } catch (err) {
      console.error('Failed to load requests:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleApproveChange = async (id) => {
    const comments = prompt('Enter approval comments (optional):') || 'Approved';
    setActionLoading(true);
    try {
      await shiftService.approveChangeRequest(id, { comments });
      fetchRequests();
    } catch (err) {
      alert(err.response?.data?.error || err.message || 'Approval failed');
    } finally {
      setActionLoading(false);
    }
  };

  const handleRejectChange = async (id) => {
    const comments = prompt('Enter rejection reason:') || 'Operational constraints';
    setActionLoading(true);
    try {
      await shiftService.rejectChangeRequest(id, { comments });
      fetchRequests();
    } catch (err) {
      alert(err.response?.data?.error || err.message || 'Rejection failed');
    } finally {
      setActionLoading(false);
    }
  };

  const handlePeerAcceptSwap = async (id) => {
    setActionLoading(true);
    try {
      await shiftService.acceptSwapTarget(id, { comments: 'Accepted by peer' });
      fetchRequests();
    } catch (err) {
      alert(err.response?.data?.error || err.message || 'Accept failed');
    } finally {
      setActionLoading(false);
    }
  };

  const handleApproveSwap = async (id) => {
    const comments = prompt('Supervisor approval comments:') || 'Approved by Supervisor';
    setActionLoading(true);
    try {
      await shiftService.approveSwap(id, { comments });
      fetchRequests();
    } catch (err) {
      alert(err.response?.data?.error || err.message || 'Approval failed');
    } finally {
      setActionLoading(false);
    }
  };

  const handleRejectSwap = async (id) => {
    const comments = prompt('Supervisor rejection reason:') || 'Rejected';
    setActionLoading(true);
    try {
      await shiftService.rejectSwap(id, { comments });
      fetchRequests();
    } catch (err) {
      alert(err.response?.data?.error || err.message || 'Rejection failed');
    } finally {
      setActionLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'APPROVED':
      case 'COMPLETED':
        return 'badge-success';
      case 'PENDING_APPROVAL':
        return 'badge-warning';
      case 'PENDING_TARGET_ACCEPTANCE':
        return 'badge-info';
      case 'REJECTED':
        return 'badge-danger';
      default:
        return 'badge-secondary';
    }
  };

  return (
    <div className="portal-content" style={{ padding: '1.5rem', maxWidth: '1400px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom: '1.5rem' }}>
        <h1 style={{ fontSize: '1.75rem', fontWeight: '700', color: '#f8fafc', margin: 0 }}>
          Shift Requests & Peer Swaps
        </h1>
        <p style={{ color: '#94a3b8', fontSize: '0.9rem', marginTop: '0.25rem' }}>
          Review employee shift modification requests and peer-to-peer swap approvals.
        </p>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '1rem', borderBottom: '1px solid var(--border-color)', marginBottom: '1.5rem' }}>
        <button
          onClick={() => setActiveTab('CHANGES')}
          style={{
            padding: '0.75rem 1.25rem',
            background: 'none',
            border: 'none',
            borderBottom: activeTab === 'CHANGES' ? '3px solid #38bdf8' : '3px solid transparent',
            color: activeTab === 'CHANGES' ? '#38bdf8' : '#94a3b8',
            fontWeight: activeTab === 'CHANGES' ? '700' : '500',
            cursor: 'pointer',
            fontSize: '0.95rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}
        >
          <Repeat size={18} />
          <span>Shift Change Requests</span>
        </button>

        <button
          onClick={() => setActiveTab('SWAPS')}
          style={{
            padding: '0.75rem 1.25rem',
            background: 'none',
            border: 'none',
            borderBottom: activeTab === 'SWAPS' ? '3px solid #38bdf8' : '3px solid transparent',
            color: activeTab === 'SWAPS' ? '#38bdf8' : '#94a3b8',
            fontWeight: activeTab === 'SWAPS' ? '700' : '500',
            cursor: 'pointer',
            fontSize: '0.95rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}
        >
          <ArrowRightLeft size={18} />
          <span>Peer Shift Swaps</span>
        </button>
      </div>

      {/* Tab 1: Change Requests */}
      {activeTab === 'CHANGES' && (
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <table className="table" style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: 'rgba(30, 41, 59, 0.7)', borderBottom: '1px solid var(--border-color)' }}>
                <th style={{ padding: '0.85rem 1rem', textAlign: 'left', color: '#94a3b8' }}>ID</th>
                <th style={{ padding: '0.85rem 1rem', textAlign: 'left', color: '#94a3b8' }}>Employee</th>
                <th style={{ padding: '0.85rem 1rem', textAlign: 'left', color: '#94a3b8' }}>Current &rarr; Requested</th>
                <th style={{ padding: '0.85rem 1rem', textAlign: 'left', color: '#94a3b8' }}>Effective Date</th>
                <th style={{ padding: '0.85rem 1rem', textAlign: 'left', color: '#94a3b8' }}>Reason</th>
                <th style={{ padding: '0.85rem 1rem', textAlign: 'left', color: '#94a3b8' }}>Status</th>
                <th style={{ padding: '0.85rem 1rem', textAlign: 'center', color: '#94a3b8' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: '2rem', color: '#94a3b8' }}>
                    Loading change requests...
                  </td>
                </tr>
              ) : changeRequests.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: '2rem', color: '#94a3b8' }}>
                    No shift change requests found.
                  </td>
                </tr>
              ) : (
                changeRequests.map((r) => (
                  <tr key={r._id} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.05)' }}>
                    <td style={{ padding: '0.85rem 1rem', fontWeight: '700', color: '#38bdf8' }}>{r.requestId}</td>
                    <td style={{ padding: '0.85rem 1rem', color: '#f1f5f9' }}>
                      <div>{r.employeeId ? `${r.employeeId.firstName} ${r.employeeId.lastName}` : r.employeeIdCode}</div>
                      <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>{r.employeeIdCode}</div>
                    </td>
                    <td style={{ padding: '0.85rem 1rem' }}>
                      <span className="badge badge-secondary">{r.currentShiftCode}</span>
                      <span style={{ margin: '0 0.5rem', color: '#94a3b8' }}>&rarr;</span>
                      <span className="badge badge-info">{r.requestedShiftCode}</span>
                    </td>
                    <td style={{ padding: '0.85rem 1rem', color: '#f1f5f9' }}>
                      {new Date(r.effectiveDate).toLocaleDateString()}
                    </td>
                    <td style={{ padding: '0.85rem 1rem', color: '#cbd5e1', fontSize: '0.85rem' }}>{r.reason}</td>
                    <td style={{ padding: '0.85rem 1rem' }}>
                      <span className={`badge ${getStatusBadge(r.status)}`}>{r.status}</span>
                    </td>
                    <td style={{ padding: '0.85rem 1rem', textAlign: 'center' }}>
                      {r.status === 'PENDING_APPROVAL' ? (
                        <div style={{ display: 'flex', gap: '0.4rem', justifyContent: 'center' }}>
                          <button
                            onClick={() => handleApproveChange(r.requestId)}
                            disabled={actionLoading}
                            className="btn btn-sm btn-success"
                            title="Approve Change"
                          >
                            <Check size={14} />
                          </button>
                          <button
                            onClick={() => handleRejectChange(r.requestId)}
                            disabled={actionLoading}
                            className="btn btn-sm btn-outline-danger"
                            title="Reject Change"
                          >
                            <X size={14} />
                          </button>
                        </div>
                      ) : (
                        <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Reviewed</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Tab 2: Peer Swap Requests */}
      {activeTab === 'SWAPS' && (
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <table className="table" style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: 'rgba(30, 41, 59, 0.7)', borderBottom: '1px solid var(--border-color)' }}>
                <th style={{ padding: '0.85rem 1rem', textAlign: 'left', color: '#94a3b8' }}>Swap ID</th>
                <th style={{ padding: '0.85rem 1rem', textAlign: 'left', color: '#94a3b8' }}>Requester Staff</th>
                <th style={{ padding: '0.85rem 1rem', textAlign: 'left', color: '#94a3b8' }}>Target Staff</th>
                <th style={{ padding: '0.85rem 1rem', textAlign: 'left', color: '#94a3b8' }}>Reason</th>
                <th style={{ padding: '0.85rem 1rem', textAlign: 'left', color: '#94a3b8' }}>Status</th>
                <th style={{ padding: '0.85rem 1rem', textAlign: 'center', color: '#94a3b8' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: '2rem', color: '#94a3b8' }}>
                    Loading swap requests...
                  </td>
                </tr>
              ) : swapRequests.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: '2rem', color: '#94a3b8' }}>
                    No shift swap requests found.
                  </td>
                </tr>
              ) : (
                swapRequests.map((s) => (
                  <tr key={s._id} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.05)' }}>
                    <td style={{ padding: '0.85rem 1rem', fontWeight: '700', color: '#38bdf8' }}>{s.swapId}</td>
                    <td style={{ padding: '0.85rem 1rem', color: '#f1f5f9' }}>
                      <div>{s.requesterEmployeeId ? `${s.requesterEmployeeId.firstName} ${s.requesterEmployeeId.lastName}` : s.requesterEmployeeCode}</div>
                      <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                        {s.requesterEmployeeCode} ({s.requesterAssignmentId?.shiftCode})
                      </div>
                    </td>
                    <td style={{ padding: '0.85rem 1rem', color: '#f1f5f9' }}>
                      <div>{s.targetEmployeeId ? `${s.targetEmployeeId.firstName} ${s.targetEmployeeId.lastName}` : s.targetEmployeeCode}</div>
                      <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                        {s.targetEmployeeCode} ({s.targetAssignmentId?.shiftCode})
                      </div>
                    </td>
                    <td style={{ padding: '0.85rem 1rem', color: '#cbd5e1', fontSize: '0.85rem' }}>{s.reason}</td>
                    <td style={{ padding: '0.85rem 1rem' }}>
                      <span className={`badge ${getStatusBadge(s.status)}`}>{s.status}</span>
                    </td>
                    <td style={{ padding: '0.85rem 1rem', textAlign: 'center' }}>
                      {s.status === 'PENDING_TARGET_ACCEPTANCE' && (
                        <button
                          onClick={() => handlePeerAcceptSwap(s.swapId)}
                          disabled={actionLoading}
                          className="btn btn-sm btn-info"
                        >
                          Peer Accept
                        </button>
                      )}
                      {s.status === 'PENDING_APPROVAL' && (
                        <div style={{ display: 'flex', gap: '0.4rem', justifyContent: 'center' }}>
                          <button
                            onClick={() => handleApproveSwap(s.swapId)}
                            disabled={actionLoading}
                            className="btn btn-sm btn-success"
                            title="Approve Swap"
                          >
                            <Check size={14} />
                          </button>
                          <button
                            onClick={() => handleRejectSwap(s.swapId)}
                            disabled={actionLoading}
                            className="btn btn-sm btn-outline-danger"
                            title="Reject Swap"
                          >
                            <X size={14} />
                          </button>
                        </div>
                      )}
                      {s.status === 'COMPLETED' && (
                        <span style={{ fontSize: '0.8rem', color: '#34d399' }}>Completed</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default ShiftRequestsPage;
