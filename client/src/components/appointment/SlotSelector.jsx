import React from 'react';
import { Clock, CheckCircle, XCircle } from 'lucide-react';

export const SlotSelector = ({ slots = [], selectedSlot, onSelectSlot, isLoading = false }) => {
  if (isLoading) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
        <Clock size={28} className="animate-spin" style={{ margin: '0 auto 0.5rem' }} />
        <p>Loading available slots from doctor schedule...</p>
      </div>
    );
  }

  if (!slots || slots.length === 0) {
    return (
      <div
        style={{
          padding: '2rem',
          textAlign: 'center',
          background: 'rgba(239, 68, 68, 0.05)',
          borderRadius: 'var(--radius-md)',
          border: '1px dashed rgba(239, 68, 68, 0.2)',
          color: 'var(--text-muted)'
        }}
      >
        <XCircle size={32} color="#f87171" style={{ margin: '0 auto 0.5rem' }} />
        <p style={{ fontWeight: '500', color: 'var(--text-primary)' }}>No Available Slots</p>
        <p style={{ fontSize: '0.85rem' }}>The doctor has no open slots on this date. Please select another date or doctor.</p>
      </div>
    );
  }

  return (
    <div>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))',
          gap: '0.75rem',
          marginTop: '0.5rem'
        }}
      >
        {slots.map((slot) => {
          const isSelected = selectedSlot === slot.startTime;
          const isAvailable = slot.available;

          return (
            <button
              key={slot.startTime}
              type="button"
              disabled={!isAvailable}
              onClick={() => isAvailable && onSelectSlot(slot.startTime)}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '0.75rem 0.5rem',
                borderRadius: 'var(--radius-md)',
                cursor: isAvailable ? 'pointer' : 'not-allowed',
                border: isSelected
                  ? '2px solid #38bdf8'
                  : isAvailable
                  ? '1px solid var(--border-color)'
                  : '1px solid rgba(239, 68, 68, 0.2)',
                background: isSelected
                  ? 'rgba(56, 189, 248, 0.15)'
                  : isAvailable
                  ? 'var(--bg-card)'
                  : 'rgba(239, 68, 68, 0.04)',
                opacity: isAvailable ? 1 : 0.6,
                transition: 'all var(--transition-fast)'
              }}
            >
              <div
                style={{
                  fontSize: '0.95rem',
                  fontWeight: isSelected ? '700' : '600',
                  color: isSelected ? '#38bdf8' : isAvailable ? 'var(--text-primary)' : 'var(--text-muted)'
                }}
              >
                {slot.startTime}
              </div>
              <div
                style={{
                  fontSize: '0.7rem',
                  marginTop: '0.25rem',
                  color: isSelected ? '#38bdf8' : isAvailable ? '#4ade80' : '#f87171',
                  fontWeight: '500'
                }}
              >
                {isAvailable ? 'Available' : 'Booked'}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
