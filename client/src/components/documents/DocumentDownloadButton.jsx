import React, { useState } from 'react';
import { Download, Loader2 } from 'lucide-react';
import documentClientService from '../../services/documentClientService';

export const DocumentDownloadButton = ({
  documentId,
  fileName = 'document.pdf',
  variant = 'primary',
  className = '',
  children
}) => {
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState(null);

  const handleDownload = async (e) => {
    e.stopPropagation();
    if (downloading) return;
    setDownloading(true);
    setError(null);
    try {
      await documentClientService.downloadDocumentFile(documentId, fileName);
    } catch (err) {
      console.error('Download error:', err);
      setError(err.message || 'Download failed');
      alert(`Download Error: ${err.message || 'Failed to download document'}`);
    } finally {
      setDownloading(false);
    }
  };

  const baseStyle =
    'inline-flex items-center justify-center font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-1 rounded-md text-sm';
  const variants = {
    primary: 'bg-primary-600 hover:bg-primary-700 text-white shadow-sm focus:ring-primary-500 px-3 py-1.5',
    secondary: 'bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 shadow-sm focus:ring-primary-500 px-3 py-1.5',
    ghost: 'text-slate-600 hover:text-primary-600 hover:bg-slate-100 p-1.5',
    compact: 'text-primary-600 hover:text-primary-800 p-1 hover:bg-primary-50 rounded'
  };

  return (
    <button
      type="button"
      onClick={handleDownload}
      disabled={downloading}
      className={`${baseStyle} ${variants[variant] || variants.primary} ${className} disabled:opacity-50`}
      title={error || 'Download Official PDF Document'}
    >
      {downloading ? (
        <Loader2 className="w-4 h-4 animate-spin mr-1.5" />
      ) : (
        <Download className="w-4 h-4 mr-1.5" />
      )}
      {children || (downloading ? 'Downloading...' : 'Download')}
    </button>
  );
};

export default DocumentDownloadButton;
