import api from './api';

export const radiologyService = {
  // 1. Examination Master
  listExams: (params) => api.get('/radiology/exams', { params }),
  getExamById: (id) => api.get(`/radiology/exams/${id}`),
  createExam: (data) => api.post('/radiology/exams', data),
  updateExam: (id, data) => api.put(`/radiology/exams/${id}`, data),
  updateExamStatus: (id, status) => api.patch(`/radiology/exams/${id}/status`, { status }),

  // 2. Modality Master
  listModalities: (params) => api.get('/radiology/modalities', { params }),
  getModalityById: (id) => api.get(`/radiology/modalities/${id}`),
  createModality: (data) => api.post('/radiology/modalities', data),
  updateModality: (id, data) => api.put(`/radiology/modalities/${id}`, data),
  updateModalityStatus: (id, data) => api.patch(`/radiology/modalities/${id}/status`, data),

  // 3. Orders
  listOrders: (params) => api.get('/radiology/orders', { params }),
  getOrderById: (id) => api.get(`/radiology/orders/${id}`),
  createOrder: (data) => api.post('/radiology/orders', data),
  checkDuplicateOrder: (data) => api.post('/radiology/orders/check-duplicate', data),
  cancelOrder: (id, cancellationReason) => api.post(`/radiology/orders/${id}/cancel`, { reason: cancellationReason }),

  // 4. Scheduling & Check-In
  listSchedules: (params) => api.get('/radiology/schedules', { params }),
  getAvailability: (params) => api.get('/radiology/schedules/availability', { params }),
  bookSchedule: (data) => api.post('/radiology/schedules', data),
  reschedule: (id, data) => api.post(`/radiology/schedules/${id}/reschedule`, data),
  cancelSchedule: (id, reason) => api.post(`/radiology/schedules/${id}/cancel`, { reason }),
  checkIn: (id, data) => api.post(`/radiology/schedules/${id}/check-in`, data),

  // 5. Studies & Procedures
  listStudies: (params) => api.get('/radiology/studies', { params }),
  getStudyById: (id) => api.get(`/radiology/studies/${id}`),
  createStudy: (data) => api.post('/radiology/studies', data),
  startExamination: (id, data) => api.post(`/radiology/studies/${id}/start`, data),
  completeExamination: (id, data) => api.post(`/radiology/studies/${id}/complete`, data),

  // 6. Reports
  listReports: (params) => api.get('/radiology/reports', { params }),
  getReportById: (id) => api.get(`/radiology/reports/${id}`),
  createReport: (data) => api.post('/radiology/reports', data),
  updateReport: (id, data) => api.put(`/radiology/reports/${id}`, data),
  verifyReport: (id) => api.post(`/radiology/reports/${id}/verify`),
  finalizeReport: (id) => api.post(`/radiology/reports/${id}/finalize`),
  releaseReport: (id) => api.post(`/radiology/reports/${id}/release`),
  amendReport: (id, data) => api.post(`/radiology/reports/${id}/amend`, data),
  downloadReport: (id) => api.get(`/radiology/reports/${id}/download`),

  // 7. Exceptions
  listExceptions: (params) => api.get('/radiology/exceptions', { params }),
  getExceptionById: (id) => api.get(`/radiology/exceptions/${id}`),
  createException: (data) => api.post('/radiology/exceptions', data),
  resolveException: (id, data) => api.post(`/radiology/exceptions/${id}/resolve`, data),

  // 8. Analytics & RPA
  getDashboardMetrics: () => api.get('/radiology/analytics/dashboard'),
  getSchedulingAnalytics: () => api.get('/radiology/analytics/scheduling'),
  getModalityAnalytics: () => api.get('/radiology/analytics/modalities'),
  getTurnaroundAnalytics: () => api.get('/radiology/analytics/turnaround'),
  getRpaAnalytics: () => api.get('/radiology/analytics/rpa'),
  syncOrderToRis: (data) => api.post('/radiology/integrations/sync-order', data),
  syncPacsMetadata: (data) => api.post('/radiology/integrations/sync-pacs', data),
  reconcileOrder: (data) => api.post('/radiology/integrations/reconcile', data),
  recordConsumableUsage: (data) => api.post('/radiology/inventory/consume', data),
  triggerRpaJob: (data) => api.post('/radiology/rpa/trigger', data),
  executeRpaJob: (id, data) => api.post(`/radiology/rpa/${id}/execute`, data)
};

export const radiologyApi = radiologyService;
export default radiologyService;
