import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  ArrowLeft,
  ShieldCheck,
  FileText,
  AlertCircle,
  CheckCircle2,
  DollarSign,
  User,
  Calendar,
  Building,
  UploadCloud,
  Save,
  AlertTriangle
} from 'lucide-react';
import insuranceClaimService from '../../services/insuranceClaimService';
import insuranceService from '../../services/insuranceService';
import billingService from '../../services/billingService';
import patientService from '../../services/patientService';

export const ClaimCreatePage = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const queryParams = new URLSearchParams(location.search);
  const initialPatientId = queryParams.get('patientId') || '';
  const initialInvoiceId = queryParams.get('invoiceId') || '';

  const [patientId, setPatientId] = useState(initialPatientId);
  const [patientData, setPatientData] = useState(null);
  const [policies, setPolicies] = useState([]);
  const [selectedPolicyId, setSelectedPolicyId] = useState('');
  const [invoices, setInvoices] = useState([]);
  const [selectedInvoiceId, setSelectedInvoiceId] = useState(initialInvoiceId);
  const [selectedInvoice, setSelectedInvoice] = useState(null);

  const [claimType, setClaimType] = useState('INPATIENT');
  const [totalClaimAmount, setTotalClaimAmount] = useState('');
  const [notes, setNotes] = useState('');
  const [submissionSource, setSubmissionSource] = useState('API');

  const [loadingPatient, setLoadingPatient] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);
  const [warningMessage, setWarningMessage] = useState(null);

  // When patient ID changes or is submitted
  const handleLoadPatient = async (pid) => {
    if (!pid) return;
    try {
      setLoadingPatient(true);
      setErrorMessage(null);
      setWarningMessage(null);

      const [patRes, polRes, invRes] = await Promise.all([
        patientService.getPatientById(pid).catch(() => null),
        insuranceService.getPatientPolicies(pid).catch(() => ({ data: [] })),
        billingService.getPatientInvoices ? billingService.getPatientInvoices(pid).catch(() => ({ data: [] })) : Promise.resolve({ data: [] })
      ]);

      if (patRes && (patRes.data || patRes.patientId)) {
        setPatientData(patRes.data || patRes);
      } else {
        setErrorMessage(`Patient ${pid} not found in master records.`);
        return;
      }

      const activePolicies = (polRes?.data || []).filter((p) => p.status === 'ACTIVE' || p.status === 'DRAFT');
      setPolicies(polRes?.data || []);
      if (activePolicies.length > 0) {
        setSelectedPolicyId(activePolicies[0].policyId);
      } else if (polRes?.data?.length > 0) {
        setSelectedPolicyId(polRes.data[0].policyId);
        setWarningMessage('Note: This patient has policies but none are marked ACTIVE.');
      } else {
        setWarningMessage('Warning: No insurance policy on file for this patient.');
      }

      if (invRes && invRes.data) {
        setInvoices(invRes.data);
      }
    } catch (err) {
      console.error('Error fetching patient info:', err);
      setErrorMessage('Failed to fetch patient data.');
    } finally {
      setLoadingPatient(false);
    }
  };

  useEffect(() => {
    if (initialPatientId) {
      handleLoadPatient(initialPatientId);
    }
  }, [initialPatientId]);

  // When selected invoice changes
  useEffect(() => {
    if (selectedInvoiceId && invoices.length > 0) {
      const inv = invoices.find((i) => i.invoiceId === selectedInvoiceId);
      if (inv) {
        setSelectedInvoice(inv);
        setTotalClaimAmount(inv.grossTotal || inv.netTotal || '');
      }
    }
  }, [selectedInvoiceId, invoices]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!patientId || !selectedPolicyId || !selectedInvoiceId) {
      setErrorMessage('Please select a valid Patient, Insurance Policy, and Billing Invoice.');
      return;
    }

    try {
      setSubmitting(true);
      setErrorMessage(null);

      const payload = {
        patientId,
        policyId: selectedPolicyId,
        invoiceId: selectedInvoiceId,
        claimType,
        totalClaimAmount: parseFloat(totalClaimAmount) || 0,
        admissionId: selectedInvoice?.admissionId,
        visitId: selectedInvoice?.visitId,
        dischargeId: selectedInvoice?.dischargeId,
        submissionSource,
        notes
      };

      const res = await insuranceClaimService.createClaim(payload);
      if (res && res.data) {
        navigate(`/finance/claims/${res.data.claimId}`);
      } else {
        navigate('/finance/claims');
      }
    } catch (err) {
      console.error('Failed to create claim:', err);
      setErrorMessage(err.response?.data?.message || err.message || 'Failed to create insurance claim');
    } finally {
      setSubmitting(false);
    }
  };

  const selectedPolicy = policies.find((p) => p.policyId === selectedPolicyId);

  return (
    <div style={{ padding: '1.5rem', maxWidth: '1000px', margin: '0 auto' }}>
      {/* Top Back Nav */}
      <div style={{ marginBottom: '1.25rem' }}>
        <button
          onClick={() => navigate('/finance/claims')}
          className="btn btn-secondary"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.4rem',
            padding: '0.45rem 0.85rem',
            fontSize: '0.85rem'
          }}
        >
          <ArrowLeft size={16} />
          <span>Back to Claims</span>
        </button>
      </div>

      <div
        style={{
          background: 'var(--bg-card)',
          borderRadius: 'var(--radius-lg)',
          border: '1px solid var(--border-color)',
          overflow: 'hidden'
        }}
      >
        <div
          style={{
            padding: '1.5rem',
            borderBottom: '1px solid var(--border-color)',
            background: 'var(--bg-sidebar)'
          }}
        >
          <h2 style={{ margin: 0, fontSize: '1.4rem', fontWeight: '700', color: 'var(--text-primary)' }}>
            Create Insurance Claim Package
          </h2>
          <p style={{ margin: '0.25rem 0 0', color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
            Associate patient, active policy, discharge invoice, and prepare dossier for insurer submission
          </p>
        </div>

        {errorMessage && (
          <div
            style={{
              margin: '1rem 1.5rem 0',
              padding: '0.85rem 1rem',
              background: 'rgba(239, 68, 68, 0.1)',
              border: '1px solid #ef4444',
              borderRadius: 'var(--radius-md)',
              color: '#ef4444',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              fontSize: '0.875rem'
            }}
          >
            <AlertCircle size={18} />
            <span>{errorMessage}</span>
          </div>
        )}

        {warningMessage && (
          <div
            style={{
              margin: '1rem 1.5rem 0',
              padding: '0.85rem 1rem',
              background: 'rgba(234, 179, 8, 0.1)',
              border: '1px solid #eab308',
              borderRadius: 'var(--radius-md)',
              color: '#eab308',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              fontSize: '0.875rem'
            }}
          >
            <AlertTriangle size={18} />
            <span>{warningMessage}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ padding: '1.5rem' }}>
          {/* Section 1: Patient Search / ID */}
          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ display: 'block', fontWeight: '600', marginBottom: '0.4rem', fontSize: '0.875rem' }}>
              Patient ID *
            </label>
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <input
                type="text"
                placeholder="e.g. P10045"
                value={patientId}
                onChange={(e) => setPatientId(e.target.value.trim())}
                required
                style={{
                  flex: 1,
                  padding: '0.65rem 0.85rem',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border-color)',
                  background: 'var(--bg-sidebar)',
                  color: 'var(--text-primary)',
                  fontSize: '0.9rem'
                }}
              />
              <button
                type="button"
                onClick={() => handleLoadPatient(patientId)}
                disabled={loadingPatient || !patientId}
                className="btn btn-secondary"
                style={{ padding: '0.65rem 1.25rem', whiteSpace: 'nowrap' }}
              >
                {loadingPatient ? 'Loading...' : 'Lookup Patient'}
              </button>
            </div>

            {patientData && (
              <div
                style={{
                  marginTop: '0.75rem',
                  padding: '0.75rem 1rem',
                  borderRadius: 'var(--radius-md)',
                  background: 'rgba(56, 189, 248, 0.08)',
                  border: '1px solid rgba(56, 189, 248, 0.2)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '1rem',
                  fontSize: '0.85rem'
                }}
              >
                <User size={18} style={{ color: '#38bdf8' }} />
                <div>
                  <strong style={{ color: 'var(--text-primary)' }}>{patientData.fullName || `${patientData.firstName} ${patientData.lastName}`}</strong>
                  <span style={{ color: 'var(--text-muted)', marginLeft: '0.5rem' }}>
                    ({patientData.gender}, DOB: {patientData.dateOfBirth ? new Date(patientData.dateOfBirth).toLocaleDateString() : 'N/A'})
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Section 2: Insurance Policy Selection */}
          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ display: 'block', fontWeight: '600', marginBottom: '0.4rem', fontSize: '0.875rem' }}>
              Associated Insurance Policy *
            </label>
            {policies.length > 0 ? (
              <select
                value={selectedPolicyId}
                onChange={(e) => setSelectedPolicyId(e.target.value)}
                required
                style={{
                  width: '100%',
                  padding: '0.65rem 0.85rem',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border-color)',
                  background: 'var(--bg-sidebar)',
                  color: 'var(--text-primary)',
                  fontSize: '0.9rem'
                }}
              >
                <option value="">Select an Insurance Policy</option>
                {policies.map((p) => (
                  <option key={p.policyId} value={p.policyId}>
                    {p.providerName} — Policy #{p.policyNumber} (Member: {p.memberId || 'N/A'}, Status: {p.status})
                  </option>
                ))}
              </select>
            ) : (
              <input
                type="text"
                placeholder="No policy found. Enter Policy ID manually if known"
                value={selectedPolicyId}
                onChange={(e) => setSelectedPolicyId(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.65rem 0.85rem',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border-color)',
                  background: 'var(--bg-sidebar)',
                  color: 'var(--text-primary)',
                  fontSize: '0.9rem'
                }}
              />
            )}

            {selectedPolicy && (
              <div
                style={{
                  marginTop: '0.75rem',
                  padding: '0.75rem 1rem',
                  borderRadius: 'var(--radius-md)',
                  background: 'var(--bg-sidebar)',
                  border: '1px solid var(--border-color)',
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                  gap: '0.5rem',
                  fontSize: '0.8rem'
                }}
              >
                <div><strong>Insurer:</strong> {selectedPolicy.providerName}</div>
                <div><strong>Policy Number:</strong> {selectedPolicy.policyNumber}</div>
                <div><strong>Member ID:</strong> {selectedPolicy.memberId || 'N/A'}</div>
                <div>
                  <strong>Verification:</strong>{' '}
                  <span style={{ color: selectedPolicy.lastVerificationStatus === 'VERIFIED' ? '#22c55e' : '#eab308' }}>
                    {selectedPolicy.lastVerificationStatus || 'UNVERIFIED'}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Section 3: Billing Invoice Selection */}
          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ display: 'block', fontWeight: '600', marginBottom: '0.4rem', fontSize: '0.875rem' }}>
              Billing Invoice *
            </label>
            {invoices.length > 0 ? (
              <select
                value={selectedInvoiceId}
                onChange={(e) => setSelectedInvoiceId(e.target.value)}
                required
                style={{
                  width: '100%',
                  padding: '0.65rem 0.85rem',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border-color)',
                  background: 'var(--bg-sidebar)',
                  color: 'var(--text-primary)',
                  fontSize: '0.9rem'
                }}
              >
                <option value="">Select a Hospital Invoice</option>
                {invoices.map((inv) => (
                  <option key={inv.invoiceId} value={inv.invoiceId}>
                    {inv.invoiceId} — {inv.invoiceType || 'BILL'} (₹{inv.grossTotal || inv.netTotal}, Status: {inv.status})
                  </option>
                ))}
              </select>
            ) : (
              <input
                type="text"
                placeholder="Enter Invoice ID (e.g. INV-2026-001245)"
                value={selectedInvoiceId}
                onChange={(e) => setSelectedInvoiceId(e.target.value)}
                required
                style={{
                  width: '100%',
                  padding: '0.65rem 0.85rem',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border-color)',
                  background: 'var(--bg-sidebar)',
                  color: 'var(--text-primary)',
                  fontSize: '0.9rem'
                }}
              />
            )}
          </div>

          {/* Section 4: Claim Parameters */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
              gap: '1rem',
              marginBottom: '1.5rem'
            }}
          >
            <div>
              <label style={{ display: 'block', fontWeight: '600', marginBottom: '0.4rem', fontSize: '0.875rem' }}>
                Claim Type *
              </label>
              <select
                value={claimType}
                onChange={(e) => setClaimType(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.65rem 0.85rem',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border-color)',
                  background: 'var(--bg-sidebar)',
                  color: 'var(--text-primary)',
                  fontSize: '0.9rem'
                }}
              >
                <option value="INPATIENT">Inpatient (IPD)</option>
                <option value="OUTPATIENT">Outpatient (OPD)</option>
                <option value="EMERGENCY">Emergency</option>
                <option value="DAYCARE">Daycare</option>
                <option value="SURGICAL">Surgical</option>
                <option value="PHARMACY">Pharmacy</option>
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontWeight: '600', marginBottom: '0.4rem', fontSize: '0.875rem' }}>
                Total Claim Amount (INR) *
              </label>
              <input
                type="number"
                min="0"
                step="0.01"
                placeholder="0.00"
                value={totalClaimAmount}
                onChange={(e) => setTotalClaimAmount(e.target.value)}
                required
                style={{
                  width: '100%',
                  padding: '0.65rem 0.85rem',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border-color)',
                  background: 'var(--bg-sidebar)',
                  color: 'var(--text-primary)',
                  fontSize: '0.9rem',
                  fontWeight: '600'
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontWeight: '600', marginBottom: '0.4rem', fontSize: '0.875rem' }}>
                Submission Channel
              </label>
              <select
                value={submissionSource}
                onChange={(e) => setSubmissionSource(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.65rem 0.85rem',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border-color)',
                  background: 'var(--bg-sidebar)',
                  color: 'var(--text-primary)',
                  fontSize: '0.9rem'
                }}
              >
                <option value="API">Official Insurer REST API</option>
                <option value="INSURER_PORTAL_RPA">Robot Framework Portal Automation</option>
                <option value="MANUAL">Manual Offline Submission</option>
              </select>
            </div>
          </div>

          {/* Section 5: Notes */}
          <div style={{ marginBottom: '1.75rem' }}>
            <label style={{ display: 'block', fontWeight: '600', marginBottom: '0.4rem', fontSize: '0.875rem' }}>
              Internal Administrative Notes
            </label>
            <textarea
              rows={3}
              placeholder="Provide any instructions or clinical encounter references..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              style={{
                width: '100%',
                padding: '0.65rem 0.85rem',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border-color)',
                background: 'var(--bg-sidebar)',
                color: 'var(--text-primary)',
                fontSize: '0.9rem'
              }}
            />
          </div>

          {/* Action Buttons */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
            <button
              type="button"
              onClick={() => navigate('/finance/claims')}
              className="btn btn-secondary"
              style={{ padding: '0.65rem 1.25rem' }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="btn btn-primary"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.65rem 1.75rem',
                background: '#0284c7',
                color: '#fff',
                border: 'none',
                borderRadius: 'var(--radius-md)',
                fontWeight: '600',
                cursor: submitting ? 'not-allowed' : 'pointer'
              }}
            >
              <Save size={18} />
              <span>{submitting ? 'Creating Dossier...' : 'Create Draft Claim'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ClaimCreatePage;
