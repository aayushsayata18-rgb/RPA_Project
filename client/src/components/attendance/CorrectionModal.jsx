import React, { useState } from 'react';
import { attendanceService } from '../../services/attendanceService';
import { X, AlertCircle, Clock, FileText, CheckCircle2 } from 'lucide-react';

export const CorrectionModal = ({ attendance, onClose, onSuccess }) => {
  const [checkIn, setCheckIn] = useState(
    attendance && attendance.checkIn && attendance.checkIn.timestamp
      ? new Date(attendance.checkIn.timestamp).toISOString().slice(0, 16)
      : ''
  );
  const [checkOut, setCheckOut] = useState(
    attendance && attendance.checkOut && attendance.checkOut.timestamp
      ? new Date(attendance.checkOut.timestamp).toISOString().slice(0, 16)
      : ''
  );
  const [reason, setReason] = useState('');
  const [documentUrl, setDocumentUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  if (!attendance) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!reason || reason.trim().length < 5) {
      setError('Please provide a clear justification reason (minimum 5 characters).');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const payload = {
        requestedCheckIn: checkIn ? new Date(checkIn).toISOString() : null,
        requestedCheckOut: checkOut ? new Date(checkOut).toISOString() : null,
        reason: reason.trim(),
        evidenceDocuments: documentUrl ? [{ documentId: 'DOC-SELF', name: 'Supporting Evidence', url: documentUrl }] : []
      };

      await attendanceService.submitCorrection(attendance._id || attendance.attendanceId, payload);
      if (onSuccess) onSuccess();
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to submit correction request.');
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
          maxWidth: '520px',
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
            <Clock style={{ width: '22px', height: '22px', color: '#38bdf8' }} />
            <h3 style={{ margin: 0, fontSize: '1.15rem', color: '#f8fafc' }}>Request Attendance Correction</h3>
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

          <div style={{ marginBottom: '1rem', fontSize: '0.875rem', color: '#94a3b8' }}>
            Date:{' '}
            <strong style={{ color: '#f8fafc' }}>
              {new Date(attendance.attendanceDate).toLocaleDateString('en-US', {
                weekday: 'short',
                year: 'numeric',
                month: 'short',
                day: 'numeric'
              })}
            </strong>{' '}
            | ID: <span style={{ color: '#38bdf8' }}>{attendance.attendanceId}</span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', color: '#94a3b8', marginBottom: '0.35rem' }}>
                Requested Check-In
              </label>
              <input
                type="datetime-local"
                value={checkIn}
                onChange={(e) => setCheckIn(e.target.value)}
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
                Requested Check-Out
              </label>
              <input
                type="datetime-local"
                value={checkOut}
                onChange={(e) => setCheckOut(e.target.value)}
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
              Justification Reason <span style={{ color: '#ef4444' }}>*</span>
            </label>
            <textarea
              rows="3"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g. Biometric device scanner was unresponsive at exit gate; approved OT assignment."
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
              required
            />
          </div>

          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ display: 'block', fontSize: '0.8rem', color: '#94a3b8', marginBottom: '0.35rem' }}>
              Supporting Evidence Document / Link (Optional)
            </label>
            <input
              type="text"
              value={documentUrl}
              onChange={(e) => setDocumentUrl(e.target.value)}
              placeholder="https://hospital-docs.internal/evidence/slip-101.pdf"
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
                background: '#0284c7',
                color: '#ffffff',
                border: 'none',
                cursor: 'pointer',
                fontWeight: '600'
              }}
            >
              {loading ? 'Submitting...' : 'Submit For Approval'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CorrectionModal;
