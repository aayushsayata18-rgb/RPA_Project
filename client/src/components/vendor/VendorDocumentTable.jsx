import React, { useState } from 'react';
import { FileText, Upload, CheckCircle2, XCircle, AlertTriangle, Calendar, ExternalLink } from 'lucide-react';
import { VendorVerificationBadge } from './VendorVerificationBadge';
import vendorService from '../../services/vendorService';

export const VendorDocumentTable = ({ vendorId, documents = [], onRefresh, canVerify = true, canUpload = true }) => {
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    documentType: 'Drug Manufacturing License',
    documentNumber: '',
    title: '',
    issueDate: '',
    expiryDate: '',
    issuer: '',
    fileReference: ''
  });

  const handleUpload = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      await vendorService.uploadDocument(vendorId, formData);
      setShowUploadModal(false);
      setFormData({
        documentType: 'Drug Manufacturing License',
        documentNumber: '',
        title: '',
        issueDate: '',
        expiryDate: '',
        issuer: '',
        fileReference: ''
      });
      if (onRefresh) onRefresh();
    } catch (err) {
      alert(err.response?.data?.message || err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (docId) => {
    const notes = prompt('Enter verification approval notes (optional):', 'Statutory criteria confirmed');
    if (notes === null) return;
    try {
      await vendorService.verifyDocument(vendorId, docId, { notes });
      if (onRefresh) onRefresh();
    } catch (err) {
      alert(err.response?.data?.message || err.message);
    }
  };

  const handleReject = async (docId) => {
    const rejectionReason = prompt('Enter rejection reason:');
    if (!rejectionReason) return;
    try {
      await vendorService.rejectDocument(vendorId, docId, { rejectionReason });
      if (onRefresh) onRefresh();
    } catch (err) {
      alert(err.response?.data?.message || err.message);
    }
  };

  const getExpiryLabel = (expiryDate) => {
    if (!expiryDate) return { text: 'No Expiry', color: 'var(--text-muted)' };
    const now = new Date();
    const expiry = new Date(expiryDate);
    const diffMs = expiry - now;
    const days = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

    if (days < 0) {
      return { text: `Expired (${Math.abs(days)}d ago)`, color: '#ef4444', isAlert: true };
    }
    if (days <= 30) {
      return { text: `Expires in ${days}d`, color: '#f97316', isAlert: true };
    }
    if (days <= 60) {
      return { text: `Expires in ${days}d`, color: '#eab308' };
    }
    return { text: `Valid (${days}d left)`, color: '#10b981' };
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h4 style={{ margin: 0, fontSize: '1rem', fontWeight: 600, color: 'var(--text-primary)' }}>
          Compliance & Regulatory Documents ({documents.length})
        </h4>
        {canUpload && (
          <button
            onClick={() => setShowUploadModal(true)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              padding: '0.4rem 0.8rem',
              borderRadius: '6px',
              border: 'none',
              background: '#38bdf8',
              color: '#0f172a',
              fontWeight: 600,
              fontSize: '0.85rem',
              cursor: 'pointer'
            }}
          >
            <Upload size={14} /> Upload Document
          </button>
        )}
      </div>

      <div style={{ overflowX: 'auto', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.88rem' }}>
          <thead>
            <tr style={{ background: 'var(--bg-secondary)', borderBottom: '1px solid var(--border-color)', color: 'var(--text-secondary)' }}>
              <th style={{ padding: '0.75rem 1rem' }}>Document Type & Details</th>
              <th style={{ padding: '0.75rem 1rem' }}>Document Number</th>
              <th style={{ padding: '0.75rem 1rem' }}>Issuer</th>
              <th style={{ padding: '0.75rem 1rem' }}>Expiry & Validity</th>
              <th style={{ padding: '0.75rem 1rem' }}>Status</th>
              {canVerify && <th style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>Actions</th>}
            </tr>
          </thead>
          <tbody>
            {documents.length === 0 ? (
              <tr>
                <td colSpan={canVerify ? 6 : 5} style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                  No documents on file. Upload mandatory licenses and certificates.
                </td>
              </tr>
            ) : (
              documents.map((d) => {
                const expiryInfo = getExpiryLabel(d.expiryDate);
                return (
                  <tr key={d.vendorDocumentId} style={{ borderBottom: '1px solid var(--border-color)' }}>
                    <td style={{ padding: '0.8rem 1rem' }}>
                      <div style={{ fontWeight: 600, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                        <FileText size={15} style={{ color: '#38bdf8' }} />
                        {d.documentType}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>
                        ID: {d.vendorDocumentId}
                      </div>
                    </td>
                    <td style={{ padding: '0.8rem 1rem', fontWeight: 500, color: 'var(--text-primary)' }}>
                      {d.documentNumber || '—'}
                    </td>
                    <td style={{ padding: '0.8rem 1rem', color: 'var(--text-secondary)' }}>
                      {d.issuer || '—'}
                    </td>
                    <td style={{ padding: '0.8rem 1rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: expiryInfo.color, fontWeight: 600, fontSize: '0.82rem' }}>
                        {expiryInfo.isAlert && <AlertTriangle size={13} />}
                        {expiryInfo.text}
                      </div>
                      {d.expiryDate && (
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                          {new Date(d.expiryDate).toLocaleDateString()}
                        </div>
                      )}
                    </td>
                    <td style={{ padding: '0.8rem 1rem' }}>
                      <VendorVerificationBadge status={d.status} />
                    </td>
                    {canVerify && (
                      <td style={{ padding: '0.8rem 1rem', textAlign: 'right' }}>
                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                          {d.status !== 'VERIFIED' && (
                            <button
                              onClick={() => handleVerify(d.vendorDocumentId)}
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '0.2rem',
                                padding: '0.25rem 0.5rem',
                                borderRadius: '4px',
                                border: '1px solid rgba(16, 185, 129, 0.4)',
                                background: 'rgba(16, 185, 129, 0.12)',
                                color: '#10b981',
                                fontSize: '0.75rem',
                                cursor: 'pointer',
                                fontWeight: 600
                              }}
                              title="Verify Document"
                            >
                              <CheckCircle2 size={13} /> Verify
                            </button>
                          )}
                          {d.status !== 'REJECTED' && (
                            <button
                              onClick={() => handleReject(d.vendorDocumentId)}
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '0.2rem',
                                padding: '0.25rem 0.5rem',
                                borderRadius: '4px',
                                border: '1px solid rgba(239, 68, 68, 0.4)',
                                background: 'rgba(239, 68, 68, 0.12)',
                                color: '#ef4444',
                                fontSize: '0.75rem',
                                cursor: 'pointer',
                                fontWeight: 600
                              }}
                              title="Reject Document"
                            >
                              <XCircle size={13} /> Reject
                            </button>
                          )}
                        </div>
                      </td>
                    )}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Upload Document Modal */}
      {showUploadModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.6)',
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
              borderRadius: '12px',
              border: '1px solid var(--border-color)',
              width: '100%',
              maxWidth: '480px',
              padding: '1.5rem',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.5)'
            }}
          >
            <h3 style={{ margin: '0 0 1rem 0', fontSize: '1.1rem', fontWeight: 600 }}>Upload Vendor Document</h3>
            <form onSubmit={handleUpload} style={{ display: 'flex', flexDirection: 'column', gap: '0.9rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.3rem' }}>
                  Document Type *
                </label>
                <select
                  value={formData.documentType}
                  onChange={(e) => setFormData({ ...formData, documentType: e.target.value })}
                  style={{ width: '100%', padding: '0.55rem', borderRadius: '6px', border: '1px solid var(--border-color)', background: 'var(--bg-input)', color: 'var(--text-primary)' }}
                >
                  <option value="Drug Manufacturing License">Drug Manufacturing License</option>
                  <option value="GST Registration Certificate">GST Registration Certificate</option>
                  <option value="ISO 9001:2015 Quality Certificate">ISO 9001:2015 Quality Certificate</option>
                  <option value="Medical Device Manufacturing License">Medical Device Manufacturing License</option>
                  <option value="Biomedical Waste Handler Authorization">Biomedical Waste Handler Authorization</option>
                  <option value="Business Registration Certificate">Business Registration Certificate</option>
                  <option value="Quality & Sterile Barrier Certificate">Quality & Sterile Barrier Certificate</option>
                  <option value="Bank Account Verification Cheque">Bank Account Verification Cheque</option>
                  <option value="Other Compliance Certificate">Other Compliance Certificate</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.3rem' }}>
                  Document / Certificate Number
                </label>
                <input
                  type="text"
                  placeholder="e.g. LIC-MH-2024-9988"
                  value={formData.documentNumber}
                  onChange={(e) => setFormData({ ...formData, documentNumber: e.target.value })}
                  style={{ width: '100%', padding: '0.55rem', borderRadius: '6px', border: '1px solid var(--border-color)', background: 'var(--bg-input)', color: 'var(--text-primary)' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.8rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.3rem' }}>
                    Issue Date
                  </label>
                  <input
                    type="date"
                    value={formData.issueDate}
                    onChange={(e) => setFormData({ ...formData, issueDate: e.target.value })}
                    style={{ width: '100%', padding: '0.55rem', borderRadius: '6px', border: '1px solid var(--border-color)', background: 'var(--bg-input)', color: 'var(--text-primary)' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.3rem' }}>
                    Expiry Date
                  </label>
                  <input
                    type="date"
                    value={formData.expiryDate}
                    onChange={(e) => setFormData({ ...formData, expiryDate: e.target.value })}
                    style={{ width: '100%', padding: '0.55rem', borderRadius: '6px', border: '1px solid var(--border-color)', background: 'var(--bg-input)', color: 'var(--text-primary)' }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.3rem' }}>
                  Issuing Regulatory Body
                </label>
                <input
                  type="text"
                  placeholder="e.g. State FDA / CDSCO / PCB"
                  value={formData.issuer}
                  onChange={(e) => setFormData({ ...formData, issuer: e.target.value })}
                  style={{ width: '100%', padding: '0.55rem', borderRadius: '6px', border: '1px solid var(--border-color)', background: 'var(--bg-input)', color: 'var(--text-primary)' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.3rem' }}>
                  Document Cloud / Local Reference URI
                </label>
                <input
                  type="text"
                  placeholder="https://docs.hospital.internal/..."
                  value={formData.fileReference}
                  onChange={(e) => setFormData({ ...formData, fileReference: e.target.value })}
                  style={{ width: '100%', padding: '0.55rem', borderRadius: '6px', border: '1px solid var(--border-color)', background: 'var(--bg-input)', color: 'var(--text-primary)' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
                <button
                  type="button"
                  onClick={() => setShowUploadModal(false)}
                  style={{ padding: '0.5rem 1rem', borderRadius: '6px', border: '1px solid var(--border-color)', background: 'transparent', color: 'var(--text-secondary)', cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  style={{ padding: '0.5rem 1rem', borderRadius: '6px', border: 'none', background: '#38bdf8', color: '#0f172a', fontWeight: 600, cursor: 'pointer' }}
                >
                  {loading ? 'Uploading...' : 'Submit Document'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
