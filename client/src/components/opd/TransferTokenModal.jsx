import React, { useState } from 'react';
import { ArrowRightLeft, X } from 'lucide-react';

export const TransferTokenModal = ({ token, isOpen, onClose, onSubmit, departments = [] }) => {
  const [targetDepartmentId, setTargetDepartmentId] = useState(departments[0]?.departmentId || 'DEP-GMED');
  const [reason, setReason] = useState('DEPARTMENT_TRANSFER');
  const [loading, setLoading] = useState(false);

  if (!isOpen || !token) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await onSubmit(token.tokenId, { targetDepartmentId, reason });
      onClose();
    } catch (err) {
      alert(err.response?.data?.message || err.message || 'Failed to transfer token');
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
          maxWidth: '500px',
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
            background: 'rgba(99, 102, 241, 0.08)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#818cf8' }}>
            <ArrowRightLeft size={20} />
            <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: '700' }}>
              Transfer Token to Another Queue
            </h3>
          </div>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ padding: '1.5rem' }}>
          <div style={{ marginBottom: '1.25rem' }}>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Transferring Token</div>
            <div style={{ fontSize: '1.2rem', fontWeight: '800', color: '#38bdf8' }}>
              {token.tokenNumber} — {token.patientName}
            </div>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
              Current: {token.departmentName}
            </div>
          </div>

          <div style={{ marginBottom: '1.25rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600', fontSize: '0.9rem' }}>
              Destination Department *
            </label>
            <select
              value={targetDepartmentId}
              onChange={(e) => setTargetDepartmentId(e.target.value)}
              style={{
                width: '100%',
                padding: '0.75rem',
                borderRadius: 'var(--radius-md)',
                background: 'var(--bg-input)',
                border: '1px solid var(--border-color)',
                color: 'var(--text-primary)'
              }}
            >
              <option value="DEP-GMED">General Medicine</option>
              <option value="DEP-CARD">Cardiology</option>
              <option value="DEP-DERM">Dermatology</option>
              <option value="DEP-ORTH">Orthopedics</option>
              <option value="DEP-PED">Pediatrics</option>
            </select>
          </div>

          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600', fontSize: '0.9rem' }}>
              Transfer Reason *
            </label>
            <input
              type="text"
              required
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g. Cross-consultation required, Wrong department assigned"
              style={{
                width: '100%',
                padding: '0.75rem',
                borderRadius: 'var(--radius-md)',
                background: 'var(--bg-input)',
                border: '1px solid var(--border-color)',
                color: 'var(--text-primary)'
              }}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
            <button type="button" onClick={onClose} className="btn btn-secondary">
              Cancel
            </button>
            <button type="submit" disabled={loading} className="btn btn-primary">
              {loading ? 'Transferring...' : 'Transfer Queue Entry'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TransferTokenModal;
