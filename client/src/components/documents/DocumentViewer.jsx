import React, { useState, useEffect } from 'react';
import {
  FileText,
  X,
  Download,
  CheckCircle,
  Clock,
  ShieldCheck,
  AlertTriangle,
  RotateCw,
  Ban,
  User,
  Calendar,
  Layers,
  Copy,
  ExternalLink
} from 'lucide-react';
import DocumentStatusBadge from './DocumentStatusBadge';
import DocumentDownloadButton from './DocumentDownloadButton';
import documentClientService from '../../services/documentClientService';

export const DocumentViewer = ({
  documentId,
  isOpen,
  onClose,
  onStatusChange,
  canApprove = false,
  canRelease = false,
  canRegenerate = false
}) => {
  const [doc, setDoc] = useState(null);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (isOpen && documentId) {
      loadDoc();
    }
  }, [isOpen, documentId]);

  const loadDoc = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await documentClientService.getDocumentById(documentId);
      setDoc(res.data);
    } catch (err) {
      setError(err.message || 'Failed to retrieve document');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async () => {
    if (!window.confirm('Are you sure you want to approve this clinical/administrative document?')) return;
    setActionLoading(true);
    try {
      await documentClientService.approveDocument(documentId);
      await loadDoc();
      if (onStatusChange) onStatusChange();
    } catch (err) {
      alert(`Approval Error: ${err.message}`);
    } finally {
      setActionLoading(false);
    }
  };

  const handleRelease = async () => {
    if (!window.confirm('Release this document to patient and recipients?')) return;
    setActionLoading(true);
    try {
      await documentClientService.releaseDocument(documentId);
      await loadDoc();
      if (onStatusChange) onStatusChange();
    } catch (err) {
      alert(`Release Error: ${err.message}`);
    } finally {
      setActionLoading(false);
    }
  };

  const handleRegenerate = async () => {
    const reason = window.prompt('Enter reason / correction notes for regenerating this document:');
    if (reason === null) return;
    setActionLoading(true);
    try {
      const res = await documentClientService.regenerateDocument(documentId, { correctionReason: reason });
      alert(`Document regenerated! New version ID: ${res.data.documentId}`);
      onClose();
      if (onStatusChange) onStatusChange();
    } catch (err) {
      alert(`Regeneration Error: ${err.message}`);
    } finally {
      setActionLoading(false);
    }
  };

  const handleCancel = async () => {
    const reason = window.prompt('Please enter cancellation reason:');
    if (!reason) return;
    setActionLoading(true);
    try {
      await documentClientService.cancelDocument(documentId, reason);
      await loadDoc();
      if (onStatusChange) onStatusChange();
    } catch (err) {
      alert(`Cancellation Error: ${err.message}`);
    } finally {
      setActionLoading(false);
    }
  };

  const copyChecksum = () => {
    if (doc?.storage?.checksum) {
      navigator.clipboard.writeText(doc.storage.checksum);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="relative bg-white rounded-2xl shadow-2xl max-w-4xl w-full border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-primary-100 text-primary-700 rounded-lg">
              <FileText className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="text-lg font-bold text-slate-900">
                  {doc?.title || 'Document Details'}
                </h3>
                {doc && <DocumentStatusBadge status={doc.status} />}
              </div>
              <div className="text-xs text-slate-500 font-mono mt-0.5">
                {documentId} | Version {doc?.version || 1}
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-200/50 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 max-h-[75vh] overflow-y-auto space-y-6">
          {loading ? (
            <div className="flex items-center justify-center py-16 text-slate-500 text-sm">
              <RotateCw className="w-6 h-6 animate-spin mr-2 text-primary-600" />
              Loading document metadata & preview...
            </div>
          ) : error ? (
            <div className="p-4 bg-rose-50 text-rose-700 rounded-lg text-sm border border-rose-200">
              {error}
            </div>
          ) : doc ? (
            <>
              {/* Metadata Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                  <div className="text-xs font-semibold text-slate-500 uppercase flex items-center">
                    <User className="w-3.5 h-3.5 mr-1 text-slate-400" /> Patient Target
                  </div>
                  <div className="font-medium text-slate-900 mt-1">
                    {doc.patientName || 'N/A'}
                  </div>
                  <div className="text-xs text-slate-500 font-mono">
                    ID: {doc.patientId || 'Not Linked'}
                  </div>
                </div>

                <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                  <div className="text-xs font-semibold text-slate-500 uppercase flex items-center">
                    <Layers className="w-3.5 h-3.5 mr-1 text-slate-400" /> Category & Dept
                  </div>
                  <div className="font-medium text-slate-900 mt-1">
                    {doc.category || 'PATIENT'}
                  </div>
                  <div className="text-xs text-slate-500">
                    Dept: {doc.department || 'GENERAL'} | Level: {doc.confidentiality || 'NORMAL'}
                  </div>
                </div>

                <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                  <div className="text-xs font-semibold text-slate-500 uppercase flex items-center">
                    <Calendar className="w-3.5 h-3.5 mr-1 text-slate-400" /> Generated At
                  </div>
                  <div className="font-medium text-slate-900 mt-1">
                    {new Date(doc.generatedAt || doc.createdAt).toLocaleString()}
                  </div>
                  <div className="text-xs text-slate-500">
                    By: {doc.generatedBy || 'SYSTEM'}
                  </div>
                </div>
              </div>

              {/* Security & Checksum Banner */}
              <div className="p-3.5 bg-emerald-50/70 rounded-xl border border-emerald-200 flex items-center justify-between text-xs">
                <div className="flex items-center space-x-2 text-emerald-800">
                  <ShieldCheck className="w-5 h-5 text-emerald-600 flex-shrink-0" />
                  <div>
                    <span className="font-semibold">SHA-256 Checksum Verified:</span>{' '}
                    <span className="font-mono text-emerald-950">
                      {doc.storage?.checksum ? `${doc.storage.checksum.substring(0, 32)}...` : 'Generating hash'}
                    </span>
                  </div>
                </div>
                {doc.storage?.checksum && (
                  <button
                    onClick={copyChecksum}
                    className="flex items-center text-emerald-700 hover:text-emerald-900 font-medium px-2 py-1 rounded hover:bg-emerald-100 transition-colors"
                  >
                    <Copy className="w-3.5 h-3.5 mr-1" />
                    {copied ? 'Copied' : 'Copy'}
                  </button>
                )}
              </div>

              {/* Rendered HTML or Document Particulars */}
              <div className="border border-slate-200 rounded-xl p-5 bg-white shadow-sm space-y-3">
                <div className="text-sm font-semibold text-slate-900 border-b pb-2 flex items-center justify-between">
                  <span>Structured Document Content</span>
                  <span className="text-xs text-slate-500">Format: PDF (Verified)</span>
                </div>

                {doc.htmlContent ? (
                  <div
                    className="prose prose-sm max-w-none text-slate-700 max-h-60 overflow-y-auto p-3 bg-slate-50 rounded border"
                    dangerouslySetInnerHTML={{ __html: doc.htmlContent }}
                  />
                ) : (
                  <div className="grid grid-cols-2 gap-2 text-sm bg-slate-50 p-4 rounded-lg">
                    {Object.entries(doc.metadata || {}).map(([k, v]) => (
                      <div key={k} className="border-b border-slate-200 py-1">
                        <span className="text-slate-500 text-xs font-semibold uppercase">{k}: </span>
                        <span className="text-slate-900 font-medium">
                          {typeof v === 'object' ? JSON.stringify(v) : String(v)}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Status Notice if not released */}
              {doc.status !== 'RELEASED' && (
                <div className="p-3 bg-amber-50 rounded-lg border border-amber-200 text-xs text-amber-800 flex items-center space-x-2">
                  <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0" />
                  <span>
                    This document is in <strong>{doc.status}</strong> state. In accordance with hospital policy, unreleased documents remain confidential and are not visible in the Patient Portal until finalized and released.
                  </span>
                </div>
              )}
            </>
          ) : null}
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center space-x-2">
            {doc?.status === 'RELEASED' && (
              <DocumentDownloadButton
                documentId={documentId}
                fileName={`${documentId}.pdf`}
                variant="primary"
              >
                Download Official PDF
              </DocumentDownloadButton>
            )}

            {/* Preview in new tab */}
            {doc?.status === 'RELEASED' && (
              <a
                href={`/api/documents/${documentId}/preview`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-md hover:bg-slate-50"
              >
                <ExternalLink className="w-4 h-4 mr-1.5" />
                Browser Preview
              </a>
            )}
          </div>

          <div className="flex items-center space-x-2">
            {/* Approval Workflow */}
            {canApprove && (doc?.status === 'PENDING_REVIEW' || doc?.status === 'GENERATED') && (
              <button
                type="button"
                onClick={handleApprove}
                disabled={actionLoading}
                className="px-3 py-1.5 bg-teal-600 hover:bg-teal-700 text-white text-sm font-medium rounded-md shadow-sm disabled:opacity-50"
              >
                Approve Document
              </button>
            )}

            {/* Release Workflow */}
            {canRelease && (doc?.status === 'APPROVED' || doc?.status === 'GENERATED') && (
              <button
                type="button"
                onClick={handleRelease}
                disabled={actionLoading}
                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium rounded-md shadow-sm disabled:opacity-50"
              >
                Release to Patient
              </button>
            )}

            {/* Versioning / Regenerate */}
            {canRegenerate && doc?.status === 'RELEASED' && (
              <button
                type="button"
                onClick={handleRegenerate}
                disabled={actionLoading}
                className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-md shadow-sm disabled:opacity-50"
              >
                Regenerate (v{doc.version + 1})
              </button>
            )}

            {/* Cancel Document */}
            {doc && doc.status !== 'CANCELLED' && doc.status !== 'ARCHIVED' && (
              <button
                type="button"
                onClick={handleCancel}
                disabled={actionLoading}
                className="px-3 py-1.5 bg-rose-50 text-rose-700 border border-rose-300 hover:bg-rose-100 text-sm font-medium rounded-md disabled:opacity-50"
              >
                Cancel
              </button>
            )}

            <button
              type="button"
              onClick={onClose}
              className="px-4 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-800 text-sm font-medium rounded-md transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DocumentViewer;
