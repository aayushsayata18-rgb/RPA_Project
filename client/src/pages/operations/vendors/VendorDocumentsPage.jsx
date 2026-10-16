import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  FileText,
  AlertTriangle,
  CheckCircle2,
  Clock,
  RefreshCw,
  Search,
  ExternalLink,
  ShieldCheck,
  Calendar,
  Building2
} from 'lucide-react';
import vendorService from '../../../services/vendorService';
import { VendorVerificationBadge } from '../../../components/vendor/VendorVerificationBadge';

export const VendorDocumentsPage = () => {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [scanning, setScanning] = useState(false);
  const [scanResult, setScanResult] = useState(null);
  const [filterStatus, setFilterStatus] = useState('');
  const [filterDays, setFilterDays] = useState(30);
  const [searchTerm, setSearchTerm] = useState('');

  const fetchDocuments = async () => {
    try {
      setLoading(true);
      // Fetch stats to get expiry report
      const expiryRes = await vendorService.checkExpiry(filterDays);
      const expiryData = expiryRes.data?.data || expiryRes.data;
      setScanResult(expiryData);

      // Also get all vendors to gather documents across vendors
      const vRes = await vendorService.getVendors({ limit: 50 });
      const vendorsList = (vRes.data?.data || vRes.data).vendors || [];

      // Concurrently fetch documents for each vendor
      const docPromises = vendorsList.map(async (v) => {
        try {
          const dRes = await vendorService.getDocuments(v._id);
          const docs = dRes.data?.data || dRes.data || [];
          return docs.map((doc) => ({ ...doc, vendorName: v.legalName, vendorCode: v.vendorCode }));
        } catch {
          return [];
        }
      });

      const allDocsNested = await Promise.all(docPromises);
      setDocuments(allDocsNested.flat());
    } catch (err) {
      console.error('Failed to load compliance documents:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDocuments();
  }, [filterDays]);

  const handleRunScan = async () => {
    try {
      setScanning(true);
      const res = await vendorService.checkExpiry(filterDays);
      const data = res.data?.data || res.data;
      setScanResult(data);
      alert(`Compliance Scan Complete!\nExpiring within ${filterDays} days: ${data.expiringSoonCount || 0}\nExpired: ${data.expiredCount || 0}`);
      fetchDocuments();
    } catch (err) {
      alert(err.response?.data?.message || err.message);
    } finally {
      setScanning(false);
    }
  };

  const filteredDocuments = documents.filter((doc) => {
    const matchesSearch =
      doc.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doc.documentType?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doc.vendorName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doc.vendorCode?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = filterStatus ? doc.verificationStatus === filterStatus : true;
    return matchesSearch && matchesStatus;
  });

  return (
    <div style={{ padding: '2rem', maxWidth: '1400px', margin: '0 auto', color: '#1e293b' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.75rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{ padding: '0.6rem', borderRadius: '10px', background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)', color: '#fff' }}>
              <FileText size={24} />
            </div>
            <div>
              <h1 style={{ fontSize: '1.75rem', fontWeight: 800, margin: 0, color: '#0f172a' }}>
                Vendor Compliance & Document Expiry
              </h1>
              <p style={{ margin: '0.2rem 0 0 0', color: '#64748b', fontSize: '0.9rem' }}>
                Regulatory licenses, GMP certificates, tax filings & automated expiry alerts
              </p>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button
            onClick={fetchDocuments}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.65rem 1.1rem',
              background: '#f8fafc',
              border: '1px solid #cbd5e1',
              borderRadius: '8px',
              fontSize: '0.875rem',
              fontWeight: 600,
              cursor: 'pointer',
              color: '#334155'
            }}
          >
            <RefreshCw size={16} className={loading ? 'spin' : ''} />
            Refresh
          </button>

          <button
            onClick={handleRunScan}
            disabled={scanning}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.65rem 1.25rem',
              background: '#0284c7',
              color: '#ffffff',
              border: 'none',
              borderRadius: '8px',
              fontSize: '0.875rem',
              fontWeight: 700,
              cursor: scanning ? 'not-allowed' : 'pointer',
              boxShadow: '0 2px 4px rgba(2, 132, 199, 0.25)',
              opacity: scanning ? 0.7 : 1
            }}
          >
            <Clock size={16} />
            {scanning ? 'Auditing Expiry...' : `Run ${filterDays}-Day Expiry Audit`}
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1.25rem', marginBottom: '1.5rem' }}>
        <div style={{ background: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0', padding: '1.25rem', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: '#64748b', fontSize: '0.85rem', fontWeight: 600 }}>
            <span>Total Documents Registered</span>
            <FileText size={18} color="#2563eb" />
          </div>
          <div style={{ fontSize: '1.85rem', fontWeight: 800, color: '#0f172a', marginTop: '0.5rem' }}>
            {documents.length}
          </div>
        </div>

        <div style={{ background: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0', padding: '1.25rem', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: '#64748b', fontSize: '0.85rem', fontWeight: 600 }}>
            <span>Verified Compliant</span>
            <CheckCircle2 size={18} color="#16a34a" />
          </div>
          <div style={{ fontSize: '1.85rem', fontWeight: 800, color: '#16a34a', marginTop: '0.5rem' }}>
            {documents.filter((d) => d.verificationStatus === 'VERIFIED').length}
          </div>
        </div>

        <div style={{ background: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0', padding: '1.25rem', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: '#64748b', fontSize: '0.85rem', fontWeight: 600 }}>
            <span>Expiring Soon (Alerts)</span>
            <Clock size={18} color="#f59e0b" />
          </div>
          <div style={{ fontSize: '1.85rem', fontWeight: 800, color: '#f59e0b', marginTop: '0.5rem' }}>
            {scanResult?.expiringSoonCount || 0}
          </div>
        </div>

        <div style={{ background: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0', padding: '1.25rem', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: '#64748b', fontSize: '0.85rem', fontWeight: 600 }}>
            <span>Expired Certificates</span>
            <AlertTriangle size={18} color="#ef4444" />
          </div>
          <div style={{ fontSize: '1.85rem', fontWeight: 800, color: '#ef4444', marginTop: '0.5rem' }}>
            {scanResult?.expiredCount || 0}
          </div>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div style={{ background: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0', padding: '1.25rem', marginBottom: '1.5rem', display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ position: 'relative', flex: '1 1 300px' }}>
          <Search size={18} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
          <input
            type="text"
            placeholder="Search documents by title, type, or supplier..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ width: '100%', padding: '0.65rem 0.75rem 0.65rem 2.4rem', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '0.875rem' }}
          />
        </div>

        <div style={{ minWidth: '180px' }}>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            style={{ width: '100%', padding: '0.65rem 0.75rem', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '0.875rem', background: '#ffffff' }}
          >
            <option value="">All Verification Statuses</option>
            <option value="VERIFIED">VERIFIED</option>
            <option value="PENDING_VERIFICATION">PENDING_VERIFICATION</option>
            <option value="REJECTED">REJECTED</option>
            <option value="EXPIRED">EXPIRED</option>
          </select>
        </div>

        <div style={{ minWidth: '160px' }}>
          <select
            value={filterDays}
            onChange={(e) => setFilterDays(Number(e.target.value))}
            style={{ width: '100%', padding: '0.65rem 0.75rem', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '0.875rem', background: '#ffffff' }}
          >
            <option value={30}>Audit Window: 30 Days</option>
            <option value={60}>Audit Window: 60 Days</option>
            <option value={90}>Audit Window: 90 Days</option>
          </select>
        </div>
      </div>

      {/* Documents Table */}
      <div style={{ background: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
          <thead>
            <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#475569', fontWeight: 600 }}>
              <th style={{ padding: '0.9rem 1.25rem' }}>Supplier Entity</th>
              <th style={{ padding: '0.9rem 1.25rem' }}>Document Type & Title</th>
              <th style={{ padding: '0.9rem 1.25rem' }}>License / Doc No.</th>
              <th style={{ padding: '0.9rem 1.25rem' }}>Expiry Date</th>
              <th style={{ padding: '0.9rem 1.25rem' }}>Verification</th>
              <th style={{ padding: '0.9rem 1.25rem', textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={6} style={{ padding: '3rem', textAlign: 'center', color: '#64748b' }}>
                  <RefreshCw size={24} className="spin" style={{ margin: '0 auto 0.5rem auto', display: 'block' }} />
                  Loading cross-vendor compliance registry...
                </td>
              </tr>
            ) : filteredDocuments.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ padding: '3rem', textAlign: 'center', color: '#94a3b8' }}>
                  <FileText size={36} style={{ margin: '0 auto 0.5rem auto', display: 'block', opacity: 0.4 }} />
                  No compliance documents found matching your filters.
                </td>
              </tr>
            ) : (
              filteredDocuments.map((doc) => {
                const isExpired = doc.expiryDate && new Date(doc.expiryDate) < new Date();
                const daysRemaining = doc.expiryDate ? Math.ceil((new Date(doc.expiryDate) - new Date()) / (1000 * 60 * 60 * 24)) : null;
                const isExpiringSoon = daysRemaining !== null && daysRemaining >= 0 && daysRemaining <= filterDays;

                return (
                  <tr key={doc._id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '1rem 1.25rem' }}>
                      <Link to={`/operations/vendors/${doc.vendorId}`} style={{ fontWeight: 700, color: '#1d4ed8', textDecoration: 'none' }}>
                        {doc.vendorName}
                      </Link>
                      <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{doc.vendorCode}</div>
                    </td>

                    <td style={{ padding: '1rem 1.25rem' }}>
                      <div style={{ fontWeight: 600, color: '#1e293b' }}>{doc.title || doc.documentType}</div>
                      <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{doc.documentType}</div>
                    </td>

                    <td style={{ padding: '1rem 1.25rem', color: '#334155', fontWeight: 500 }}>
                      {doc.documentNumber || 'N/A'}
                    </td>

                    <td style={{ padding: '1rem 1.25rem' }}>
                      {doc.expiryDate ? (
                        <div>
                          <span style={{ fontWeight: 600, color: isExpired ? '#ef4444' : isExpiringSoon ? '#d97706' : '#1e293b' }}>
                            {new Date(doc.expiryDate).toLocaleDateString()}
                          </span>
                          {isExpired && (
                            <span style={{ display: 'block', fontSize: '0.7rem', color: '#ef4444', fontWeight: 700 }}>
                              EXPIRED
                            </span>
                          )}
                          {isExpiringSoon && (
                            <span style={{ display: 'block', fontSize: '0.7rem', color: '#d97706', fontWeight: 700 }}>
                              Expires in {daysRemaining} days
                            </span>
                          )}
                        </div>
                      ) : (
                        <span style={{ color: '#94a3b8' }}>Perpetual / No Expiry</span>
                      )}
                    </td>

                    <td style={{ padding: '1rem 1.25rem' }}>
                      <VendorVerificationBadge status={doc.verificationStatus} />
                    </td>

                    <td style={{ padding: '1rem 1.25rem', textAlign: 'right' }}>
                      <Link
                        to={`/operations/vendors/${doc.vendorId}`}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.35rem',
                          padding: '0.45rem 0.85rem',
                          background: '#f1f5f9',
                          border: '1px solid #cbd5e1',
                          borderRadius: '6px',
                          color: '#1e293b',
                          fontSize: '0.8rem',
                          fontWeight: 600,
                          textDecoration: 'none'
                        }}
                      >
                        Inspect Dossier &rarr;
                      </Link>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default VendorDocumentsPage;
