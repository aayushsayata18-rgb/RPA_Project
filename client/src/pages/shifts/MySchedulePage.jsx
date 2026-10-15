import React, { useState, useEffect } from 'react';
import {
  Calendar,
  Clock,
  Repeat,
  ArrowRightLeft,
  Moon,
  Sun,
  CheckCircle,
  AlertCircle,
  X
} from 'lucide-react';
import shiftService from '../../services/shiftService';

export const MySchedulePage = () => {
  const [schedule, setSchedule] = useState(null);
  const [loading, setLoading] = useState(true);
  const [shifts, setShifts] = useState([]);

  // Modals
  const [showChangeModal, setShowChangeModal] = useState(false);
  const [showSwapModal, setShowSwapModal] = useState(false);
  const [selectedAssignment, setSelectedAssignment] = useState(null);

  const [changeForm, setChangeForm] = useState({
    requestedShiftId: '',
    reason: ''
  });

  const [swapForm, setSwapForm] = useState({
    targetEmployeeId: '',
    targetAssignmentId: '',
    reason: ''
  });

  const [actionLoading, setActionLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState(null);

  useEffect(() => {
    fetchMySchedule();
    loadShiftDefinitions();
  }, []);

  const fetchMySchedule = async () => {
    try {
      setLoading(true);
      const res = await shiftService.getMySchedule();
      setSchedule(res.data);
    } catch (err) {
      console.error('Failed to load employee schedule:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadShiftDefinitions = async () => {
    try {
      const res = await shiftService.getDefinitions({ status: 'ACTIVE' });
      setShifts(res.data?.shifts || []);
    } catch (err) {}
  };

  const handleOpenChangeModal = (assignment) => {
    setSelectedAssignment(assignment);
    setChangeForm({
      requestedShiftId: shifts[0]?.shiftCode || 'MORNING',
      reason: ''
    });
    setShowChangeModal(true);
  };

  const handleOpenSwapModal = (assignment) => {
    setSelectedAssignment(assignment);
    setSwapForm({
      targetEmployeeId: '',
      targetAssignmentId: '',
      reason: ''
    });
    setShowSwapModal(true);
  };

  const handleSubmitChange = async (e) => {
    e.preventDefault();
    if (!selectedAssignment) return;
    setActionLoading(true);
    try {
      await shiftService.createChangeRequest({
        assignmentId: selectedAssignment._id,
        requestedShiftId: changeForm.requestedShiftId,
        reason: changeForm.reason
      });
      setShowChangeModal(false);
      setStatusMessage({ type: 'success', text: 'Shift change request submitted to your supervisor.' });
      fetchMySchedule();
    } catch (err) {
      alert(err.response?.data?.error || err.message || 'Request failed');
    } finally {
      setActionLoading(false);
    }
  };

  const handleSubmitSwap = async (e) => {
    e.preventDefault();
    if (!selectedAssignment) return;
    setActionLoading(true);
    try {
      await shiftService.createSwapRequest({
        requesterAssignmentId: selectedAssignment._id,
        targetEmployeeId: swapForm.targetEmployeeId,
        targetAssignmentId: swapForm.targetAssignmentId,
        reason: swapForm.reason
      });
      setShowSwapModal(false);
      setStatusMessage({ type: 'success', text: 'Shift swap request sent to peer for acceptance.' });
      fetchMySchedule();
    } catch (err) {
      alert(err.response?.data?.error || err.message || 'Swap request failed');
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="portal-content" style={{ padding: '1.5rem', maxWidth: '1200px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom: '1.5rem' }}>
        <h1 style={{ fontSize: '1.75rem', fontWeight: '700', color: '#f8fafc', margin: 0 }}>
          My Shift Schedule
        </h1>
        <p style={{ color: '#94a3b8', fontSize: '0.9rem', marginTop: '0.25rem' }}>
          View your assigned shifts, upcoming schedules, and submit change or swap requests.
        </p>
      </div>

      {statusMessage && (
        <div
          style={{
            padding: '0.75rem 1rem',
            borderRadius: '6px',
            marginBottom: '1rem',
            background: statusMessage.type === 'success' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
            color: statusMessage.type === 'success' ? '#34d399' : '#fca5a5'
          }}
        >
          {statusMessage.text}
        </div>
      )}

      {/* Today's Shift Card */}
      <div
        className="card"
        style={{
          padding: '1.5rem',
          marginBottom: '2rem',
          background: 'linear-gradient(135deg, rgba(30, 41, 59, 0.9) 0%, rgba(15, 23, 42, 0.9) 100%)',
          border: '1px solid rgba(56, 189, 248, 0.3)',
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.3)'
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <div style={{ fontSize: '0.85rem', color: '#38bdf8', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Today's Scheduled Shift
            </div>
            {schedule?.today ? (
              <div style={{ marginTop: '0.5rem' }}>
                <h2 style={{ fontSize: '1.5rem', fontWeight: '700', color: '#f8fafc', margin: 0 }}>
                  {schedule.today.shiftId?.shiftName || schedule.today.shiftCode}
                </h2>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginTop: '0.35rem', color: '#cbd5e1' }}>
                  <Clock size={16} color="#38bdf8" />
                  <span>
                    {schedule.today.shiftId?.startTime} - {schedule.today.shiftId?.endTime}
                  </span>
                  {schedule.today.shiftId?.crossesMidnight && (
                    <span className="badge badge-warning" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.2rem' }}>
                      <Moon size={12} /> Overnight
                    </span>
                  )}
                </div>
                <div style={{ fontSize: '0.85rem', color: '#94a3b8', marginTop: '0.35rem' }}>
                  Department: {schedule.today.departmentId?.name || 'General Operations'}
                </div>
              </div>
            ) : (
              <div style={{ marginTop: '0.5rem', color: '#94a3b8' }}>
                <div style={{ fontSize: '1.25rem', fontWeight: '600', color: '#f1f5f9' }}>Scheduled OFF</div>
                <div style={{ fontSize: '0.85rem' }}>You have no scheduled shifts assigned for today.</div>
              </div>
            )}
          </div>

          {schedule?.today && (
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button
                onClick={() => handleOpenChangeModal(schedule.today)}
                className="btn btn-secondary btn-sm"
                style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}
              >
                <Repeat size={14} />
                <span>Request Change</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Upcoming Schedule */}
      <div className="card" style={{ padding: '1.5rem' }}>
        <h3 style={{ fontSize: '1.15rem', fontWeight: '600', color: '#f8fafc', marginBottom: '1.25rem' }}>
          Upcoming Work Schedule
        </h3>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '2rem', color: '#94a3b8' }}>Loading schedule...</div>
        ) : !schedule?.allAssignments?.length ? (
          <div style={{ textAlign: 'center', padding: '2rem', color: '#94a3b8' }}>
            No upcoming shifts scheduled.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {schedule.allAssignments.map((a) => (
              <div
                key={a._id}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '1rem',
                  background: 'rgba(30, 41, 59, 0.4)',
                  borderRadius: '8px',
                  border: '1px solid rgba(255, 255, 255, 0.05)'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <div
                    style={{
                      padding: '0.5rem 0.75rem',
                      background: 'rgba(56, 189, 248, 0.1)',
                      borderRadius: '6px',
                      textAlign: 'center',
                      minWidth: '70px'
                    }}
                  >
                    <div style={{ fontSize: '0.75rem', color: '#94a3b8', textTransform: 'uppercase' }}>
                      {new Date(a.assignmentDate).toLocaleDateString('en-US', { weekday: 'short' })}
                    </div>
                    <div style={{ fontSize: '1.1rem', fontWeight: '700', color: '#38bdf8' }}>
                      {new Date(a.assignmentDate).getDate()}
                    </div>
                  </div>

                  <div>
                    <div style={{ fontWeight: '600', color: '#f1f5f9' }}>
                      {a.shiftId?.shiftName || a.shiftCode}
                    </div>
                    <div style={{ fontSize: '0.8rem', color: '#94a3b8', marginTop: '0.2rem' }}>
                      {a.shiftId?.startTime} - {a.shiftId?.endTime} • {a.departmentId?.name || 'Department'}
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <button
                    onClick={() => handleOpenChangeModal(a)}
                    className="btn btn-sm btn-secondary"
                    title="Request Shift Change"
                  >
                    <Repeat size={14} /> Change
                  </button>
                  <button
                    onClick={() => handleOpenSwapModal(a)}
                    className="btn btn-sm btn-secondary"
                    title="Request Shift Swap"
                  >
                    <ArrowRightLeft size={14} /> Swap
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Change Request Modal */}
      {showChangeModal && selectedAssignment && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.7)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '1rem'
          }}
        >
          <div
            className="card"
            style={{
              width: '100%',
              maxWidth: '450px',
              padding: '1.5rem',
              background: '#0f172a',
              border: '1px solid rgba(255, 255, 255, 0.1)'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h3 style={{ margin: 0, color: '#f8fafc', fontSize: '1.15rem' }}>Request Shift Change</h3>
              <button
                onClick={() => setShowChangeModal(false)}
                style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}
              >
                <X size={18} />
              </button>
            </div>

            <div style={{ fontSize: '0.85rem', color: '#94a3b8', marginBottom: '1rem' }}>
              Date: <strong style={{ color: '#f1f5f9' }}>{new Date(selectedAssignment.assignmentDate).toLocaleDateString()}</strong>
              <br />
              Current Shift: <strong style={{ color: '#f1f5f9' }}>{selectedAssignment.shiftCode}</strong>
            </div>

            <form onSubmit={handleSubmitChange}>
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontSize: '0.8rem', color: '#94a3b8', marginBottom: '0.35rem' }}>
                  Requested Shift *
                </label>
                <select
                  className="input-field"
                  value={changeForm.requestedShiftId}
                  onChange={(e) => setChangeForm({ ...changeForm, requestedShiftId: e.target.value })}
                >
                  {shifts.map((s) => (
                    <option key={s._id} value={s.shiftCode}>
                      {s.shiftCode} ({s.startTime} - {s.endTime})
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ marginBottom: '1.25rem' }}>
                <label style={{ display: 'block', fontSize: '0.8rem', color: '#94a3b8', marginBottom: '0.35rem' }}>
                  Reason for Change *
                </label>
                <textarea
                  className="input-field"
                  rows={3}
                  required
                  value={changeForm.reason}
                  onChange={(e) => setChangeForm({ ...changeForm, reason: e.target.value })}
                  placeholder="Explain reason for schedule adjustment..."
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                <button
                  type="button"
                  onClick={() => setShowChangeModal(false)}
                  className="btn btn-secondary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="btn btn-primary"
                >
                  {actionLoading ? 'Submitting...' : 'Submit Request'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Swap Request Modal */}
      {showSwapModal && selectedAssignment && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.7)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '1rem'
          }}
        >
          <div
            className="card"
            style={{
              width: '100%',
              maxWidth: '480px',
              padding: '1.5rem',
              background: '#0f172a',
              border: '1px solid rgba(255, 255, 255, 0.1)'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h3 style={{ margin: 0, color: '#f8fafc', fontSize: '1.15rem' }}>Request Peer Shift Swap</h3>
              <button
                onClick={() => setShowSwapModal(false)}
                style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmitSwap}>
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontSize: '0.8rem', color: '#94a3b8', marginBottom: '0.35rem' }}>
                  Target Peer Employee ID *
                </label>
                <input
                  type="text"
                  className="input-field"
                  required
                  value={swapForm.targetEmployeeId}
                  onChange={(e) => setSwapForm({ ...swapForm, targetEmployeeId: e.target.value.toUpperCase() })}
                  placeholder="e.g. EMP10002"
                />
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontSize: '0.8rem', color: '#94a3b8', marginBottom: '0.35rem' }}>
                  Target Shift Assignment ID *
                </label>
                <input
                  type="text"
                  className="input-field"
                  required
                  value={swapForm.targetAssignmentId}
                  onChange={(e) => setSwapForm({ ...swapForm, targetAssignmentId: e.target.value })}
                  placeholder="e.g. ASN10002"
                />
              </div>

              <div style={{ marginBottom: '1.25rem' }}>
                <label style={{ display: 'block', fontSize: '0.8rem', color: '#94a3b8', marginBottom: '0.35rem' }}>
                  Reason for Swap *
                </label>
                <textarea
                  className="input-field"
                  rows={2}
                  required
                  value={swapForm.reason}
                  onChange={(e) => setSwapForm({ ...swapForm, reason: e.target.value })}
                  placeholder="Mutual coverage reason..."
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                <button
                  type="button"
                  onClick={() => setShowSwapModal(false)}
                  className="btn btn-secondary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="btn btn-primary"
                >
                  {actionLoading ? 'Sending...' : 'Send Swap Request'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default MySchedulePage;
