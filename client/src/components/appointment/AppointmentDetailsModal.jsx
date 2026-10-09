import React from 'react';
import { Modal } from '../common/Modal';
import { AppointmentStatusBadge } from './AppointmentStatusBadge';
import { Calendar, Clock, MapPin, User, Stethoscope, FileText, CheckCircle2, History, AlertCircle } from 'lucide-react';

export const AppointmentDetailsModal = ({ isOpen, onClose, appointment }) => {
  if (!appointment) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Appointment Details — ${appointment.appointmentId}`} maxWidth="650px">
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        {/* Top Status & Booking Ref Bar */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '1rem',
            background: 'var(--bg-secondary)',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border-color)'
          }}
        >
          <div>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block' }}>Current Status</span>
            <AppointmentStatusBadge status={appointment.status} />
          </div>
          <div style={{ textAlign: 'right' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block' }}>Booking Reference</span>
            <code style={{ fontSize: '0.85rem', color: '#38bdf8', fontWeight: '600' }}>
              {appointment.bookingReference || 'N/A'}
            </code>
          </div>
        </div>

        {/* Doctor & Clinic Details */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '1rem',
            padding: '1rem',
            background: 'var(--bg-card)',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border-color)'
          }}
        >
          <div>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Doctor & Specialty</span>
            <div style={{ fontWeight: '700', fontSize: '1rem', color: 'var(--text-primary)', marginTop: '0.2rem' }}>
              {appointment.doctorName}
            </div>
            <div style={{ fontSize: '0.85rem', color: '#38bdf8', fontWeight: '500' }}>
              {appointment.specialty} ({appointment.departmentName || 'Main Hospital'})
            </div>
          </div>

          <div>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Date & Time</span>
            <div style={{ fontWeight: '700', fontSize: '1rem', color: 'var(--text-primary)', marginTop: '0.2rem' }}>
              {appointment.appointmentDateStr}
            </div>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
              {appointment.startTime} - {appointment.endTime} (Room: {appointment.roomNumber || 'OPD-101'})
            </div>
          </div>
        </div>

        {/* Patient Details */}
        <div
          style={{
            padding: '1rem',
            background: 'var(--bg-card)',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border-color)'
          }}
        >
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Patient Information</span>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '0.75rem', marginTop: '0.35rem' }}>
            <div>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Full Name:</span>
              <div style={{ fontSize: '0.85rem', fontWeight: '600' }}>{appointment.patientName}</div>
            </div>
            <div>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Patient ID:</span>
              <div style={{ fontSize: '0.85rem', fontWeight: '600' }}>{appointment.patientId}</div>
            </div>
            <div>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Contact:</span>
              <div style={{ fontSize: '0.85rem' }}>{appointment.patientPhone || 'N/A'}</div>
            </div>
            <div>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Consultation Fee:</span>
              <div style={{ fontSize: '0.85rem', fontWeight: '600', color: '#34d399' }}>₹{appointment.consultationFee || 500}</div>
            </div>
          </div>
        </div>

        {/* Appointment Reason & Clinical Purpose */}
        {appointment.reason && (
          <div
            style={{
              padding: '0.85rem 1rem',
              background: 'rgba(56, 189, 248, 0.06)',
              borderRadius: 'var(--radius-md)',
              border: '1px solid rgba(56, 189, 248, 0.2)'
            }}
          >
            <span style={{ fontSize: '0.75rem', color: '#38bdf8', fontWeight: '700', textTransform: 'uppercase' }}>
              Reason for Consultation
            </span>
            <p style={{ margin: '0.35rem 0 0', fontSize: '0.9rem', color: 'var(--text-primary)' }}>
              {appointment.reason}
            </p>
          </div>
        )}

        {/* Reschedule / Cancellation Banner if applicable */}
        {appointment.rescheduledFromAppointmentId && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.75rem',
              background: 'rgba(245, 158, 11, 0.1)',
              borderRadius: 'var(--radius-md)',
              border: '1px solid rgba(245, 158, 11, 0.25)',
              fontSize: '0.85rem',
              color: '#fbbf24'
            }}
          >
            <AlertCircle size={18} />
            <span>This appointment was rescheduled from previous booking: <strong>{appointment.rescheduledFromAppointmentId}</strong></span>
          </div>
        )}

        {appointment.cancellationReason && (
          <div
            style={{
              padding: '0.75rem 1rem',
              background: 'rgba(239, 68, 68, 0.1)',
              borderRadius: 'var(--radius-md)',
              border: '1px solid rgba(239, 68, 68, 0.25)',
              fontSize: '0.85rem',
              color: '#f87171'
            }}
          >
            <div><strong>Cancellation Reason:</strong> {appointment.cancellationReason}</div>
            {appointment.cancellationNotes && <div><strong>Notes:</strong> {appointment.cancellationNotes}</div>}
          </div>
        )}

        {/* Immutable History Timeline */}
        {appointment.history && appointment.history.length > 0 && (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
              <History size={16} color="#38bdf8" />
              <span style={{ fontSize: '0.85rem', fontWeight: '700', textTransform: 'uppercase', color: 'var(--text-secondary)' }}>
                Immutable Event History
              </span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {appointment.history.map((hist, idx) => (
                <div
                  key={hist.historyId || idx}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '0.6rem 0.85rem',
                    background: 'var(--bg-secondary)',
                    borderRadius: 'var(--radius-sm)',
                    fontSize: '0.8rem',
                    borderLeft: '3px solid #38bdf8'
                  }}
                >
                  <div>
                    <strong style={{ color: 'var(--text-primary)' }}>{hist.action}</strong>
                    <span style={{ color: 'var(--text-muted)', marginLeft: '0.5rem' }}>
                      ({hist.reason || hist.details || 'Lifecycle update'})
                    </span>
                  </div>
                  <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>
                    {new Date(hist.createdAt).toLocaleString()}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
          <button type="button" onClick={onClose} className="btn btn-outline" style={{ minWidth: '100px' }}>
            Close
          </button>
        </div>
      </div>
    </Modal>
  );
};
