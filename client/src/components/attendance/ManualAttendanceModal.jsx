import React, { useState } from 'react';
import { attendanceService } from '../../services/attendanceService';
import { X, AlertCircle, PlusCircle, Check } from 'lucide-react';

export const ManualAttendanceModal = ({ onClose, onSuccess }) => {
  const [employeeIdCode, setEmployeeIdCode] = useState('');
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [checkInTime, setCheckInTime] = useState('');
  const [checkOutTime, setCheckOutTime] = useState('');
  const [reason, setReason] = useState('');
  const [remarks, setRemarks] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!employeeIdCode.trim()) {
      setError('Employee ID Code is required.');
      return;
    }
    if (!reason || reason.trim().length < 5) {
      setError('Mandatory justification reason (at least 5 characters) is required for manual entry.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const payload = {
        employeeIdCode: employeeIdCode.trim().toUpperCase(),
        date,
        checkInTime: checkInTime ? new Date(checkInTime).toISOString() : null,
        checkOutTime: checkOutTime ? new Date(checkOutTime).toISOString() : null,
        reason: reason.trim(),
        remarks: remarks.trim()
      };

      await attendanceService.createManualAttendance(payload);
      if (onSuccess) onSuccess();
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to record manual attendance.');
    } finally {
      setLoading(false);
    }
  };

  return (
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
          maxWidth: '540px',
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
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <PlusCircle style={{ width: '22px', height: '22px', color: '#10b981' }} />
            <h3 style={{ margin: 0, fontSize: '1.15rem', color: '#f8fafc' }}>Record Authorized Manual Attendance</h3>
          </div>
          <button
            onClick={onClose}
            style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}
          >
            <X style={{ width: '20px', height: '20px' }} />
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ padding: '1.5rem' }}>
          {error && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                padding: '0.75rem 1rem',
                backgroundColor: 'rgba(239, 68, 68, 0.15)',
                color: '#ef4444',
                borderRadius: '8px',
                marginBottom: '1.25rem',
                fontSize: '0.85rem'
              }}
            >
              <AlertCircle style={{ width: '18px', height: '18px', flexShrink: 0 }} />
              <span>{error}</span>
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', color: '#94a3b8', marginBottom: '0.35rem' }}>
                Employee ID <span style={{ color: '#ef4444' }}>*</span>
              </label>
              <input
                type="text"
                placeholder="e.g. EMP10001"
                value={employeeIdCode}
                onChange={(e) => setEmployeeIdCode(e.target.value)}
                required
                style={{
                  width: '100%',
                  padding: '0.6rem 0.75rem',
                  borderRadius: '6px',
                  background: 'var(--bg-input, #0f172a)',
                  border: '1px solid var(--border-color, #334155)',
                  color: '#f8fafc',
                  fontSize: '0.85rem'
                }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', color: '#94a3b8', marginBottom: '0.35rem' }}>
                Attendance Date <span style={{ color: '#ef4444' }}>*</span>
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
                style={{
                  width: '100%',
                  padding: '0.6rem 0.75rem',
                  borderRadius: '6px',
                  background: 'var(--bg-input, #0f172a)',
                  border: '1px solid var(--border-color, #334155)',
                  color: '#f8fafc',
                  fontSize: '0.85rem'
                }}
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', color: '#94a3b8', marginBottom: '0.35rem' }}>
                Check-In Timestamp
              </label>
              <input
                type="datetime-local"
                value={checkInTime}
                onChange={(e) => setCheckInTime(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.6rem 0.75rem',
                  borderRadius: '6px',
                  background: 'var(--bg-input, #0f172a)',
                  border: '1px solid var(--border-color, #334155)',
                  color: '#f8fafc',
                  fontSize: '0.85rem'
                }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', color: '#94a3b8', marginBottom: '0.35rem' }}>
                Check-Out Timestamp
              </label>
              <input
                type="datetime-local"
                value={checkOutTime}
                onChange={(e) => setCheckOutTime(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.6rem 0.75rem',
                  borderRadius: '6px',
                  background: 'var(--bg-input, #0f172a)',
                  border: '1px solid var(--border-color, #334155)',
                  color: '#f8fafc',
                  fontSize: '0.85rem'
                }}
              />
            </div>
          </div>

          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', fontSize: '0.8rem', color: '#94a3b8', marginBottom: '0.35rem' }}>
              Administrative Justification Reason <span style={{ color: '#ef4444' }}>*</span>
            </label>
            <textarea
              rows="2"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g. Biometric scanner outage at main lobby during power transition."
              required
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

          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ display: 'block', fontSize: '0.8rem', color: '#94a3b8', marginBottom: '0.35rem' }}>
              Internal Remarks (Optional)
            </label>
            <input
              type="text"
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              placeholder="Optional notes or ticket reference"
              style={{
                width: '100%',
                padding: '0.6rem 0.75rem',
                borderRadius: '6px',
                background: 'var(--bg-input, #0f172a)',
                border: '1px solid var(--border-color, #334155)',
                color: '#f8fafc',
                fontSize: '0.85rem'
              }}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="btn btn-secondary"
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
              disabled={loading}
              className="btn btn-primary"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.5rem 1.25rem',
                borderRadius: '6px',
                background: '#10b981',
                color: '#ffffff',
                border: 'none',
                cursor: 'pointer',
                fontWeight: '600'
              }}
            >
              {loading ? 'Recording...' : 'Record Manual Attendance'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ManualAttendanceModal;
