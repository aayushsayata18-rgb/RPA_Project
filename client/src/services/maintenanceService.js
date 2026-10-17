import api from './api';

export const maintenanceService = {
  // 1. Assets & Categories
  getCategories: () => api.get('/maintenance/categories'),
  createCategory: (data) => api.post('/maintenance/categories', data),
  getAssets: (params) => api.get('/maintenance/assets', { params }),
  getAssetById: (id) => api.get(`/maintenance/assets/${id}`),
  createAsset: (data) => api.post('/maintenance/assets', data),
  updateAsset: (id, data) => api.put(`/maintenance/assets/${id}`, data),
  updateAssetStatus: (id, status, reason) => api.patch(`/maintenance/assets/${id}/status`, { status, reason }),
  getAssetHistory: (id) => api.get(`/maintenance/assets/${id}/history`),
  checkDuplicates: (data) => api.post('/maintenance/assets/check-duplicates', data),

  // 2. Requests
  getRequests: (params) => api.get('/maintenance/requests', { params }),
  getRequestById: (id) => api.get(`/maintenance/requests/${id}`),
  createRequest: (data) => api.post('/maintenance/requests', data),
  approveRequest: (id, data) => api.post(`/maintenance/requests/${id}/approve`, data),
  rejectRequest: (id, data) => api.post(`/maintenance/requests/${id}/reject`, data),
  createWorkOrderFromRequest: (id, data) => api.post(`/maintenance/requests/${id}/create-work-order`, data),

  // 3. Work Orders
  getWorkOrders: (params) => api.get('/maintenance/work-orders', { params }),
  getWorkOrderById: (id) => api.get(`/maintenance/work-orders/${id}`),
  createWorkOrder: (data) => api.post('/maintenance/work-orders', data),
  assignWorkOrder: (id, data) => api.post(`/maintenance/work-orders/${id}/assign`, data),
  scheduleWorkOrder: (id, data) => api.post(`/maintenance/work-orders/${id}/schedule`, data),
  startWorkOrder: (id) => api.post(`/maintenance/work-orders/${id}/start`),
  holdWorkOrder: (id, data) => api.post(`/maintenance/work-orders/${id}/hold`, data),
  completeWorkOrder: (id, data) => api.post(`/maintenance/work-orders/${id}/complete`, data),
  verifyWorkOrder: (id, data) => api.post(`/maintenance/work-orders/${id}/verify`, data),
  closeWorkOrder: (id, data) => api.post(`/maintenance/work-orders/${id}/close`, data),
  reopenWorkOrder: (id, data) => api.post(`/maintenance/work-orders/${id}/reopen`, data),
  getCalendar: (params) => api.get('/maintenance/work-orders/calendar', { params }),

  // 4. Preventive Plans
  getPlans: (params) => api.get('/maintenance/preventive-plans', { params }),
  getPlanById: (id) => api.get(`/maintenance/preventive-plans/${id}`),
  createPlan: (data) => api.post('/maintenance/preventive-plans', data),
  updatePlan: (id, data) => api.put(`/maintenance/preventive-plans/${id}`, data),
  generateWorkOrderFromPlan: (id) => api.post(`/maintenance/preventive-plans/${id}/generate-work-order`),

  // 5. Checklists
  getChecklists: (params) => api.get('/maintenance/checklists', { params }),
  getChecklistById: (id) => api.get(`/maintenance/checklists/${id}`),
  createChecklist: (data) => api.post('/maintenance/checklists', data),
  updateChecklist: (id, data) => api.put(`/maintenance/checklists/${id}`, data),

  // 6. Parts
  getPartRequests: (params) => api.get('/maintenance/parts', { params }),
  createPartRequest: (data) => api.post('/maintenance/parts/request', data),
  approvePartRequest: (id) => api.post(`/maintenance/parts/${id}/approve`),
  issuePart: (id, data) => api.post(`/maintenance/parts/${id}/issue`, data),
  returnPart: (id, data) => api.post(`/maintenance/parts/${id}/return`, data),

  // 7. Contracts (AMC)
  getContracts: (params) => api.get('/maintenance/contracts', { params }),
  getContractById: (id) => api.get(`/maintenance/contracts/${id}`),
  createContract: (data) => api.post('/maintenance/contracts', data),
  updateContract: (id, data) => api.put(`/maintenance/contracts/${id}`, data),
  renewContract: (id, data) => api.post(`/maintenance/contracts/${id}/renew`, data),

  // 8. Calibrations
  getCalibrations: (params) => api.get('/maintenance/calibrations', { params }),
  getCalibrationById: (id) => api.get(`/maintenance/calibrations/${id}`),
  createCalibration: (data) => api.post('/maintenance/calibrations', data),
  updateCalibration: (id, data) => api.put(`/maintenance/calibrations/${id}`, data),

  // 9. Exceptions
  getExceptions: (params) => api.get('/maintenance/exceptions', { params }),
  getExceptionById: (id) => api.get(`/maintenance/exceptions/${id}`),
  createException: (data) => api.post('/maintenance/exceptions', data),
  resolveException: (id, data) => api.post(`/maintenance/exceptions/${id}/resolve`, data),

  // 10. Analytics
  getDashboardMetrics: () => api.get('/maintenance/analytics/dashboard'),
  getCostAnalytics: () => api.get('/maintenance/analytics/cost'),
  getDowntimeAnalytics: () => api.get('/maintenance/analytics/downtime'),

  // 11. RPA
  exportWorkOrderToCmms: (id) => api.post(`/maintenance/rpa/work-orders/${id}/export`),
  syncWorkOrderStatus: (id, status) => api.post(`/maintenance/rpa/work-orders/${id}/sync`, { status })
};

export default maintenanceService;
