import React from 'react';
import { Calendar, Clock, MapPin, User, Stethoscope, ArrowRight, XCircle, RotateCcw, Eye } from 'lucide-react';
import { AppointmentStatusBadge } from './AppointmentStatusBadge';

export const AppointmentCard = ({ appointment, onView, onCancel, onReschedule, onCheckIn, userRole }) => {
  const isCancellable = ['CONFIRMED', 'REQUESTED', 'PENDING_REVIEW', 'SCHEDULED'].includes(appointment.status);
  const isReschedulable = ['CONFIRMED', 'REQUESTED', 'PENDING_REVIEW', 'SCHEDULED'].includes(appointment.status);
  const isCheckInEligible = appointment.status === 'CONFIRMED' && appointment.checkInStatus === 'NOT_CHECKED_IN';

  return (
    <div
      className="card"
      style={{
        padding: '1.25rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '1rem',
        borderLeft: appointment.status === 'CONFIRMED' ? '4px solid #38bdf8' : '4px solid var(--border-color)',
        transition: 'transform var(--transition-fast), box-shadow var(--transition-fast)'
      }}
    >
      {/* Header Row: Specialty & Status */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
            <span
              style={{
                fontSize: '0.75rem',
                fontWeight: '700',
                textTransform: 'uppercase',
                color: '#38bdf8',
                letterSpacing: '0.05em'
              }}
            >
              {appointment.specialty || 'General'}
            </span>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>•</span>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{appointment.appointmentId}</span>
          </div>
          <h3 style={{ fontSize: '1.1rem', fontWeight: '700', margin: 0, color: 'var(--text-primary)' }}>
            {appointment.doctorName}
          </h3>
        </div>
        <AppointmentStatusBadge status={appointment.status} />
      </div>

      {/* Date, Time & Room Info */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
          gap: '0.75rem',
          padding: '0.75rem',
          background: 'var(--bg-secondary)',
          borderRadius: 'var(--radius-md)'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-secondary)' }}>
          <Calendar size={16} color="#38bdf8" />
          <span style={{ fontSize: '0.85rem', fontWeight: '600' }}>{appointment.appointmentDateStr}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-secondary)' }}>
          <Clock size={16} color="#38bdf8" />
          <span style={{ fontSize: '0.85rem', fontWeight: '600' }}>
            {appointment.startTime} - {appointment.endTime}
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-secondary)' }}>
          <MapPin size={16} color="#38bdf8" />
          <span style={{ fontSize: '0.85rem' }}>{appointment.roomNumber || 'OPD'}</span>
        </div>
      </div>

      {/* Patient & Purpose if viewed by staff */}
      {userRole !== 'PATIENT' && (
        <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <User size={15} color="var(--text-muted)" />
          <span>
            Patient: <strong style={{ color: 'var(--text-primary)' }}>{appointment.patientName}</strong> ({appointment.patientId})
          </span>
        </div>
      )}

      {appointment.reason && (
        <div style={{ fontSize: '0.825rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>
          "{appointment.reason}"
        </div>
      )}

      {/* Actions */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: '0.5rem',
          marginTop: 'auto',
          paddingTop: '0.5rem',
          borderTop: '1px solid var(--border-color)'
        }}
      >
        <button
          type="button"
          onClick={() => onView(appointment)}
          className="btn btn-outline"
          style={{ flex: 1, minWidth: '90px', padding: '0.45rem 0.75rem', fontSize: '0.8rem', gap: '0.35rem' }}
        >
          <Eye size={14} />
          Details
        </button>

        {isReschedulable && onReschedule && (
          <button
            type="button"
            onClick={() => onReschedule(appointment)}
            className="btn btn-outline"
            style={{ flex: 1, minWidth: '100px', padding: '0.45rem 0.75rem', fontSize: '0.8rem', gap: '0.35rem' }}
          >
            <RotateCcw size={14} />
            Reschedule
          </button>
        )}

        {isCancellable && onCancel && (
          <button
            type="button"
            onClick={() => onCancel(appointment)}
            className="btn"
            style={{
              flex: 1,
              minWidth: '85px',
              padding: '0.45rem 0.75rem',
              fontSize: '0.8rem',
              gap: '0.35rem',
              background: 'rgba(239, 68, 68, 0.12)',
              color: '#f87171',
              border: '1px solid rgba(239, 68, 68, 0.3)'
            }}
          >
            <XCircle size={14} />
            Cancel
          </button>
        )}

        {isCheckInEligible && onCheckIn && ['RECEPTIONIST', 'SYSTEM_ADMIN'].includes(userRole) && (
          <button
            type="button"
            onClick={() => onCheckIn(appointment)}
            className="btn btn-primary"
            style={{ flex: 1, minWidth: '95px', padding: '0.45rem 0.75rem', fontSize: '0.8rem' }}
          >
            Check In
          </button>
        )}
      </div>
    </div>
  );
};
