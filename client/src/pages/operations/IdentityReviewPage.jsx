import React, { useState, useEffect } from 'react';
import {
  ShieldAlert,
  UserCheck,
  UserPlus,
  XCircle,
  AlertTriangle,
  CheckCircle2,
  Activity,
  ArrowRight,
  Eye,
  FileText
} from 'lucide-react';
import { patientService } from '../../services/patientService';

export const IdentityReviewPage = () => {
  const [registrations, setRegistrations] = useState([]);
  const [selectedReg, setSelectedReg] = useState(null);
  const [selectedPatientId, setSelectedPatientId] = useState('');
  const [reviewNotes, setReviewNotes] = useState('');
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    fetchPendingReviews();
  }, []);

  const fetchPendingReviews = async () => {
    setLoading(true);
    try {
      const res = await patientService.listRegistrations({
        status: 'IDENTITY_VERIFICATION_REQUIRED'
      });
      if (res?.data) {
        setRegistrations(res.data.registrations || []);
        if (res.data.registrations?.length > 0) {
          setSelectedReg(res.data.registrations[0]);
          if (res.data.registrations[0].potentialMatches?.length > 0) {
            setSelectedPatientId(res.data.registrations[0].potentialMatches[0].patientId);
          }
        } else {
          setSelectedReg(null);
        }
      }
    } catch (err) {
      console.error('Failed to load identity reviews:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDecision = async (decision) => {
    if (!selectedReg) return;
    setActionLoading(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const res = await patientService.reviewRegistration(selectedReg.registrationId, {
        decision,
        selectedPatientId: decision === 'CONFIRM_EXISTING' ? selectedPatientId : undefined,
        reviewNotes
      });

      if (res?.success) {
        setSuccessMsg(
          `Decision [${decision}] successfully processed for Registration ${selectedReg.registrationId}. Patient ID: ${res.data.patientId || 'N/A'}.`
        );
        setReviewNotes('');
        fetchPendingReviews();
      }
    } catch (err) {
      setErrorMsg(err.message || 'Failed to submit review decision.');
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">Identity Verification & Ambiguity Queue</h1>
          <p className="page-subtitle">
            Operations Portal • Human Review for Duplicate & Partial Identity Matches
          </p>
        </div>
        <span
          style={{
            padding: '0.35rem 0.85rem',
            borderRadius: '9999px',
            fontSize: '0.8rem',
            fontWeight: 700,
            background: registrations.length > 0 ? 'rgba(245, 158, 11, 0.2)' : 'rgba(16, 185, 129, 0.2)',
            color: registrations.length > 0 ? '#fbbf24' : '#10b981',
            border: `1px solid ${registrations.length > 0 ? 'rgba(245, 158, 11, 0.4)' : 'rgba(16, 185, 129, 0.4)'}`
          }}
        >
          {registrations.length} Cases Pending Review
        </span>
      </div>

      {successMsg && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            padding: '1rem',
            background: 'rgba(16, 185, 129, 0.15)',
            border: '1px solid rgba(16, 185, 129, 0.4)',
            borderRadius: '8px',
            marginBottom: '1.5rem',
            color: '#a7f3d0'
          }}
        >
          <CheckCircle2 size={20} color="#10b981" />
          <span>{successMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            padding: '1rem',
            background: 'rgba(239, 68, 68, 0.15)',
            border: '1px solid rgba(239, 68, 68, 0.4)',
            borderRadius: '8px',
            marginBottom: '1.5rem',
            color: '#fca5a5'
          }}
        >
          <AlertTriangle size={20} color="#ef4444" />
          <span>{errorMsg}</span>
        </div>
      )}

      {loading ? (
        <div style={{ textAlign: 'center', padding: '4rem 0', color: '#94a3b8' }}>
          Loading identity review queue...
        </div>
      ) : registrations.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '4rem 2rem' }}>
          <CheckCircle2 size={48} color="#10b981" style={{ margin: '0 auto 1rem' }} />
          <h3 style={{ fontSize: '1.25rem', color: '#f8fafc', marginBottom: '0.5rem' }}>
            Queue Cleared!
          </h3>
          <p className="text-secondary" style={{ maxWidth: '500px', margin: '0 auto' }}>
            No ambiguous registration cases pending human verification. All registrations have clean, confident identities.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-3" style={{ gap: '1.5rem' }}>
          {/* Left Column: List of Ambiguous Cases */}
          <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
            <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid var(--border-color)', fontWeight: 700, color: '#f8fafc' }}>
              Pending Ambiguity Cases
            </div>
            <div style={{ maxHeight: '600px', overflowY: 'auto' }}>
              {registrations.map((reg) => {
                const isSelected = selectedReg?.registrationId === reg.registrationId;
                const sub = reg.submittedData || {};
                return (
                  <div
                    key={reg.registrationId}
                    onClick={() => {
                      setSelectedReg(reg);
                      if (reg.potentialMatches?.length > 0) {
                        setSelectedPatientId(reg.potentialMatches[0].patientId);
                      }
                    }}
                    style={{
                      padding: '1rem 1.25rem',
                      borderBottom: '1px solid var(--border-color)',
                      cursor: 'pointer',
                      background: isSelected ? 'rgba(2, 132, 199, 0.15)' : 'transparent',
                      borderLeft: isSelected ? '4px solid #38bdf8' : '4px solid transparent',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                      <strong style={{ color: isSelected ? '#38bdf8' : '#f8fafc', fontSize: '0.9rem' }}>
                        {sub.firstName} {sub.lastName}
                      </strong>
                      <span style={{ fontSize: '0.75rem', color: '#fbbf24', fontWeight: 700 }}>
                        {reg.potentialMatches?.length || 0} Matches
                      </span>
                    </div>
                    <div style={{ fontSize: '0.8rem', color: '#94a3b8' }}>
                      Phone: {sub.mobile} • DOB: {sub.dateOfBirth ? new Date(sub.dateOfBirth).toLocaleDateString('en-GB') : 'N/A'}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.25rem' }}>
                      {reg.registrationId} • {new Date(reg.createdAt).toLocaleTimeString()}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right 2 Columns: Side-by-Side Comparison & Decision Matrix */}
          <div className="card" style={{ gridColumn: 'span 2' }}>
            {selectedReg ? (
              <div className="space-y-4">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem' }}>
                  <div>
                    <h3 style={{ fontSize: '1.2rem', color: '#f8fafc' }}>
                      Comparison Dossier: {selectedReg.registrationId}
                    </h3>
                    <p className="text-secondary text-xs">
                      Verify if submitted applicant is an existing patient or a genuinely new individual.
                    </p>
                  </div>
                  <span
                    style={{
                      padding: '0.25rem 0.65rem',
                      borderRadius: '4px',
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      background: 'rgba(239, 68, 68, 0.2)',
                      color: '#f87171'
                    }}
                  >
                    NEVER AUTO-MERGE
                  </span>
                </div>

                {/* Side-by-Side Comparison Grid */}
                <div className="grid grid-cols-2" style={{ gap: '1rem' }}>
                  {/* Left Box: Submitted Data */}
                  <div style={{ background: 'rgba(15, 23, 42, 0.7)', padding: '1rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.08)' }}>
                    <div style={{ color: '#fbbf24', fontWeight: 700, fontSize: '0.85rem', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <FileText size={16} /> NEWLY SUBMITTED APPLICANT
                    </div>
                    <div style={{ fontSize: '0.85rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                      <div>
                        <span className="text-secondary text-xs" style={{ display: 'block' }}>Name</span>
                        <strong style={{ color: '#f8fafc' }}>{selectedReg.submittedData?.firstName} {selectedReg.submittedData?.lastName}</strong>
                      </div>
                      <div>
                        <span className="text-secondary text-xs" style={{ display: 'block' }}>Date of Birth</span>
                        <span style={{ color: '#e2e8f0' }}>{selectedReg.submittedData?.dateOfBirth ? new Date(selectedReg.submittedData.dateOfBirth).toLocaleDateString('en-GB') : 'N/A'}</span>
                      </div>
                      <div>
                        <span className="text-secondary text-xs" style={{ display: 'block' }}>Gender</span>
                        <span style={{ color: '#e2e8f0' }}>{selectedReg.submittedData?.gender}</span>
                      </div>
                      <div>
                        <span className="text-secondary text-xs" style={{ display: 'block' }}>Mobile</span>
                        <span style={{ color: '#e2e8f0' }}>{selectedReg.submittedData?.mobile}</span>
                      </div>
                      <div>
                        <span className="text-secondary text-xs" style={{ display: 'block' }}>Email</span>
                        <span style={{ color: '#e2e8f0' }}>{selectedReg.submittedData?.email || 'N/A'}</span>
                      </div>
                    </div>
                  </div>

                  {/* Right Box: Potential Matches in Patient Master */}
                  <div style={{ background: 'rgba(15, 23, 42, 0.7)', padding: '1rem', borderRadius: '8px', border: '1px solid rgba(2, 132, 199, 0.3)' }}>
                    <div style={{ color: '#38bdf8', fontWeight: 700, fontSize: '0.85rem', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <UserCheck size={16} /> POTENTIAL MATCHES IN PATIENT MASTER
                    </div>

                    {selectedReg.potentialMatches?.map((match) => {
                      const isCandidateSelected = selectedPatientId === match.patientId;
                      return (
                        <div
                          key={match.patientId}
                          onClick={() => setSelectedPatientId(match.patientId)}
                          style={{
                            padding: '0.75rem',
                            borderRadius: '6px',
                            border: `1px solid ${isCandidateSelected ? '#0284c7' : 'rgba(255,255,255,0.06)'}`,
                            background: isCandidateSelected ? 'rgba(2, 132, 199, 0.15)' : 'rgba(0,0,0,0.2)',
                            marginBottom: '0.75rem',
                            cursor: 'pointer'
                          }}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.25rem' }}>
                            <strong style={{ color: '#38bdf8', fontSize: '0.9rem' }}>{match.patientId} - {match.fullName}</strong>
                            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#10b981', background: 'rgba(16,185,129,0.15)', padding: '0.15rem 0.4rem', borderRadius: '4px' }}>
                              {match.matchScore}% Match
                            </span>
                          </div>
                          <div style={{ fontSize: '0.8rem', color: '#cbd5e1' }}>
                            Mobile: {match.mobile} • DOB: {match.dateOfBirth ? new Date(match.dateOfBirth).toLocaleDateString('en-GB') : 'N/A'}
                          </div>
                          <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '0.35rem' }}>
                            Reasons: {match.matchReasons?.join(', ')}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Reviewer Decision Matrix */}
                <div style={{ background: 'rgba(15, 23, 42, 0.8)', padding: '1.25rem', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                  <label className="text-secondary text-xs" style={{ display: 'block', marginBottom: '0.35rem', fontWeight: 600 }}>
                    Staff Review Audit Notes <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <input
                    type="text"
                    value={reviewNotes}
                    onChange={(e) => setReviewNotes(e.target.value)}
                    placeholder="Enter reason for identity decision (e.g. Phone confirmed with patient over desk)..."
                    className="input text-sm"
                    style={{ marginBottom: '1rem' }}
                  />

                  <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                    <button
                      type="button"
                      onClick={() => handleDecision('REJECT')}
                      disabled={actionLoading}
                      className="btn btn-danger"
                      style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem' }}
                    >
                      <XCircle size={16} /> Reject Submission
                    </button>

                    <button
                      type="button"
                      onClick={() => handleDecision('CREATE_NEW')}
                      disabled={actionLoading}
                      className="btn btn-secondary"
                      style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem' }}
                    >
                      <UserPlus size={16} /> Create Distinct New Patient ID
                    </button>

                    <button
                      type="button"
                      onClick={() => handleDecision('CONFIRM_EXISTING')}
                      disabled={actionLoading || !selectedPatientId}
                      className="btn btn-primary"
                      style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem' }}
                    >
                      <UserCheck size={16} /> Confirm Existing Patient ({selectedPatientId || 'Select'})
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '3rem', color: '#64748b' }}>
                Select an ambiguous registration from the queue to review.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
