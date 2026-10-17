import React, { useState, useEffect } from 'react';
import {
  FileText,
  Search,
  Filter,
  Download,
  Eye,
  History,
  UploadCloud,
  CheckCircle2,
  Clock,
  AlertTriangle,
  RotateCw,
  ShieldCheck,
  Archive,
  Layers,
  FileCheck2,
  Plus
} from 'lucide-react';
import documentClientService from '../../../services/documentClientService';
import DocumentStatusBadge from '../../../components/documents/DocumentStatusBadge';
import DocumentDownloadButton from '../../../components/documents/DocumentDownloadButton';
import DocumentViewer from '../../../components/documents/DocumentViewer';
import DocumentVersionHistory from '../../../components/documents/DocumentVersionHistory';
import DocumentUploadModal from '../../../components/documents/DocumentUploadModal';

export const DocumentDashboard = () => {
  const [documents, setDocuments] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [status, setStatus] = useState('');
  const [documentType, setDocumentType] = useState('');

  // Modals state
  const [selectedDocId, setSelectedDocId] = useState(null);
  const [isViewerOpen, setIsViewerOpen] = useState(false);
  const [historyDocId, setHistoryDocId] = useState(null);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [maintenanceRunning, setMaintenanceRunning] = useState(false);

  useEffect(() => {
    loadData();
  }, [category, status, documentType]);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [docsRes, statsRes] = await Promise.all([
        documentClientService.getDocuments({
          category: category || undefined,
          status: status || undefined,
          documentType: documentType || undefined,
          search: search || undefined
        }),
        documentClientService.getStats().catch(() => ({ data: null }))
      ]);

      setDocuments(docsRes.data || []);
      if (statsRes?.data) setStats(statsRes.data);
    } catch (err) {
      setError(err.message || 'Failed to load documents');
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    loadData();
  };

  const handleRunIntegrityCheck = async () => {
    if (!window.confirm('Run background SHA-256 integrity checksum verification across documents?')) return;
    setMaintenanceRunning(true);
    try {
      const res = await documentClientService.runIntegrityCheck();
      alert(`Integrity Check Finished: ${res.data.passed}/${res.data.totalChecked} files verified successfully!`);
      loadData();
    } catch (err) {
      alert(`Integrity Check Error: ${err.message}`);
    } finally {
      setMaintenanceRunning(false);
    }
  };

  const handleRunRetention = async () => {
    if (!window.confirm('Execute document archival retention cycle (archiving records older than 365 days)?')) return;
    setMaintenanceRunning(true);
    try {
      const res = await documentClientService.runRetentionJob(365);
      alert(`Archival Complete: ${res.data.archivedCount} documents moved to ARCHIVED status.`);
      loadData();
    } catch (err) {
      alert(`Retention Job Error: ${err.message}`);
    } finally {
      setMaintenanceRunning(false);
    }
  };

  const openViewer = (id) => {
    setSelectedDocId(id);
    setIsViewerOpen(true);
  };

  const openHistory = (id) => {
    setHistoryDocId(id);
    setIsHistoryOpen(true);
  };

  return (
    <div className="space-y-6 p-6">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center space-x-2">
            <FileText className="w-7 h-7 text-primary-600" />
            <span>Document Management Center</span>
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Centralized document generation, versioning, access control, and PDF archival repository
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setIsUploadOpen(true)}
            className="inline-flex items-center px-3.5 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg text-sm font-semibold shadow-sm transition-colors"
          >
            <UploadCloud className="w-4 h-4 mr-2" />
            Upload Document
          </button>

          <button
            onClick={handleRunIntegrityCheck}
            disabled={maintenanceRunning}
            className="inline-flex items-center px-3.5 py-2 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-lg text-sm font-medium shadow-sm transition-colors disabled:opacity-50"
            title="Verify SHA-256 checksums"
          >
            <ShieldCheck className="w-4 h-4 mr-2 text-emerald-600" />
            Integrity Check
          </button>

          <button
            onClick={handleRunRetention}
            disabled={maintenanceRunning}
            className="inline-flex items-center px-3.5 py-2 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-lg text-sm font-medium shadow-sm transition-colors disabled:opacity-50"
            title="Archive documents past retention threshold"
          >
            <Archive className="w-4 h-4 mr-2 text-amber-600" />
            Archival Run
          </button>
        </div>
      </div>

      {/* KPI Stats Cards (Section 79) */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <div className="text-xs font-semibold text-slate-500 uppercase">Generated Today</div>
          <div className="text-2xl font-bold text-slate-900 mt-1">
            {stats?.generatedToday ?? 0}
          </div>
          <div className="text-xs text-emerald-600 font-medium mt-1 flex items-center">
            <Clock className="w-3.5 h-3.5 mr-1" /> Fresh batches
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <div className="text-xs font-semibold text-slate-500 uppercase">Released</div>
          <div className="text-2xl font-bold text-emerald-600 mt-1">
            {stats?.released ?? 0}
          </div>
          <div className="text-xs text-slate-500 mt-1">Active in portal</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <div className="text-xs font-semibold text-slate-500 uppercase">Pending Review</div>
          <div className="text-2xl font-bold text-amber-600 mt-1">
            {stats?.pendingReview ?? 0}
          </div>
          <div className="text-xs text-slate-500 mt-1">Awaiting approval</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <div className="text-xs font-semibold text-slate-500 uppercase">Superseded</div>
          <div className="text-2xl font-bold text-purple-600 mt-1">
            {stats?.superseded ?? 0}
          </div>
          <div className="text-xs text-slate-500 mt-1">Previous revisions</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <div className="text-xs font-semibold text-slate-500 uppercase">Archived</div>
          <div className="text-2xl font-bold text-slate-600 mt-1">
            {stats?.archived ?? 0}
          </div>
          <div className="text-xs text-slate-500 mt-1">Stored long-term</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <div className="text-xs font-semibold text-slate-500 uppercase">Total Repository</div>
          <div className="text-2xl font-bold text-primary-600 mt-1">
            {stats?.totalGenerated ?? documents.length}
          </div>
          <div className="text-xs text-slate-500 mt-1">Managed files</div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-3">
        <form onSubmit={handleSearchSubmit} className="flex flex-col md:flex-row gap-3">
          <div className="flex-1 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              placeholder="Search by Document ID, Title, Patient Name or UHID..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-3 gap-2">
            <select
              value={category}
              onChange={e => setCategory(e.target.value)}
              className="text-xs font-medium px-3 py-2 border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="">All Categories</option>
              <option value="PATIENT">PATIENT</option>
              <option value="CLINICAL">CLINICAL</option>
              <option value="FINANCIAL">FINANCIAL</option>
              <option value="LABORATORY">LABORATORY</option>
              <option value="RADIOLOGY">RADIOLOGY</option>
              <option value="OPERATIONS">OPERATIONS</option>
              <option value="PROCUREMENT">PROCUREMENT</option>
              <option value="HR">HR</option>
              <option value="ADMINISTRATION">ADMINISTRATION</option>
            </select>

            <select
              value={status}
              onChange={e => setStatus(e.target.value)}
              className="text-xs font-medium px-3 py-2 border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="">All Statuses</option>
              <option value="RELEASED">RELEASED</option>
              <option value="GENERATED">GENERATED</option>
              <option value="PENDING_REVIEW">PENDING_REVIEW</option>
              <option value="APPROVED">APPROVED</option>
              <option value="DRAFT">DRAFT</option>
              <option value="SUPERSEDED">SUPERSEDED</option>
              <option value="ARCHIVED">ARCHIVED</option>
              <option value="CANCELLED">CANCELLED</option>
              <option value="FAILED">FAILED</option>
            </select>

            <button
              type="submit"
              className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-lg text-xs font-semibold shadow-sm transition-colors"
            >
              Apply Filter
            </button>
          </div>
        </form>
      </div>

      {/* Main Documents Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center text-slate-500 text-sm">
            <RotateCw className="w-8 h-8 animate-spin text-primary-600 mb-2" />
            Loading hospital document repository...
          </div>
        ) : error ? (
          <div className="p-8 text-center text-rose-600 bg-rose-50/50">
            <AlertTriangle className="w-8 h-8 mx-auto mb-2 text-rose-500" />
            {error}
          </div>
        ) : documents.length === 0 ? (
          <div className="py-16 text-center text-slate-500">
            <FileText className="w-10 h-10 mx-auto mb-2 text-slate-400" />
            <div className="font-semibold text-slate-700">No documents found</div>
            <p className="text-xs text-slate-400 mt-1">Try resetting the filters or generate new documents.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200 text-xs font-bold text-slate-600 uppercase tracking-wider">
                  <th className="py-3 px-4">Document ID & Title</th>
                  <th className="py-3 px-4">Patient / Subject</th>
                  <th className="py-3 px-4">Type & Category</th>
                  <th className="py-3 px-4">Version</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Generated Date</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {documents.map(doc => (
                  <tr
                    key={doc.documentId}
                    className="hover:bg-slate-50/80 transition-colors cursor-pointer group"
                    onClick={() => openViewer(doc.documentId)}
                  >
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-slate-900 group-hover:text-primary-600 transition-colors">
                        {doc.title}
                      </div>
                      <div className="text-xs font-mono text-slate-500 flex items-center space-x-2 mt-0.5">
                        <span>{doc.documentId}</span>
                        {doc.confidentiality && doc.confidentiality !== 'NORMAL' && (
                          <span className="text-[10px] font-sans font-bold px-1.5 py-0.2 bg-amber-100 text-amber-800 rounded">
                            {doc.confidentiality}
                          </span>
                        )}
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
                      {doc.patientName ? (
                        <div>
                          <div className="font-medium text-slate-800">{doc.patientName}</div>
                          <div className="text-xs text-slate-500 font-mono">ID: {doc.patientId}</div>
                        </div>
                      ) : (
                        <span className="text-xs text-slate-400 italic">Hospital Administration</span>
                      )}
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="font-medium text-slate-800 text-xs">{doc.documentType}</div>
                      <div className="text-[11px] text-slate-500 uppercase">{doc.category}</div>
                    </td>

                    <td className="py-3.5 px-4">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          openHistory(doc.documentId);
                        }}
                        className="inline-flex items-center text-xs font-medium text-slate-600 hover:text-primary-600 px-2 py-1 rounded bg-slate-100 hover:bg-slate-200 transition-colors"
                        title="View revision lineage"
                      >
                        <History className="w-3 h-3 mr-1" />
                        v{doc.version || 1}
                      </button>
                    </td>

                    <td className="py-3.5 px-4">
                      <DocumentStatusBadge status={doc.status} />
                    </td>

                    <td className="py-3.5 px-4 text-xs text-slate-500">
                      {new Date(doc.generatedAt || doc.createdAt).toLocaleDateString()}
                    </td>

                    <td className="py-3.5 px-4 text-right space-x-2" onClick={e => e.stopPropagation()}>
                      <button
                        onClick={() => openViewer(doc.documentId)}
                        className="p-1.5 text-slate-500 hover:text-primary-600 hover:bg-slate-100 rounded-md transition-colors"
                        title="View Details"
                      >
                        <Eye className="w-4 h-4" />
                      </button>

                      {doc.status === 'RELEASED' && (
                        <DocumentDownloadButton
                          documentId={doc.documentId}
                          fileName={`${doc.documentId}.pdf`}
                          variant="compact"
                        />
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Viewer Modal */}
      <DocumentViewer
        documentId={selectedDocId}
        isOpen={isViewerOpen}
        onClose={() => setIsViewerOpen(false)}
        onStatusChange={loadData}
        canApprove={true}
        canRelease={true}
        canRegenerate={true}
      />

      {/* Version History Modal */}
      <DocumentVersionHistory
        documentId={historyDocId}
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
      />

      {/* Upload Modal */}
      <DocumentUploadModal
        isOpen={isUploadOpen}
        onClose={() => setIsUploadOpen(false)}
        onUploadSuccess={loadData}
      />
    </div>
  );
};

export default DocumentDashboard;
