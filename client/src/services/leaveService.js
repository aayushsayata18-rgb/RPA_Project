import api from './api';

export const leaveService = {
  // Leave Types
  getLeaveTypes: (params) => api.get('/leave/types', { params }),
  getLeaveTypeById: (id) => api.get(`/leave/types/${id}`),
  createLeaveType: (data) => api.post('/leave/types', data),
  updateLeaveType: (id, data) => api.patch(`/leave/types/${id}`, data),

  // Policies
  getLeavePolicies: (params) => api.get('/leave/policies', { params }),
  createLeavePolicy: (data) => api.post('/leave/policies', data),
  updateLeavePolicy: (id, data) => api.patch(`/leave/policies/${id}`, data),

  // Leave Requests
  getLeaveRequests: (params) => api.get('/leave/requests', { params }),
  getLeaveRequestById: (id) => api.get(`/leave/requests/${id}`),
  createLeaveRequest: (data) => api.post('/leave/requests', data),
  approveLeaveRequest: (id, data) => api.post(`/leave/requests/${id}/approve`, data),
  rejectLeaveRequest: (id, data) => api.post(`/leave/requests/${id}/reject`, data),
  withdrawLeaveRequest: (id) => api.post(`/leave/requests/${id}/withdraw`),

  // Cancellation
  requestCancellation: (id, data) => api.post(`/leave/requests/${id}/cancellation`, data),
  approveCancellation: (id, data) => api.post(`/leave/cancellations/${id}/approve`, data),
  rejectCancellation: (id, data) => api.post(`/leave/cancellations/${id}/reject`, data),

  // Balances & Ledger
  getBalances: (params) => api.get('/leave/balances', { params }),
  getEmployeeBalances: (employeeId, params) => api.get(`/leave/balances/${employeeId}`, { params }),
  getLedger: (employeeId, params) => api.get(`/leave/ledger/${employeeId}`, { params }),
  adjustBalance: (data) => api.post('/leave/balances/adjust', data),

  // Accrual & Carry Forward
  runAccrual: (data) => api.post('/leave/accrual/run', data),
  runCarryForward: (data) => api.post('/leave/carry-forward/run', data),

  // Reports
  getSummaryReport: (params) => api.get('/leave/reports/summary', { params }),
  getDepartmentReport: (params) => api.get('/leave/reports/department', { params }),
  getUtilizationReport: (params) => api.get('/leave/reports/utilization', { params }),
  getExceptionsReport: () => api.get('/leave/reports/exceptions'),

  // Holidays
  getHolidays: (params) => api.get('/leave/holidays', { params }),
  createHoliday: (data) => api.post('/leave/holidays', data),

  // Employee Self-Service
  getMyLeave: () => api.get('/me/leave'),
  getMyBalances: () => api.get('/me/leave/balances'),
  createMyLeaveRequest: (data) => api.post('/me/leave/requests', data),

  // RPA Integration
  rpaImportLeave: (data) => api.post('/leave/rpa/import', data),
  rpaSyncLeave: (data) => api.post('/leave/rpa/sync', data)
};

export default leaveService;
