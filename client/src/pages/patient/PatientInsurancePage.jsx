import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  Plus,
  RefreshCw,
  CheckCircle2,
  Clock,
  AlertCircle,
  XCircle,
  FileText,
  Upload,
  Calendar,
  Eye
} from 'lucide-react';
import insuranceService from '../../services/insuranceService';
import { useAuth } from '../../context/AuthContext';

export const PatientInsurancePage = () => {
  const { user } = useAuth();
  const patientId = user?.patientId || user?.userId || 'P10045';

  const [policies, setPolicies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [verifyingId, setVerifyingId] = useState(null);

  const [formData, setFormData] = useState({
    providerName: '',
    policyNumber: '',
    memberId: '',
    groupNumber: '',
    policyHolderName: user?.name || user?.username || 'Rahul Shah',
    relationshipToPatient: 'SELF',
    planName: '',
    startDate: '',
    endDate: ''
  });
  const [submitting, setSubmitting] = useState(false);
  const [formMsg, setFormMsg] = useState(null);

  const fetchPolicies = async () => {
    try {
      setLoading(true);
      const res = await insuranceService.getPatientPolicies(patientId);
      if (res && res.policies) {
        setPolicies(res.policies);
      }
    } catch (err) {
      console.error('Failed to load patient insurance:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPolicies();
  }, [patientId]);

  const handleVerify = async (policyId) => {
    try {
      setVerifyingId(policyId);
      const res = await insuranceService.requestVerification(policyId, { source: 'API' });
      alert(`Verification request submitted (Ref: ${res.verificationId}). Our system is verifying with your insurer.`);
      setTimeout(() => {
        fetchPolicies();
        setVerifyingId(null);
      }, 2000);
    } catch (err) {
      alert(err.response?.data?.message || err.message || 'Verification request failed');
      setVerifyingId(null);
    }
  };

  const handleSubmitPolicy = async (e, shouldVerify = false) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      setFormMsg(null);

      const res = await insuranceService.createPolicy({
        ...formData,
        patientId,
        isPrimary: policies.length === 0
      });

      if (shouldVerify && res.policy?.policyId) {
        await insuranceService.requestVerification(res.policy.policyId);
      }

      setFormMsg({ type: 'success', text: 'Insurance policy saved successfully!' });
      setTimeout(() => {
        setShowAddForm(false);
        setFormMsg(null);
        setFormData({
          providerName: '',
          policyNumber: '',
          memberId: '',
          groupNumber: '',
          policyHolderName: user?.name || 'Rahul Shah',
          relationshipToPatient: 'SELF',
          planName: '',
          startDate: '',
          endDate: ''
        });
        fetchPolicies();
      }, 1500);
    } catch (err) {
      setFormMsg({
        type: 'error',
        text: err.response?.data?.message || err.message || 'Failed to save policy'
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ padding: '1.5rem', maxWidth: '1080px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.75rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.6rem', fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <ShieldCheck size={26} color="#0284c7" />
            My Insurance & Coverage
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '0.2rem' }}>
            View and manage your registered health insurance policies and verification status
          </p>
        </div>

        <div>
          {!showAddForm && (
            <button
              onClick={() => setShowAddForm(true)}
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
              <Plus size={16} /> Add Insurance
            </button>
          )}
        </div>
      </div>

      {/* Add Insurance Form (Section 14) */}
      {showAddForm && (
        <div
          style={{
            background: 'var(--bg-card)',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border-color)',
            padding: '1.75rem',
            marginBottom: '2rem'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 600, color: 'var(--text-primary)' }}>
              Add New Insurance Policy
            </h3>
            <button
              onClick={() => setShowAddForm(false)}
              style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', fontSize: '1.25rem', cursor: 'pointer' }}
            >
              ×
            </button>
          </div>

          {formMsg && (
            <div
              style={{
                padding: '0.75rem',
                borderRadius: 'var(--radius-sm)',
                marginBottom: '1rem',
                fontSize: '0.85rem',
                background: formMsg.type === 'success' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                color: formMsg.type === 'success' ? '#10b981' : '#ef4444',
                border: `1px solid ${formMsg.type === 'success' ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`
              }}
            >
              {formMsg.text}
            </div>
          )}

          <form onSubmit={(e) => handleSubmitPolicy(e, false)}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1rem', marginBottom: '1.25rem' }}>
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
                  style={{ width: '100%', padding: '0.6rem', borderRadius: 'var(--radius-sm)', background: 'var(--bg-app)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }}
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
                  style={{ width: '100%', padding: '0.6rem', borderRadius: 'var(--radius-sm)', background: 'var(--bg-app)', border: '1px solid var(--border-color)', color: 'var(--text-primary)', fontFamily: 'monospace' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>
                  Member ID *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. MEM-78291"
                  value={formData.memberId}
                  onChange={(e) => setFormData({ ...formData, memberId: e.target.value })}
                  style={{ width: '100%', padding: '0.6rem', borderRadius: 'var(--radius-sm)', background: 'var(--bg-app)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }}
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
                  style={{ width: '100%', padding: '0.6rem', borderRadius: 'var(--radius-sm)', background: 'var(--bg-app)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>
                  Policy Holder Name *
                </label>
                <input
                  type="text"
                  required
                  value={formData.policyHolderName}
                  onChange={(e) => setFormData({ ...formData, policyHolderName: e.target.value })}
                  style={{ width: '100%', padding: '0.6rem', borderRadius: 'var(--radius-sm)', background: 'var(--bg-app)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>
                  Relationship to Patient *
                </label>
                <select
                  value={formData.relationshipToPatient}
                  onChange={(e) => setFormData({ ...formData, relationshipToPatient: e.target.value })}
                  style={{ width: '100%', padding: '0.6rem', borderRadius: 'var(--radius-sm)', background: 'var(--bg-app)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }}
                >
                  <option value="SELF">Self</option>
                  <option value="SPOUSE">Spouse</option>
                  <option value="CHILD">Child</option>
                  <option value="PARENT">Parent</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>
                  Plan Name
                </label>
                <input
                  type="text"
                  placeholder="e.g. Gold Health Plan"
                  value={formData.planName}
                  onChange={(e) => setFormData({ ...formData, planName: e.target.value })}
                  style={{ width: '100%', padding: '0.6rem', borderRadius: 'var(--radius-sm)', background: 'var(--bg-app)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>
                  Policy Expiration Date
                </label>
                <input
                  type="date"
                  value={formData.endDate}
                  onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                  style={{ width: '100%', padding: '0.6rem', borderRadius: 'var(--radius-sm)', background: 'var(--bg-app)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }}
                />
              </div>
            </div>

            {/* Document upload simulation */}
            <div style={{ marginBottom: '1.5rem', padding: '1rem', background: 'rgba(0,0,0,0.2)', borderRadius: 'var(--radius-sm)', border: '1px dashed var(--border-color)', textAlign: 'center' }}>
              <Upload size={24} style={{ color: 'var(--text-muted)', margin: '0 auto 0.4rem' }} />
              <div style={{ fontSize: '0.85rem', color: 'var(--text-primary)', fontWeight: 500 }}>Upload Insurance Card or e-Card (Optional)</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>Supports PDF, JPG, PNG up to 10MB</div>
            </div>

            {/* Buttons (Section 14: Save, Save & Verify, Cancel) */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                style={{ padding: '0.6rem 1rem', borderRadius: 'var(--radius-sm)', background: 'transparent', border: '1px solid var(--border-color)', color: 'var(--text-secondary)', cursor: 'pointer' }}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                style={{ padding: '0.6rem 1.25rem', borderRadius: 'var(--radius-sm)', background: 'rgba(255, 255, 255, 0.08)', border: '1px solid var(--border-color)', color: 'var(--text-primary)', fontWeight: 600, cursor: 'pointer' }}
              >
                Save
              </button>
              <button
                type="button"
                disabled={submitting}
                onClick={(e) => handleSubmitPolicy(e, true)}
                style={{ padding: '0.6rem 1.25rem', borderRadius: 'var(--radius-sm)', background: 'var(--color-primary)', border: 'none', color: '#fff', fontWeight: 600, cursor: 'pointer' }}
              >
                Save & Verify Now
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Policies Display */}
      {loading ? (
        <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
          <RefreshCw size={24} className="spin-icon" style={{ margin: '0 auto 0.75rem' }} />
          Loading your insurance policies...
        </div>
      ) : policies.length === 0 ? (
        <div style={{ background: 'var(--bg-card)', padding: '3rem', textAlign: 'center', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
          <ShieldCheck size={36} style={{ margin: '0 auto 0.75rem', color: 'var(--text-muted)', opacity: 0.5 }} />
          <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--text-primary)' }}>No Insurance Policies Added</h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '0.35rem' }}>
            Add your health insurance information to streamline your hospital visits and cashless coverage.
          </p>
          <button
            onClick={() => setShowAddForm(true)}
            style={{ marginTop: '1.25rem', padding: '0.6rem 1.25rem', borderRadius: 'var(--radius-sm)', background: 'var(--color-primary)', border: 'none', color: '#fff', fontWeight: 600, cursor: 'pointer' }}
          >
            Add Insurance Policy
          </button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {policies.map((pol) => (
            <div
              key={pol._id || pol.policyId}
              style={{
                background: 'var(--bg-card)',
                borderRadius: 'var(--radius-md)',
                border: pol.isPrimary ? '1px solid rgba(56, 189, 248, 0.4)' : '1px solid var(--border-color)',
                padding: '1.5rem',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '1rem'
              }}
            >
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                  <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                    {pol.providerName}
                  </h3>
                  {pol.isPrimary && (
                    <span style={{ fontSize: '0.7rem', fontWeight: 700, padding: '0.15rem 0.5rem', borderRadius: '999px', background: 'rgba(56, 189, 248, 0.15)', color: '#38bdf8', border: '1px solid rgba(56, 189, 248, 0.3)' }}>
                      PRIMARY
                    </span>
                  )}
                  <span
                    style={{
                      fontSize: '0.75rem',
                      fontWeight: 600,
                      padding: '0.15rem 0.55rem',
                      borderRadius: '4px',
                      background:
                        pol.lastVerificationStatus === 'VERIFIED'
                          ? 'rgba(16, 185, 129, 0.15)'
                          : 'rgba(245, 158, 11, 0.15)',
                      color: pol.lastVerificationStatus === 'VERIFIED' ? '#10b981' : '#f59e0b'
                    }}
                  >
                    {pol.lastVerificationStatus || 'UNVERIFIED'}
                  </span>
                </div>

                <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '0.35rem' }}>
                  Policy #: <strong style={{ color: 'var(--text-primary)', fontFamily: 'monospace' }}>{pol.policyNumber}</strong> • Member ID: {pol.memberId || 'N/A'} • Status: {pol.status}
                </div>

                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.35rem' }}>
                  Network: {pol.networkStatus || 'Unknown'} • Last Verified: {pol.lastVerifiedAt ? new Date(pol.lastVerifiedAt).toLocaleDateString() : 'Pending'}
                </div>
              </div>

              <div>
                <button
                  onClick={() => handleVerify(pol.policyId)}
                  disabled={verifyingId === pol.policyId}
                  style={{
                    padding: '0.55rem 1rem',
                    borderRadius: 'var(--radius-sm)',
                    background: 'var(--color-primary)',
                    border: 'none',
                    color: '#fff',
                    fontWeight: 600,
                    fontSize: '0.8rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.4rem'
                  }}
                >
                  <RefreshCw size={14} className={verifyingId === pol.policyId ? 'spin-icon' : ''} />
                  {verifyingId === pol.policyId ? 'Verifying...' : 'Request Verification'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default PatientInsurancePage;
