import React, { useState, useEffect } from 'react';
import {
  FileText,
  Download,
  Eye,
  ShieldCheck,
  Calendar,
  Lock,
  Search,
  RotateCw,
  FolderOpen
} from 'lucide-react';
import documentClientService from '../../services/documentClientService';
import DocumentStatusBadge from '../../components/documents/DocumentStatusBadge';
import DocumentDownloadButton from '../../components/documents/DocumentDownloadButton';
import DocumentViewer from '../../components/documents/DocumentViewer';

export const PatientDocuments = () => {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [selectedDocId, setSelectedDocId] = useState(null);
  const [isViewerOpen, setIsViewerOpen] = useState(false);

  useEffect(() => {
    loadPatientDocuments();
  }, []);

  const loadPatientDocuments = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await documentClientService.getPatientDocuments();
      setDocuments(res.data || []);
    } catch (err) {
      setError(err.message || 'Failed to retrieve your patient medical documents.');
    } finally {
      setLoading(false);
    }
  };

  const filteredDocs = documents.filter(doc => {
    if (!search) return true;
    const term = search.toLowerCase();
    return (
      (doc.title && doc.title.toLowerCase().includes(term)) ||
      (doc.documentType && doc.documentType.toLowerCase().includes(term)) ||
      (doc.documentId && doc.documentId.toLowerCase().includes(term))
    );
  });

  const openViewer = (id) => {
    setSelectedDocId(id);
    setIsViewerOpen(true);
  };

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-primary-700 to-indigo-800 text-white rounded-2xl p-6 shadow-md relative overflow-hidden">
        <div className="relative z-10 max-w-2xl">
          <span className="inline-flex items-center text-xs font-semibold uppercase tracking-wider bg-white/20 px-2.5 py-1 rounded-full text-white/90 mb-2">
            <ShieldCheck className="w-3.5 h-3.5 mr-1 text-emerald-300" />
            Verified & Certified Patient Records
          </span>
          <h1 className="text-2xl font-bold tracking-tight">
            My Medical & Billing Documents
          </h1>
          <p className="text-sm text-primary-100 mt-1">
            Access your finalized discharge summaries, verified laboratory reports, invoices, and official payment receipts anytime.
          </p>
        </div>
      </div>

      {/* Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center space-x-3">
        <Search className="w-5 h-5 text-slate-400" />
        <input
          type="text"
          placeholder="Search by document title, lab test, invoice or document ID..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="flex-1 text-sm bg-transparent border-none focus:outline-none focus:ring-0 text-slate-800"
        />
        {search && (
          <button
            onClick={() => setSearch('')}
            className="text-xs text-slate-400 hover:text-slate-600 px-2 py-1"
          >
            Clear
          </button>
        )}
      </div>

      {/* Document List */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
          <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
            Available Documents ({filteredDocs.length})
          </h2>
          <span className="text-xs text-slate-500 flex items-center">
            <Lock className="w-3.5 h-3.5 mr-1 text-slate-400" />
            Protected by Patient Medical Privacy (RBAC)
          </span>
        </div>

        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center text-slate-500 text-sm">
            <RotateCw className="w-8 h-8 animate-spin text-primary-600 mb-2" />
            Loading your medical documents...
          </div>
        ) : error ? (
          <div className="p-8 text-center text-rose-600 bg-rose-50/50">
            {error}
          </div>
        ) : filteredDocs.length === 0 ? (
          <div className="py-16 text-center text-slate-500">
            <FolderOpen className="w-12 h-12 mx-auto mb-2 text-slate-400" />
            <div className="font-semibold text-slate-700">No Released Documents Found</div>
            <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
              Documents are automatically published here once clinical verification and doctor release approvals are finalized.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {filteredDocs.map(doc => (
              <div
                key={doc.documentId}
                className="p-5 hover:bg-slate-50 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div className="flex items-start space-x-3.5">
                  <div className="p-2.5 bg-primary-50 text-primary-700 rounded-xl flex-shrink-0 mt-0.5">
                    <FileText className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="flex items-center space-x-2">
                      <h3 className="font-semibold text-slate-900 text-base">
                        {doc.title}
                      </h3>
                      <DocumentStatusBadge status={doc.status} />
                    </div>

                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500 mt-1 font-mono">
                      <span>Doc ID: {doc.documentId}</span>
                      <span>•</span>
                      <span className="font-sans font-medium text-slate-700">{doc.documentType}</span>
                      <span>•</span>
                      <span className="flex items-center font-sans text-slate-500">
                        <Calendar className="w-3.5 h-3.5 mr-1" />
                        {new Date(doc.releasedAt || doc.generatedAt || doc.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-2 sm:self-center">
                  <button
                    onClick={() => openViewer(doc.documentId)}
                    className="inline-flex items-center px-3 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 shadow-sm transition-colors"
                  >
                    <Eye className="w-3.5 h-3.5 mr-1.5" />
                    View
                  </button>

                  <DocumentDownloadButton
                    documentId={doc.documentId}
                    fileName={`${doc.title || doc.documentId}.pdf`}
                    variant="primary"
                  >
                    Download PDF
                  </DocumentDownloadButton>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Patient Document Details Modal */}
      <DocumentViewer
        documentId={selectedDocId}
        isOpen={isViewerOpen}
        onClose={() => setIsViewerOpen(false)}
        canApprove={false}
        canRelease={false}
        canRegenerate={false}
      />
    </div>
  );
};

export default PatientDocuments;
