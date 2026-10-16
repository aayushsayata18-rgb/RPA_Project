import React, { useState, useEffect } from 'react';
import radiologyService from '../../../services/radiologyService';
import { UserCheck, CheckCircle, Clock, AlertTriangle, Search, Filter, ShieldAlert } from 'lucide-react';

export const PatientCheckIn = () => {
  const [schedules, setSchedules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedSchedule, setSelectedSchedule] = useState(null);
  const [preparationConfirmed, setPreparationConfirmed] = useState(true);
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState('');

  const fetchTodaySchedules = async () => {
    setLoading(true);
    try {
      const todayStr = new Date().toISOString().split('T')[0];
      const res = await radiologyService.listSchedules({ date: todayStr });
      if (res.data?.data) {
        setSchedules(res.data.data);
      }
    } catch (err) {
      console.error('Failed to fetch schedules:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTodaySchedules();
  }, []);

  const handleCheckInSubmit = async (e) => {
    e.preventDefault();
    if (!selectedSchedule) return;
    setSubmitting(true);
    setMessage('');

    try {
      await radiologyService.checkIn(selectedSchedule._id, {
        preparationConfirmed,
        notes
      });

      setMessage(`Patient ${selectedSchedule.patientName} successfully checked in.`);
      setSelectedSchedule(null);
      setNotes('');
      fetchTodaySchedules();
    } catch (err) {
      setMessage(err.response?.data?.message || err.message || 'Check-in failed.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="portal-container" style={{ padding: '24px', maxWidth: '1400px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: '700', color: '#0f172a', margin: 0 }}>
          Radiology Reception Check-In Desk
        </h1>
        <p style={{ color: '#64748b', margin: '4px 0 0 0', fontSize: '14px' }}>
          Verify patient arrival, confirm preparation compliance, and transition appointment to procedure-ready
        </p>
      </div>

      {message && (
        <div style={{ padding: '12px 16px', borderRadius: '8px', background: '#dcfce7', color: '#166534', border: '1px solid #bbf7d0', marginBottom: '20px', fontSize: '14px' }}>
          {message}
        </div>
      )}

      {/* Grid: Appointments List & Check-In Action Card */}
      <div style={{ display: 'grid', gridTemplateColumns: selectedSchedule ? '1fr 400px' : '1fr', gap: '24px' }}>
        {/* Appointments Table */}
        <div className="card" style={{ borderRadius: '12px', background: '#fff', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid #e2e8f0', background: '#f8fafc', fontWeight: '700', color: '#0f172a' }}>
            Today's Scheduled Appointments ({schedules.length})
          </div>

          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
            <thead>
              <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#475569' }}>
                <th style={{ padding: '12px 16px' }}>Time</th>
                <th style={{ padding: '12px 16px' }}>Patient Name</th>
                <th style={{ padding: '12px 16px' }}>Examination</th>
                <th style={{ padding: '12px 16px' }}>Room / Modality</th>
                <th style={{ padding: '12px 16px' }}>Status</th>
                <th style={{ padding: '12px 16px', textAlign: 'right' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="6" style={{ padding: '32px', textAlign: 'center', color: '#64748b' }}>Loading appointments...</td></tr>
              ) : schedules.length === 0 ? (
                <tr><td colSpan="6" style={{ padding: '32px', textAlign: 'center', color: '#94a3b8' }}>No appointments scheduled for today.</td></tr>
              ) : (
                schedules.map((item) => (
                  <tr key={item._id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '12px 16px', fontWeight: '700', color: '#0284c7' }}>
                      {new Date(item.scheduledStart).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td style={{ padding: '12px 16px', fontWeight: '600', color: '#0f172a' }}>
                      {item.patientName}
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      {item.examName}
                    </td>
                    <td style={{ padding: '12px 16px', color: '#475569' }}>
                      {item.room} ({item.modalityName})
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <span style={{
                        padding: '4px 10px', borderRadius: '12px', fontSize: '11px', fontWeight: '700',
                        background: item.status === 'CHECKED_IN' ? '#dcfce7' : item.status === 'CONFIRMED' ? '#e0f2fe' : '#f1f5f9',
                        color: item.status === 'CHECKED_IN' ? '#15803d' : item.status === 'CONFIRMED' ? '#0369a1' : '#475569'
                      }}>
                        {item.status}
                      </span>
                    </td>
                    <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                      {item.status !== 'CHECKED_IN' && item.status !== 'COMPLETED' ? (
                        <button
                          onClick={() => {
                            setSelectedSchedule(item);
                            setPreparationConfirmed(true);
                            setNotes('');
                          }}
                          style={{
                            padding: '6px 14px',
                            borderRadius: '6px',
                            background: '#0284c7',
                            color: '#fff',
                            border: 'none',
                            fontSize: '12px',
                            fontWeight: '600',
                            cursor: 'pointer'
                          }}
                        >
                          Check In Patient
                        </button>
                      ) : (
                        <span style={{ fontSize: '12px', color: '#16a34a', fontWeight: '600' }}>✓ Checked In</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Check-In Details Card */}
        {selectedSchedule && (
          <div className="card" style={{ borderRadius: '12px', background: '#fff', border: '1px solid #0284c7', padding: '20px', height: 'fit-content' }}>
            <h3 style={{ margin: '0 0 14px 0', fontSize: '16px', fontWeight: '700', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <UserCheck size={18} color="#0284c7" /> Verify & Check-In
            </h3>

            <div style={{ background: '#f8fafc', padding: '12px', borderRadius: '8px', marginBottom: '16px', fontSize: '13px' }}>
              <div><strong>Patient:</strong> {selectedSchedule.patientName}</div>
              <div><strong>Exam:</strong> {selectedSchedule.examName}</div>
              <div><strong>Scheduled:</strong> {new Date(selectedSchedule.scheduledStart).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
              <div><strong>Suite:</strong> {selectedSchedule.room}</div>
            </div>

            <form onSubmit={handleCheckInSubmit}>
              <div style={{ marginBottom: '16px', background: '#fef3c7', padding: '12px', borderRadius: '8px', border: '1px solid #fde68a' }}>
                <label style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', fontSize: '13px', color: '#92400e', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={preparationConfirmed}
                    onChange={(e) => setPreparationConfirmed(e.target.checked)}
                    style={{ marginTop: '2px' }}
                  />
                  <span>
                    <strong>Preparation Instructions Completed</strong>
                    <div style={{ fontSize: '11px', marginTop: '2px' }}>
                      (Fasting, metal removal, contrast instructions verified with patient)
                    </div>
                  </span>
                </label>
              </div>

              {!preparationConfirmed && (
                <div style={{ padding: '10px 12px', borderRadius: '6px', background: '#fee2e2', color: '#b91c1c', fontSize: '12px', marginBottom: '16px' }}>
                  <AlertTriangle size={14} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '4px' }} />
                  Marking incomplete will log an operational exception for technician review.
                </div>
              )}

              <div style={{ marginBottom: '18px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#475569', marginBottom: '6px' }}>Receptionist Notes</label>
                <textarea
                  rows="2"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="ID verified, arrived with escort..."
                  style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px' }}
                />
              </div>

              <div style={{ display: 'flex', gap: '10px' }}>
                <button
                  type="button"
                  onClick={() => setSelectedSchedule(null)}
                  style={{ flex: 1, padding: '9px', borderRadius: '8px', border: '1px solid #cbd5e1', background: '#fff', cursor: 'pointer', fontWeight: '500' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  style={{ flex: 1, padding: '9px', borderRadius: '8px', background: '#16a34a', color: '#fff', border: 'none', fontWeight: '600', cursor: 'pointer' }}
                >
                  {submitting ? 'Checking In...' : 'Confirm Check-In'}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};

export default PatientCheckIn;
