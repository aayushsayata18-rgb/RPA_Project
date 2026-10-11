import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft,
  FileText,
  ShieldCheck,
  CheckCircle,
  AlertCircle,
  Clock,
  Send,
  UploadCloud,
  DollarSign,
  RefreshCw,
  AlertTriangle,
  XCircle,
  Eye,
  FileCheck,
  Building,
  HelpCircle,
  User,
  CreditCard,
  History,
  Check,
  Info
} from 'lucide-react';
import insuranceClaimService from '../../services/insuranceClaimService';

export const ClaimDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [claim, setClaim] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('overview'); // overview | items | checklist | timeline | queries | settlement

  // Modals / forms
  const [showDocModal, setShowDocModal] = useState(false);
  const [docFormData, setDocFormData] = useState({
    documentType: 'DISCHARGE_DOCUMENT',
    fileName: '',
    notes: ''
  });

  const [showQueryModal, setShowQueryModal] = useState(false);
  const [queryFormData, setQueryFormData] = useState({
    queryType: 'MISSING_DOCUMENT',
    queryText: '',
    dueDate: '',
    responsibleDepartment: 'BILLING'
  });

  const [respondingQuery, setRespondingQuery] = useState(null);
  const [responseFormData, setResponseFormData] = useState({
    responseText: ''
  });

  const [showSettlementModal, setShowSettlementModal] = useState(false);
  const [settlementFormData, setSettlementFormData] = useState({
    settledAmount: '',
    paymentReference: '',
    notes: ''
  });

  const fetchClaimDetails = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await insuranceClaimService.getClaimById(id);
      if (res && res.data) {
        setClaim(res.data);
      } else if (res) {
        setClaim(res);
      }
    } catch (err) {
      console.error('Failed to load claim:', err);
      setError('Failed to load claim details.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) {
      fetchClaimDetails();
    }
  }, [id]);

  // Actions
  const handleValidate = async () => {
    try {
      setActionLoading(true);
      const res = await insuranceClaimService.validateClaim(claim.claimId);
      if (res.data?.isValid) {
        alert('Validation Successful! All mandatory fields and checklist documents are verified.');
      } else {
        alert(`Validation issues found:\n- ${res.data?.errors?.join('\n- ')}`);
      }
      fetchClaimDetails();
    } catch (err) {
      alert(`Validation error: ${err.response?.data?.message || err.message}`);
    } finally {
      setActionLoading(false);
    }
  };

  const handleMarkReady = async () => {
    try {
      setActionLoading(true);
      await insuranceClaimService.markReady(claim.claimId);
      alert('Claim marked READY for insurer submission!');
      fetchClaimDetails();
    } catch (err) {
      alert(`Cannot mark ready: ${err.response?.data?.message || err.message}`);
    } finally {
      setActionLoading(false);
    }
  };

  const handleSubmitClaim = async () => {
    const confirmSub = window.confirm(`Submit claim ${claim.claimId} to ${claim.insurerName}?`);
    if (!confirmSub) return;

    try {
      setActionLoading(true);
      const res = await insuranceClaimService.submitClaim(claim.claimId, {
        source: claim.submissionSource || 'API'
      });
      alert(`Claim submitted successfully!\nInsurer Ref: ${res.data?.insurerReferenceNumber}`);
      fetchClaimDetails();
    } catch (err) {
      alert(`Submission failed: ${err.response?.data?.message || err.message}`);
    } finally {
      setActionLoading(false);
    }
  };

  const handleCheckStatus = async () => {
    try {
      setActionLoading(true);
      const res = await insuranceClaimService.checkClaimStatus(claim.claimId);
      alert(`Status Polled: ${res.data?.status || 'No change'}`);
      fetchClaimDetails();
    } catch (err) {
      alert(`Status check failed: ${err.response?.data?.message || err.message}`);
    } finally {
      setActionLoading(false);
    }
  };

  const handleCancelClaim = async () => {
    const reason = window.prompt('Enter reason for cancellation:');
    if (!reason) return;

    try {
      setActionLoading(true);
      await insuranceClaimService.cancelClaim(claim.claimId, reason);
      alert('Claim has been cancelled.');
      fetchClaimDetails();
    } catch (err) {
      alert(`Cancellation failed: ${err.response?.data?.message || err.message}`);
    } finally {
      setActionLoading(false);
    }
  };

  const handleAddDocument = async (e) => {
    e.preventDefault();
    if (!docFormData.fileName) {
      alert('Please provide a document file name.');
      return;
    }
    try {
      setActionLoading(true);
      await insuranceClaimService.addDocument(claim.claimId, {
        ...docFormData,
        required: false
      });
      setShowDocModal(false);
      setDocFormData({ documentType: 'DISCHARGE_DOCUMENT', fileName: '', notes: '' });
      fetchClaimDetails();
    } catch (err) {
      alert(`Failed to upload document: ${err.response?.data?.message || err.message}`);
    } finally {
      setActionLoading(false);
    }
  };

  const handleCreateQuery = async (e) => {
    e.preventDefault();
    if (!queryFormData.queryText) {
      alert('Please enter query text.');
      return;
    }
    try {
      setActionLoading(true);
      await insuranceClaimService.createQuery(claim.claimId, queryFormData);
      setShowQueryModal(false);
      setQueryFormData({ queryType: 'MISSING_DOCUMENT', queryText: '', dueDate: '', responsibleDepartment: 'BILLING' });
      fetchClaimDetails();
    } catch (err) {
      alert(`Failed to create query: ${err.response?.data?.message || err.message}`);
    } finally {
      setActionLoading(false);
    }
  };

  const handleRespondQuery = async (e) => {
    e.preventDefault();
    if (!responseFormData.responseText) {
      alert('Please enter response text.');
      return;
    }
    try {
      setActionLoading(true);
      await insuranceClaimService.respondToQuery(claim.claimId, respondingQuery.queryId, responseFormData);
      setRespondingQuery(null);
      setResponseFormData({ responseText: '' });
      fetchClaimDetails();
    } catch (err) {
      alert(`Failed to respond to query: ${err.response?.data?.message || err.message}`);
    } finally {
      setActionLoading(false);
    }
  };

  const handleRecordSettlement = async (e) => {
    e.preventDefault();
    if (!settlementFormData.paymentReference || !settlementFormData.settledAmount) {
      alert('Payment Reference and Settled Amount are required.');
      return;
    }
    try {
      setActionLoading(true);
      await insuranceClaimService.recordSettlement(claim.claimId, {
        settledAmount: parseFloat(settlementFormData.settledAmount),
        paymentReference: settlementFormData.paymentReference,
        notes: settlementFormData.notes
      });
      setShowSettlementModal(false);
      setSettlementFormData({ settledAmount: '', paymentReference: '', notes: '' });
      alert('Settlement payment recorded and reconciled with billing!');
      fetchClaimDetails();
    } catch (err) {
      alert(`Settlement failed: ${err.response?.data?.message || err.message}`);
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
        <RefreshCw size={28} className="spin" style={{ marginBottom: '0.75rem', color: '#0284c7' }} />
        <div>Loading claim dossier...</div>
      </div>
    );
  }

  if (error || !claim) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center', color: '#ef4444' }}>
        <AlertTriangle size={32} style={{ marginBottom: '0.5rem' }} />
        <div>{error || 'Claim not found.'}</div>
        <button
          onClick={() => navigate('/finance/claims')}
          className="btn btn-secondary"
          style={{ marginTop: '1rem' }}
        >
          Return to Claims
        </button>
      </div>
    );
  }

  const getStatusBadge = (status) => {
    const map = {
      DRAFT: { bg: 'rgba(148, 163, 184, 0.15)', text: '#94a3b8', label: 'Draft' },
      READY: { bg: 'rgba(56, 189, 248, 0.15)', text: '#38bdf8', label: 'Ready for Submission' },
      SUBMITTED: { bg: 'rgba(129, 140, 248, 0.15)', text: '#818cf8', label: 'Submitted' },
      UNDER_REVIEW: { bg: 'rgba(234, 179, 8, 0.15)', text: '#eab308', label: 'Under Review' },
      QUERY: { bg: 'rgba(249, 115, 22, 0.15)', text: '#f97316', label: 'Query Raised' },
      MORE_INFORMATION_REQUIRED: { bg: 'rgba(249, 115, 22, 0.2)', text: '#ea580c', label: 'Additional Docs Required' },
      APPROVED: { bg: 'rgba(34, 197, 94, 0.15)', text: '#22c55e', label: 'Approved' },
      PARTIALLY_APPROVED: { bg: 'rgba(168, 85, 247, 0.15)', text: '#a855f7', label: 'Partially Approved' },
      REJECTED: { bg: 'rgba(239, 68, 68, 0.15)', text: '#ef4444', label: 'Rejected' },
      PAID: { bg: 'rgba(16, 185, 129, 0.2)', text: '#10b981', label: 'Paid & Settled' },
      CANCELLED: { bg: 'rgba(100, 116, 139, 0.2)', text: '#64748b', label: 'Cancelled' }
    };
    const s = map[status] || { bg: '#e2e8f0', text: '#475569', label: status };

    return (
      <span
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '0.4rem',
          padding: '0.35rem 0.85rem',
          borderRadius: '9999px',
          fontSize: '0.85rem',
          fontWeight: '700',
          background: s.bg,
          color: s.text
        }}
      >
        <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: s.text }} />
        {s.label}
      </span>
    );
  };

  return (
    <div style={{ padding: '1.5rem', maxWidth: '1440px', margin: '0 auto' }}>
      {/* Top Navigation */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '1.25rem',
          flexWrap: 'wrap',
          gap: '1rem'
        }}
      >
        <button
          onClick={() => navigate('/finance/claims')}
          className="btn btn-secondary"
          style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', padding: '0.45rem 0.85rem', fontSize: '0.85rem' }}
        >
          <ArrowLeft size={16} />
          <span>All Claims</span>
        </button>

        {/* Action Controls Toolbar */}
        <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap', alignItems: 'center' }}>
          {claim.status === 'DRAFT' && (
            <>
              <button
                onClick={handleValidate}
                disabled={actionLoading}
                className="btn btn-secondary"
                style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem' }}
              >
                <FileCheck size={16} />
                <span>Validate Checklist</span>
              </button>

              <button
                onClick={handleMarkReady}
                disabled={actionLoading}
                className="btn btn-primary"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  fontSize: '0.85rem',
                  background: '#38bdf8',
                  color: '#0f172a',
                  fontWeight: '600'
                }}
              >
                <CheckCircle size={16} />
                <span>Mark Ready</span>
              </button>
            </>
          )}

          {claim.status === 'READY' && (
            <button
              onClick={handleSubmitClaim}
              disabled={actionLoading}
              className="btn btn-primary"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.4rem',
                fontSize: '0.85rem',
                background: '#0284c7',
                color: '#fff',
                fontWeight: '600'
              }}
            >
              <Send size={16} />
              <span>Submit to Insurer</span>
            </button>
          )}

          {['SUBMITTED', 'UNDER_REVIEW', 'QUERY', 'MORE_INFORMATION_REQUIRED'].includes(claim.status) && (
            <button
              onClick={handleCheckStatus}
              disabled={actionLoading}
              className="btn btn-secondary"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem' }}
            >
              <RefreshCw size={16} className={actionLoading ? 'spin' : ''} />
              <span>Check Status with Insurer</span>
            </button>
          )}

          {['APPROVED', 'PARTIALLY_APPROVED'].includes(claim.status) && (
            <button
              onClick={() => {
                setSettlementFormData({
                  settledAmount: claim.approvedAmount || '',
                  paymentReference: '',
                  notes: ''
                });
                setShowSettlementModal(true);
              }}
              className="btn btn-primary"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.4rem',
                fontSize: '0.85rem',
                background: '#10b981',
                color: '#fff',
                fontWeight: '600'
              }}
            >
              <DollarSign size={16} />
              <span>Record Settlement Payment</span>
            </button>
          )}

          {['DRAFT', 'READY'].includes(claim.status) && (
            <button
              onClick={handleCancelClaim}
              disabled={actionLoading}
              className="btn btn-danger"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.4rem',
                fontSize: '0.85rem',
                background: 'rgba(239, 68, 68, 0.15)',
                color: '#ef4444',
                border: '1px solid rgba(239, 68, 68, 0.3)'
              }}
            >
              <XCircle size={16} />
              <span>Cancel Claim</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Dossier Header Card */}
      <div
        style={{
          background: 'var(--bg-card)',
          borderRadius: 'var(--radius-lg)',
          border: '1px solid var(--border-color)',
          padding: '1.5rem',
          marginBottom: '1.5rem'
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.35rem' }}>
              <h1 style={{ margin: 0, fontSize: '1.6rem', fontWeight: '800', color: 'var(--text-primary)' }}>
                {claim.claimId}
              </h1>
              {getStatusBadge(claim.status)}
            </div>
            <div style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
              Insurer: <strong>{claim.insurerName}</strong> • Policy Number: <strong>{claim.policyNumber}</strong> • Type: <strong>{claim.claimType}</strong>
            </div>
            {claim.insurerReferenceNumber && (
              <div style={{ color: '#0284c7', fontSize: '0.85rem', marginTop: '0.35rem', fontWeight: '600' }}>
                Insurer Reference Number: {claim.insurerReferenceNumber}
              </div>
            )}
          </div>

          {/* Amount Summary Cards */}
          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
            <div style={{ background: 'var(--bg-sidebar)', padding: '0.75rem 1.25rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', minWidth: '130px' }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Claimed Amount</div>
              <div style={{ fontSize: '1.3rem', fontWeight: '700', color: 'var(--text-primary)' }}>
                ₹{(claim.totalClaimAmount || claim.claimAmount || 0).toLocaleString()}
              </div>
            </div>

            <div style={{ background: 'var(--bg-sidebar)', padding: '0.75rem 1.25rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', minWidth: '130px' }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Approved Amount</div>
              <div style={{ fontSize: '1.3rem', fontWeight: '700', color: claim.approvedAmount > 0 ? '#22c55e' : 'var(--text-muted)' }}>
                ₹{(claim.approvedAmount || 0).toLocaleString()}
              </div>
            </div>

            <div style={{ background: 'var(--bg-sidebar)', padding: '0.75rem 1.25rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', minWidth: '130px' }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Settled (Paid)</div>
              <div style={{ fontSize: '1.3rem', fontWeight: '700', color: claim.settlementAmount > 0 ? '#10b981' : 'var(--text-muted)' }}>
                ₹{(claim.settlementAmount || claim.settledAmount || 0).toLocaleString()}
              </div>
            </div>
          </div>
        </div>

        {/* Rejection / Query Alerts if active */}
        {claim.status === 'REJECTED' && claim.rejectionReason && (
          <div
            style={{
              marginTop: '1.25rem',
              padding: '0.85rem 1rem',
              background: 'rgba(239, 68, 68, 0.1)',
              border: '1px solid #ef4444',
              borderRadius: 'var(--radius-md)',
              color: '#ef4444',
              fontSize: '0.875rem'
            }}
          >
            <strong>Rejection Reason from Insurer:</strong> {claim.rejectionReason}
            <div style={{ fontSize: '0.78rem', marginTop: '0.35rem', color: 'var(--text-secondary)' }}>
              Note: Staff review required. Automated appeals or clinical alterations are prohibited (Section 42 & 43).
            </div>
          </div>
        )}

        {['QUERY', 'MORE_INFORMATION_REQUIRED'].includes(claim.status) && claim.queryReason && (
          <div
            style={{
              marginTop: '1.25rem',
              padding: '0.85rem 1rem',
              background: 'rgba(249, 115, 22, 0.1)',
              border: '1px solid #f97316',
              borderRadius: 'var(--radius-md)',
              color: '#f97316',
              fontSize: '0.875rem'
            }}
          >
            <strong>Insurer Query Note:</strong> {claim.queryReason}
          </div>
        )}
      </div>

      {/* Tabs Header */}
      <div
        style={{
          display: 'flex',
          gap: '0.5rem',
          borderBottom: '1px solid var(--border-color)',
          marginBottom: '1.5rem',
          overflowX: 'auto'
        }}
      >
        {[
          { id: 'overview', label: 'Dossier Overview', icon: FileText },
          { id: 'items', label: `Service Charges (${claim.items?.length || 0})`, icon: CreditCard },
          { id: 'checklist', label: 'Document Checklist', icon: FileCheck },
          { id: 'timeline', label: `Timeline & History (${claim.statusHistory?.length || 0})`, icon: History },
          { id: 'queries', label: 'Insurer Queries', icon: HelpCircle },
          { id: 'settlement', label: 'Settlement & Billing', icon: DollarSign }
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.75rem 1.25rem',
                border: 'none',
                borderBottom: isActive ? '3px solid #0284c7' : '3px solid transparent',
                background: 'transparent',
                color: isActive ? '#0284c7' : 'var(--text-secondary)',
                fontWeight: isActive ? '600' : '500',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                fontSize: '0.9rem'
              }}
            >
              <Icon size={16} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab Content 1: Overview */}
      {activeTab === 'overview' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '1.5rem' }}>
          {/* Patient Card */}
          <div style={{ background: 'var(--bg-card)', padding: '1.25rem', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-color)' }}>
            <h3 style={{ margin: '0 0 1rem', fontSize: '1rem', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <User size={18} style={{ color: '#0284c7' }} />
              <span>Patient & Encounter Info</span>
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.875rem' }}>
              <div><strong>Patient ID:</strong> {claim.patientId}</div>
              <div><strong>Patient Name:</strong> {claim.patientName}</div>
              <div><strong>Invoice ID:</strong> <Link to={`/billing/invoices/${claim.invoiceId}`} style={{ color: '#0284c7' }}>{claim.invoiceId}</Link></div>
              <div><strong>Admission ID:</strong> {claim.admissionId || 'N/A'}</div>
              <div><strong>Discharge ID:</strong> {claim.dischargeId || 'N/A'}</div>
              <div><strong>Admission Date:</strong> {claim.admissionDate ? new Date(claim.admissionDate).toLocaleDateString() : 'N/A'}</div>
              <div><strong>Discharge Date:</strong> {claim.dischargeDate ? new Date(claim.dischargeDate).toLocaleDateString() : 'N/A'}</div>
            </div>
          </div>

          {/* Insurance Policy Card */}
          <div style={{ background: 'var(--bg-card)', padding: '1.25rem', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-color)' }}>
            <h3 style={{ margin: '0 0 1rem', fontSize: '1rem', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <ShieldCheck size={18} style={{ color: '#22c55e' }} />
              <span>Insurance Coverage</span>
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.875rem' }}>
              <div><strong>Provider:</strong> {claim.insurerName}</div>
              <div><strong>Policy Number:</strong> {claim.policyNumber}</div>
              <div><strong>Member ID:</strong> {claim.memberId || 'N/A'}</div>
              <div><strong>Verification Ref:</strong> {claim.verificationId || 'Unlinked'}</div>
              <div><strong>Submission Channel:</strong> {claim.submissionSource}</div>
              <div><strong>Submitted At:</strong> {claim.submittedAt ? new Date(claim.submittedAt).toLocaleString() : 'Not submitted yet'}</div>
              <div><strong>Last Checked:</strong> {claim.lastStatusCheckedAt ? new Date(claim.lastStatusCheckedAt).toLocaleString() : 'Never'}</div>
            </div>
          </div>

          {/* Notes Card */}
          <div style={{ background: 'var(--bg-card)', padding: '1.25rem', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-color)' }}>
            <h3 style={{ margin: '0 0 1rem', fontSize: '1rem', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Info size={18} style={{ color: '#eab308' }} />
              <span>Dossier Notes & Metadata</span>
            </h3>
            <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
              {claim.notes || 'No internal notes provided for this claim package.'}
            </p>
            <div style={{ marginTop: '1rem', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
              Created By: {claim.createdBy || 'SYSTEM'} • Last Updated By: {claim.updatedBy || 'SYSTEM'}
            </div>
          </div>
        </div>
      )}

      {/* Tab Content 2: Service Items */}
      {activeTab === 'items' && (
        <div style={{ background: 'var(--bg-card)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-color)', overflow: 'hidden' }}>
          <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid var(--border-color)', background: 'var(--bg-sidebar)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ margin: 0, fontSize: '1rem', color: 'var(--text-primary)' }}>Claimed Hospital Service Breakdown</h3>
            <div style={{ fontWeight: '700', fontSize: '0.9rem', color: 'var(--text-primary)' }}>
              Total: ₹{(claim.totalClaimAmount || 0).toLocaleString()}
            </div>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-secondary)' }}>
                  <th style={{ padding: '0.75rem 1rem' }}>Category</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Description</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Qty</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Unit Rate</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Claimed Amount</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Approved</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Rejected</th>
                </tr>
              </thead>
              <tbody>
                {(claim.items || []).map((item, idx) => (
                  <tr key={item._id || idx} style={{ borderBottom: '1px solid var(--border-color)' }}>
                    <td style={{ padding: '0.75rem 1rem', color: 'var(--text-secondary)' }}>
                      <span style={{ background: 'var(--bg-sidebar)', padding: '0.2rem 0.5rem', borderRadius: '4px', fontSize: '0.75rem' }}>
                        {item.serviceType}
                      </span>
                    </td>
                    <td style={{ padding: '0.75rem 1rem', fontWeight: '500', color: 'var(--text-primary)' }}>{item.description}</td>
                    <td style={{ padding: '0.75rem 1rem' }}>{item.quantity}</td>
                    <td style={{ padding: '0.75rem 1rem' }}>₹{item.unitAmount}</td>
                    <td style={{ padding: '0.75rem 1rem', fontWeight: '600' }}>₹{item.claimedAmount}</td>
                    <td style={{ padding: '0.75rem 1rem', color: item.approvedAmount > 0 ? '#22c55e' : 'var(--text-muted)' }}>
                      ₹{item.approvedAmount || 0}
                    </td>
                    <td style={{ padding: '0.75rem 1rem', color: item.rejectedAmount > 0 ? '#ef4444' : 'var(--text-muted)' }}>
                      ₹{item.rejectedAmount || 0}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab Content 3: Document Checklist & Uploads */}
      {activeTab === 'checklist' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '1.5rem' }}>
          {/* Section 20 Checklist */}
          <div style={{ background: 'var(--bg-card)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-color)', padding: '1.25rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h3 style={{ margin: 0, fontSize: '1rem', color: 'var(--text-primary)' }}>Mandatory Document Checklist</h3>
              <button
                onClick={() => setShowDocModal(true)}
                className="btn btn-secondary"
                style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8rem', padding: '0.4rem 0.75rem' }}
              >
                <UploadCloud size={15} />
                <span>Upload Document</span>
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {(claim.documentChecklist || []).map((chk, i) => (
                <div
                  key={i}
                  style={{
                    padding: '0.75rem 1rem',
                    borderRadius: 'var(--radius-md)',
                    background: 'var(--bg-sidebar)',
                    border: '1px solid var(--border-color)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}
                >
                  <div>
                    <div style={{ fontWeight: '600', color: 'var(--text-primary)', fontSize: '0.875rem' }}>
                      {chk.title || chk.documentType}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      Type: {chk.documentType} • {chk.required ? 'Mandatory' : 'Optional'}
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                    {chk.available ? (
                      <span style={{ fontSize: '0.75rem', color: '#22c55e', background: 'rgba(34, 197, 94, 0.1)', padding: '0.2rem 0.5rem', borderRadius: '4px', fontWeight: '600' }}>
                        ✓ Available
                      </span>
                    ) : chk.required ? (
                      <span style={{ fontSize: '0.75rem', color: '#ef4444', background: 'rgba(239, 68, 68, 0.1)', padding: '0.2rem 0.5rem', borderRadius: '4px', fontWeight: '600' }}>
                        Missing
                      </span>
                    ) : (
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Not required</span>
                    )}

                    {chk.submitted && (
                      <span style={{ fontSize: '0.75rem', color: '#818cf8', background: 'rgba(129, 140, 248, 0.1)', padding: '0.2rem 0.5rem', borderRadius: '4px' }}>
                        Submitted
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Uploaded Documents List */}
          <div style={{ background: 'var(--bg-card)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-color)', padding: '1.25rem' }}>
            <h3 style={{ margin: '0 0 1rem', fontSize: '1rem', color: 'var(--text-primary)' }}>Attached Claim Documents</h3>
            {(claim.documents || []).length === 0 ? (
              <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)', fontSize: '0.875rem' }}>
                No supplementary files attached yet.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {claim.documents.map((doc) => (
                  <div
                    key={doc.documentId}
                    style={{
                      padding: '0.75rem 1rem',
                      borderRadius: 'var(--radius-md)',
                      background: 'var(--bg-sidebar)',
                      border: '1px solid var(--border-color)',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center'
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: '600', color: 'var(--text-primary)', fontSize: '0.875rem' }}>{doc.fileName}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        {doc.documentType} • v{doc.version || 1} • {new Date(doc.uploadedAt || doc.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                    <span style={{ fontSize: '0.75rem', color: '#0284c7', background: 'rgba(2, 132, 199, 0.1)', padding: '0.2rem 0.5rem', borderRadius: '4px' }}>
                      {doc.verificationStatus}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab Content 4: Status History & Timeline */}
      {activeTab === 'timeline' && (
        <div style={{ background: 'var(--bg-card)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-color)', padding: '1.5rem' }}>
          <h3 style={{ margin: '0 0 1.25rem', fontSize: '1rem', color: 'var(--text-primary)' }}>
            Complete Claim Audit & Status Timeline (Section 10 & 52)
          </h3>

          <div style={{ position: 'relative', paddingLeft: '1.5rem' }}>
            {(claim.statusHistory || []).map((item, idx) => (
              <div key={item._id || idx} style={{ position: 'relative', marginBottom: '1.5rem', paddingLeft: '1rem' }}>
                <div
                  style={{
                    position: 'absolute',
                    left: '-1.5rem',
                    top: '4px',
                    width: '12px',
                    height: '12px',
                    borderRadius: '50%',
                    background: '#0284c7',
                    border: '2px solid var(--bg-card)'
                  }}
                />
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                  <strong style={{ color: 'var(--text-primary)', fontSize: '0.9rem' }}>
                    {item.previousStatus === 'NONE' ? 'Created DRAFT' : `${item.previousStatus} → ${item.newStatus}`}
                  </strong>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    {new Date(item.timestamp).toLocaleString()}
                  </span>
                </div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
                  {item.reason}
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.1rem' }}>
                  Actor: {item.changedBy} • Source: {item.source} {item.insurerReference ? `• Ref: ${item.insurerReference}` : ''}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab Content 5: Queries */}
      {activeTab === 'queries' && (
        <div style={{ background: 'var(--bg-card)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-color)', padding: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
            <h3 style={{ margin: 0, fontSize: '1rem', color: 'var(--text-primary)' }}>
              Insurer Queries & Information Requests (Section 35 & 37)
            </h3>
            <button
              onClick={() => setShowQueryModal(true)}
              className="btn btn-secondary"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8rem', padding: '0.4rem 0.75rem' }}
            >
              <span>+ Record Query</span>
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <QueriesList claimId={claim.claimId} onSelectRespond={(q) => setRespondingQuery(q)} />
          </div>
        </div>
      )}

      {/* Tab Content 6: Settlement & Reconciliation */}
      {activeTab === 'settlement' && (
        <div style={{ background: 'var(--bg-card)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-color)', padding: '1.5rem' }}>
          <h3 style={{ margin: '0 0 1.25rem', fontSize: '1rem', color: 'var(--text-primary)' }}>
            Claim Payment Settlement & Billing Reconciliation (Section 44, 45 & 47)
          </h3>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem', marginBottom: '1.5rem' }}>
            <div style={{ background: 'var(--bg-sidebar)', padding: '1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Approved Claim Liability</div>
              <div style={{ fontSize: '1.25rem', fontWeight: '700', color: '#22c55e', marginTop: '0.25rem' }}>
                ₹{(claim.approvedAmount || 0).toLocaleString()}
              </div>
            </div>

            <div style={{ background: 'var(--bg-sidebar)', padding: '1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Received Settlement Payment</div>
              <div style={{ fontSize: '1.25rem', fontWeight: '700', color: '#10b981', marginTop: '0.25rem' }}>
                ₹{(claim.settlementAmount || 0).toLocaleString()}
              </div>
            </div>

            <div style={{ background: 'var(--bg-sidebar)', padding: '1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Payment Settlement Date</div>
              <div style={{ fontSize: '1.1rem', fontWeight: '600', color: 'var(--text-primary)', marginTop: '0.25rem' }}>
                {claim.paidAt ? new Date(claim.paidAt).toLocaleDateString() : 'Pending Payment'}
              </div>
            </div>
          </div>

          <SettlementRecords claimId={claim.claimId} />
        </div>
      )}

      {/* Modal: Upload Document */}
      {showDocModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: 'var(--bg-card)', width: '90%', maxWidth: '480px', borderRadius: 'var(--radius-lg)', padding: '1.5rem', border: '1px solid var(--border-color)' }}>
            <h3 style={{ margin: '0 0 1rem', fontSize: '1.2rem', color: 'var(--text-primary)' }}>Upload Supporting Document</h3>
            <form onSubmit={handleAddDocument}>
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', marginBottom: '0.35rem' }}>Document Type</label>
                <select
                  value={docFormData.documentType}
                  onChange={(e) => setDocFormData({ ...docFormData, documentType: e.target.value })}
                  style={{ width: '100%', padding: '0.6rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', background: 'var(--bg-sidebar)', color: 'var(--text-primary)' }}
                >
                  <option value="FINAL_INVOICE">Final Hospital Invoice</option>
                  <option value="DISCHARGE_DOCUMENT">Discharge Summary / Clinical Notes</option>
                  <option value="INSURANCE_CARD">Insurance Card</option>
                  <option value="LAB_REPORT">Lab Diagnostic Report</option>
                  <option value="RADIOLOGY_REPORT">Radiology / Scan Report</option>
                  <option value="PHARMACY_DOCUMENT">Pharmacy Dispense Record</option>
                  <option value="SERVICE_DOCUMENT">Service / Procedure Record</option>
                  <option value="OTHER">Other Insurer-Required Document</option>
                </select>
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', marginBottom: '0.35rem' }}>File Name / Description *</label>
                <input
                  type="text"
                  placeholder="e.g. discharge_summary_final.pdf"
                  value={docFormData.fileName}
                  onChange={(e) => setDocFormData({ ...docFormData, fileName: e.target.value })}
                  required
                  style={{ width: '100%', padding: '0.6rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', background: 'var(--bg-sidebar)', color: 'var(--text-primary)' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '1.25rem' }}>
                <button type="button" onClick={() => setShowDocModal(false)} className="btn btn-secondary">Cancel</button>
                <button type="submit" disabled={actionLoading} className="btn btn-primary" style={{ background: '#0284c7', color: '#fff' }}>
                  Upload Document
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Record Query */}
      {showQueryModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: 'var(--bg-card)', width: '90%', maxWidth: '520px', borderRadius: 'var(--radius-lg)', padding: '1.5rem', border: '1px solid var(--border-color)' }}>
            <h3 style={{ margin: '0 0 1rem', fontSize: '1.2rem', color: 'var(--text-primary)' }}>Record Insurer Query</h3>
            <form onSubmit={handleCreateQuery}>
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', marginBottom: '0.35rem' }}>Query Type</label>
                <select
                  value={queryFormData.queryType}
                  onChange={(e) => setQueryFormData({ ...queryFormData, queryType: e.target.value })}
                  style={{ width: '100%', padding: '0.6rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', background: 'var(--bg-sidebar)', color: 'var(--text-primary)' }}
                >
                  <option value="MISSING_DOCUMENT">Missing Document Request</option>
                  <option value="CLARIFICATION">Medical / Clinical Clarification</option>
                  <option value="BILLING_BREAKDOWN">Itemized Billing Breakdown</option>
                  <option value="OTHER">Other Information Request</option>
                </select>
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', marginBottom: '0.35rem' }}>Responsible Department</label>
                <select
                  value={queryFormData.responsibleDepartment}
                  onChange={(e) => setQueryFormData({ ...queryFormData, responsibleDepartment: e.target.value })}
                  style={{ width: '100%', padding: '0.6rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', background: 'var(--bg-sidebar)', color: 'var(--text-primary)' }}
                >
                  <option value="BILLING">Billing & Cashier</option>
                  <option value="MEDICAL_RECORDS">Medical Records / MRD</option>
                  <option value="LABORATORY">Diagnostic Laboratory</option>
                  <option value="RADIOLOGY">Radiology & Imaging</option>
                  <option value="PHARMACY">Pharmacy</option>
                  <option value="ADMINISTRATION">Hospital Administration</option>
                </select>
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', marginBottom: '0.35rem' }}>Query Description / Text *</label>
                <textarea
                  rows={3}
                  value={queryFormData.queryText}
                  onChange={(e) => setQueryFormData({ ...queryFormData, queryText: e.target.value })}
                  required
                  placeholder="Detail what the insurer has requested..."
                  style={{ width: '100%', padding: '0.6rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', background: 'var(--bg-sidebar)', color: 'var(--text-primary)' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '1.25rem' }}>
                <button type="button" onClick={() => setShowQueryModal(false)} className="btn btn-secondary">Cancel</button>
                <button type="submit" disabled={actionLoading} className="btn btn-primary" style={{ background: '#f97316', color: '#fff' }}>
                  Save Query
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Respond to Query */}
      {respondingQuery && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: 'var(--bg-card)', width: '90%', maxWidth: '520px', borderRadius: 'var(--radius-lg)', padding: '1.5rem', border: '1px solid var(--border-color)' }}>
            <h3 style={{ margin: '0 0 0.5rem', fontSize: '1.2rem', color: 'var(--text-primary)' }}>Respond to Insurer Query</h3>
            <p style={{ margin: '0 0 1rem', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
              Query: <em>{respondingQuery.queryText}</em>
            </p>
            <form onSubmit={handleRespondQuery}>
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', marginBottom: '0.35rem' }}>Response Text / Resolution *</label>
                <textarea
                  rows={4}
                  value={responseFormData.responseText}
                  onChange={(e) => setResponseFormData({ responseText: e.target.value })}
                  required
                  placeholder="Provide authoritative clarification or reference attached documents..."
                  style={{ width: '100%', padding: '0.6rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', background: 'var(--bg-sidebar)', color: 'var(--text-primary)' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '1.25rem' }}>
                <button type="button" onClick={() => setRespondingQuery(null)} className="btn btn-secondary">Cancel</button>
                <button type="submit" disabled={actionLoading} className="btn btn-primary" style={{ background: '#0284c7', color: '#fff' }}>
                  Submit Response
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Record Settlement */}
      {showSettlementModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: 'var(--bg-card)', width: '90%', maxWidth: '480px', borderRadius: 'var(--radius-lg)', padding: '1.5rem', border: '1px solid var(--border-color)' }}>
            <h3 style={{ margin: '0 0 1rem', fontSize: '1.2rem', color: 'var(--text-primary)' }}>Record Settlement & Reconcile</h3>
            <form onSubmit={handleRecordSettlement}>
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', marginBottom: '0.35rem' }}>Settled Amount (INR) *</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={settlementFormData.settledAmount}
                  onChange={(e) => setSettlementFormData({ ...settlementFormData, settledAmount: e.target.value })}
                  required
                  style={{ width: '100%', padding: '0.6rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', background: 'var(--bg-sidebar)', color: 'var(--text-primary)', fontWeight: '600' }}
                />
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', marginBottom: '0.35rem' }}>Payment / NEFT Reference *</label>
                <input
                  type="text"
                  placeholder="e.g. UTR-20261011-884920"
                  value={settlementFormData.paymentReference}
                  onChange={(e) => setSettlementFormData({ ...settlementFormData, paymentReference: e.target.value })}
                  required
                  style={{ width: '100%', padding: '0.6rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', background: 'var(--bg-sidebar)', color: 'var(--text-primary)' }}
                />
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', marginBottom: '0.35rem' }}>Settlement Notes</label>
                <textarea
                  rows={2}
                  value={settlementFormData.notes}
                  onChange={(e) => setSettlementFormData({ ...settlementFormData, notes: e.target.value })}
                  placeholder="Optional bank or remittance notes..."
                  style={{ width: '100%', padding: '0.6rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', background: 'var(--bg-sidebar)', color: 'var(--text-primary)' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '1.25rem' }}>
                <button type="button" onClick={() => setShowSettlementModal(false)} className="btn btn-secondary">Cancel</button>
                <button type="submit" disabled={actionLoading} className="btn btn-primary" style={{ background: '#10b981', color: '#fff' }}>
                  Confirm Settlement
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

// Subcomponent: Queries List
const QueriesList = ({ claimId, onSelectRespond }) => {
  const [queries, setQueries] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchQ = async () => {
      try {
        const res = await insuranceClaimService.getQueries(claimId);
        setQueries(res?.data || []);
      } catch (err) {
        console.warn('Failed to load queries:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchQ();
  }, [claimId]);

  if (loading) return <div>Loading queries...</div>;
  if (queries.length === 0) {
    return <div style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>No insurer queries raised for this claim.</div>;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
      {queries.map((q) => (
        <div
          key={q.queryId}
          style={{
            padding: '1rem',
            borderRadius: 'var(--radius-md)',
            background: 'var(--bg-sidebar)',
            border: '1px solid var(--border-color)'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <span
                style={{
                  fontSize: '0.75rem',
                  fontWeight: '700',
                  padding: '0.2rem 0.5rem',
                  borderRadius: '4px',
                  background: q.status === 'RESOLVED' || q.status === 'SUBMITTED' ? 'rgba(34, 197, 94, 0.15)' : 'rgba(249, 115, 22, 0.15)',
                  color: q.status === 'RESOLVED' || q.status === 'SUBMITTED' ? '#22c55e' : '#f97316'
                }}
              >
                {q.status}
              </span>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginLeft: '0.5rem' }}>
                Dept: {q.responsibleDepartment}
              </span>
              <p style={{ margin: '0.5rem 0', fontWeight: '500', color: 'var(--text-primary)' }}>
                {q.queryText}
              </p>
            </div>

            {q.status === 'OPEN' && (
              <button
                onClick={() => onSelectRespond(q)}
                className="btn btn-secondary"
                style={{ fontSize: '0.75rem', padding: '0.35rem 0.65rem' }}
              >
                Respond
              </button>
            )}
          </div>

          {q.responseText && (
            <div style={{ marginTop: '0.5rem', padding: '0.5rem 0.75rem', background: 'var(--bg-card)', borderRadius: '4px', fontSize: '0.8rem', borderLeft: '3px solid #0284c7' }}>
              <strong>Response:</strong> {q.responseText}
              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                Responded by: {q.respondedBy} at {new Date(q.respondedAt).toLocaleString()}
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

// Subcomponent: Settlement Records
const SettlementRecords = ({ claimId }) => {
  const [settlements, setSettlements] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchS = async () => {
      try {
        const res = await insuranceClaimService.getSettlement(claimId);
        setSettlements(res?.data || []);
      } catch (err) {
        console.warn('Failed to load settlements:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchS();
  }, [claimId]);

  if (loading) return <div>Loading settlements...</div>;
  if (settlements.length === 0) {
    return <div style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>No settlement records found.</div>;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
      {settlements.map((s) => (
        <div
          key={s.settlementId}
          style={{
            padding: '1rem',
            borderRadius: 'var(--radius-md)',
            background: 'var(--bg-sidebar)',
            border: '1px solid var(--border-color)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}
        >
          <div>
            <div style={{ fontWeight: '600', color: 'var(--text-primary)', fontSize: '0.9rem' }}>
              Settlement Ref: {s.paymentReference}
            </div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              Insurer: {s.insurerName} • Date: {new Date(s.settlementDate).toLocaleDateString()}
            </div>
            {s.differenceAmount > 0 && (
              <div style={{ fontSize: '0.78rem', color: '#eab308', marginTop: '0.25rem' }}>
                ⚠️ Discrepancy: Difference of ₹{s.differenceAmount} recorded in ExceptionCase.
              </div>
            )}
          </div>

          <div style={{ textAlign: 'right' }}>
            <div style={{ fontWeight: '700', fontSize: '1.1rem', color: '#10b981' }}>
              ₹{s.settledAmount.toLocaleString()}
            </div>
            <div style={{ fontSize: '0.75rem', color: s.reconciledWithBilling ? '#22c55e' : '#eab308' }}>
              {s.reconciledWithBilling ? '✓ Reconciled with Billing' : 'Pending Reconciliation'}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default ClaimDetailPage;
