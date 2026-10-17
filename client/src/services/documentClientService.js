import api from './api';
import axios from 'axios';

/**
 * Module 27: DocumentClientService
 * Frontend API client for document generation, templates, packages and audits
 */
export const documentClientService = {
  // Documents
  getDocuments: (params = {}) => api.get('/documents', { params }),
  getDocumentById: (documentId) => api.get(`/documents/${documentId}`),
  generateDocument: (payload) => api.post('/documents/generate', payload),
  uploadDocument: (payload) => api.post('/documents/upload', payload),
  approveDocument: (documentId) => api.post(`/documents/${documentId}/approve`),
  releaseDocument: (documentId) => api.post(`/documents/${documentId}/release`),
  regenerateDocument: (documentId, updatedData = {}) => api.post(`/documents/${documentId}/regenerate`, { updatedData }),
  cancelDocument: (documentId, reason) => api.post(`/documents/${documentId}/cancel`, { reason }),
  getVersionHistory: (documentId) => api.get(`/documents/${documentId}/versions`),
  getPatientDocuments: () => api.get('/documents/patient/my-documents'),
  getStats: () => api.get('/documents/reports/stats'),
  getAccessLogs: (params = {}) => api.get('/documents/reports/access-logs', { params }),
  runIntegrityCheck: () => api.post('/documents/maintenance/integrity-check'),
  runRetentionJob: (days = 365) => api.post('/documents/maintenance/retention-job', { archiveAfterDays: days }),

  // Secure Download with JWT
  downloadDocumentFile: async (documentId, fileName = 'document.pdf') => {
    const token = localStorage.getItem('token');
    const response = await axios.get(`/api/documents/${documentId}/download`, {
      headers: {
        Authorization: token ? `Bearer ${token}` : ''
      },
      responseType: 'blob'
    });

    const blob = new Blob([response.data], { type: 'application/pdf' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', fileName);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  },

  // Templates
  getTemplates: (params = {}) => api.get('/document-templates', { params }),
  getTemplateById: (id) => api.get(`/document-templates/${id}`),
  createTemplate: (payload) => api.post('/document-templates', payload),
  updateTemplate: (id, payload) => api.patch(`/document-templates/${id}`, payload),
  approveTemplate: (id) => api.post(`/document-templates/${id}/approve`),
  activateTemplate: (id) => api.post(`/document-templates/${id}/activate`),
  deactivateTemplate: (id) => api.post(`/document-templates/${id}/deactivate`),
  previewTemplate: (id, sampleData = {}) => api.post(`/document-templates/${id}/preview`, { sampleData }),

  // Packages
  getPackages: (params = {}) => api.get('/document-packages', { params }),
  getPackageById: (packageId) => api.get(`/document-packages/${packageId}`),
  createPackage: (payload) => api.post('/document-packages', payload),
  downloadPackageFile: async (packageId, fileName = 'package.pdf') => {
    const token = localStorage.getItem('token');
    const response = await axios.get(`/api/document-packages/${packageId}/download`, {
      headers: {
        Authorization: token ? `Bearer ${token}` : ''
      },
      responseType: 'blob'
    });

    const blob = new Blob([response.data], { type: 'application/pdf' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', fileName);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  }
};

export default documentClientService;
