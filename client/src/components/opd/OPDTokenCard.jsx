import React from 'react';
import { QueueStatusBadge } from './QueueStatusBadge';
import { Clock, MapPin, User, Users, AlertCircle, Sparkles, CheckCircle2 } from 'lucide-react';

export const OPDTokenCard = ({ token, patientsAhead = 0, estimatedWaitMinutes = 0, onRefresh }) => {
  if (!token) return null;

  const isCalled = token.status === 'CALLED';
  const isInService = token.status === 'IN_SERVICE';
  const isCompleted = token.status === 'COMPLETED';

  return (
    <div
      style={{
        background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.95), rgba(30, 41, 59, 0.9))',
        borderRadius: '1.25rem',
        border: isCalled
          ? '2px solid #a855f7'
          : isInService
          ? '2px solid #10b981'
          : '1px solid rgba(56, 189, 248, 0.3)',
        boxShadow: isCalled
          ? '0 0 25px rgba(168, 85, 247, 0.3)'
          : isInService
          ? '0 0 25px rgba(16, 185, 129, 0.3)'
          : '0 10px 30px rgba(0, 0, 0, 0.4)',
        padding: '2rem',
        position: 'relative',
        overflow: 'hidden',
        transition: 'all 0.3s ease'
      }}
    >
      {/* Background Glow Accent */}
      <div
        style={{
          position: 'absolute',
          top: '-60px',
          right: '-60px',
          width: '180px',
          height: '180px',
          borderRadius: '50%',
          background: isCalled
            ? 'radial-gradient(circle, rgba(168, 85, 247, 0.25) 0%, transparent 70%)'
            : isInService
            ? 'radial-gradient(circle, rgba(16, 185, 129, 0.25) 0%, transparent 70%)'
            : 'radial-gradient(circle, rgba(56, 189, 248, 0.2) 0%, transparent 70%)',
          pointerEvents: 'none'
        }}
      />

      {/* Header */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          marginBottom: '1.5rem',
          flexWrap: 'wrap',
          gap: '1rem'
        }}
      >
        <div>
          <div
            style={{
              fontSize: '0.8rem',
              textTransform: 'uppercase',
              letterSpacing: '0.1em',
              fontWeight: '700',
              color: '#94a3b8',
              marginBottom: '0.25rem'
            }}
          >
            Hospital OPD Queue Token
          </div>
          <h2
            style={{
              fontSize: '3rem',
              fontWeight: '900',
              letterSpacing: '-0.03em',
              color: isCalled ? '#d8b4fe' : isInService ? '#6ee7b7' : '#38bdf8',
              margin: 0,
              lineHeight: 1
            }}
          >
            {token.tokenNumber}
          </h2>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.5rem' }}>
          <QueueStatusBadge status={token.status} priority={token.priorityType} />
          {token.isLate && (
            <span
              style={{
                fontSize: '0.75rem',
                color: '#f59e0b',
                background: 'rgba(245, 158, 11, 0.1)',
                padding: '0.2rem 0.5rem',
                borderRadius: '0.375rem',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.3rem'
              }}
            >
              <AlertCircle size={12} /> Late Arrival ({token.lateMinutes}m)
            </span>
          )}
        </div>
      </div>

      {/* Live Notice Banner if Called */}
      {isCalled && (
        <div
          style={{
            background: 'rgba(168, 85, 247, 0.15)',
            border: '1px solid rgba(168, 85, 247, 0.4)',
            borderRadius: '0.75rem',
            padding: '1rem',
            marginBottom: '1.5rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            animation: 'pulse 2s infinite'
          }}
        >
          <Sparkles size={24} color="#c084fc" />
          <div>
            <div style={{ fontWeight: '700', color: '#f3e8ff', fontSize: '0.95rem' }}>
              Your Token Has Been Called!
            </div>
            <div style={{ fontSize: '0.85rem', color: '#e9d5ff' }}>
              Please proceed immediately to <strong>{token.roomNumber || 'Consultation Room'}</strong>.
            </div>
          </div>
        </div>
      )}

      {/* Live Notice Banner if In Service */}
      {isInService && (
        <div
          style={{
            background: 'rgba(16, 185, 129, 0.15)',
            border: '1px solid rgba(16, 185, 129, 0.4)',
            borderRadius: '0.75rem',
            padding: '1rem',
            marginBottom: '1.5rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem'
          }}
        >
          <CheckCircle2 size={24} color="#34d399" />
          <div>
            <div style={{ fontWeight: '700', color: '#ecfdf5', fontSize: '0.95rem' }}>
              Consultation In Progress
            </div>
            <div style={{ fontSize: '0.85rem', color: '#a7f3d0' }}>
              Your consultation with Dr. {token.doctorName} is active in {token.roomNumber}.
            </div>
          </div>
        </div>
      )}

      {/* Position Metrics Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
          gap: '1rem',
          background: 'rgba(15, 23, 42, 0.6)',
          borderRadius: '0.75rem',
          padding: '1.25rem',
          marginBottom: '1.5rem',
          border: '1px solid rgba(255, 255, 255, 0.05)'
        }}
      >
        <div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.35rem', marginBottom: '0.35rem' }}>
            <Users size={14} color="#38bdf8" /> Patients Ahead
          </div>
          <div style={{ fontSize: '1.6rem', fontWeight: '800', color: '#f8fafc' }}>
            {isCompleted ? 0 : patientsAhead}
          </div>
        </div>

        <div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.35rem', marginBottom: '0.35rem' }}>
            <Clock size={14} color="#38bdf8" /> Est. Waiting Time
          </div>
          <div style={{ fontSize: '1.6rem', fontWeight: '800', color: '#f8fafc' }}>
            {isCompleted ? 'Done' : isCalled ? 'Now' : `~${estimatedWaitMinutes} mins`}
          </div>
        </div>

        <div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.35rem', marginBottom: '0.35rem' }}>
            <MapPin size={14} color="#38bdf8" /> Consultation Room
          </div>
          <div style={{ fontSize: '1.25rem', fontWeight: '700', color: '#f8fafc', marginTop: '0.2rem' }}>
            {token.roomNumber || 'OPD-101'}
          </div>
        </div>
      </div>

      {/* Details List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem', fontSize: '0.875rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255, 255, 255, 0.05)', paddingBottom: '0.5rem' }}>
          <span style={{ color: 'var(--text-muted)' }}>Patient Name:</span>
          <span style={{ fontWeight: '600', color: '#f1f5f9' }}>{token.patientName} ({token.patientId})</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255, 255, 255, 0.05)', paddingBottom: '0.5rem' }}>
          <span style={{ color: 'var(--text-muted)' }}>Consulting Doctor:</span>
          <span style={{ fontWeight: '600', color: '#f1f5f9' }}>{token.doctorName}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255, 255, 255, 0.05)', paddingBottom: '0.5rem' }}>
          <span style={{ color: 'var(--text-muted)' }}>Department:</span>
          <span style={{ fontWeight: '600', color: '#f1f5f9' }}>{token.departmentName}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255, 255, 255, 0.05)', paddingBottom: '0.5rem' }}>
          <span style={{ color: 'var(--text-muted)' }}>Scheduled Time:</span>
          <span style={{ fontWeight: '600', color: '#f1f5f9' }}>{token.expectedAppointmentTime || '10:00 AM'}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255, 255, 255, 0.05)', paddingBottom: '0.5rem' }}>
          <span style={{ color: 'var(--text-muted)' }}>Check-in Channel:</span>
          <span style={{ fontWeight: '600', color: '#94a3b8' }}>{token.checkInChannel === 'ONLINE_SELF_CHECKIN' ? 'Online Self Check-in' : 'Front Desk Desk'}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: '0.2rem' }}>
          <span style={{ color: 'var(--text-muted)' }}>Token Reference:</span>
          <span style={{ fontFamily: 'monospace', color: '#64748b' }}>{token.tokenId}</span>
        </div>
      </div>
    </div>
  );
};

export default OPDTokenCard;
