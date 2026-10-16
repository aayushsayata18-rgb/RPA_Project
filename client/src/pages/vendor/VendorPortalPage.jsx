import React, { useState, useEffect } from 'react';
import {
  Building2,
  FileText,
  Award,
  AlertTriangle,
  CheckCircle2,
  Upload,
  Send,
  Clock,
  TrendingUp,
  ShieldCheck,
  RefreshCw,
  Mail,
  Phone,
  MessageSquare
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import vendorService from '../../services/vendorService';
import { VendorStatusBadge } from '../../components/vendor/VendorStatusBadge';
import { VendorRiskBadge } from '../../components/vendor/VendorRiskBadge';
import { VendorVerificationBadge } from '../../components/vendor/VendorVerificationBadge';
import { VendorDocumentTable } from '../../components/vendor/VendorDocumentTable';
import { VendorContractTable } from '../../components/vendor/VendorContractTable';
import { VendorPerformanceChart } from '../../components/vendor/VendorPerformanceChart';

export const VendorPortalPage = () => {
  const { user } = useAuth();
  const [vendor, setVendor] = useState(null);
  const [documents, setDocuments] = useState([]);
  const [contracts, setContracts] = useState([]);
  const [performance, setPerformance] = useState(null);
  const [issues, setIssues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  // Response to Issue state
  const [respondModal, setRespondModal] = useState({ open: false, issue: null, text: '' });
  const [respondLoading, setRespondLoading] = useState(false);

  const fetchVendorData = async () => {
    try {
      setLoading(true);

      // Determine vendor ID from linked entity or email lookup
      let vId = user?.linkedEntityId;
      if (!vId) {
        const res = await vendorService.getVendors({ limit: 1 });
        const list = (res.data?.data || res.data).vendors || [];
        if (list.length > 0) vId = list[0]._id;
      }

      if (!vId) {
        setLoading(false);
        return;
      }

      const [vRes, docRes, conRes, perfRes, issRes] = await Promise.allSettled([
        vendorService.getVendorById(vId),
        vendorService.getDocuments(vId),
        vendorService.getContracts(vId),
        vendorService.getPerformance(vId),
        vendorService.getIssuesByVendor(vId)
      ]);

      if (vRes.status === 'fulfilled') setVendor(vRes.value.data?.data || vRes.value.data);
      if (docRes.status === 'fulfilled') setDocuments(docRes.value.data?.data || docRes.value.data || []);
      if (conRes.status === 'fulfilled') setContracts(conRes.value.data?.data || conRes.value.data || []);
      if (perfRes.status === 'fulfilled') setPerformance(perfRes.value.data?.data || perfRes.value.data || null);
      if (issRes.status === 'fulfilled') setIssues(issRes.value.data?.data || issRes.value.data || []);
    } catch (err) {
      console.error('Failed to load supplier portal data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVendorData();
  }, [user]);

  const handleIssueResponseSubmit = async (e) => {
    e.preventDefault();
    if (!respondModal.text) return;
    try {
      setRespondLoading(true);
      await vendorService.respondToIssue(respondModal.issue._id, {
        response: respondModal.text
      });
      setRespondModal({ open: false, issue: null, text: '' });
      fetchVendorData();
    } catch (err) {
      alert(err.response?.data?.message || err.message);
    } finally {
      setRespondLoading(false);
    }
  };

  if (loading && !vendor) {
    return (
      <div style={{ padding: '4rem', textAlign: 'center', color: '#64748b' }}>
        <RefreshCw size={32} className="spin" style={{ margin: '0 auto 1rem auto', display: 'block' }} />
        Loading supplier portal...
      </div>
    );
  }

  if (!vendor) {
    return (
      <div style={{ padding: '4rem', textAlign: 'center', color: '#475569' }}>
        <Building2 size={48} style={{ margin: '0 auto 1rem auto', opacity: 0.5 }} />
        <h2>No Linked Supplier Account Found</h2>
        <p>Your user profile is not linked to any active vendor master record.</p>
      </div>
    );
  }

  return (
    <div style={{ padding: '2rem', maxWidth: '1400px', margin: '0 auto', color: '#1e293b' }}>
      {/* Header Profile Banner */}
      <div
        style={{
          background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
          borderRadius: '16px',
          padding: '2rem',
          color: '#ffffff',
          marginBottom: '1.5rem',
          boxShadow: '0 4px 12px rgba(15, 23, 42, 0.15)'
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1.5rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem', flexWrap: 'wrap' }}>
              <span style={{ background: '#2563eb', padding: '0.2rem 0.6rem', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 700 }}>
                SUPPLIER SELF-SERVICE PORTAL
              </span>
              <span style={{ fontSize: '0.85rem', color: '#94a3b8' }}>
                Code: <strong>{vendor.vendorCode}</strong>
              </span>
            </div>

            <h1 style={{ fontSize: '2rem', fontWeight: 800, margin: '0 0 0.5rem 0' }}>
              {vendor.legalName}
            </h1>

            <div style={{ display: 'flex', gap: '1.5rem', fontSize: '0.875rem', color: '#cbd5e1', flexWrap: 'wrap' }}>
              {vendor.taxId && <span>GSTIN / Tax ID: <strong>{vendor.taxId}</strong></span>}
              <span>Payment Terms: <strong>{vendor.paymentTerms}</strong></span>
              <span>Settlement: <strong>{vendor.currency}</strong></span>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
            <VendorStatusBadge status={vendor.status} />
            <VendorVerificationBadge status={vendor.verificationStatus} />
            <button
              onClick={fetchVendorData}
              style={{
                padding: '0.6rem 0.85rem',
                background: 'rgba(255, 255, 255, 0.1)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                borderRadius: '8px',
                color: '#ffffff',
                cursor: 'pointer'
              }}
            >
              <RefreshCw size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div
        style={{
          display: 'flex',
          gap: '0.5rem',
          borderBottom: '2px solid #e2e8f0',
          marginBottom: '1.5rem',
          overflowX: 'auto'
        }}
      >
        {[
          { key: 'overview', label: 'Company Profile & Orders', icon: Building2 },
          { key: 'documents', label: `Compliance Documents (${documents.length})`, icon: FileText },
          { key: 'contracts', label: `Active Contracts (${contracts.length})`, icon: Award },
          { key: 'performance', label: 'Performance Scorecard', icon: TrendingUp },
          { key: 'issues', label: `Open Disputes & Grievances (${issues.length})`, icon: AlertTriangle }
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
      {activeTab === 'overview' && (
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1.5rem' }}>
          <div style={{ background: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0', padding: '1.5rem' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, margin: '0 0 1rem 0' }}>
              Enrolled Business Categories
            </h3>
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '1.5rem' }}>
              {(vendor.categories || []).map((cat) => (
                <span
                  key={cat}
                  style={{
                    padding: '0.35rem 0.85rem',
                    borderRadius: '8px',
                    background: '#eff6ff',
                    color: '#1d4ed8',
                    fontSize: '0.8rem',
                    fontWeight: 700,
                    border: '1px solid #bfdbfe'
                  }}
                >
                  {cat}
                </span>
              ))}
            </div>

            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, margin: '0 0 1rem 0' }}>
              Procurement & Operational Status
            </h3>
            {vendor.status === 'APPROVED' ? (
              <div style={{ padding: '1rem', background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '8px', color: '#166534', fontSize: '0.875rem' }}>
                <div style={{ fontWeight: 700, marginBottom: '0.25rem' }}>Full Procurement Clearance Active</div>
                Your company is actively approved to receive Hospital Purchase Orders, submit RFQ bids, and dispatch inventory.
              </div>
            ) : (
              <div style={{ padding: '1rem', background: '#fffbeb', border: '1px solid #fde68a', borderRadius: '8px', color: '#92400e', fontSize: '0.875rem' }}>
                <div style={{ fontWeight: 700, marginBottom: '0.25rem' }}>Status Notice: {vendor.status}</div>
                Orders may be held or pending four-eyes compliance re-verification. Contact the Hospital Procurement Desk for guidance.
              </div>
            )}
          </div>

          <div style={{ background: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0', padding: '1.5rem' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, margin: '0 0 1rem 0' }}>
              Hospital Contact Liaison
            </h3>
            <div style={{ fontSize: '0.875rem', color: '#475569', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <div>
                <strong>Central Procurement Desk</strong>
                <div style={{ color: '#64748b' }}>procurement@hospital.org</div>
                <div style={{ color: '#64748b' }}>+91 22 2600 4000 (Ext 401)</div>
              </div>
              <div>
                <strong>Accounts Payable & Invoicing</strong>
                <div style={{ color: '#64748b' }}>finance.invoices@hospital.org</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'documents' && (
        <VendorDocumentTable vendorId={vendor._id} documents={documents} onRefresh={fetchVendorData} canVerify={false} canUpload={true} />
      )}

      {activeTab === 'contracts' && (
        <VendorContractTable vendorId={vendor._id} contracts={contracts} onRefresh={fetchVendorData} canManage={false} />
      )}

      {activeTab === 'performance' && (
        <VendorPerformanceChart performanceData={performance} />
      )}

      {activeTab === 'issues' && (
        <div style={{ background: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0', padding: '1.5rem' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, margin: '0 0 1rem 0', color: '#0f172a' }}>
            Discrepancies & Quality Defect Tickets
          </h3>
          {issues.length === 0 ? (
            <div style={{ padding: '3rem', textAlign: 'center', color: '#16a34a' }}>
              <CheckCircle2 size={36} style={{ margin: '0 auto 0.5rem auto' }} />
              Clean Record: No outstanding quality or delivery discrepancies reported.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {issues.map((i) => (
                <div key={i._id} style={{ border: '1px solid #e2e8f0', borderRadius: '8px', padding: '1.25rem', background: '#f8fafc' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                    <div>
                      <div style={{ fontWeight: 700, color: '#0f172a' }}>{i.issueCode}: {i.title}</div>
                      <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{i.category} • Severity: {i.severity}</div>
                    </div>
                    <span style={{ padding: '0.2rem 0.6rem', borderRadius: '9999px', fontSize: '0.75rem', fontWeight: 700, background: '#fef3c7', color: '#92400e' }}>
                      {i.status}
                    </span>
                  </div>
                  <p style={{ fontSize: '0.85rem', color: '#334155', margin: '0.5rem 0' }}>{i.description}</p>

                  {i.vendorResponse && (
                    <div style={{ marginTop: '0.75rem', padding: '0.75rem', background: '#eff6ff', borderRadius: '6px', fontSize: '0.8rem', color: '#1e40af' }}>
                      <strong>Your Submitted Response:</strong> {i.vendorResponse}
                    </div>
                  )}

                  {i.status === 'OPEN' && !i.vendorResponse && (
                    <button
                      onClick={() => setRespondModal({ open: true, issue: i, text: '' })}
                      style={{
                        marginTop: '0.75rem',
                        padding: '0.45rem 1rem',
                        background: '#2563eb',
                        color: '#ffffff',
                        border: 'none',
                        borderRadius: '6px',
                        fontSize: '0.8rem',
                        fontWeight: 600,
                        cursor: 'pointer'
                      }}
                    >
                      Respond to Issue &rarr;
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Response Modal */}
      {respondModal.open && (
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
          <div style={{ background: '#ffffff', borderRadius: '14px', maxWidth: '500px', width: '100%', padding: '1.75rem' }}>
            <h3 style={{ margin: '0 0 0.5rem 0', fontWeight: 800 }}>Submit Supplier Response</h3>
            <p style={{ fontSize: '0.85rem', color: '#64748b', margin: '0 0 1rem 0' }}>
              Ticket: {respondModal.issue?.issueCode} - {respondModal.issue?.title}
            </p>

            <form onSubmit={handleIssueResponseSubmit}>
              <textarea
                rows={4}
                required
                placeholder="Explain dispatch status, courier tracking, replacement batch details, or rectification..."
                value={respondModal.text}
                onChange={(e) => setRespondModal({ ...respondModal, text: e.target.value })}
                style={{ width: '100%', padding: '0.75rem', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '0.875rem', marginBottom: '1.25rem' }}
              />

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                <button
                  type="button"
                  onClick={() => setRespondModal({ open: false, issue: null, text: '' })}
                  style={{ padding: '0.65rem 1.25rem', background: '#f1f5f9', border: '1px solid #cbd5e1', borderRadius: '8px', fontWeight: 600 }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={respondLoading}
                  style={{ padding: '0.65rem 1.5rem', background: '#2563eb', color: '#ffffff', border: 'none', borderRadius: '8px', fontWeight: 700 }}
                >
                  {respondLoading ? 'Submitting...' : 'Send Response'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default VendorPortalPage;
