import React, { useState } from 'react';
import { Modal } from '../common/Modal';
import { AlertTriangle } from 'lucide-react';

export const CancelAppointmentModal = ({ isOpen, onClose, appointment, onConfirmCancel, isSubmitting }) => {
  const [reason, setReason] = useState('PATIENT_REQUEST');
  const [notes, setNotes] = useState('');

  if (!appointment) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    onConfirmCancel({
      reason,
      notes: reason === 'OTHER' ? notes : (notes || reason)
    });
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Cancel Appointment" maxWidth="500px">
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'flex-start',
            gap: '0.75rem',
            padding: '0.85rem 1rem',
            background: 'rgba(239, 68, 68, 0.1)',
            borderRadius: 'var(--radius-md)',
            border: '1px solid rgba(239, 68, 68, 0.25)',
            color: '#f87171',
            fontSize: '0.85rem'
          }}
        >
          <AlertTriangle size={20} style={{ flexShrink: 0, marginTop: '2px' }} />
          <div>
            <strong>Are you sure you want to cancel this appointment?</strong>
            <p style={{ margin: '0.25rem 0 0', color: 'var(--text-secondary)' }}>
              Appointment <strong>{appointment.appointmentId}</strong> with{' '}
              <strong>{appointment.doctorName}</strong> on <strong>{appointment.appointmentDateStr}</strong> at{' '}
              <strong>{appointment.startTime}</strong> will be released for other patients.
            </p>
          </div>
        </div>

        <div className="form-group">
          <label className="form-label" style={{ fontWeight: '600' }}>
            Cancellation Reason <span style={{ color: '#f87171' }}>*</span>
          </label>
          <select
            className="form-select"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            required
          >
            <option value="PATIENT_REQUEST">Patient Request</option>
            <option value="DOCTOR_UNAVAILABLE">Doctor Unavailable</option>
            <option value="HOSPITAL_CANCELLATION">Hospital Administrative Cancellation</option>
            <option value="DUPLICATE_BOOKING">Duplicate Booking</option>
            <option value="OTHER">Other Reason</option>
          </select>
        </div>

        {reason === 'OTHER' && (
          <div className="form-group">
            <label className="form-label">Detailed Explanation</label>
            <textarea
              className="form-control"
              rows={3}
              placeholder="Please provide the specific reason for cancellation..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              required
            />
          </div>
        )}

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
          <button type="button" onClick={onClose} className="btn btn-outline" disabled={isSubmitting}>
            Keep Appointment
          </button>
          <button
            type="submit"
            className="btn"
            disabled={isSubmitting}
            style={{
              background: '#ef4444',
              color: '#ffffff',
              border: 'none',
              fontWeight: '600'
            }}
          >
            {isSubmitting ? 'Cancelling...' : 'Confirm Cancellation'}
          </button>
        </div>
      </form>
    </Modal>
  );
};
