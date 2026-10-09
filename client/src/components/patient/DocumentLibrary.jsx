import React, { useState } from 'react';
import {
  FileText,
  Download,
  Eye,
  ShieldCheck,
  Calendar,
  Layers,
  Search,
  ExternalLink,
  X,
  Lock
} from 'lucide-react';
import patientRecordService from '../../services/patientRecordService';

export const DocumentLibrary = ({ documents = [], categories = {}, patientId, onRefresh }) => {
  const [activeTab, setActiveTab] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [previewDoc, setPreviewDoc] = useState(null);
  const [downloadingId, setDownloadingId] = useState(null);

  const handleDownload = async (doc) => {
    try {
      setDownloadingId(doc.documentId);
      const res = await patientRecordService.downloadDocument(doc.documentId);
      if (res.data?.success && res.data.data) {
        const item = res.data.data;
        if (item.htmlContent) {
          // Open formatted document printable view
          const win = window.open('', '_blank');
          win.document.write(`
            <html>
              <head>
                <title>${item.title}</title>
                <style>
                  body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; padding: 2rem; color: #1e293b; }
                  .header { border-bottom: 2px solid #0284c7; padding-bottom: 1rem; margin-bottom: 1.5rem; display: flex; justify-content: space-between; align-items: center; }
                  .badge { background: #e0f2fe; color: #0284c7; padding: 0.3rem 0.6rem; border-radius: 4px; font-weight: bold; font-size: 0.8rem; }
                  .meta { margin-top: 2rem; border-top: 1px solid #e2e8f0; padding-top: 1rem; font-size: 0.8rem; color: #64748b; }
                </style>
              </head>
              <body>
                <div class="header">
                  <div>
                    <h2>HOSPITAL ADMINISTRATIVE RPA PLATFORM</h2>
                    <h3>${item.title}</h3>
                  </div>
                  <span class="badge">OFFICIAL VERIFIED DOCUMENT</span>
                </div>
                ${item.htmlContent}
                <div class="meta">
                  <p>Document ID: ${item.documentId} | Generated At: ${new Date(item.createdAt).toLocaleString()}</p>
                </div>
              </body>
            </html>
          `);
          win.document.close();
          win.focus();
        } else if (item.fileUrl) {
          window.open(item.fileUrl, '_blank');
        }
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Error downloading authorized document.');
    } finally {
      setDownloadingId(null);
    }
  };

  const getFilteredDocs = () => {
    let list = documents;
    if (activeTab === 'ADMINISTRATIVE') list = categories.ADMINISTRATIVE || [];
    else if (activeTab === 'CLINICAL') list = categories.CLINICAL || [];
    else if (activeTab === 'DISCHARGE') list = categories.DISCHARGE || [];
    else if (activeTab === 'INSURANCE') list = categories.INSURANCE || [];

    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      list = list.filter(
        (d) =>
          d.title.toLowerCase().includes(q) ||
          d.documentType.toLowerCase().includes(q) ||
          d.documentId.toLowerCase().includes(q)
      );
    }
    return list;
  };

  const displayedDocs = getFilteredDocs();

  return (
    <div
      style={{
        background: 'var(--bg-card, #1e293b)',
        borderRadius: '16px',
        padding: '1.5rem',
        border: '1px solid var(--border-color, rgba(255,255,255,0.08))',
        boxShadow: '0 8px 24px rgba(0,0,0,0.2)'
      }}
    >
      {/* Header */}
      <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
        <div>
          <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: '700', color: 'var(--text-primary, #f8fafc)' }}>
            Patient Document Repository
          </h3>
          <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.85rem', color: 'var(--text-secondary, #94a3b8)' }}>
            Centralized digital archive of receipts, clinical reports, discharge papers, and insurance files
          </p>
        </div>

        {/* Search */}
        <div style={{ position: 'relative' }}>
          <Search size={15} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: '#64748b' }} />
          <input
            type="text"
            placeholder="Search documents..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              background: 'rgba(0,0,0,0.25)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '8px',
              padding: '0.45rem 0.75rem 0.45rem 2.2rem',
              color: 'var(--text-primary, #f8fafc)',
              fontSize: '0.85rem',
              outline: 'none',
              width: '200px'
            }}
          />
        </div>
      </div>

      {/* Category Filter Tabs */}
      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '1.25rem', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '0.75rem' }}>
        {[
          { id: 'ALL', label: 'All Documents', count: documents.length },
          { id: 'CLINICAL', label: 'Clinical Reports', count: categories.CLINICAL?.length || 0 },
          { id: 'DISCHARGE', label: 'Discharge Papers', count: categories.DISCHARGE?.length || 0 },
          { id: 'ADMINISTRATIVE', label: 'Invoices & Receipts', count: categories.ADMINISTRATIVE?.length || 0 },
          { id: 'INSURANCE', label: 'Insurance & Claims', count: categories.INSURANCE?.length || 0 }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              background: activeTab === tab.id ? 'rgba(56, 189, 248, 0.15)' : 'transparent',
              color: activeTab === tab.id ? '#38bdf8' : 'var(--text-secondary, #94a3b8)',
              border: activeTab === tab.id ? '1px solid rgba(56, 189, 248, 0.3)' : '1px solid transparent',
              borderRadius: '8px',
              padding: '0.4rem 0.8rem',
              fontSize: '0.85rem',
              fontWeight: '500',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem'
            }}
          >
            <span>{tab.label}</span>
            <span
              style={{
                background: activeTab === tab.id ? '#38bdf8' : 'rgba(255,255,255,0.08)',
                color: activeTab === tab.id ? '#0f172a' : 'var(--text-secondary, #94a3b8)',
                borderRadius: '10px',
                padding: '0.1rem 0.4rem',
                fontSize: '0.7rem',
                fontWeight: '700'
              }}
            >
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {/* Document Grid */}
      {displayedDocs.length === 0 ? (
        <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted, #64748b)' }}>
          No documents found in this section.
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1rem' }}>
          {displayedDocs.map((doc) => (
            <div
              key={doc.documentId}
              style={{
                background: 'rgba(255, 255, 255, 0.03)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                borderRadius: '12px',
                padding: '1.2rem',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                transition: 'transform 0.2s, box-shadow 0.2s'
              }}
            >
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.6rem' }}>
                  <span
                    style={{
                      background: 'rgba(56, 189, 248, 0.12)',
                      color: '#38bdf8',
                      padding: '0.15rem 0.5rem',
                      borderRadius: '4px',
                      fontSize: '0.7rem',
                      fontWeight: '700'
                    }}
                  >
                    {doc.documentType}
                  </span>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted, #64748b)' }}>
                    v{doc.version || 1}
                  </span>
                </div>

                <h4 style={{ margin: '0 0 0.4rem 0', fontSize: '0.95rem', fontWeight: '600', color: 'var(--text-primary, #f8fafc)', lineHeight: '1.3' }}>
                  {doc.title}
                </h4>

                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary, #94a3b8)', display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '1rem' }}>
                  <Calendar size={13} color="#64748b" />
                  <span>{new Date(doc.createdAt).toLocaleDateString()}</span>
                  <span>• ID: {doc.documentId}</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', gap: '0.5rem', paddingTop: '0.75rem', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                <button
                  onClick={() => setPreviewDoc(doc)}
                  style={{
                    flex: 1,
                    background: 'rgba(255,255,255,0.06)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    color: 'var(--text-primary, #f8fafc)',
                    borderRadius: '6px',
                    padding: '0.45rem',
                    fontSize: '0.8rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.35rem',
                    cursor: 'pointer'
                  }}
                >
                  <Eye size={14} />
                  <span>Preview</span>
                </button>

                <button
                  onClick={() => handleDownload(doc)}
                  disabled={downloadingId === doc.documentId}
                  style={{
                    flex: 1,
                    background: 'linear-gradient(135deg, #0284c7, #0369a1)',
                    border: 'none',
                    color: '#fff',
                    borderRadius: '6px',
                    padding: '0.45rem',
                    fontSize: '0.8rem',
                    fontWeight: '600',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.35rem',
                    cursor: 'pointer',
                    opacity: downloadingId === doc.documentId ? 0.6 : 1
                  }}
                >
                  <Download size={14} />
                  <span>{downloadingId === doc.documentId ? 'Downloading...' : 'Download'}</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Preview Modal */}
      {previewDoc && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.7)',
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
              background: '#0f172a',
              border: '1px solid rgba(255,255,255,0.15)',
              borderRadius: '16px',
              width: '100%',
              maxWidth: '700px',
              maxHeight: '85vh',
              display: 'flex',
              flexDirection: 'column',
              boxShadow: '0 20px 40px rgba(0,0,0,0.5)'
            }}
          >
            {/* Modal Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1.25rem 1.5rem', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: '700', color: '#f8fafc' }}>
                  {previewDoc.title}
                </h3>
                <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                  Doc ID: {previewDoc.documentId} • Type: {previewDoc.documentType}
                </span>
              </div>
              <button
                onClick={() => setPreviewDoc(null)}
                style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: '0.25rem' }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Body */}
            <div style={{ padding: '1.5rem', overflowY: 'auto', flex: 1, color: '#e2e8f0', background: '#1e293b' }}>
              {previewDoc.htmlContent ? (
                <div dangerouslySetInnerHTML={{ __html: previewDoc.htmlContent }} />
              ) : (
                <div style={{ padding: '2rem', textAlign: 'center', color: '#94a3b8' }}>
                  <FileText size={48} color="#38bdf8" style={{ marginBottom: '1rem' }} />
                  <p>Digital preview ready for download.</p>
                  <p style={{ fontSize: '0.8rem' }}>File Location: {previewDoc.fileUrl || 'Secure Server Storage'}</p>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', padding: '1rem 1.5rem', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
              <button
                onClick={() => setPreviewDoc(null)}
                style={{
                  background: 'rgba(255,255,255,0.08)',
                  border: 'none',
                  color: '#e2e8f0',
                  padding: '0.5rem 1rem',
                  borderRadius: '6px',
                  cursor: 'pointer'
                }}
              >
                Close
              </button>
              <button
                onClick={() => {
                  handleDownload(previewDoc);
                  setPreviewDoc(null);
                }}
                style={{
                  background: '#0284c7',
                  border: 'none',
                  color: '#fff',
                  padding: '0.5rem 1.25rem',
                  borderRadius: '6px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.4rem'
                }}
              >
                <Download size={15} />
                <span>Download Document</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DocumentLibrary;
