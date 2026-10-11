import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../../services/api';
import { StatusBadge } from '../../components/common/StatusBadge';
import {
  Calendar,
  Clock,
  Plus,
  Trash2,
  ArrowLeft,
  AlertTriangle,
  CheckCircle,
  RefreshCw,
  Ban,
  ShieldCheck
} from 'lucide-react';

const DAYS_OF_WEEK = [
  { num: 1, name: 'Monday' },
  { num: 2, name: 'Tuesday' },
  { num: 3, name: 'Wednesday' },
  { num: 4, name: 'Thursday' },
  { num: 5, name: 'Friday' },
  { num: 6, name: 'Saturday' },
  { num: 0, name: 'Sunday' }
];

export const DoctorScheduleCalendarPage = () => {
  const { doctorId } = useParams();
  const [doctor, setDoctor] = useState(null);
  const [schedules, setSchedules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionMsg, setActionMsg] = useState('');
  const [actionError, setActionError] = useState('');

  // Add Schedule Modal
  const [showAddModal, setShowAddModal] = useState(false);
  const [newSchedule, setNewSchedule] = useState({
    dayOfWeek: 1,
    startTime: '09:00',
    endTime: '13:00',
    slotDurationMinutes: 30,
    maxCapacityPerSlot: 1,
    roomNumber: 'OPD-101',
    effectiveFrom: new Date().toISOString().split('T')[0],
    effectiveTo: '',
    status: 'ACTIVE'
  });
  const [conflictWarning, setConflictWarning] = useState('');

  // Block Time Modal
  const [showBlockModal, setShowBlockModal] = useState(false);
  const [blockTimeData, setBlockTimeData] = useState({
    date: new Date().toISOString().split('T')[0],
    startTime: '09:00',
    endTime: '13:00',
    status: 'UNAVAILABLE',
    reason: 'Temporary Administrative Unavailability'
  });

  const fetchDoctorAndSchedules = async () => {
    setLoading(true);
    setActionMsg('');
    setActionError('');
    try {
      const docRes = await api.get(`/doctors/${doctorId}`);
      if (docRes.data.success) {
        setDoctor(docRes.data.data);
      }

      const schRes = await api.get(`/doctors/${doctorId}/schedules`);
      if (schRes.data.success) {
        setSchedules(schRes.data.data || []);
      }
    } catch (err) {
      console.error('Failed to load schedules:', err.message);
      setActionError(err.response?.data?.message || err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDoctorAndSchedules();
  }, [doctorId]);

  // Check Conflict preview on modal field change
  const checkConflictPreview = async (candidate) => {
    setConflictWarning('');
    try {
      const res = await api.post(`/doctors/${doctorId}/schedules/check-conflict`, candidate);
      if (res.data.success && res.data.data.hasConflict) {
        setConflictWarning(res.data.data.conflictMessage);
      }
    } catch (err) {
      // Conflict check error
    }
  };

  const handleScheduleChange = (e) => {
    const { name, value } = e.target;
    const updated = {
      ...newSchedule,
      [name]: name === 'dayOfWeek' || name === 'slotDurationMinutes' || name === 'maxCapacityPerSlot' ? Number(value) : value
    };
    setNewSchedule(updated);
    checkConflictPreview(updated);
  };

  const handleCreateSchedule = async (e) => {
    e.preventDefault();
    setActionMsg('');
    setActionError('');
    try {
      const res = await api.post(`/doctors/${doctorId}/schedules`, newSchedule);
      if (res.data.success) {
        setActionMsg('New recurring schedule created successfully!');
        setShowAddModal(false);
        setConflictWarning('');
        fetchDoctorAndSchedules();
      }
    } catch (err) {
      setActionError(err.response?.data?.message || err.message);
    }
  };

  const handleCancelSchedule = async (scheduleId) => {
    if (!window.confirm('Are you sure you want to cancel this schedule? Any affected future appointments will be flagged for administrative review.')) {
      return;
    }
    setActionMsg('');
    setActionError('');
    try {
      const res = await api.delete(`/doctors/${doctorId}/schedules/${scheduleId}`);
      if (res.data.success) {
        setActionMsg(`Schedule cancelled. ${res.data.data?.affectedAppointmentsCount || 0} future appointments flagged.`);
        fetchDoctorAndSchedules();
      }
    } catch (err) {
      setActionError(err.response?.data?.message || err.message);
    }
  };

  const handleBlockTimeSubmit = async (e) => {
    e.preventDefault();
    setActionMsg('');
    setActionError('');
    try {
      const res = await api.post(`/doctors/${doctorId}/availability`, blockTimeData);
      if (res.data.success) {
        setActionMsg(`Time blocked successfully on ${blockTimeData.date}!`);
        setShowBlockModal(false);
        fetchDoctorAndSchedules();
      }
    } catch (err) {
      setActionError(err.response?.data?.message || err.message);
    }
  };

  return (
    <div className="page-container">
      {/* Header */}
      <div style={{ marginBottom: '1rem' }}>
        <Link to={`/admin/doctors/${doctorId}`} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
          <ArrowLeft size={14} /> Back to Doctor Profile
        </Link>
      </div>

      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 className="page-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Calendar className="text-primary" /> Doctor Recurring Schedule & Calendar Planner
          </h1>
          <p className="page-subtitle">
            Doctor: <strong>{doctor?.displayName || doctor?.fullName || doctorId}</strong> ({doctor?.specialty} - {doctor?.departmentName})
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button className="btn btn-secondary" onClick={fetchDoctorAndSchedules}>
            <RefreshCw size={16} /> Refresh
          </button>
          <button className="btn btn-secondary" onClick={() => setShowBlockModal(true)}>
            <Ban size={16} /> Block Time / Unavailability
          </button>
          <button className="btn btn-primary" onClick={() => { setShowAddModal(true); checkConflictPreview(newSchedule); }}>
            <Plus size={16} /> Add Schedule
          </button>
        </div>
      </div>

      {actionMsg && (
        <div className="card" style={{ borderLeft: '4px solid #10b981', background: 'rgba(16, 185, 129, 0.08)', padding: '0.75rem 1rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <CheckCircle color="#10b981" size={18} />
          <span style={{ color: '#10b981', fontWeight: 600 }}>{actionMsg}</span>
        </div>
      )}

      {actionError && (
        <div className="card" style={{ borderLeft: '4px solid #ef4444', background: 'rgba(239, 68, 68, 0.08)', padding: '0.75rem 1rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <AlertTriangle color="#ef4444" size={18} />
          <span style={{ color: '#ef4444', fontWeight: 600 }}>{actionError}</span>
        </div>
      )}

      {/* Weekly Schedule Grid (Section 22 & 47) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem' }}>
        {DAYS_OF_WEEK.map((day) => {
          const daySchedules = schedules.filter((s) => s.dayOfWeek === day.num && s.status !== 'CANCELLED');
          return (
            <div key={day.num} className="card" style={{ padding: '1rem', minHeight: '180px', display: 'flex', flexDirection: 'column' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem', marginBottom: '0.75rem' }}>
                <span style={{ fontWeight: 700, fontSize: '0.95rem' }}>{day.name}</span>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  {daySchedules.length} session{daySchedules.length === 1 ? '' : 's'}
                </span>
              </div>

              {daySchedules.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', flex: 1 }}>
                  {daySchedules.map((sch) => (
                    <div
                      key={sch.scheduleId || sch._id}
                      style={{
                        padding: '0.75rem',
                        background: 'var(--bg-surface)',
                        border: '1px solid var(--border-color)',
                        borderRadius: '6px',
                        borderLeft: '4px solid #38bdf8'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                        <span style={{ fontWeight: 700, fontSize: '0.9rem', color: '#38bdf8' }}>
                          <Clock size={14} style={{ display: 'inline', marginRight: '4px', verticalAlign: '-2px' }} />
                          {sch.startTime} - {sch.endTime}
                        </span>
                        <button
                          className="btn btn-danger btn-sm"
                          style={{ padding: '2px 6px', height: 'auto' }}
                          title="Cancel Schedule"
                          onClick={() => handleCancelSchedule(sch.scheduleId || sch._id)}
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>

                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        Slot: {sch.slotDurationMinutes}m | Cap: {sch.maxCapacityPerSlot} | Room: {sch.roomNumber || doctor?.roomNumber}
                      </div>

                      <div style={{ marginTop: '0.35rem' }}>
                        <StatusBadge status={sch.status} />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                  No sessions scheduled
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Add Schedule Modal with Live Conflict Preview */}
      {showAddModal && (
        <div className="modal-backdrop" style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div className="card" style={{ width: '480px', padding: '1.5rem', background: 'var(--bg-surface)' }}>
            <h3 style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Calendar size={18} className="text-primary" /> Add Recurring Schedule
            </h3>

            {conflictWarning && (
              <div style={{ padding: '0.75rem', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid #ef4444', borderRadius: '4px', marginBottom: '1rem', fontSize: '0.85rem', color: '#ef4444' }}>
                <AlertTriangle size={16} style={{ display: 'inline', marginRight: '4px', verticalAlign: '-2px' }} />
                <strong>Schedule Conflict Detected:</strong> {conflictWarning}
              </div>
            )}

            <form onSubmit={handleCreateSchedule}>
              <div className="form-group" style={{ marginBottom: '1rem' }}>
                <label>Day of Week</label>
                <select className="form-control" name="dayOfWeek" value={newSchedule.dayOfWeek} onChange={handleScheduleChange} required>
                  {DAYS_OF_WEEK.map((d) => (
                    <option key={d.num} value={d.num}>{d.name}</option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                <div className="form-group">
                  <label>Start Time (HH:MM)</label>
                  <input type="time" className="form-control" name="startTime" value={newSchedule.startTime} onChange={handleScheduleChange} required />
                </div>
                <div className="form-group">
                  <label>End Time (HH:MM)</label>
                  <input type="time" className="form-control" name="endTime" value={newSchedule.endTime} onChange={handleScheduleChange} required />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                <div className="form-group">
                  <label>Slot Duration (Mins)</label>
                  <select className="form-control" name="slotDurationMinutes" value={newSchedule.slotDurationMinutes} onChange={handleScheduleChange}>
                    <option value={15}>15 Minutes</option>
                    <option value={20}>20 Minutes</option>
                    <option value={30}>30 Minutes</option>
                    <option value={45}>45 Minutes</option>
                    <option value={60}>60 Minutes</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Room / Location</label>
                  <input type="text" className="form-control" name="roomNumber" value={newSchedule.roomNumber} onChange={handleScheduleChange} placeholder="e.g. OPD-101" />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
                <div className="form-group">
                  <label>Effective From</label>
                  <input type="date" className="form-control" name="effectiveFrom" value={newSchedule.effectiveFrom} onChange={handleScheduleChange} />
                </div>
                <div className="form-group">
                  <label>Effective To (Optional)</label>
                  <input type="date" className="form-control" name="effectiveTo" value={newSchedule.effectiveTo} onChange={handleScheduleChange} />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowAddModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={!!conflictWarning}>
                  Save Schedule
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Block Time Modal */}
      {showBlockModal && (
        <div className="modal-backdrop" style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div className="card" style={{ width: '440px', padding: '1.5rem', background: 'var(--bg-surface)' }}>
            <h3 style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Ban size={18} color="#f59e0b" /> Block Slot / Record Unavailability
            </h3>

            <form onSubmit={handleBlockTimeSubmit}>
              <div className="form-group" style={{ marginBottom: '1rem' }}>
                <label>Date</label>
                <input
                  type="date"
                  className="form-control"
                  required
                  value={blockTimeData.date}
                  onChange={(e) => setBlockTimeData({ ...blockTimeData, date: e.target.value })}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                <div className="form-group">
                  <label>Start Time</label>
                  <input
                    type="time"
                    className="form-control"
                    required
                    value={blockTimeData.startTime}
                    onChange={(e) => setBlockTimeData({ ...blockTimeData, startTime: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label>End Time</label>
                  <input
                    type="time"
                    className="form-control"
                    required
                    value={blockTimeData.endTime}
                    onChange={(e) => setBlockTimeData({ ...blockTimeData, endTime: e.target.value })}
                  />
                </div>
              </div>

              <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                <label>Reason for Unavailability</label>
                <textarea
                  className="form-control"
                  rows={2}
                  required
                  value={blockTimeData.reason}
                  onChange={(e) => setBlockTimeData({ ...blockTimeData, reason: e.target.value })}
                  placeholder="e.g. Attending surgical conference / Emergency off-duty..."
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowBlockModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Block Selected Time</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
