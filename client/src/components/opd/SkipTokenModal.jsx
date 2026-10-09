import React, { useState } from 'react';
import { UserX, X } from 'lucide-react';

export const SkipTokenModal = ({ token, isOpen, onClose, onSubmit }) => {
  const [reason, setReason] = useState('PATIENT_NOT_PRESENT');
  const [loading, setLoading] = useState(false);

  if (!isOpen || !token) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await onSubmit(token.tokenId, reason);
      onClose();
    } catch (err) {
      alert(err.response?.data?.message || err.message || 'Failed to skip token');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.75)',
        backdropFilter: 'blur(4px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
        padding: '1rem'
      }}
    >
      <div
        style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border-color)',
          borderRadius: 'var(--radius-lg)',
          width: '100%',
          maxWidth: '460px',
          boxShadow: '0 20px 40px rgba(0,0,0,0.5)',
          overflow: 'hidden'
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '1.25rem 1.5rem',
            borderBottom: '1px solid var(--border-color)',
            background: 'rgba(245, 158, 11, 0.08)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#f59e0b' }}>
            <UserX size={20} />
            <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: '700' }}>
              Skip Patient Token
            </h3>
          </div>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ padding: '1.5rem' }}>
          <div style={{ marginBottom: '1.25rem' }}>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Skipping Token</div>
            <div style={{ fontSize: '1.2rem', fontWeight: '800', color: '#38bdf8' }}>
              {token.tokenNumber} — {token.patientName}
            </div>
          </div>

          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600', fontSize: '0.9rem' }}>
              Reason for Skipping *
            </label>
            <select
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              style={{
                width: '100%',
                padding: '0.75rem',
                borderRadius: 'var(--radius-md)',
                background: 'var(--bg-input)',
                border: '1px solid var(--border-color)',
                color: 'var(--text-primary)'
              }}
            >
              <option value="PATIENT_NOT_PRESENT">Patient Not Responding / Not in Waiting Area</option>
              <option value="INVESTIGATIONS_PENDING">Pending Diagnostic / Lab Reports</option>
              <option value="PATIENT_REQUEST">Patient Requested Deferral</option>
              <option value="TRIAGE_HOLD">Temporary Clinical Triage Hold</option>
              <option value="OTHER">Other Operational Reason</option>
            </select>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
            <button type="button" onClick={onClose} className="btn btn-secondary">
              Cancel
            </button>
            <button type="submit" disabled={loading} className="btn btn-primary" style={{ background: '#f59e0b', borderColor: '#f59e0b' }}>
              {loading ? 'Skipping...' : 'Confirm Skip'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SkipTokenModal;
