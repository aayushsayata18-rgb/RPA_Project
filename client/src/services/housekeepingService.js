import api from './api';

export const housekeepingService = {
  // 1. Areas
  listAreas: (params) => api.get('/housekeeping/areas', { params }),
  getAreaById: (id) => api.get(`/housekeeping/areas/${id}`),
  createArea: (data) => api.post('/housekeeping/areas', data),
  updateArea: (id, data) => api.put(`/housekeeping/areas/${id}`, data),
  updateAreaStatus: (id, status) => api.patch(`/housekeeping/areas/${id}/status`, { status }),

  // 2. Checklists
  listChecklists: (params) => api.get('/housekeeping/checklists', { params }),
  getChecklistById: (id) => api.get(`/housekeeping/checklists/${id}`),
  createChecklist: (data) => api.post('/housekeeping/checklists', data),
  updateChecklist: (id, data) => api.put(`/housekeeping/checklists/${id}`, data),

  // 3. Schedules
  listSchedules: (params) => api.get('/housekeeping/schedules', { params }),
  getScheduleById: (id) => api.get(`/housekeeping/schedules/${id}`),
  createSchedule: (data) => api.post('/housekeeping/schedules', data),
  updateSchedule: (id, data) => api.put(`/housekeeping/schedules/${id}`, data),
  updateScheduleStatus: (id, active) => api.patch(`/housekeeping/schedules/${id}/status`, { active }),

  // 4. Tasks & Turnover
  listTasks: (params) => api.get('/housekeeping/tasks', { params }),
  getTurnoverBoard: () => api.get('/housekeeping/tasks/turnover/board'),
  getTaskById: (id) => api.get(`/housekeeping/tasks/${id}`),
  createTask: (data) => api.post('/housekeeping/tasks', data),
  triggerTurnover: (data) => api.post('/housekeeping/tasks/turnover', data),
  updateTask: (id, data) => api.patch(`/housekeeping/tasks/${id}`, data),
  assignTask: (id, data) => api.post(`/housekeeping/tasks/${id}/assign`, data),
  scheduleTask: (id, data) => api.post(`/housekeeping/tasks/${id}/schedule`, data),
  startTask: (id) => api.post(`/housekeeping/tasks/${id}/start`),
  holdTask: (id, data) => api.post(`/housekeeping/tasks/${id}/hold`, data),
  completeTask: (id, data) => api.post(`/housekeeping/tasks/${id}/complete`, data),
  closeTask: (id, data) => api.post(`/housekeeping/tasks/${id}/close`, data),
  reopenTask: (id, data) => api.post(`/housekeeping/tasks/${id}/reopen`, data),

  // 5. Inspections
  listInspections: (params) => api.get('/housekeeping/inspections', { params }),
  getInspectionById: (id) => api.get(`/housekeeping/inspections/${id}`),
  performInspection: (data) => api.post('/housekeeping/inspections', data),
  inspectTask: (id, data) => api.post(`/housekeeping/tasks/${id}/inspect`, data),

  // 6. Supplies & Consumables
  listSupplies: (params) => api.get('/housekeeping/supplies', { params }),
  getSupplyById: (id) => api.get(`/housekeeping/supplies/${id}`),
  requestSupplies: (data) => api.post('/housekeeping/supplies/request', data),
  approveSupply: (id, data) => api.post(`/housekeeping/supplies/${id}/approve`, data),
  issueSupply: (id, data) => api.post(`/housekeeping/supplies/${id}/issue`, data),
  returnSupply: (id, data) => api.post(`/housekeeping/supplies/${id}/return`, data),

  // 7. Exceptions
  listExceptions: (params) => api.get('/housekeeping/exceptions', { params }),
  getExceptionById: (id) => api.get(`/housekeeping/exceptions/${id}`),
  createException: (data) => api.post('/housekeeping/exceptions', data),
  updateException: (id, data) => api.patch(`/housekeeping/exceptions/${id}`, data),
  resolveException: (id, data) => api.post(`/housekeeping/exceptions/${id}/resolve`, data),

  // 8. RPA Automation
  syncTurnovers: () => api.post('/housekeeping/rpa/sync-turnovers'),
  triggerRpaJob: (data) => api.post('/housekeeping/rpa/trigger', data),
  syncTaskStatus: (id, data) => api.post(`/housekeeping/rpa/tasks/${id}/sync`, data),

  // 9. Analytics
  getDashboardMetrics: () => api.get('/housekeeping/analytics/dashboard'),
  getTaskAnalytics: () => api.get('/housekeeping/analytics/tasks'),
  getSlaAnalytics: () => api.get('/housekeeping/analytics/sla'),
  getStaffAnalytics: () => api.get('/housekeeping/analytics/staff'),
  getTurnoverAnalytics: () => api.get('/housekeeping/analytics/turnover')
};

export default housekeepingService;
