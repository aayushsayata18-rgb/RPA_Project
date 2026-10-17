import React, { useState } from 'react';
import { UploadCloud, FileUp, X, AlertCircle, Loader2 } from 'lucide-react';
import documentClientService from '../../services/documentClientService';

export const DocumentUploadModal = ({ isOpen, onClose, onUploadSuccess }) => {
  const [formData, setFormData] = useState({
    title: '',
    documentType: 'VENDOR_DOCUMENT',
    category: 'OPERATIONS',
    entityType: 'General',
    entityId: '',
    confidentiality: 'NORMAL',
    department: 'GENERAL',
    patientId: ''
  });
  const [selectedFile, setSelectedFile] = useState(null);
  const [fileBase64, setFileBase64] = useState('');
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);

  if (!isOpen) return null;

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 25 * 1024 * 1024) {
      setError('File size exceeds maximum permitted limit of 25MB.');
      return;
    }

    setSelectedFile(file);
    if (!formData.title) {
      setFormData(prev => ({ ...prev, title: file.name.replace(/\.[^/.]+$/, '') }));
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      setFileBase64(event.target.result);
    };
    reader.readAsDataURL(file);
    setError(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedFile) {
      setError('Please select a file to upload.');
      return;
    }

    setUploading(true);
    setError(null);
    try {
      await documentClientService.uploadDocument({
        ...formData,
        fileName: selectedFile.name,
        mimeType: selectedFile.type || 'application/pdf',
        fileBase64,
        entityReference: {
          entityType: formData.entityType,
          entityId: formData.entityId || 'UPLOAD',
          module: formData.category
        }
      });

      alert('Document uploaded and secured successfully!');
      onClose();
      if (onUploadSuccess) onUploadSuccess();
    } catch (err) {
      setError(err.message || 'Failed to upload document');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="relative bg-white rounded-2xl shadow-2xl max-w-lg w-full border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50">
          <div className="flex items-center space-x-2">
            <UploadCloud className="w-5 h-5 text-primary-600" />
            <h3 className="text-lg font-bold text-slate-900">Upload Supporting Document</h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 p-1 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-rose-50 text-rose-700 text-sm rounded-lg border border-rose-200 flex items-center">
              <AlertCircle className="w-4 h-4 mr-2 flex-shrink-0" />
              {error}
            </div>
          )}

          {/* File Picker */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
              Select Document File (.pdf, .png, .jpg, .docx, .xlsx)
            </label>
            <div className="border-2 border-dashed border-slate-300 rounded-xl p-6 text-center hover:border-primary-500 transition-colors bg-slate-50">
              <FileUp className="w-8 h-8 text-slate-400 mx-auto mb-2" />
              <input
                type="file"
                onChange={handleFileChange}
                accept=".pdf,.png,.jpg,.jpeg,.docx,.xlsx,.csv,.txt"
                className="hidden"
                id="file-upload-input"
              />
              <label
                htmlFor="file-upload-input"
                className="cursor-pointer text-sm font-semibold text-primary-600 hover:text-primary-700"
              >
                Browse device file
              </label>
              <div className="text-xs text-slate-500 mt-1">
                {selectedFile ? `${selectedFile.name} (${Math.round(selectedFile.size / 1024)} KB)` : 'Max file size 25MB'}
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
              Document Title
            </label>
            <input
              type="text"
              required
              value={formData.title}
              onChange={e => setFormData({ ...formData, title: e.target.value })}
              placeholder="e.g. Vendor Quality Certificate 2026"
              className="w-full text-sm px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                Document Type
              </label>
              <select
                value={formData.documentType}
                onChange={e => setFormData({ ...formData, documentType: e.target.value })}
                className="w-full text-sm px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:outline-none"
              >
                <option value="VENDOR_DOCUMENT">VENDOR_DOCUMENT</option>
                <option value="INSURANCE_CLAIM_PACKAGE">INSURANCE_CLAIM_PACKAGE</option>
                <option value="EMPLOYEE_DOCUMENT">EMPLOYEE_DOCUMENT</option>
                <option value="PATIENT_REGISTRATION_RECEIPT">PATIENT_REGISTRATION_RECEIPT</option>
                <option value="LAB_REPORT">LAB_REPORT</option>
                <option value="RADIOLOGY_REPORT">RADIOLOGY_REPORT</option>
                <option value="MAINTENANCE_REPORT">MAINTENANCE_REPORT</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                Category
              </label>
              <select
                value={formData.category}
                onChange={e => setFormData({ ...formData, category: e.target.value })}
                className="w-full text-sm px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:outline-none"
              >
                <option value="OPERATIONS">OPERATIONS</option>
                <option value="PATIENT">PATIENT</option>
                <option value="CLINICAL">CLINICAL</option>
                <option value="FINANCIAL">FINANCIAL</option>
                <option value="INSURANCE">INSURANCE</option>
                <option value="VENDOR">VENDOR</option>
                <option value="HR">HR</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                Linked Patient ID (Optional)
              </label>
              <input
                type="text"
                placeholder="e.g. P10001"
                value={formData.patientId}
                onChange={e => setFormData({ ...formData, patientId: e.target.value })}
                className="w-full text-sm px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                Confidentiality
              </label>
              <select
                value={formData.confidentiality}
                onChange={e => setFormData({ ...formData, confidentiality: e.target.value })}
                className="w-full text-sm px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:outline-none"
              >
                <option value="NORMAL">NORMAL</option>
                <option value="RESTRICTED">RESTRICTED</option>
                <option value="HIGHLY_RESTRICTED">HIGHLY_RESTRICTED</option>
              </select>
            </div>
          </div>

          <div className="pt-2 flex justify-end space-x-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-slate-300 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={uploading || !selectedFile}
              className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg text-sm font-medium shadow-sm disabled:opacity-50 flex items-center"
            >
              {uploading && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
              {uploading ? 'Encrypting & Storing...' : 'Upload Document'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default DocumentUploadModal;
