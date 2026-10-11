import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ShieldCheck,
  Plus,
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  FileText,
  User,
  Clock,
  ArrowLeft,
  Calendar,
  AlertCircle
} from 'lucide-react';
import insuranceService from '../../services/insuranceService';
import api from '../../services/api';

export const PatientInsurancePage = () => {
  const { patientId } = useParams();
  const navigate = useNavigate();

  const [patient, setPatient] = useState(null);
  const [policies, setPolicies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [verifyingPolicyId, setVerifyingPolicyId] = useState(null);

  // Add Policy Modal
  const [modalOpen, setModalOpen] = useState(false);
  const [duplicateWarning, setDuplicateWarning] = useState(null);
  const [formData, setFormData] = useState({
    providerName: '',
    policyNumber: '',
    memberId: '',
    groupNumber: '',
    policyHolderName: '',
    relationshipToPatient: 'SELF',
    planName: '',
    planType: 'COMPREHENSIVE',
    startDate: '',
    endDate: '',
    isPrimary: true
  });
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const fetchPatientAndPolicies = async () => {
    try {
      setLoading(true);
      const [patRes, polRes] = await Promise.all([
        api.get(`/patients/${patientId}`).catch(() => ({ data: { patient: { patientId, fullName: 'Patient' } } })),
        insuranceService.getPatientPolicies(patientId).catch(() => ({ policies: [] }))
      ]);

      if (patRes.data && patRes.data.patient) setPatient(patRes.data.patient);
      if (polRes && polRes.policies) setPolicies(polRes.policies);
    } catch (err) {
      console.error('Failed to load patient insurance data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (patientId) fetchPatientAndPolicies();
  }, [patientId]);

  const handleVerify = async (policyId) => {
    try {
      setVerifyingPolicyId(policyId);
      const res = await insuranceService.requestVerification(policyId, { forceNew: true });
      alert(`Verification queued! Ref: ${res.verificationId}. Processing with insurer...`);
      setTimeout(() => {
        fetchPatientAndPolicies();
        setVerifyingPolicyId(null);
      }, 2000);
    } catch (err) {
      alert(err.response?.data?.message || err.message || 'Verification failed');
      setVerifyingPolicyId(null);
    }
  };

  // Pre-flight duplicate check on blur of policy number or member ID
  const checkDuplicate = async () => {
    if (!formData.policyNumber || !formData.providerName) return;
    try {
      const res = await insuranceService.checkDuplicatePolicy({
        patientId,
        providerName: formData.providerName,
        policyNumber: formData.policyNumber,
        memberId: formData.memberId
      });
      if (res.isDuplicate) {
        setDuplicateWarning(res.existingPolicy);
      } else {
        setDuplicateWarning(null);
      }
    } catch (err) {
      console.warn('Duplicate check error:', err);
    }
  };

  const handleCreatePolicy = async (e, shouldVerify = false) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      setErrorMsg('');
      const res = await insuranceService.createPolicy({
        ...formData,
        patientId
      });

      if (shouldVerify && res.policy?.policyId) {
        await insuranceService.requestVerification(res.policy.policyId, { forceNew: true });
      }

      setModalOpen(false);
      setFormData({
        providerName: '',
        policyNumber: '',
        memberId: '',
        groupNumber: '',
        policyHolderName: '',
        relationshipToPatient: 'SELF',
        planName: '',
        planType: 'COMPREHENSIVE',
        startDate: '',
        endDate: '',
        isPrimary: policies.length === 0
      });
      setDuplicateWarning(null);
      fetchPatientAndPolicies();
    } catch (err) {
      setErrorMsg(err.response?.data?.message || err.message || 'Failed to create policy');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ padding: '1.5rem', maxWidth: '1280px', margin: '0 auto' }}>
      {/* Back button & Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.25rem' }}>
        <button
          onClick={() => navigate('/finance/insurance')}
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
          <ArrowLeft size={16} /> Back to Insurance Hub
        </button>
      </div>

      {/* Patient Banner */}
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
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div
            style={{
              width: '52px',
              height: '52px',
              borderRadius: '50%',
              background: 'linear-gradient(135deg, rgba(2, 132, 199, 0.2), rgba(99, 102, 241, 0.2))',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#38bdf8'
            }}
          >
            <User size={28} />
          </div>
          <div>
            <h2 style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--text-primary)' }}>
              {patient?.fullName || 'Patient Insurance Dossier'}
            </h2>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
              Patient ID: <span style={{ color: '#38bdf8', fontWeight: 600 }}>{patientId}</span> • Phone:{' '}
              {patient?.mobile || 'N/A'} • DOB:{' '}
              {patient?.dateOfBirth ? new Date(patient.dateOfBirth).toLocaleDateString() : 'N/A'}
            </div>
          </div>
        </div>

        <div>
          <button
            onClick={() => setModalOpen(true)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.65rem 1.25rem',
              borderRadius: 'var(--radius-md)',
              background: 'var(--color-primary)',
              color: '#ffffff',
              fontWeight: 600,
              border: 'none',
              cursor: 'pointer',
              boxShadow: '0 4px 12px rgba(2, 132, 199, 0.25)'
            }}
          >
            <Plus size={16} /> Add Insurance Policy
          </button>
        </div>
      </div>

      {/* Policies List */}
      <div>
        <h3 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '1rem', color: 'var(--text-primary)' }}>
          Associated Policies ({policies.length})
        </h3>

        {loading ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
            <RefreshCw size={24} className="spin-icon" style={{ margin: '0 auto 0.75rem' }} />
            Loading patient insurance policies...
          </div>
        ) : policies.length === 0 ? (
          <div
            style={{
              background: 'var(--bg-card)',
              padding: '3rem',
              textAlign: 'center',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-color)'
            }}
          >
            <ShieldCheck size={40} style={{ margin: '0 auto 0.75rem', color: 'var(--text-muted)', opacity: 0.5 }} />
            <div style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--text-primary)' }}>No Insurance Policies Found</div>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '0.35rem' }}>
              No insurance policies have been recorded for this patient yet.
            </p>
            <button
              onClick={() => setModalOpen(true)}
              style={{
                marginTop: '1.25rem',
                padding: '0.6rem 1.2rem',
                borderRadius: 'var(--radius-sm)',
                background: 'var(--color-primary)',
                border: 'none',
                color: '#fff',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              Add First Policy
            </button>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '1.25rem' }}>
            {policies.map((pol) => (
              <div
                key={pol._id || pol.policyId}
                style={{
                  background: 'var(--bg-card)',
                  borderRadius: 'var(--radius-md)',
                  border: pol.isPrimary ? '1px solid rgba(56, 189, 248, 0.4)' : '1px solid var(--border-color)',
                  padding: '1.5rem',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  boxShadow: pol.isPrimary ? '0 4px 16px rgba(2, 132, 199, 0.15)' : 'none',
                  position: 'relative'
                }}
              >
                {/* Header of policy card */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                          {pol.providerName}
                        </span>
                        {pol.isPrimary && (
                          <span
                            style={{
                              fontSize: '0.7rem',
                              fontWeight: 700,
                              padding: '0.15rem 0.5rem',
                              borderRadius: '999px',
                              background: 'rgba(56, 189, 248, 0.15)',
                              color: '#38bdf8',
                              border: '1px solid rgba(56, 189, 248, 0.3)'
                            }}
                          >
                            PRIMARY
                          </span>
                        )}
                      </div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.15rem' }}>
                        {pol.planName || 'Comprehensive Health Coverage'}
                      </div>
                    </div>

                    <div>
                      <span
                        style={{
                          fontSize: '0.75rem',
                          fontWeight: 600,
                          padding: '0.2rem 0.6rem',
                          borderRadius: '4px',
                          background:
                            pol.lastVerificationStatus === 'VERIFIED'
                              ? 'rgba(16, 185, 129, 0.15)'
                              : pol.lastVerificationStatus === 'EXPIRED'
                              ? 'rgba(239, 68, 68, 0.15)'
                              : 'rgba(245, 158, 11, 0.15)',
                          color:
                            pol.lastVerificationStatus === 'VERIFIED'
                              ? '#10b981'
                              : pol.lastVerificationStatus === 'EXPIRED'
                              ? '#ef4444'
                              : '#f59e0b',
                          border: `1px solid ${
                            pol.lastVerificationStatus === 'VERIFIED'
                              ? 'rgba(16, 185, 129, 0.3)'
                              : pol.lastVerificationStatus === 'EXPIRED'
                              ? 'rgba(239, 68, 68, 0.3)'
                              : 'rgba(245, 158, 11, 0.3)'
                          }`
                        }}
                      >
                        {pol.lastVerificationStatus || 'UNVERIFIED'}
                      </span>
                    </div>
                  </div>

                  {/* Policy Identifiers Grid */}
                  <div
                    style={{
                      background: 'rgba(0, 0, 0, 0.2)',
                      padding: '0.85rem',
                      borderRadius: 'var(--radius-sm)',
                      display: 'grid',
                      gridTemplateColumns: '1fr 1fr',
                      gap: '0.5rem',
                      fontSize: '0.8rem',
                      marginBottom: '1rem'
                    }}
                  >
                    <div>
                      <span style={{ color: 'var(--text-muted)' }}>Policy Number:</span>
                      <div style={{ fontFamily: 'monospace', fontWeight: 600, color: 'var(--text-primary)' }}>
                        {pol.policyNumber}
                      </div>
                    </div>
                    <div>
                      <span style={{ color: 'var(--text-muted)' }}>Member ID:</span>
                      <div style={{ fontFamily: 'monospace', fontWeight: 600, color: 'var(--text-primary)' }}>
                        {pol.memberId || 'N/A'}
                      </div>
                    </div>
                    <div>
                      <span style={{ color: 'var(--text-muted)' }}>Policy Holder:</span>
                      <div style={{ fontWeight: 500, color: 'var(--text-primary)' }}>
                        {pol.policyHolderName} ({pol.relationshipToPatient || 'SELF'})
                      </div>
                    </div>
                    <div>
                      <span style={{ color: 'var(--text-muted)' }}>Network Tier:</span>
                      <div style={{ fontWeight: 500, color: pol.networkStatus === 'IN_NETWORK' ? '#10b981' : '#f59e0b' }}>
                        {pol.networkStatus || 'UNKNOWN'}
                      </div>
                    </div>
                  </div>

                  {/* Coverage Breakdown */}
                  <div style={{ fontSize: '0.85rem', marginBottom: '1rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
                      <span style={{ color: 'var(--text-secondary)' }}>Coverage Limit:</span>
                      <span style={{ fontWeight: 700, color: '#38bdf8' }}>
                        {pol.coverageLimit !== null && pol.coverageLimit !== undefined
                          ? `₹${Number(pol.coverageLimit).toLocaleString()}`
                          : 'Unavailable / Unknown'}
                      </span>
                    </div>

                    {pol.coverageRemaining !== null && pol.coverageRemaining !== undefined && (
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
                        <span style={{ color: 'var(--text-secondary)' }}>Remaining Coverage:</span>
                        <span style={{ fontWeight: 600, color: '#10b981' }}>
                          ₹{Number(pol.coverageRemaining).toLocaleString()}
                        </span>
                      </div>
                    )}

                    {pol.deductibleRemaining !== null && pol.deductibleRemaining !== undefined && (
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
                        <span style={{ color: 'var(--text-secondary)' }}>Deductible Remaining:</span>
                        <span style={{ color: 'var(--text-primary)' }}>₹{Number(pol.deductibleRemaining).toLocaleString()}</span>
                      </div>
                    )}

                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: 'var(--text-secondary)' }}>Prior Authorization:</span>
                      <span style={{ color: pol.authorizationRequired === 'REQUIRED' ? '#fbbf24' : 'var(--text-muted)' }}>
                        {pol.authorizationRequired || 'Unknown'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Footer and Actions */}
                <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '0.85rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    Last Verified:{' '}
                    {pol.lastVerifiedAt ? new Date(pol.lastVerifiedAt).toLocaleDateString() : 'Never'}
                  </div>

                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    {pol.lastVerificationId && (
                      <button
                        onClick={() => navigate(`/finance/verifications/${pol.lastVerificationId}`)}
                        style={{
                          padding: '0.4rem 0.8rem',
                          borderRadius: 'var(--radius-sm)',
                          background: 'rgba(255, 255, 255, 0.05)',
                          border: '1px solid var(--border-color)',
                          color: 'var(--text-secondary)',
                          fontSize: '0.75rem',
                          cursor: 'pointer'
                        }}
                      >
                        Dossier
                      </button>
                    )}

                    <button
                      onClick={() => handleVerify(pol.policyId)}
                      disabled={verifyingPolicyId === pol.policyId}
                      style={{
                        padding: '0.4rem 0.9rem',
                        borderRadius: 'var(--radius-sm)',
                        background: 'linear-gradient(135deg, #0284c7, #0369a1)',
                        border: 'none',
                        color: '#fff',
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.3rem'
                      }}
                    >
                      <RefreshCw size={12} className={verifyingPolicyId === pol.policyId ? 'spin-icon' : ''} />
                      {verifyingPolicyId === pol.policyId ? 'Verifying...' : 'Re-Verify'}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add Policy Modal */}
      {modalOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.75)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '1rem'
          }}
        >
          <div
            style={{
              background: 'var(--bg-card)',
              border: '1px solid var(--border-color)',
              borderRadius: 'var(--radius-md)',
              width: '100%',
              maxWidth: '640px',
              padding: '1.75rem',
              maxHeight: '90vh',
              overflowY: 'auto'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                Add Patient Insurance Policy
              </h3>
              <button
                onClick={() => setModalOpen(false)}
                style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', fontSize: '1.25rem', cursor: 'pointer' }}
              >
                ×
              </button>
            </div>

            {/* Duplicate Detection Warning (Section 16) */}
            {duplicateWarning && (
              <div
                style={{
                  background: 'rgba(245, 158, 11, 0.15)',
                  border: '1px solid rgba(245, 158, 11, 0.4)',
                  padding: '1rem',
                  borderRadius: 'var(--radius-sm)',
                  marginBottom: '1.25rem',
                  color: '#fbbf24'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 600 }}>
                  <AlertTriangle size={18} /> Duplicate Policy Detected!
                </div>
                <div style={{ fontSize: '0.85rem', marginTop: '0.35rem', color: 'var(--text-primary)' }}>
                  A matching policy is already registered for this patient:
                  <div style={{ fontFamily: 'monospace', marginTop: '0.2rem' }}>
                    Policy: {duplicateWarning.policyNumber} • Provider: {duplicateWarning.providerName} • Status:{' '}
                    {duplicateWarning.status}
                  </div>
                </div>
              </div>
            )}

            {errorMsg && (
              <div
                style={{
                  background: 'rgba(239, 68, 68, 0.15)',
                  border: '1px solid rgba(239, 68, 68, 0.3)',
                  padding: '0.75rem',
                  borderRadius: 'var(--radius-sm)',
                  color: '#ef4444',
                  fontSize: '0.85rem',
                  marginBottom: '1rem'
                }}
              >
                {errorMsg}
              </div>
            )}

            <form onSubmit={(e) => handleCreatePolicy(e, false)}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>
                    Insurance Provider *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Star Health Insurance"
                    value={formData.providerName}
                    onChange={(e) => setFormData({ ...formData, providerName: e.target.value })}
                    onBlur={checkDuplicate}
                    style={{
                      width: '100%',
                      padding: '0.6rem',
                      borderRadius: 'var(--radius-sm)',
                      background: 'var(--bg-app)',
                      border: '1px solid var(--border-color)',
                      color: 'var(--text-primary)'
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>
                    Policy Number *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. POL-ABC-45892"
                    value={formData.policyNumber}
                    onChange={(e) => setFormData({ ...formData, policyNumber: e.target.value })}
                    onBlur={checkDuplicate}
                    style={{
                      width: '100%',
                      padding: '0.6rem',
                      borderRadius: 'var(--radius-sm)',
                      background: 'var(--bg-app)',
                      border: '1px solid var(--border-color)',
                      color: 'var(--text-primary)',
                      fontFamily: 'monospace'
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>
                    Member ID / Card No *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. MEM-78291"
                    value={formData.memberId}
                    onChange={(e) => setFormData({ ...formData, memberId: e.target.value })}
                    onBlur={checkDuplicate}
                    style={{
                      width: '100%',
                      padding: '0.6rem',
                      borderRadius: 'var(--radius-sm)',
                      background: 'var(--bg-app)',
                      border: '1px solid var(--border-color)',
                      color: 'var(--text-primary)'
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>
                    Group Number
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. GRP-1002"
                    value={formData.groupNumber}
                    onChange={(e) => setFormData({ ...formData, groupNumber: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '0.6rem',
                      borderRadius: 'var(--radius-sm)',
                      background: 'var(--bg-app)',
                      border: '1px solid var(--border-color)',
                      color: 'var(--text-primary)'
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>
                    Policy Holder Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Full name as on policy"
                    value={formData.policyHolderName}
                    onChange={(e) => setFormData({ ...formData, policyHolderName: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '0.6rem',
                      borderRadius: 'var(--radius-sm)',
                      background: 'var(--bg-app)',
                      border: '1px solid var(--border-color)',
                      color: 'var(--text-primary)'
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>
                    Relationship to Patient *
                  </label>
                  <select
                    value={formData.relationshipToPatient}
                    onChange={(e) => setFormData({ ...formData, relationshipToPatient: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '0.6rem',
                      borderRadius: 'var(--radius-sm)',
                      background: 'var(--bg-app)',
                      border: '1px solid var(--border-color)',
                      color: 'var(--text-primary)'
                    }}
                  >
                    <option value="SELF">Self</option>
                    <option value="SPOUSE">Spouse</option>
                    <option value="CHILD">Child</option>
                    <option value="PARENT">Parent</option>
                    <option value="OTHER">Other</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>
                    Plan Name
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Gold Health Shield"
                    value={formData.planName}
                    onChange={(e) => setFormData({ ...formData, planName: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '0.6rem',
                      borderRadius: 'var(--radius-sm)',
                      background: 'var(--bg-app)',
                      border: '1px solid var(--border-color)',
                      color: 'var(--text-primary)'
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>
                    Policy End Date
                  </label>
                  <input
                    type="date"
                    value={formData.endDate}
                    onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '0.6rem',
                      borderRadius: 'var(--radius-sm)',
                      background: 'var(--bg-app)',
                      border: '1px solid var(--border-color)',
                      color: 'var(--text-primary)'
                    }}
                  />
                </div>
              </div>

              <div style={{ marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <input
                  type="checkbox"
                  id="isPrimaryCheckbox"
                  checked={formData.isPrimary}
                  onChange={(e) => setFormData({ ...formData, isPrimary: e.target.checked })}
                  style={{ width: '16px', height: '16px', cursor: 'pointer' }}
                />
                <label htmlFor="isPrimaryCheckbox" style={{ fontSize: '0.85rem', color: 'var(--text-primary)', cursor: 'pointer' }}>
                  Mark as Primary Insurance Policy
                </label>
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  style={{
                    padding: '0.6rem 1rem',
                    borderRadius: 'var(--radius-sm)',
                    background: 'transparent',
                    border: '1px solid var(--border-color)',
                    color: 'var(--text-secondary)',
                    cursor: 'pointer'
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting || !!duplicateWarning}
                  style={{
                    padding: '0.6rem 1.25rem',
                    borderRadius: 'var(--radius-sm)',
                    background: 'rgba(255, 255, 255, 0.08)',
                    border: '1px solid var(--border-color)',
                    color: 'var(--text-primary)',
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  Save Policy
                </button>
                <button
                  type="button"
                  disabled={submitting || !!duplicateWarning}
                  onClick={(e) => handleCreatePolicy(e, true)}
                  style={{
                    padding: '0.6rem 1.25rem',
                    borderRadius: 'var(--radius-sm)',
                    background: 'var(--color-primary)',
                    border: 'none',
                    color: '#fff',
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  Save & Verify Now
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default PatientInsurancePage;
