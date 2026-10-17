import api from './api';

export const feedbackService = {
  // Submit feedback
  submitFeedback: (data) => api.post('/feedback', data),

  // Patient own feedback list
  getMyFeedback: (params) => api.get('/feedback/my', { params }),

  // Administrative / operational feedback query
  getFeedbackList: (params) => api.get('/feedback', { params }),

  // Single feedback dossier
  getFeedbackById: (feedbackId) => api.get(`/feedback/${feedbackId}`),

  // Case management
  assignFeedback: (feedbackId, data) => api.post(`/feedback/${feedbackId}/assign`, data),
  changePriority: (feedbackId, priority) => api.post(`/feedback/${feedbackId}/priority`, { priority }),
  addInternalNote: (feedbackId, data) => api.post(`/feedback/${feedbackId}/internal-notes`, data),
  uploadAttachment: (feedbackId, attachment) => api.post(`/feedback/${feedbackId}/attachments`, attachment),

  // Investigation workflow
  startInvestigation: (feedbackId, data) => api.post(`/feedback/${feedbackId}/investigation`, data),
  updateInvestigation: (feedbackId, data) => api.patch(`/feedback/${feedbackId}/investigation`, data),
  approveInvestigation: (feedbackId, data) => api.post(`/feedback/${feedbackId}/investigation/approve`, data),

  // Response workflow
  draftResponse: (feedbackId, responseText) => api.post(`/feedback/${feedbackId}/response`, { responseText }),
  submitForApproval: (feedbackId) => api.post(`/feedback/${feedbackId}/response/submit-approval`),
  approveResponse: (feedbackId) => api.post(`/feedback/${feedbackId}/response/approve`),
  sendResponse: (feedbackId) => api.post(`/feedback/${feedbackId}/response/send`),

  // Lifecycle
  resolveFeedback: (feedbackId, data) => api.post(`/feedback/${feedbackId}/resolve`, data),
  closeFeedback: (feedbackId, data) => api.post(`/feedback/${feedbackId}/close`, data),
  reopenFeedback: (feedbackId, data) => api.post(`/feedback/${feedbackId}/reopen`, data),
  escalateFeedback: (feedbackId, data) => api.post(`/feedback/${feedbackId}/escalate`, data),

  // SLA Management
  pauseSLA: (feedbackId, reason) => api.post(`/feedback/${feedbackId}/sla/pause`, { reason }),
  resumeSLA: (feedbackId) => api.post(`/feedback/${feedbackId}/sla/resume`),
  checkSLABreaches: () => api.post('/feedback/sla/check-breaches'),

  // Reporting & Analytics
  getSummaryReport: () => api.get('/feedback/reports/summary'),
  getCategoryReport: () => api.get('/feedback/reports/by-category'),
  getDepartmentReport: () => api.get('/feedback/reports/by-department'),
  getSLAReport: () => api.get('/feedback/reports/sla'),
  getRatingReport: () => api.get('/feedback/reports/ratings'),

  // RPA & Automation
  rpaImport: (data) => api.post('/feedback/rpa/import', data),
  rpaSync: (data) => api.post('/feedback/rpa/sync', data),
  rpaReconcile: () => api.post('/feedback/rpa/reconcile')
};

export default feedbackService;
