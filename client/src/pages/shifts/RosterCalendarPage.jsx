import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Calendar as CalendarIcon,
  Plus,
  Send,
  CheckCircle2,
  Share2,
  AlertTriangle,
  Lock,
  ChevronLeft,
  ChevronRight,
  User,
  X
} from 'lucide-react';
import shiftService from '../../services/shiftService';

export const RosterCalendarPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const selectedRosterIdParam = searchParams.get('rosterId');

  const [rosters, setRosters] = useState([]);
  const [selectedRosterId, setSelectedRosterId] = useState(selectedRosterIdParam || '');
  const [calendarData, setCalendarData] = useState(null);
  const [shifts, setShifts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState(null);

  // New Roster Modal
  const [showRosterModal, setShowRosterModal] = useState(false);
  const [rosterForm, setRosterForm] = useState({
    rosterName: '',
    departmentId: 'DEP-RECEPTION',
    periodStart: new Date().toISOString().split('T')[0],
    periodEnd: new Date(Date.now() + 6 * 86400000).toISOString().split('T')[0],
    notes: ''
  });

  // Assignment Modal
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedCell, setSelectedCell] = useState(null);
  const [assignShiftId, setAssignShiftId] = useState('');
  const [assignNotes, setAssignNotes] = useState('');

  useEffect(() => {
    fetchInitialData();
  }, []);

  useEffect(() => {
    if (selectedRosterId) {
      loadCalendar(selectedRosterId);
    }
  }, [selectedRosterId]);

  const fetchInitialData = async () => {
    try {
      const [rosterRes, shiftsRes] = await Promise.all([
        shiftService.getRosters({ limit: 50 }),
        shiftService.getDefinitions({ status: 'ACTIVE' })
      ]);
      const list = rosterRes.data?.rosters || [];
      setRosters(list);
      setShifts(shiftsRes.data?.shifts || []);

      if (list.length > 0 && !selectedRosterId) {
        const idToSelect = selectedRosterIdParam || list[0].rosterId || list[0]._id;
        setSelectedRosterId(idToSelect);
      }
    } catch (err) {
      console.error('Failed to load initial roster list:', err);
    }
  };

  const loadCalendar = async (id) => {
    try {
      setLoading(true);
      setStatusMessage(null);
      const res = await shiftService.getRosterCalendar(id);
      setCalendarData(res.data);
    } catch (err) {
      console.error('Failed to load roster calendar:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateRoster = async (e) => {
    e.preventDefault();
    setActionLoading(true);
    try {
      const res = await shiftService.createRoster(rosterForm);
      setShowRosterModal(false);
      await fetchInitialData();
      setSelectedRosterId(res.data.roster.rosterId);
    } catch (err) {
      alert(err.response?.data?.error || err.message || 'Failed to create roster');
    } finally {
      setActionLoading(false);
    }
  };

  const handleSubmitForApproval = async () => {
    if (!calendarData?.roster?.rosterId) return;
    setActionLoading(true);
    try {
      await shiftService.submitRoster(calendarData.roster.rosterId);
      setStatusMessage({ type: 'success', text: 'Roster submitted for review.' });
      loadCalendar(selectedRosterId);
    } catch (err) {
      setStatusMessage({ type: 'error', text: err.response?.data?.error || 'Submit failed' });
    } finally {
      setActionLoading(false);
    }
  };

  const handleApprove = async () => {
    if (!calendarData?.roster?.rosterId) return;
    setActionLoading(true);
    try {
      await shiftService.approveRoster(calendarData.roster.rosterId);
      setStatusMessage({ type: 'success', text: 'Roster approved successfully.' });
      loadCalendar(selectedRosterId);
    } catch (err) {
      setStatusMessage({ type: 'error', text: err.response?.data?.error || 'Approval failed' });
    } finally {
      setActionLoading(false);
    }
  };

  const handlePublish = async () => {
    if (!calendarData?.roster?.rosterId) return;
    if (!window.confirm('Publish this roster? Assigned employees will receive notifications and published schedules will be locked into version control.')) {
      return;
    }
    setActionLoading(true);
    try {
      const res = await shiftService.publishRoster(calendarData.roster.rosterId);
      setStatusMessage({
        type: 'success',
        text: `Roster published successfully! Created Version ${res.data.version?.versionNumber || 1}. Employees notified.`
      });
      loadCalendar(selectedRosterId);
    } catch (err) {
      setStatusMessage({ type: 'error', text: err.response?.data?.error || 'Publish failed' });
    } finally {
      setActionLoading(false);
    }
  };

  const handleCellClick = (emp, dateKey, existing) => {
    setSelectedCell({ emp, dateKey, existing });
    setAssignShiftId(existing?.shiftCode || shifts[0]?.shiftCode || 'MORNING');
    setAssignNotes('');
    setShowAssignModal(true);
  };

  const handleSaveAssignment = async (e) => {
    e.preventDefault();
    if (!selectedCell) return;
    setActionLoading(true);
    try {
      if (selectedCell.existing?.id) {
        await shiftService.updateAssignment(selectedCell.existing.id, {
          shiftId: assignShiftId,
          notes: assignNotes
        });
      } else {
        await shiftService.createAssignment({
          employeeId: selectedCell.emp.employeeId,
          shiftId: assignShiftId,
          assignmentDate: selectedCell.dateKey,
          rosterId: selectedRosterId,
          notes: assignNotes
        });
      }
      setShowAssignModal(false);
      loadCalendar(selectedRosterId);
    } catch (err) {
      alert(err.response?.data?.error || err.message || 'Failed to save shift assignment');
    } finally {
      setActionLoading(false);
    }
  };

  const getShiftBadgeStyle = (code) => {
    switch (code) {
      case 'MORNING':
        return { background: 'rgba(56, 189, 248, 0.2)', color: '#38bdf8', border: '1px solid #38bdf8' };
      case 'EVENING':
        return { background: 'rgba(245, 158, 11, 0.2)', color: '#f59e0b', border: '1px solid #f59e0b' };
      case 'NIGHT':
        return { background: 'rgba(168, 85, 247, 0.2)', color: '#c084fc', border: '1px solid #a855f7' };
      case 'ROTATIONAL':
        return { background: 'rgba(16, 185, 129, 0.2)', color: '#34d399', border: '1px solid #10b981' };
      default:
        return { background: 'rgba(148, 163, 184, 0.2)', color: '#cbd5e1', border: '1px solid #64748b' };
    }
  };

  return (
    <div className="portal-content" style={{ padding: '1.5rem', maxWidth: '1600px', margin: '0 auto' }}>
      {/* Top Controls & Roster Selector */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: '700', color: '#f8fafc', margin: 0 }}>
            Roster Scheduling Calendar
          </h1>
          <p style={{ color: '#94a3b8', fontSize: '0.875rem', marginTop: '0.2rem' }}>
            Interactive matrix scheduling: assign staff, review coverage, and execute approval workflows.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          <select
            className="input-field"
            style={{ width: '280px', fontWeight: '500' }}
            value={selectedRosterId}
            onChange={(e) => {
              setSelectedRosterId(e.target.value);
              setSearchParams({ rosterId: e.target.value });
            }}
          >
            {rosters.map((r) => (
              <option key={r._id} value={r.rosterId}>
                {r.rosterName} ({r.status})
              </option>
            ))}
          </select>

          <button
            onClick={() => setShowRosterModal(true)}
            className="btn btn-secondary"
            style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}
          >
            <Plus size={16} />
            <span>New Roster</span>
          </button>
        </div>
      </div>

      {/* Status banner */}
      {statusMessage && (
        <div
          style={{
            padding: '0.75rem 1rem',
            borderRadius: '6px',
            marginBottom: '1rem',
            background: statusMessage.type === 'success' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
            color: statusMessage.type === 'success' ? '#34d399' : '#fca5a5',
            border: `1px solid ${statusMessage.type === 'success' ? '#10b981' : '#ef4444'}`
          }}
        >
          {statusMessage.text}
        </div>
      )}

      {/* Roster Metadata & Lifecycle Actions Bar */}
      {calendarData?.roster && (
        <div
          className="card"
          style={{
            padding: '1rem 1.25rem',
            marginBottom: '1.25rem',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '1rem'
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <span style={{ fontSize: '1.15rem', fontWeight: '700', color: '#f8fafc' }}>
                {calendarData.roster.rosterName}
              </span>
              <span className={`badge ${calendarData.roster.status === 'PUBLISHED' ? 'badge-success' : 'badge-warning'}`}>
                {calendarData.roster.status}
              </span>
              {calendarData.roster.currentVersion > 1 && (
                <span className="badge badge-info">V{calendarData.roster.currentVersion}</span>
              )}
            </div>
            <div style={{ fontSize: '0.8rem', color: '#94a3b8', marginTop: '0.25rem' }}>
              Department: {calendarData.roster.departmentName} • Period: {new Date(calendarData.roster.periodStart).toLocaleDateString()} &rarr; {new Date(calendarData.roster.periodEnd).toLocaleDateString()}
            </div>
          </div>

          {/* Workflow Action Buttons */}
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            {calendarData.roster.status === 'DRAFT' && (
              <button
                onClick={handleSubmitForApproval}
                disabled={actionLoading}
                className="btn btn-warning"
                style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem' }}
              >
                <Send size={15} />
                <span>Submit For Approval</span>
              </button>
            )}

            {calendarData.roster.status === 'PENDING_APPROVAL' && (
              <button
                onClick={handleApprove}
                disabled={actionLoading}
                className="btn btn-info"
                style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem' }}
              >
                <CheckCircle2 size={15} />
                <span>Authorize & Approve</span>
              </button>
            )}

            {(calendarData.roster.status === 'APPROVED' || calendarData.roster.status === 'DRAFT') && (
              <button
                onClick={handlePublish}
                disabled={actionLoading}
                className="btn btn-primary"
                style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem' }}
              >
                <Share2 size={15} />
                <span>Publish Roster</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* Matrix Grid */}
      <div className="card" style={{ padding: 0, overflowX: 'auto' }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: '#94a3b8' }}>
            Loading roster schedule grid...
          </div>
        ) : !calendarData || calendarData.dates?.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: '#94a3b8' }}>
            Select or create a roster to view the schedule matrix.
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '900px' }}>
            <thead>
              <tr style={{ background: 'rgba(30, 41, 59, 0.8)', borderBottom: '1px solid var(--border-color)' }}>
                <th style={{ padding: '0.85rem 1rem', textAlign: 'left', color: '#94a3b8', width: '220px' }}>
                  Employee
                </th>
                {calendarData.dates.map((d) => {
                  const dateObj = new Date(d);
                  const dayName = dateObj.toLocaleDateString('en-US', { weekday: 'short' });
                  return (
                    <th key={d} style={{ padding: '0.75rem 0.5rem', textAlign: 'center', color: '#94a3b8', fontSize: '0.85rem' }}>
                      <div style={{ fontWeight: '700', color: '#e2e8f0' }}>{dayName}</div>
                      <div style={{ fontSize: '0.75rem', opacity: 0.7 }}>{d.slice(5)}</div>
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody>
              {calendarData.grid.length === 0 ? (
                <tr>
                  <td colSpan={calendarData.dates.length + 1} style={{ textAlign: 'center', padding: '2rem', color: '#94a3b8' }}>
                    No employees currently assigned to this roster period. Click below to add staff.
                  </td>
                </tr>
              ) : (
                calendarData.grid.map((emp) => (
                  <tr key={emp.employeeId} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.05)' }}>
                    {/* Employee Col */}
                    <td style={{ padding: '0.75rem 1rem', background: 'rgba(15, 23, 42, 0.5)' }}>
                      <div style={{ fontWeight: '600', color: '#f8fafc', fontSize: '0.9rem' }}>{emp.name}</div>
                      <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                        {emp.employeeId} • {emp.designation || 'Staff'}
                      </div>
                    </td>

                    {/* Day Cells */}
                    {calendarData.dates.map((dateKey) => {
                      const assignment = emp.assignments[dateKey];
                      return (
                        <td
                          key={dateKey}
                          onClick={() => handleCellClick(emp, dateKey, assignment)}
                          style={{
                            padding: '0.5rem',
                            textAlign: 'center',
                            cursor: 'pointer',
                            verticalAlign: 'middle',
                            transition: 'background 0.15s ease'
                          }}
                          onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.03)')}
                          onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                        >
                          {assignment ? (
                            <div
                              style={{
                                ...getShiftBadgeStyle(assignment.shiftCode),
                                padding: '0.35rem 0.5rem',
                                borderRadius: '4px',
                                fontSize: '0.75rem',
                                fontWeight: '700',
                                display: 'inline-block'
                              }}
                            >
                              <div>{assignment.shiftCode}</div>
                              <div style={{ fontSize: '0.65rem', opacity: 0.85, fontWeight: 'normal' }}>
                                {assignment.startTime}-{assignment.endTime}
                              </div>
                            </div>
                          ) : (
                            <span style={{ color: '#475569', fontSize: '0.75rem' }}>OFF</span>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}
      </div>

      {/* Assignment Editor Modal */}
      {showAssignModal && selectedCell && (
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
              <h3 style={{ margin: 0, color: '#f8fafc', fontSize: '1.15rem' }}>
                Shift Assignment
              </h3>
              <button
                onClick={() => setShowAssignModal(false)}
                style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}
              >
                <X size={18} />
              </button>
            </div>

            <div style={{ fontSize: '0.85rem', color: '#94a3b8', marginBottom: '1rem' }}>
              Employee: <strong style={{ color: '#f1f5f9' }}>{selectedCell.emp.name} ({selectedCell.emp.employeeId})</strong>
              <br />
              Date: <strong style={{ color: '#f1f5f9' }}>{selectedCell.dateKey}</strong>
            </div>

            <form onSubmit={handleSaveAssignment}>
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontSize: '0.8rem', color: '#94a3b8', marginBottom: '0.35rem' }}>
                  Select Shift
                </label>
                <select
                  className="input-field"
                  value={assignShiftId}
                  onChange={(e) => setAssignShiftId(e.target.value)}
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
                  Assignment Notes
                </label>
                <input
                  type="text"
                  className="input-field"
                  value={assignNotes}
                  onChange={(e) => setAssignNotes(e.target.value)}
                  placeholder="Optional notes or reason..."
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                <button
                  type="button"
                  onClick={() => setShowAssignModal(false)}
                  className="btn btn-secondary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="btn btn-primary"
                >
                  {actionLoading ? 'Saving...' : 'Save Assignment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* New Roster Modal */}
      {showRosterModal && (
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
              maxWidth: '500px',
              padding: '1.5rem',
              background: '#0f172a',
              border: '1px solid rgba(255, 255, 255, 0.1)'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h3 style={{ margin: 0, color: '#f8fafc', fontSize: '1.15rem' }}>
                Create New Scheduling Roster
              </h3>
              <button
                onClick={() => setShowRosterModal(false)}
                style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateRoster}>
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontSize: '0.8rem', color: '#94a3b8', marginBottom: '0.35rem' }}>
                  Roster Name *
                </label>
                <input
                  type="text"
                  className="input-field"
                  required
                  value={rosterForm.rosterName}
                  onChange={(e) => setRosterForm({ ...rosterForm, rosterName: e.target.value })}
                  placeholder="e.g. Reception Desk — November Week 2"
                />
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontSize: '0.8rem', color: '#94a3b8', marginBottom: '0.35rem' }}>
                  Department ID / Code *
                </label>
                <input
                  type="text"
                  className="input-field"
                  required
                  value={rosterForm.departmentId}
                  onChange={(e) => setRosterForm({ ...rosterForm, departmentId: e.target.value })}
                  placeholder="e.g. DEP-RECEPTION"
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', color: '#94a3b8', marginBottom: '0.35rem' }}>
                    Period Start *
                  </label>
                  <input
                    type="date"
                    className="input-field"
                    required
                    value={rosterForm.periodStart}
                    onChange={(e) => setRosterForm({ ...rosterForm, periodStart: e.target.value })}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', color: '#94a3b8', marginBottom: '0.35rem' }}>
                    Period End *
                  </label>
                  <input
                    type="date"
                    className="input-field"
                    required
                    value={rosterForm.periodEnd}
                    onChange={(e) => setRosterForm({ ...rosterForm, periodEnd: e.target.value })}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '1rem' }}>
                <button
                  type="button"
                  onClick={() => setShowRosterModal(false)}
                  className="btn btn-secondary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="btn btn-primary"
                >
                  {actionLoading ? 'Creating...' : 'Create Roster'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default RosterCalendarPage;
