import React from 'react';
import {
  User,
  Phone,
  Mail,
  MapPin,
  Heart,
  ShieldCheck,
  BedDouble,
  CreditCard,
  Calendar,
  AlertCircle,
  FileText
} from 'lucide-react';

export const PatientSummaryCard = ({ summary, onEditProfile, isStaff = false }) => {
  if (!summary || !summary.patient) return null;

  const { patient, activeAdmission, currentBed, financialOverview, activeInsurance } = summary;

  return (
    <div
      style={{
        background: 'var(--bg-card, #1e293b)',
        borderRadius: '16px',
        padding: '1.5rem',
        border: '1px solid var(--border-color, rgba(255,255,255,0.08))',
        boxShadow: '0 8px 24px rgba(0,0,0,0.2)',
        marginBottom: '1.5rem'
      }}
    >
      <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem' }}>
        {/* Patient Identity Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div
            style={{
              width: '60px',
              height: '60px',
              borderRadius: '14px',
              background: 'linear-gradient(135deg, #38bdf8, #0284c7)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fff',
              fontSize: '1.5rem',
              fontWeight: '700'
            }}
          >
            {patient.fullName ? patient.fullName.charAt(0) : 'P'}
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
              <h2 style={{ margin: 0, fontSize: '1.4rem', fontWeight: '700', color: 'var(--text-primary, #f8fafc)' }}>
                {patient.fullName}
              </h2>
              <span
                style={{
                  background: 'rgba(56, 189, 248, 0.15)',
                  color: '#38bdf8',
                  padding: '0.2rem 0.6rem',
                  borderRadius: '6px',
                  fontSize: '0.8rem',
                  fontWeight: '600',
                  letterSpacing: '0.05em'
                }}
              >
                ID: {patient.patientId}
              </span>
              <span
                style={{
                  background: patient.status === 'ACTIVE' ? 'rgba(34, 197, 94, 0.15)' : 'rgba(234, 179, 8, 0.15)',
                  color: patient.status === 'ACTIVE' ? '#22c55e' : '#eab308',
                  padding: '0.2rem 0.6rem',
                  borderRadius: '6px',
                  fontSize: '0.75rem',
                  fontWeight: '600'
                }}
              >
                {patient.status}
              </span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginTop: '0.4rem', color: 'var(--text-secondary, #94a3b8)', fontSize: '0.85rem' }}>
              <span>{patient.gender} • {patient.age ? `${patient.age} yrs` : 'N/A'}</span>
              <span>• Blood: <strong style={{ color: '#f43f5e' }}>{patient.bloodGroup || 'UNKNOWN'}</strong></span>
              <span>• Reg: {new Date(patient.createdAt || Date.now()).toLocaleDateString()}</span>
            </div>
          </div>
        </div>

        {/* Quick Action Button for Profile Edit */}
        {onEditProfile && (
          <button
            onClick={onEditProfile}
            style={{
              background: 'rgba(255, 255, 255, 0.06)',
              color: 'var(--text-primary, #f8fafc)',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              padding: '0.5rem 1rem',
              borderRadius: '8px',
              fontSize: '0.85rem',
              fontWeight: '500',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              transition: 'all 0.2s'
            }}
          >
            <User size={15} />
            <span>{isStaff ? 'Edit Profile & History' : 'Update My Profile'}</span>
          </button>
        )}
      </div>

      {/* Grid of Key Lifecycle Indicators */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '1rem',
          marginTop: '1.25rem',
          paddingTop: '1.25rem',
          borderTop: '1px solid var(--border-color, rgba(255,255,255,0.06))'
        }}
      >
        {/* Contact Info */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', fontSize: '0.85rem' }}>
          <span style={{ color: 'var(--text-muted, #64748b)', fontSize: '0.75rem', textTransform: 'uppercase', fontWeight: '600' }}>
            Contact & Address
          </span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--text-primary, #f8fafc)' }}>
            <Phone size={14} color="#38bdf8" />
            <span>{patient.mobile || 'N/A'}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--text-secondary, #94a3b8)' }}>
            <Mail size={14} color="#38bdf8" />
            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{patient.email || 'None registered'}</span>
          </div>
        </div>

        {/* Current Bed / Inpatient Status */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', fontSize: '0.85rem' }}>
          <span style={{ color: 'var(--text-muted, #64748b)', fontSize: '0.75rem', textTransform: 'uppercase', fontWeight: '600' }}>
            Inpatient Accommodation
          </span>
          {currentBed ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#22c55e', fontWeight: '600' }}>
              <BedDouble size={16} />
              <span>Bed {currentBed.bedNumber} ({currentBed.wardName})</span>
            </div>
          ) : activeAdmission ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#38bdf8' }}>
              <BedDouble size={16} />
              <span>{activeAdmission.assignedWardName || 'Admitted'}</span>
            </div>
          ) : (
            <span style={{ color: 'var(--text-muted, #64748b)' }}>No active inpatient admission</span>
          )}
        </div>

        {/* Active Insurance */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', fontSize: '0.85rem' }}>
          <span style={{ color: 'var(--text-muted, #64748b)', fontSize: '0.75rem', textTransform: 'uppercase', fontWeight: '600' }}>
            Active Insurance
          </span>
          {activeInsurance ? (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#38bdf8', fontWeight: '600' }}>
                <ShieldCheck size={16} color="#38bdf8" />
                <span>{activeInsurance.providerName}</span>
              </div>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted, #64748b)' }}>
                Pol: {activeInsurance.policyNumber}
              </span>
            </div>
          ) : (
            <span style={{ color: 'var(--text-muted, #64748b)' }}>Self Pay / Uninsured</span>
          )}
        </div>

        {/* Financial Overview */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', fontSize: '0.85rem' }}>
          <span style={{ color: 'var(--text-muted, #64748b)', fontSize: '0.75rem', textTransform: 'uppercase', fontWeight: '600' }}>
            Financial Overview
          </span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <CreditCard size={15} color="#eab308" />
            <span style={{ color: financialOverview?.outstandingBalance > 0 ? '#f43f5e' : '#22c55e', fontWeight: '700' }}>
              ₹{financialOverview?.outstandingBalance?.toLocaleString() || 0}
            </span>
            <span style={{ color: 'var(--text-muted, #64748b)', fontSize: '0.75rem' }}>
              (Balance)
            </span>
          </div>
          <span style={{ color: 'var(--text-muted, #64748b)', fontSize: '0.75rem' }}>
            Total Invoices: {financialOverview?.totalInvoices || 0}
          </span>
        </div>
      </div>
    </div>
  );
};

export default PatientSummaryCard;
