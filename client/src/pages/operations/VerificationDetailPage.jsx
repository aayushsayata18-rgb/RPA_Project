import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ShieldCheck,
  ArrowLeft,
  RefreshCw,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Clock,
  User,
  FileText,
  DollarSign,
  Bot,
  Layers,
  Send,
  ExternalLink,
  AlertCircle
} from 'lucide-react';
import insuranceService from '../../services/insuranceService';

export const VerificationDetailPage = () => {
  const { verificationId } = useParams();
  const navigate = useNavigate();

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [evidenceList, setEvidenceList] = useState([]);

  // Exception / Manual Review Action Form
  const [decision, setDecision] = useState('Confirmed active policy and patient eligibility');
  const [reviewNotes, setReviewNotes] = useState('');
  const [confirmedStatus, setConfirmedStatus] = useState('VERIFIED');
  const [resolving, setResolving] = useState(false);
  const [resolveSuccess, setResolveSuccess] = useState(false);

  const fetchVerificationDetails = async () => {
    try {
      setLoading(true);
      const [verRes, evRes] = await Promise.all([
        insuranceService.getVerificationById(verificationId),
        insuranceService.getVerificationEvidence(verificationId).catch(() => ({ evidence: [] }))
      ]);

      if (verRes && verRes.verification) {
        setData(verRes.verification);
      }
      if (evRes && evRes.evidence) {
        setEvidenceList(evRes.evidence);
      }
    } catch (err) {
      console.error('Failed to load verification detail:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (verificationId) fetchVerificationDetails();
  }, [verificationId]);

  const handleResolveReview = async (e) => {
    e.preventDefault();
    try {
      setResolving(true);
      if (data?.exceptionCaseId) {
        await insuranceService.resolveException(data.exceptionCaseId, {
          decision,
          notes: reviewNotes,
          confirmedStatus
        });
      } else {
        await insuranceService.recordManualVerification(verificationId, {
          eligibilityStatus: confirmedStatus === 'VERIFIED' ? 'ELIGIBLE' : 'NOT_ELIGIBLE',
          policyStatus: confirmedStatus === 'VERIFIED' ? 'ACTIVE' : 'SUSPENDED',
          notes: reviewNotes,
          referenceNumber: `MANUAL-${Date.now().toString().slice(-6)}`
        });
      }

      setResolveSuccess(true);
      setTimeout(() => {
        fetchVerificationDetails();
        setResolveSuccess(false);
      }, 1500);
    } catch (err) {
      alert(err.response?.data?.message || err.message || 'Failed to submit review');
    } finally {
      setResolving(false);
    }
  };

  if (loading) {
    return (
      <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
        <RefreshCw size={24} className="spin-icon" style={{ margin: '0 auto 0.75rem' }} />
        Loading insurance verification dossier...
      </div>
    );
  }

  if (!data) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        <h3>Verification dossier not found ({verificationId})</h3>
        <button onClick={() => navigate('/finance/insurance')} className="btn-primary" style={{ marginTop: '1rem' }}>
          Back to Hub
        </button>
      </div>
    );
  }

  return (
    <div style={{ padding: '1.5rem', maxWidth: '1280px', margin: '0 auto' }}>
      {/* Back button */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.25rem' }}>
        <button
          onClick={() => navigate(-1)}
          style={{
            background: 'transparent',
            border: 'none',
            color: 'var(--text-secondary)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '0.4rem',
            fontSize: '0.875rem'
          }}
        >
          <ArrowLeft size={16} /> Back
        </button>
      </div>

      {/* Title & Status Bar */}
      <div
        style={{
          background: 'var(--bg-card)',
          borderRadius: 'var(--radius-md)',
          border: '1px solid var(--border-color)',
          padding: '1.5rem',
          marginBottom: '1.5rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1rem'
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-primary)' }}>
              Verification Dossier: {data.verificationId}
            </h1>
            <span
              style={{
                fontSize: '0.8rem',
                fontWeight: 700,
                padding: '0.25rem 0.75rem',
                borderRadius: '999px',
                background:
                  data.status === 'VERIFIED'
                    ? 'rgba(16, 185, 129, 0.15)'
                    : data.status === 'EXPIRED'
                    ? 'rgba(239, 68, 68, 0.15)'
                    : 'rgba(245, 158, 11, 0.15)',
                color:
                  data.status === 'VERIFIED'
                    ? '#10b981'
                    : data.status === 'EXPIRED'
                    ? '#ef4444'
                    : '#fbbf24',
                border: `1px solid ${
                  data.status === 'VERIFIED'
                    ? 'rgba(16, 185, 129, 0.3)'
                    : data.status === 'EXPIRED'
                    ? 'rgba(239, 68, 68, 0.3)'
                    : 'rgba(245, 158, 11, 0.3)'
                }`
              }}
            >
              {data.status}
            </span>
          </div>
          <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '0.35rem' }}>
            Source: <strong style={{ color: 'var(--text-primary)' }}>{data.verificationSource}</strong> ({data.integrationType}) •
            Correlation ID: <span style={{ fontFamily: 'monospace' }}>{data.correlationId || 'N/A'}</span>
          </div>
        </div>

        <div>
          <button
            onClick={() => navigate(`/finance/patients/${data.patientId}/insurance`)}
            style={{
              padding: '0.6rem 1.1rem',
              borderRadius: 'var(--radius-sm)',
              background: 'rgba(56, 189, 248, 0.1)',
              border: '1px solid rgba(56, 189, 248, 0.3)',
              color: '#38bdf8',
              fontSize: '0.85rem',
              cursor: 'pointer',
              fontWeight: 500
            }}
          >
            View Patient All Policies
          </button>
        </div>
      </div>

      {/* 2-Column Layout */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '1.5rem', marginBottom: '1.5rem' }}>
        {/* Left Column: Demographics & Policy Details */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* Patient Card */}
          <div style={{ background: 'var(--bg-card)', padding: '1.5rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: '1rem' }}>
              Patient Information
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', fontSize: '0.875rem' }}>
              <div>
                <span style={{ color: 'var(--text-muted)' }}>Patient Name:</span>
                <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{data.patientName || data.patient?.fullName || 'N/A'}</div>
              </div>
              <div>
                <span style={{ color: 'var(--text-muted)' }}>Hospital Patient ID:</span>
                <div style={{ fontWeight: 600, color: '#38bdf8', fontFamily: 'monospace' }}>{data.patientId}</div>
              </div>
              <div>
                <span style={{ color: 'var(--text-muted)' }}>Phone:</span>
                <div style={{ color: 'var(--text-primary)' }}>{data.patient?.mobile || 'N/A'}</div>
              </div>
              <div>
                <span style={{ color: 'var(--text-muted)' }}>Date of Birth:</span>
                <div style={{ color: 'var(--text-primary)' }}>
                  {data.patient?.dateOfBirth ? new Date(data.patient.dateOfBirth).toLocaleDateString() : 'N/A'}
                </div>
              </div>
            </div>
          </div>

          {/* Policy Card */}
          <div style={{ background: 'var(--bg-card)', padding: '1.5rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: '1rem' }}>
              Insurer & Policy Details
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', fontSize: '0.875rem' }}>
              <div>
                <span style={{ color: 'var(--text-muted)' }}>Insurer Name:</span>
                <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{data.insurerName}</div>
              </div>
              <div>
                <span style={{ color: 'var(--text-muted)' }}>Policy Number:</span>
                <div style={{ fontWeight: 600, color: 'var(--text-primary)', fontFamily: 'monospace' }}>{data.policyNumber}</div>
              </div>
              <div>
                <span style={{ color: 'var(--text-muted)' }}>Member ID:</span>
                <div style={{ fontWeight: 600, color: 'var(--text-primary)', fontFamily: 'monospace' }}>{data.memberId || 'N/A'}</div>
              </div>
              <div>
                <span style={{ color: 'var(--text-muted)' }}>Plan Name:</span>
                <div style={{ color: 'var(--text-primary)' }}>{data.policy?.planName || 'Comprehensive'}</div>
              </div>
              <div>
                <span style={{ color: 'var(--text-muted)' }}>Effective Date:</span>
                <div style={{ color: 'var(--text-primary)' }}>
                  {data.effectiveDate ? new Date(data.effectiveDate).toLocaleDateString() : 'Not Provided'}
                </div>
              </div>
              <div>
                <span style={{ color: 'var(--text-muted)' }}>Expiry Date:</span>
                <div style={{ color: 'var(--text-primary)' }}>
                  {data.expiryDate ? new Date(data.expiryDate).toLocaleDateString() : 'Not Provided'}
                </div>
              </div>
            </div>
          </div>

          {/* Technical Execution & RPA Card */}
          <div style={{ background: 'var(--bg-card)', padding: '1.5rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Bot size={16} color="#a78bfa" /> RPA Automation & Gateway Audit
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', fontSize: '0.875rem' }}>
              <div>
                <span style={{ color: 'var(--text-muted)' }}>RPA Job ID:</span>
                <div style={{ fontFamily: 'monospace', color: '#a78bfa' }}>{data.rpaJobId || 'Direct API (No RPA job)'}</div>
              </div>
              <div>
                <span style={{ color: 'var(--text-muted)' }}>External Reference:</span>
                <div style={{ fontFamily: 'monospace', color: 'var(--text-primary)' }}>{data.verificationReference || 'N/A'}</div>
              </div>
              <div>
                <span style={{ color: 'var(--text-muted)' }}>Requested At:</span>
                <div style={{ color: 'var(--text-primary)' }}>
                  {data.requestedAt ? new Date(data.requestedAt).toLocaleString() : 'N/A'}
                </div>
              </div>
              <div>
                <span style={{ color: 'var(--text-muted)' }}>Completed At:</span>
                <div style={{ color: 'var(--text-primary)' }}>
                  {data.completedAt ? new Date(data.completedAt).toLocaleString() : 'Pending'}
                </div>
              </div>
            </div>

            {/* Attempts timeline */}
            {data.attempts && data.attempts.length > 0 && (
              <div style={{ marginTop: '1rem', borderTop: '1px solid var(--border-color)', paddingTop: '0.75rem' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>
                  Verification Attempts ({data.attempts.length})
                </span>
                <div style={{ marginTop: '0.5rem', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                  {data.attempts.map((att, idx) => (
                    <div
                      key={att._id || idx}
                      style={{
                        padding: '0.4rem 0.6rem',
                        background: 'rgba(0,0,0,0.2)',
                        borderRadius: '4px',
                        fontSize: '0.75rem',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center'
                      }}
                    >
                      <span>
                        Attempt #{att.attemptNumber} ({att.source})
                      </span>
                      <span style={{ color: att.status === 'SUCCESS' ? '#10b981' : '#ef4444', fontWeight: 600 }}>
                        {att.status} {att.errorMessage ? `- ${att.errorMessage}` : ''}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Verified Coverage, Network & Actions */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* Eligibility & Financial Breakdown Card */}
          <div style={{ background: 'var(--bg-card)', padding: '1.5rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: '1.25rem' }}>
              Coverage & Cost-Sharing Summary
            </h3>

            {/* Badges row */}
            <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', marginBottom: '1.25rem' }}>
              <div style={{ padding: '0.5rem 0.75rem', borderRadius: 'var(--radius-sm)', background: 'rgba(0,0,0,0.2)', border: '1px solid var(--border-color)' }}>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Eligibility Status</div>
                <div style={{ fontWeight: 700, color: data.eligibilityStatus === 'ELIGIBLE' ? '#10b981' : '#f59e0b' }}>
                  {data.eligibilityStatus}
                </div>
              </div>

              <div style={{ padding: '0.5rem 0.75rem', borderRadius: 'var(--radius-sm)', background: 'rgba(0,0,0,0.2)', border: '1px solid var(--border-color)' }}>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Network Tier</div>
                <div style={{ fontWeight: 700, color: data.networkStatus === 'IN_NETWORK' ? '#10b981' : '#f59e0b' }}>
                  {data.networkStatus}
                </div>
              </div>

              <div style={{ padding: '0.5rem 0.75rem', borderRadius: 'var(--radius-sm)', background: 'rgba(0,0,0,0.2)', border: '1px solid var(--border-color)' }}>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Prior Authorization</div>
                <div style={{ fontWeight: 700, color: data.authorizationRequired === 'REQUIRED' ? '#fbbf24' : '#94a3b8' }}>
                  {data.authorizationRequired}
                </div>
              </div>
            </div>

            {/* Financial Numbers (Only populated from insurer) */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', borderTop: '1px solid var(--border-color)', paddingTop: '1rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Coverage Limit</span>
                <span style={{ fontSize: '1.2rem', fontWeight: 700, color: '#38bdf8' }}>
                  {data.coverageLimit !== null && data.coverageLimit !== undefined
                    ? `₹${Number(data.coverageLimit).toLocaleString()}`
                    : 'Unknown / Not Provided'}
                </span>
              </div>

              {data.coverageRemaining !== null && data.coverageRemaining !== undefined && (
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Coverage Remaining</span>
                  <span style={{ fontSize: '1.1rem', fontWeight: 600, color: '#10b981' }}>
                    ₹{Number(data.coverageRemaining).toLocaleString()}
                  </span>
                </div>
              )}

              {data.deductibleAmount !== null && data.deductibleAmount !== undefined && (
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Deductible Amount</span>
                  <span style={{ fontWeight: 500, color: 'var(--text-primary)' }}>
                    ₹{Number(data.deductibleAmount).toLocaleString()}
                  </span>
                </div>
              )}

              {data.deductibleRemaining !== null && data.deductibleRemaining !== undefined && (
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Deductible Remaining</span>
                  <span style={{ fontWeight: 500, color: '#fbbf24' }}>
                    ₹{Number(data.deductibleRemaining).toLocaleString()}
                  </span>
                </div>
              )}

              {data.copayAmount !== null && data.copayAmount !== undefined && (
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Patient Co-Pay</span>
                  <span style={{ fontWeight: 500, color: 'var(--text-primary)' }}>
                    ₹{Number(data.copayAmount).toLocaleString()}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Evidence Documents Section */}
          <div style={{ background: 'var(--bg-card)', padding: '1.5rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: '1rem' }}>
              Verification Evidence ({evidenceList.length})
            </h3>
            {evidenceList.length === 0 ? (
              <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                No external document snapshots captured.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {evidenceList.map((doc) => (
                  <div
                    key={doc._id || doc.documentId}
                    style={{
                      padding: '0.6rem 0.75rem',
                      borderRadius: 'var(--radius-sm)',
                      background: 'rgba(0,0,0,0.2)',
                      border: '1px solid var(--border-color)',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center'
                    }}
                  >
                    <div>
                      <div style={{ fontSize: '0.85rem', fontWeight: 500, color: 'var(--text-primary)' }}>{doc.fileName}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{doc.documentType} • {new Date(doc.createdAt).toLocaleDateString()}</div>
                    </div>
                    {doc.fileUrl && (
                      <a
                        href={doc.fileUrl}
                        target="_blank"
                        rel="noreferrer"
                        style={{ fontSize: '0.75rem', color: '#38bdf8', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.2rem' }}
                      >
                        <ExternalLink size={12} /> View
                      </a>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Ambiguous Review Resolution Form (Section 40) */}
          {(data.status === 'AMBIGUOUS' || data.status === 'MANUAL_REVIEW') && (
            <div
              style={{
                background: 'rgba(245, 158, 11, 0.08)',
                border: '1px solid rgba(245, 158, 11, 0.3)',
                padding: '1.5rem',
                borderRadius: 'var(--radius-md)'
              }}
            >
              <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#fbbf24', display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
                <AlertTriangle size={18} /> Human Review Resolution Desk
              </h3>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>
                This verification requires manual review due to {data.errorMessage || 'ambiguous insurer matches'}.
              </p>

              {data.insurerResponseSummary?.matches && (
                <div style={{ background: 'rgba(0,0,0,0.3)', padding: '0.75rem', borderRadius: 'var(--radius-sm)', marginBottom: '1rem', fontSize: '0.8rem' }}>
                  <div style={{ fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.4rem' }}>Candidate Matches from Insurer:</div>
                  {data.insurerResponseSummary.matches.map((m, idx) => (
                    <div key={idx} style={{ padding: '0.3rem 0', borderBottom: idx === 0 ? '1px solid var(--border-color)' : 'none' }}>
                      <strong>Match #{idx + 1}:</strong> {m.name} • DOB: {m.dob} • Mem ID: {m.memberId}
                    </div>
                  ))}
                </div>
              )}

              <form onSubmit={handleResolveReview}>
                <div style={{ marginBottom: '0.75rem' }}>
                  <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.3rem' }}>
                    Review Decision *
                  </label>
                  <input
                    type="text"
                    required
                    value={decision}
                    onChange={(e) => setDecision(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '0.55rem',
                      borderRadius: 'var(--radius-sm)',
                      background: 'var(--bg-app)',
                      border: '1px solid var(--border-color)',
                      color: 'var(--text-primary)',
                      fontSize: '0.85rem'
                    }}
                  />
                </div>

                <div style={{ marginBottom: '0.75rem' }}>
                  <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.3rem' }}>
                    Resolution Status *
                  </label>
                  <select
                    value={confirmedStatus}
                    onChange={(e) => setConfirmedStatus(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '0.55rem',
                      borderRadius: 'var(--radius-sm)',
                      background: 'var(--bg-app)',
                      border: '1px solid var(--border-color)',
                      color: 'var(--text-primary)',
                      fontSize: '0.85rem'
                    }}
                  >
                    <option value="VERIFIED">Confirm Verified (Valid)</option>
                    <option value="NOT_ELIGIBLE">Mark Not Eligible</option>
                    <option value="EXPIRED">Mark Expired</option>
                  </select>
                </div>

                <div style={{ marginBottom: '1rem' }}>
                  <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.3rem' }}>
                    Notes & Verification Evidence
                  </label>
                  <textarea
                    rows={2}
                    placeholder="Enter insurer correspondence confirmation or reference details..."
                    value={reviewNotes}
                    onChange={(e) => setReviewNotes(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '0.55rem',
                      borderRadius: 'var(--radius-sm)',
                      background: 'var(--bg-app)',
                      border: '1px solid var(--border-color)',
                      color: 'var(--text-primary)',
                      fontSize: '0.85rem'
                    }}
                  />
                </div>

                {resolveSuccess && (
                  <div style={{ padding: '0.5rem', borderRadius: '4px', background: 'rgba(16, 185, 129, 0.2)', color: '#10b981', fontSize: '0.85rem', marginBottom: '0.75rem' }}>
                    Resolution recorded and policy status updated!
                  </div>
                )}

                <button
                  type="submit"
                  disabled={resolving}
                  style={{
                    width: '100%',
                    padding: '0.65rem',
                    borderRadius: 'var(--radius-sm)',
                    background: '#fbbf24',
                    border: 'none',
                    color: '#000',
                    fontWeight: 700,
                    cursor: 'pointer'
                  }}
                >
                  {resolving ? 'Recording Decision...' : 'Record Human Decision & Resolve'}
                </button>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default VerificationDetailPage;
