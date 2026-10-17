import React, { useState, useEffect } from 'react';
import { History, FileText, CheckCircle2, ArrowRight, Loader2, X } from 'lucide-react';
import documentClientService from '../../services/documentClientService';
import DocumentStatusBadge from './DocumentStatusBadge';
import DocumentDownloadButton from './DocumentDownloadButton';

export const DocumentVersionHistory = ({ documentId, isOpen, onClose }) => {
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (isOpen && documentId) {
      loadHistory();
    }
  }, [isOpen, documentId]);

  const loadHistory = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await documentClientService.getVersionHistory(documentId);
      setHistory(res.data || []);
    } catch (err) {
      setError(err.message || 'Failed to load version history');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="relative bg-white rounded-xl shadow-2xl max-w-2xl w-full border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50">
          <div className="flex items-center space-x-2">
            <History className="w-5 h-5 text-primary-600" />
            <h3 className="text-lg font-semibold text-slate-900">
              Document Version History
            </h3>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-200/50 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 max-h-[70vh] overflow-y-auto">
          <div className="text-sm text-slate-500 mb-4">
            Auditable lineage and revisions for Document ID:{' '}
            <span className="font-mono font-semibold text-slate-800">{documentId}</span>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-12 text-slate-500">
              <Loader2 className="w-6 h-6 animate-spin mr-2" />
              Loading revisions...
            </div>
          ) : error ? (
            <div className="p-4 bg-rose-50 text-rose-700 rounded-lg text-sm border border-rose-200">
              {error}
            </div>
          ) : history.length === 0 ? (
            <div className="text-center py-8 text-slate-500 text-sm">
              No additional revision history found.
            </div>
          ) : (
            <div className="space-y-4">
              {history.map((ver, idx) => {
                const isCurrent = ver.documentId === documentId;
                return (
                  <div
                    key={ver.documentId}
                    className={`p-4 rounded-lg border transition-all ${
                      isCurrent
                        ? 'border-primary-300 bg-primary-50/40 ring-1 ring-primary-500/20'
                        : 'border-slate-200 bg-white hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-3">
                        <div
                          className={`p-2 rounded-lg mt-0.5 ${
                            isCurrent ? 'bg-primary-100 text-primary-700' : 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          <FileText className="w-5 h-5" />
                        </div>
                        <div>
                          <div className="flex items-center space-x-2">
                            <span className="font-semibold text-slate-900">
                              Version {ver.version || 1}
                            </span>
                            <span className="font-mono text-xs px-2 py-0.5 bg-slate-100 rounded text-slate-600">
                              {ver.documentId}
                            </span>
                            {isCurrent && (
                              <span className="text-xs bg-primary-600 text-white font-medium px-2 py-0.5 rounded-full">
                                Currently Selected
                              </span>
                            )}
                          </div>
                          <div className="text-xs text-slate-500 mt-1">
                            Generated on {new Date(ver.generatedAt || Date.now()).toLocaleString()} by{' '}
                            <span className="font-medium text-slate-700">{ver.createdBy || 'SYSTEM'}</span>
                          </div>
                          {ver.supersedesDocumentId && (
                            <div className="text-xs text-purple-600 font-medium mt-1 flex items-center">
                              <ArrowRight className="w-3.5 h-3.5 mr-1" />
                              Supersedes: {ver.supersedesDocumentId}
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center space-x-3">
                        <DocumentStatusBadge status={ver.status} />
                        {ver.status === 'RELEASED' && (
                          <DocumentDownloadButton
                            documentId={ver.documentId}
                            fileName={`${ver.documentId}.pdf`}
                            variant="secondary"
                          />
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-slate-50 border-t border-slate-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 text-sm font-medium rounded-lg transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default DocumentVersionHistory;
