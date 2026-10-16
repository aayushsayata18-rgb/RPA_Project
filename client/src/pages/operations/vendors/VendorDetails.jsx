import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  Building2,
  ArrowLeft,
  RefreshCw,
  Edit,
  ShieldAlert,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  PauseCircle,
  PlayCircle,
  XCircle,
  FileText,
  Users,
  Award,
  History,
  Phone,
  Mail,
  MapPin,
  ExternalLink,
  CreditCard,
  Calendar,
  AlertCircle
} from 'lucide-react';
import vendorService from '../../../services/vendorService';
import { VendorStatusBadge } from '../../../components/vendor/VendorStatusBadge';
import { VendorRiskBadge } from '../../../components/vendor/VendorRiskBadge';
import { VendorVerificationBadge } from '../../../components/vendor/VendorVerificationBadge';
import { VendorContactTable } from '../../../components/vendor/VendorContactTable';
import { VendorDocumentTable } from '../../../components/vendor/VendorDocumentTable';
import { VendorContractTable } from '../../../components/vendor/VendorContractTable';
import { VendorPerformanceChart } from '../../../components/vendor/VendorPerformanceChart';
import { VendorIssueTable } from '../../../components/vendor/VendorIssueTable';
import { VendorTimeline } from '../../../components/vendor/VendorTimeline';

export const VendorDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [vendor, setVendor] = useState(null);
  const [contacts, setContacts] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [contracts, setContracts] = useState([]);
  const [verifications, setVerifications] = useState([]);
  const [performance, setPerformance] = useState(null);
  const [issues, setIssues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  // Status Modal State
  const [statusModal, setStatusModal] = useState({ open: false, targetStatus: '', reason: '' });
  const [statusLoading, setStatusLoading] = useState(false);

  const fetchVendorData = async () => {
    try {
      setLoading(true);
      const res = await vendorService.getVendorById(id);
      const v = res.data?.data || res.data;
      setVendor(v);

      // Concurrently fetch sub-entities
      const [contRes, docRes, conRes, verRes, perfRes, issRes] = await Promise.allSettled([
        vendorService.getContacts(id),
        vendorService.getDocuments(id),
        vendorService.getContracts(id),
        vendorService.getVerifications(id),
        vendorService.getPerformance(id),
        vendorService.getIssuesByVendor(id)
      ]);

      if (contRes.status === 'fulfilled') setContacts(contRes.value.data?.data || contRes.value.data || []);
      if (docRes.status === 'fulfilled') setDocuments(docRes.value.data?.data || docRes.value.data || []);
      if (conRes.status === 'fulfilled') setContracts(conRes.value.data?.data || conRes.value.data || []);
      if (verRes.status === 'fulfilled') setVerifications(verRes.value.data?.data || verRes.value.data || []);
      if (perfRes.status === 'fulfilled') setPerformance(perfRes.value.data?.data || perfRes.value.data || null);
      if (issRes.status === 'fulfilled') setIssues(issRes.value.data?.data || issRes.value.data || []);
    } catch (err) {
      console.error('Failed to load vendor dossier:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) fetchVendorData();
  }, [id]);

  const handleStatusChangeSubmit = async (e) => {
    e.preventDefault();
    if (!statusModal.reason) {
      alert('A formal justification reason is required for status changes.');
      return;
    }
    try {
      setStatusLoading(true);
      await vendorService.updateStatus(id, {
        status: statusModal.targetStatus,
        reason: statusModal.reason
      });
      setStatusModal({ open: false, targetStatus: '', reason: '' });
      fetchVendorData();
    } catch (err) {
      alert(err.response?.data?.message || err.message || 'Status transition failed');
    } finally {
      setStatusLoading(false);
    }
  };

  if (loading && !vendor) {
    return (
      <div style={{ padding: '4rem', textAlign: 'center', color: '#64748b' }}>
        <RefreshCw size={32} className="spin" style={{ margin: '0 auto 1rem auto', display: 'block' }} />
        Loading authoritative vendor dossier...
      </div>
    );
  }

  if (!vendor) {
    return (
      <div style={{ padding: '4rem', textAlign: 'center', color: '#ef4444' }}>
        <AlertTriangle size={48} style={{ margin: '0 auto 1rem auto', display: 'block' }} />
        <h2>Vendor Not Found</h2>
        <p>The requested vendor master record does not exist or has been removed.</p>
        <Link to="/operations/vendors/list" style={{ color: '#2563eb', fontWeight: 600 }}>
          &larr; Return to Directory
        </Link>
      </div>
    );
  }

  return (
    <div style={{ padding: '2rem', maxWidth: '1400px', margin: '0 auto', color: '#1e293b' }}>
      {/* Breadcrumb & Navigation */}
      <div style={{ marginBottom: '1.25rem' }}>
        <Link
          to="/operations/vendors/list"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.4rem',
            color: '#64748b',
            textDecoration: 'none',
            fontSize: '0.875rem',
            fontWeight: 500
          }}
        >
          <ArrowLeft size={16} /> Back to Vendor Master Directory
        </Link>
      </div>

      {/* Header Profile Card */}
      <div
        style={{
          background: '#ffffff',
          borderRadius: '16px',
          border: '1px solid #e2e8f0',
          padding: '1.75rem',
          marginBottom: '1.5rem',
          boxShadow: '0 2px 6px rgba(0,0,0,0.04)'
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1.5rem' }}>
          {/* Vendor Identity */}
          <div style={{ display: 'flex', gap: '1.25rem', alignItems: 'flex-start' }}>
            <div
              style={{
                width: '64px',
                height: '64px',
                borderRadius: '14px',
                background: 'linear-gradient(135deg, #1e40af 0%, #3b82f6 100%)',
                color: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1.75rem',
                fontWeight: 800,
                boxShadow: '0 4px 10px rgba(37,99,235,0.25)',
                flexShrink: 0
              }}
            >
              {vendor.legalName?.charAt(0) || 'V'}
            </div>

            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
                <h1 style={{ fontSize: '1.85rem', fontWeight: 800, margin: 0, color: '#0f172a' }}>
                  {vendor.legalName}
                </h1>
                <VendorStatusBadge status={vendor.status} />
                <VendorVerificationBadge status={vendor.verificationStatus} />
                <VendorRiskBadge riskTier={vendor.riskTier} score={vendor.performanceScore} />
              </div>

              {vendor.tradeName && vendor.tradeName !== vendor.legalName && (
                <div style={{ fontSize: '1rem', color: '#64748b', marginTop: '0.2rem', fontWeight: 500 }}>
                  Trading as: <strong>{vendor.tradeName}</strong>
                </div>
              )}

              <div style={{ display: 'flex', gap: '1.25rem', marginTop: '0.6rem', fontSize: '0.85rem', color: '#475569', flexWrap: 'wrap' }}>
                <span style={{ background: '#f1f5f9', padding: '0.2rem 0.6rem', borderRadius: '6px', fontWeight: 700 }}>
                  Code: {vendor.vendorCode}
                </span>
                {vendor.taxId && (
                  <span>Tax ID / GSTIN: <strong>{vendor.taxId}</strong></span>
                )}
                {vendor.registrationNumber && (
                  <span>CIN: <strong>{vendor.registrationNumber}</strong></span>
                )}
                <span>Terms: <strong>{vendor.paymentTerms}</strong></span>
                <span>Currency: <strong>{vendor.currency}</strong></span>
              </div>
            </div>
          </div>

          {/* Lifecycle Action Buttons */}
          <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap' }}>
            <button
              onClick={fetchVendorData}
              title="Refresh Dossier"
              style={{
                padding: '0.6rem 0.9rem',
                background: '#f8fafc',
                border: '1px solid #cbd5e1',
                borderRadius: '8px',
                cursor: 'pointer',
                color: '#334155'
              }}
            >
              <RefreshCw size={16} />
            </button>

            {vendor.status === 'UNDER_REVIEW' && (
              <button
                onClick={() => setStatusModal({ open: true, targetStatus: 'APPROVED', reason: 'Verification criteria successfully satisfied' })}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  padding: '0.6rem 1rem',
                  background: '#16a34a',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '8px',
                  fontWeight: 600,
                  fontSize: '0.825rem',
                  cursor: 'pointer'
                }}
              >
                <CheckCircle2 size={16} /> Approve Vendor
              </button>
            )}

            {vendor.status === 'APPROVED' && (
              <>
                <button
                  onClick={() => setStatusModal({ open: true, targetStatus: 'ON_HOLD', reason: 'Temporary hold pending compliance review' })}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.4rem',
                    padding: '0.6rem 1rem',
                    background: '#f59e0b',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '8px',
                    fontWeight: 600,
                    fontSize: '0.825rem',
                    cursor: 'pointer'
                  }}
                >
                  <PauseCircle size={16} /> Put on Hold
                </button>

                <button
                  onClick={() => setStatusModal({ open: true, targetStatus: 'SUSPENDED', reason: '' })}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.4rem',
                    padding: '0.6rem 1rem',
                    background: '#dc2626',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '8px',
                    fontWeight: 600,
                    fontSize: '0.825rem',
                    cursor: 'pointer'
                  }}
                >
                  <ShieldAlert size={16} /> Suspend Vendor
                </button>
              </>
            )}

            {(vendor.status === 'ON_HOLD' || vendor.status === 'SUSPENDED') && (
              <button
                onClick={() => setStatusModal({ open: true, targetStatus: 'APPROVED', reason: 'Compliance satisfied, lifting restrictions' })}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  padding: '0.6rem 1rem',
                  background: '#2563eb',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '8px',
                  fontWeight: 600,
                  fontSize: '0.825rem',
                  cursor: 'pointer'
                }}
              >
                <PlayCircle size={16} /> Reactivate / Release
              </button>
            )}

            {vendor.status !== 'DEACTIVATED' && vendor.status !== 'SUSPENDED' && (
              <button
                onClick={() => setStatusModal({ open: true, targetStatus: 'DEACTIVATED', reason: 'Commercial discontinuation' })}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  padding: '0.6rem 0.9rem',
                  background: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  color: '#64748b',
                  borderRadius: '8px',
                  fontWeight: 600,
                  fontSize: '0.825rem',
                  cursor: 'pointer'
                }}
              >
                <XCircle size={16} /> Deactivate
              </button>
            )}
          </div>
        </div>

        {/* Categories Bar */}
        <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1.25rem', flexWrap: 'wrap' }}>
          {(vendor.categories || []).map((cat) => (
            <span
              key={cat}
              style={{
                padding: '0.2rem 0.75rem',
                borderRadius: '9999px',
                background: '#eff6ff',
                color: '#1d4ed8',
                fontSize: '0.75rem',
                fontWeight: 700,
                border: '1px solid #bfdbfe'
              }}
            >
              {cat}
            </span>
          ))}
        </div>
      </div>

      {/* Tabs Bar */}
      <div
        style={{
          display: 'flex',
          gap: '0.25rem',
          borderBottom: '2px solid #e2e8f0',
          marginBottom: '1.5rem',
          overflowX: 'auto'
        }}
      >
        {[
          { key: 'overview', label: 'Overview & Profile', icon: Building2 },
          { key: 'contacts', label: `Contacts (${contacts.length})`, icon: Users },
          { key: 'documents', label: `Documents (${documents.length})`, icon: FileText },
          { key: 'verifications', label: `Verification (${verifications.length})`, icon: ShieldCheck },
          { key: 'contracts', label: `Contracts (${contracts.length})`, icon: Award },
          { key: 'performance', label: 'Performance & KPIs', icon: Award },
          { key: 'issues', label: `Issues & Defect Tickets (${issues.length})`, icon: AlertTriangle },
          { key: 'timeline', label: 'Timeline & Messages', icon: History }
        ].map((tab) => {
          const Icon = tab.icon;
          const active = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.8rem 1.25rem',
                border: 'none',
                background: 'transparent',
                color: active ? '#2563eb' : '#64748b',
                fontWeight: active ? 700 : 500,
                fontSize: '0.9rem',
                borderBottom: active ? '3px solid #2563eb' : '3px solid transparent',
                cursor: 'pointer',
                marginBottom: '-2px',
                whiteSpace: 'nowrap'
              }}
            >
              <Icon size={16} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tab Panels */}
      <div>
        {activeTab === 'overview' && (
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1.5rem' }}>
            {/* General Info */}
            <div
              style={{
                background: '#ffffff',
                borderRadius: '12px',
                border: '1px solid #e2e8f0',
                padding: '1.5rem',
                boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
              }}
            >
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, margin: '0 0 1rem 0', color: '#0f172a' }}>
                Master Entity Information
              </h3>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', fontSize: '0.875rem' }}>
                <div>
                  <span style={{ color: '#64748b', display: 'block', fontSize: '0.75rem', fontWeight: 600 }}>Legal Structure</span>
                  <strong style={{ color: '#1e293b' }}>{vendor.legalStructure || 'PRIVATE_LIMITED'}</strong>
                </div>
                <div>
                  <span style={{ color: '#64748b', display: 'block', fontSize: '0.75rem', fontWeight: 600 }}>Website</span>
                  {vendor.website ? (
                    <a href={vendor.website} target="_blank" rel="noopener noreferrer" style={{ color: '#2563eb', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                      {vendor.website} <ExternalLink size={12} />
                    </a>
                  ) : (
                    <span style={{ color: '#94a3b8' }}>Not specified</span>
                  )}
                </div>
                <div>
                  <span style={{ color: '#64748b', display: 'block', fontSize: '0.75rem', fontWeight: 600 }}>Created Date</span>
                  <strong style={{ color: '#1e293b' }}>{new Date(vendor.createdAt).toLocaleDateString()}</strong>
                </div>
                <div>
                  <span style={{ color: '#64748b', display: 'block', fontSize: '0.75rem', fontWeight: 600 }}>Last Updated</span>
                  <strong style={{ color: '#1e293b' }}>{new Date(vendor.updatedAt).toLocaleDateString()}</strong>
                </div>
              </div>

              {vendor.notes && (
                <div style={{ marginTop: '1.5rem', padding: '1rem', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                  <span style={{ color: '#64748b', display: 'block', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', marginBottom: '0.35rem' }}>Internal Operational Notes</span>
                  <div style={{ fontSize: '0.875rem', color: '#334155', lineHeight: 1.5 }}>{vendor.notes}</div>
                </div>
              )}
            </div>

            {/* Quick Metrics Card */}
            <div
              style={{
                background: '#ffffff',
                borderRadius: '12px',
                border: '1px solid #e2e8f0',
                padding: '1.5rem',
                boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
              }}
            >
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, margin: '0 0 1rem 0', color: '#0f172a' }}>
                Operational Status
              </h3>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem', fontSize: '0.875rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '0.5rem', borderBottom: '1px solid #f1f5f9' }}>
                  <span style={{ color: '#64748b' }}>Performance Score</span>
                  <strong style={{ color: '#16a34a', fontSize: '1rem' }}>{vendor.performanceScore || 100} / 100</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '0.5rem', borderBottom: '1px solid #f1f5f9' }}>
                  <span style={{ color: '#64748b' }}>Active Contracts</span>
                  <strong>{contracts.filter((c) => c.status === 'ACTIVE').length}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '0.5rem', borderBottom: '1px solid #f1f5f9' }}>
                  <span style={{ color: '#64748b' }}>Valid Documents</span>
                  <strong>{documents.filter((d) => d.verificationStatus === 'VERIFIED').length}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '0.5rem', borderBottom: '1px solid #f1f5f9' }}>
                  <span style={{ color: '#64748b' }}>Open Issues</span>
                  <strong style={{ color: issues.filter((i) => i.status === 'OPEN').length > 0 ? '#ef4444' : '#1e293b' }}>
                    {issues.filter((i) => i.status === 'OPEN').length}
                  </strong>
                </div>
              </div>

              {vendor.status === 'SUSPENDED' && (
                <div style={{ marginTop: '1.25rem', padding: '0.85rem', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px', color: '#991b1b', fontSize: '0.8rem' }}>
                  <div style={{ fontWeight: 700, marginBottom: '0.2rem' }}>PROCUREMENT RESTRICTION ACTIVE</div>
                  This supplier cannot be selected for new Purchase Orders. Open POs are flagged for review.
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'contacts' && (
          <VendorContactTable vendorId={id} contacts={contacts} onRefresh={fetchVendorData} />
        )}

        {activeTab === 'documents' && (
          <VendorDocumentTable vendorId={id} documents={documents} onRefresh={fetchVendorData} />
        )}

        {activeTab === 'verifications' && (
          <div style={{ background: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0', padding: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <div>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 700, margin: 0, color: '#0f172a' }}>
                  Vendor Verification Audits & Evidence
                </h3>
                <p style={{ margin: '0.2rem 0 0 0', color: '#64748b', fontSize: '0.85rem' }}>
                  Four-eyes verification lifecycle, legal checks, and compliance approvals
                </p>
              </div>
            </div>

            {verifications.length === 0 ? (
              <div style={{ padding: '3rem', textAlign: 'center', color: '#94a3b8' }}>
                <ShieldCheck size={36} style={{ margin: '0 auto 0.5rem auto', opacity: 0.5 }} />
                No formal verification audits logged yet for this vendor.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {verifications.map((v) => (
                  <div key={v._id} style={{ border: '1px solid #e2e8f0', borderRadius: '8px', padding: '1rem', background: '#f8fafc' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                      <div style={{ fontWeight: 700, color: '#1e293b' }}>{v.verificationCode} - {v.verificationType}</div>
                      <VendorVerificationBadge status={v.status} />
                    </div>
                    <div style={{ fontSize: '0.8rem', color: '#64748b', marginBottom: '0.5rem' }}>
                      Requested: {new Date(v.createdAt).toLocaleDateString()}
                      {v.completedAt && ` • Completed: ${new Date(v.completedAt).toLocaleDateString()}`}
                    </div>
                    {v.evidenceItems && v.evidenceItems.length > 0 && (
                      <div style={{ marginTop: '0.5rem', background: '#ffffff', padding: '0.75rem', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
                        <strong style={{ fontSize: '0.8rem', color: '#475569' }}>Evidence Submitted:</strong>
                        <ul style={{ margin: '0.35rem 0 0 1.25rem', padding: 0, fontSize: '0.8rem', color: '#334155' }}>
                          {v.evidenceItems.map((e, idx) => (
                            <li key={idx}><strong>{e.evidenceType}</strong>: {e.notes || e.referenceId} ({e.verified ? 'Verified' : 'Pending'})</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'contracts' && (
          <VendorContractTable vendorId={id} contracts={contracts} onRefresh={fetchVendorData} />
        )}

        {activeTab === 'performance' && (
          <VendorPerformanceChart performanceData={performance} />
        )}

        {activeTab === 'issues' && (
          <VendorIssueTable vendorId={id} issues={issues} onRefresh={fetchVendorData} />
        )}

        {activeTab === 'timeline' && (
          <VendorTimeline vendorId={id} communications={vendor.communications || []} onRefresh={fetchVendorData} />
        )}
      </div>

      {/* Status Transition Modal */}
      {statusModal.open && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15, 23, 42, 0.6)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: '1rem'
          }}
        >
          <div
            style={{
              background: '#ffffff',
              borderRadius: '14px',
              maxWidth: '520px',
              width: '100%',
              padding: '1.75rem',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
              <div
                style={{
                  padding: '0.6rem',
                  borderRadius: '10px',
                  background: statusModal.targetStatus === 'SUSPENDED' ? '#fee2e2' : '#eff6ff',
                  color: statusModal.targetStatus === 'SUSPENDED' ? '#dc2626' : '#2563eb'
                }}
              >
                {statusModal.targetStatus === 'SUSPENDED' ? <ShieldAlert size={24} /> : <AlertCircle size={24} />}
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800, color: '#0f172a' }}>
                  Transition to {statusModal.targetStatus}
                </h3>
                <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.85rem', color: '#64748b' }}>
                  Vendor: {vendor.legalName} ({vendor.vendorCode})
                </p>
              </div>
            </div>

            {statusModal.targetStatus === 'SUSPENDED' && (
              <div style={{ padding: '0.85rem', background: '#fef2f2', borderRadius: '8px', border: '1px solid #fecaca', color: '#991b1b', fontSize: '0.825rem', marginBottom: '1rem' }}>
                <strong>Impact of Suspension:</strong>
                <ul style={{ margin: '0.35rem 0 0 1.25rem', padding: 0 }}>
                  <li>Blocks creation of new Purchase Orders for this vendor.</li>
                  <li>Flags all open/active Purchase Orders with status "SUSPENDED_VENDOR_REVIEW".</li>
                  <li>Logged in the immutable audit trail with timestamp and user ID.</li>
                </ul>
              </div>
            )}

            <form onSubmit={handleStatusChangeSubmit}>
              <div style={{ marginBottom: '1.25rem' }}>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: '#334155', marginBottom: '0.4rem' }}>
                  Audited Justification Reason <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <textarea
                  rows={4}
                  required
                  placeholder="Provide precise compliance or commercial justification..."
                  value={statusModal.reason}
                  onChange={(e) => setStatusModal({ ...statusModal, reason: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid #cbd5e1',
                    borderRadius: '8px',
                    fontSize: '0.875rem',
                    outline: 'none',
                    resize: 'vertical'
                  }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                <button
                  type="button"
                  onClick={() => setStatusModal({ open: false, targetStatus: '', reason: '' })}
                  style={{
                    padding: '0.65rem 1.25rem',
                    background: '#f1f5f9',
                    border: '1px solid #cbd5e1',
                    borderRadius: '8px',
                    fontWeight: 600,
                    fontSize: '0.875rem',
                    cursor: 'pointer',
                    color: '#475569'
                  }}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={statusLoading}
                  style={{
                    padding: '0.65rem 1.5rem',
                    background: statusModal.targetStatus === 'SUSPENDED' ? '#dc2626' : '#2563eb',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '8px',
                    fontWeight: 700,
                    fontSize: '0.875rem',
                    cursor: statusLoading ? 'not-allowed' : 'pointer',
                    opacity: statusLoading ? 0.7 : 1
                  }}
                >
                  {statusLoading ? 'Processing...' : `Confirm ${statusModal.targetStatus}`}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default VendorDetails;
