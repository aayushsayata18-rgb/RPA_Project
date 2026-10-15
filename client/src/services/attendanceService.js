import api from './api';

export const attendanceService = {
  // Metrics & KPI
  getDashboardMetrics: (date) => api.get('/attendance/dashboard/metrics', { params: { date } }),

  // Attendance Records
  getAttendanceList: (params) => api.get('/attendance', { params }),
  getAttendanceById: (id) => api.get(`/attendance/${id}`),

  // Punches & Manual Entry
  recordPunch: (data) => api.post('/attendance/punch', data),
  createManualAttendance: (data) => api.post('/attendance/manual', data),

  // Batch Imports
  importBatch: (data) => api.post('/attendance/import', data),
  getImportBatches: (params) => api.get('/attendance/imports', { params }),
  getImportBatchById: (id) => api.get(`/attendance/imports/${id}`),

  // Corrections
  getCorrections: (params) => api.get('/attendance/corrections', { params }),
  getCorrectionById: (id) => api.get(`/attendance/corrections/${id}`),
  submitCorrection: (attendanceId, data) => api.post(`/attendance/${attendanceId}/correction`, data),
  approveCorrection: (correctionId, data) => api.post(`/attendance/corrections/${correctionId}/approve`, data),
  rejectCorrection: (correctionId, data) => api.post(`/attendance/corrections/${correctionId}/reject`, data),

  // Reconciliation
  runReconciliation: (data) => api.post('/attendance/reconcile', data),
  getReconciliation: (params) => api.get('/attendance/reconciliation', { params }),

  // Reports
  getDailyReport: (date) => api.get('/attendance/reports/daily', { params: { date } }),
  getMonthlyReport: (params) => api.get('/attendance/reports/monthly', { params }),
  getDepartmentReport: (params) => api.get('/attendance/reports/department', { params }),
  getExceptionReport: (params) => api.get('/attendance/reports/exceptions', { params }),

  // Employee Self-Service
  getMyAttendance: (params) => api.get('/me/attendance', { params })
};

export default attendanceService;
