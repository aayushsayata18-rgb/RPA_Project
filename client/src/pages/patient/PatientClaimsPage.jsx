import React, { useState, useEffect } from 'react';
import {
  FileText,
  ShieldCheck,
  CheckCircle,
  Clock,
  AlertCircle,
  RefreshCw,
  Calendar,
  Building,
  DollarSign
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import insuranceClaimService from '../../services/insuranceClaimService';

export const PatientClaimsPage = () => {
  const { user } = useAuth();
  const [claims, setClaims] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const patientId = user?.patientId || user?.userId;

  const fetchPatientClaims = async () => {
    if (!patientId) {
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      setError(null);
      const res = await insuranceClaimService.getPatientClaims(patientId);
      setClaims(res?.data || []);
    } catch (err) {
      console.error('Failed to load patient claims:', err);
      setError('Unable to fetch your insurance claims. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPatientClaims();
  }, [patientId]);

  const getStatusBadge = (status) => {
    const map = {
      DRAFT: { bg: 'rgba(148, 163, 184, 0.15)', text: '#94a3b8', label: 'Preparing Dossier' },
      READY: { bg: 'rgba(56, 189, 248, 0.15)', text: '#38bdf8', label: 'Ready for Insurer' },
      SUBMITTED: { bg: 'rgba(129, 140, 248, 0.15)', text: '#818cf8', label: 'Submitted to Insurer' },
      UNDER_REVIEW: { bg: 'rgba(234, 179, 8, 0.15)', text: '#eab308', label: 'Under Insurer Review' },
      QUERY: { bg: 'rgba(249, 115, 22, 0.15)', text: '#f97316', label: 'Clarification In Progress' },
      MORE_INFORMATION_REQUIRED: { bg: 'rgba(249, 115, 22, 0.2)', text: '#ea580c', label: 'Information Requested' },
      APPROVED: { bg: 'rgba(34, 197, 94, 0.15)', text: '#22c55e', label: 'Approved by Insurer' },
      PARTIALLY_APPROVED: { bg: 'rgba(168, 85, 247, 0.15)', text: '#a855f7', label: 'Partially Approved' },
      REJECTED: { bg: 'rgba(239, 68, 68, 0.15)', text: '#ef4444', label: 'Review Completed (Denied)' },
      PAID: { bg: 'rgba(16, 185, 129, 0.2)', text: '#10b981', label: 'Settled & Paid' },
      CANCELLED: { bg: 'rgba(100, 116, 139, 0.2)', text: '#64748b', label: 'Cancelled' }
    };
    const s = map[status] || { bg: '#e2e8f0', text: '#475569', label: status };

    return (
      <span
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '0.35rem',
          padding: '0.25rem 0.75rem',
          borderRadius: '9999px',
          fontSize: '0.8rem',
          fontWeight: '600',
          background: s.bg,
          color: s.text
        }}
      >
        <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: s.text }} />
        {s.label}
      </span>
    );
  };

  return (
    <div style={{ padding: '1.5rem', maxWidth: '1100px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '1.6rem', fontWeight: '700', color: 'var(--text-primary)' }}>
            My Insurance Claims
          </h1>
          <p style={{ margin: '0.25rem 0 0', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
            Track claim submissions, approvals and insurance reimbursements on your hospital bills
          </p>
        </div>

        <button
          onClick={fetchPatientClaims}
          className="btn btn-secondary"
          style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem' }}
        >
          <RefreshCw size={15} />
          <span>Refresh</span>
        </button>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)' }}>
          <RefreshCw size={26} className="spin" style={{ color: '#0284c7', marginBottom: '0.5rem' }} />
          <div>Loading your claims...</div>
        </div>
      ) : error ? (
        <div style={{ textAlign: 'center', padding: '2rem', color: '#ef4444' }}>
          <AlertCircle size={32} style={{ marginBottom: '0.5rem' }} />
          <div>{error}</div>
        </div>
      ) : claims.length === 0 ? (
        <div
          style={{
            background: 'var(--bg-card)',
            borderRadius: 'var(--radius-lg)',
            border: '1px solid var(--border-color)',
            padding: '3rem',
            textAlign: 'center',
            color: 'var(--text-muted)'
          }}
        >
          <FileText size={48} style={{ opacity: 0.3, marginBottom: '0.75rem' }} />
          <h3 style={{ margin: '0 0 0.5rem', color: 'var(--text-primary)' }}>No Claims Filed</h3>
          <p style={{ margin: 0, fontSize: '0.9rem' }}>
            When an inpatient or hospital bill is submitted to your insurer, it will be visible here for real-time tracking.
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {claims.map((claim) => (
            <div
              key={claim.claimId}
              style={{
                background: 'var(--bg-card)',
                borderRadius: 'var(--radius-lg)',
                border: '1px solid var(--border-color)',
                padding: '1.25rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '1rem'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.75rem' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.25rem' }}>
                    <span style={{ fontSize: '1.1rem', fontWeight: '700', color: 'var(--text-primary)' }}>
                      Claim #{claim.claimNumber || claim.claimId}
                    </span>
                    {getStatusBadge(claim.status)}
                  </div>
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                    Insurer: <strong>{claim.insurerName}</strong> • Policy: <strong>{claim.policyNumber}</strong>
                  </div>
                  {claim.insurerReferenceNumber && (
                    <div style={{ fontSize: '0.8rem', color: '#0284c7', marginTop: '0.2rem' }}>
                      Insurer Tracking Reference: {claim.insurerReferenceNumber}
                    </div>
                  )}
                </div>

                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Claimed Amount</div>
                  <div style={{ fontSize: '1.2rem', fontWeight: '700', color: 'var(--text-primary)' }}>
                    ₹{(claim.totalClaimAmount || claim.claimAmount || 0).toLocaleString()}
                  </div>
                </div>
              </div>

              <div
                style={{
                  background: 'var(--bg-sidebar)',
                  padding: '0.75rem 1rem',
                  borderRadius: 'var(--radius-md)',
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                  gap: '0.75rem',
                  fontSize: '0.8rem',
                  border: '1px solid var(--border-color)'
                }}
              >
                <div>
                  <span style={{ color: 'var(--text-muted)' }}>Submitted Date:</span>{' '}
                  <strong style={{ color: 'var(--text-primary)' }}>
                    {claim.submittedAt ? new Date(claim.submittedAt).toLocaleDateString() : 'Processing'}
                  </strong>
                </div>

                <div>
                  <span style={{ color: 'var(--text-muted)' }}>Approved Amount:</span>{' '}
                  <strong style={{ color: claim.approvedAmount > 0 ? '#22c55e' : 'var(--text-primary)' }}>
                    {claim.approvedAmount > 0 ? `₹${claim.approvedAmount.toLocaleString()}` : 'Under Review'}
                  </strong>
                </div>

                <div>
                  <span style={{ color: 'var(--text-muted)' }}>Settled (Paid):</span>{' '}
                  <strong style={{ color: claim.settlementAmount > 0 ? '#10b981' : 'var(--text-primary)' }}>
                    {claim.settlementAmount > 0 ? `₹${claim.settlementAmount.toLocaleString()}` : 'Awaiting Settlement'}
                  </strong>
                </div>

                <div>
                  <span style={{ color: 'var(--text-muted)' }}>Decision Date:</span>{' '}
                  <strong style={{ color: 'var(--text-primary)' }}>
                    {claim.insurerDecisionDate ? new Date(claim.insurerDecisionDate).toLocaleDateString() : 'Pending'}
                  </strong>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default PatientClaimsPage;
