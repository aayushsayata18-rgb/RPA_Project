import api from './api';

export const laboratoryService = {
  // Test Catalog
  listTests: (params) => api.get('/laboratory/tests', { params }),
  getTestById: (id) => api.get(`/laboratory/tests/${id}`),
  createTest: (data) => api.post('/laboratory/tests', data),
  updateTest: (id, data) => api.put(`/laboratory/tests/${id}`, data),
  updateTestStatus: (id, status) => api.patch(`/laboratory/tests/${id}/status`, { status }),

  // Orders
  listOrders: (params) => api.get('/laboratory/orders', { params }),
  getOrderById: (id) => api.get(`/laboratory/orders/${id}`),
  createOrder: (data) => api.post('/laboratory/orders', data),
  checkDuplicateOrder: (data) => api.post('/laboratory/orders/check-duplicate', data),
  cancelOrder: (id, cancellationReason) => api.post(`/laboratory/orders/${id}/cancel`, { cancellationReason }),

  // Collections & Samples
  getCollectionQueue: (params) => api.get('/laboratory/collections/queue', { params }),
  collectSample: (id, data) => api.post(`/laboratory/collections/${id}/collect`, data),
  listSamples: (params) => api.get('/laboratory/samples', { params }),
  getSampleById: (id) => api.get(`/laboratory/samples/${id}`),
  registerSample: (data) => api.post('/laboratory/samples', data),
  receiveSample: (id, data) => api.post(`/laboratory/samples/${id}/receive`, data),
  acceptSample: (id) => api.post(`/laboratory/samples/${id}/accept`),
  rejectSample: (id, data) => api.post(`/laboratory/samples/${id}/reject`, data),

  // Results
  enterResult: (data) => api.post('/laboratory/results', data),
  getVerificationQueue: (params) => api.get('/laboratory/results/verification-queue', { params }),
  getResultById: (id) => api.get(`/laboratory/results/${id}`),
  verifyResult: (id, data) => api.post(`/laboratory/results/${id}/verify`, data),
  amendResult: (id, data) => api.post(`/laboratory/results/${id}/amend`, data),

  // Reports
  listReports: (params) => api.get('/laboratory/reports', { params }),
  getReportById: (id) => api.get(`/laboratory/reports/${id}`),
  generateReport: (data) => api.post('/laboratory/reports/generate', data),
  releaseReport: (id) => api.post(`/laboratory/reports/${id}/release`),
  recordDownload: (id) => api.post(`/laboratory/reports/${id}/download`),

  // Exceptions
  listExceptions: (params) => api.get('/laboratory/exceptions', { params }),
  getExceptionById: (id) => api.get(`/laboratory/exceptions/${id}`),
  createException: (data) => api.post('/laboratory/exceptions', data),
  resolveException: (id, data) => api.post(`/laboratory/exceptions/${id}/resolve`, data),

  // Analytics & RPA
  getDashboardMetrics: () => api.get('/laboratory/analytics/dashboard'),
  syncOrderToExternalLis: (data) => api.post('/laboratory/integrations/sync-order', data),
  fetchResultsFromExternalLis: (data) => api.post('/laboratory/integrations/fetch-results', data),
  reconcileOrder: (data) => api.post('/laboratory/integrations/reconcile', data),
  triggerRpaJob: (data) => api.post('/laboratory/rpa/trigger', data),
  executeRpaJob: (id, data) => api.post(`/laboratory/rpa/${id}/execute`, data),
  listRpaJobs: (params) => api.get('/laboratory/rpa/jobs', { params })
};

export default laboratoryService;
