import api from './api';

export const staffService = {
  // Metrics
  getDashboardMetrics: () => api.get('/employees/dashboard/metrics'),

  // Duplicate Check
  checkDuplicates: (data) => api.post('/employees/duplicates/check', data),

  // Employee Directory & CRUD
  getEmployees: (params) => api.get('/employees', { params }),
  getEmployeeById: (id) => api.get(`/employees/${id}`),
  createEmployee: (data) => api.post('/employees', data),
  updateEmployee: (id, data) => api.put(`/employees/${id}`, data),
  updateEmployeeStatus: (id, status, reason) => api.patch(`/employees/${id}/status`, { status, reason }),

  // Onboarding approval
  submitForApproval: (id) => api.post(`/employees/${id}/submit-approval`),
  approveEmployee: (id, comments) => api.post(`/employees/${id}/approve`, { comments }),
  rejectEmployee: (id, reason) => api.post(`/employees/${id}/reject`, { reason }),
  returnForCorrection: (id, comments) => api.post(`/employees/${id}/return-correction`, { comments }),

  // Department Transfer & Role Promotion
  transferEmployee: (id, data) => api.post(`/employees/${id}/transfer`, data),
  updateEmployeeRole: (id, data) => api.post(`/employees/${id}/roles`, data),

  // Offboarding & Termination
  offboardEmployee: (id, data) => api.post(`/employees/${id}/offboard`, data),
  updateOffboardingChecklist: (id, itemIndex, data) => api.put(`/employees/${id}/offboard/checklist/${itemIndex}`, data),

  // History & Documents
  getEmployeeHistory: (id) => api.get(`/employees/${id}/history`),
  getEmployeeDocuments: (id) => api.get(`/employees/${id}/documents`),
  addEmployeeDocument: (id, data) => api.post(`/employees/${id}/documents`, data),

  // Access Requests
  getAccessRequests: (params) => api.get('/access-requests', { params }),
  getEmployeeAccess: (id) => api.get(`/employees/${id}/access`),
  requestAccess: (id, data) => api.post(`/employees/${id}/access-request`, data),
  approveAccessRequest: (requestId) => api.post(`/access-requests/${requestId}/approve`),
  rejectAccessRequest: (requestId, reason) => api.post(`/access-requests/${requestId}/reject`, { reason }),
  provisionAccess: (requestId) => api.post(`/access-requests/${requestId}/provision`),
  revokeAccess: (requestId, reason) => api.post(`/access-requests/${requestId}/revoke`, { reason }),

  // External Sync
  syncEmployee: (id, data) => api.post(`/employees/${id}/sync`, data),
  getEmployeeSyncs: (id) => api.get(`/employees/${id}/sync`)
};

export default staffService;
