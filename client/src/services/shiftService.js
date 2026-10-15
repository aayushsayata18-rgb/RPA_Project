import api from './api';

export const shiftService = {
  // Shift Definitions
  getDefinitions: (params) => api.get('/shifts/definitions', { params }),
  getDefinitionById: (id) => api.get(`/shifts/definitions/${id}`),
  createDefinition: (data) => api.post('/shifts/definitions', data),
  updateDefinition: (id, data) => api.patch(`/shifts/definitions/${id}`, data),
  archiveDefinition: (id) => api.post(`/shifts/definitions/${id}/archive`),

  // Rosters
  getRosters: (params) => api.get('/shifts/rosters', { params }),
  getRosterById: (id) => api.get(`/shifts/rosters/${id}`),
  createRoster: (data) => api.post('/shifts/rosters', data),
  getRosterCalendar: (id) => api.get(`/shifts/rosters/${id}/calendar`),
  submitRoster: (id) => api.post(`/shifts/rosters/${id}/submit`),
  approveRoster: (id) => api.post(`/shifts/rosters/${id}/approve`),
  publishRoster: (id) => api.post(`/shifts/rosters/${id}/publish`),
  lockRoster: (id) => api.post(`/shifts/rosters/${id}/lock`),

  // Shift Assignments
  getAssignments: (params) => api.get('/shifts/assignments', { params }),
  createAssignment: (data) => api.post('/shifts/assignments', data),
  updateAssignment: (id, data) => api.patch(`/shifts/assignments/${id}`, data),
  batchImportAssignments: (data) => api.post('/shifts/assignments/import', data),

  // Employee Self-Service
  getMySchedule: (params) => api.get('/my-schedule', { params }),

  // Shift Change Requests
  getChangeRequests: (params) => api.get('/shifts/change-requests', { params }),
  createChangeRequest: (data) => api.post('/shifts/change-requests', data),
  approveChangeRequest: (id, data) => api.post(`/shifts/change-requests/${id}/approve`, data),
  rejectChangeRequest: (id, data) => api.post(`/shifts/change-requests/${id}/reject`, data),

  // Shift Swap Requests
  getSwapRequests: (params) => api.get('/shifts/swap-requests', { params }),
  createSwapRequest: (data) => api.post('/shifts/swap-requests', data),
  acceptSwapTarget: (id, data) => api.post(`/shifts/swap-requests/${id}/accept`, data),
  rejectSwapTarget: (id, data) => api.post(`/shifts/swap-requests/${id}/target-reject`, data),
  approveSwap: (id, data) => api.post(`/shifts/swap-requests/${id}/approve`, data),
  rejectSwap: (id, data) => api.post(`/shifts/swap-requests/${id}/reject`, data),

  // Conflicts
  getConflicts: (params) => api.get('/shifts/conflicts', { params }),
  detectConflicts: (rosterId) => api.post('/shifts/conflicts/detect', { rosterId }),
  resolveConflict: (id, data) => api.post(`/shifts/conflicts/${id}/resolve`, data),

  // Staffing Coverage & Reports
  getCoverage: (params) => api.get('/shifts/coverage', { params }),
  getEmployeeScheduleReport: (params) => api.get('/shifts/reports/employee-schedule', { params }),
  getShiftUtilizationReport: (params) => api.get('/shifts/reports/utilization', { params }),
  downloadScheduleCsv: (params) => api.get('/shifts/reports/employee-schedule/csv', { params, responseType: 'blob' })
};

export default shiftService;
