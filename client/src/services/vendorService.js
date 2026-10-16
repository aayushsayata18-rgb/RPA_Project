import api from './api';

export const vendorService = {
  // Master Vendor APIs
  getVendors: (params) => api.get('/vendors', { params }),
  getVendorById: (id) => api.get(`/vendors/${id}`),
  createVendor: (data) => api.post('/vendors', data),
  updateVendor: (id, data) => api.put(`/vendors/${id}`, data),
  updateStatus: (id, statusData) => api.patch(`/vendors/${id}/status`, statusData),
  checkDuplicate: (data) => api.post('/vendors/check-duplicate', data),
  getDashboardKPIs: () => api.get('/vendors/stats'),
  logCommunication: (id, data) => api.post(`/vendors/${id}/communications`, data),

  // Contacts
  getContacts: (id) => api.get(`/vendors/${id}/contacts`),
  createContact: (id, data) => api.post(`/vendors/${id}/contacts`, data),
  updateContact: (id, contactId, data) => api.put(`/vendors/${id}/contacts/${contactId}`, data),
  deleteContact: (id, contactId) => api.delete(`/vendors/${id}/contacts/${contactId}`),

  // Addresses
  getAddresses: (id) => api.get(`/vendors/${id}/addresses`),
  createAddress: (id, data) => api.post(`/vendors/${id}/addresses`, data),

  // Documents & Expiry
  getDocuments: (id) => api.get(`/vendors/${id}/documents`),
  uploadDocument: (id, data) => api.post(`/vendors/${id}/documents`, data),
  verifyDocument: (id, docId, data) => api.post(`/vendors/${id}/documents/${docId}/verify`, data),
  rejectDocument: (id, docId, data) => api.post(`/vendors/${id}/documents/${docId}/reject`, data),
  checkExpiry: (warningDays = 30) => api.get('/vendors/documents/check-expiry', { params: { warningDays } }),

  // Verification Workflow
  getVerifications: (id) => api.get(`/vendors/${id}/verification`),
  requestVerification: (id, data) => api.post(`/vendors/${id}/verification`, data),
  addEvidence: (id, verifId, data) => api.post(`/vendors/${id}/verification/${verifId}/evidence`, data),
  completeVerification: (id, verifId, data) => api.post(`/vendors/${id}/verification/${verifId}/complete`, data),

  // Contracts
  getContracts: (id) => api.get(`/vendors/${id}/contracts`),
  createContract: (id, data) => api.post(`/vendors/${id}/contracts`, data),
  updateContract: (id, contractId, data) => api.put(`/vendors/${id}/contracts/${contractId}`, data),
  approveContract: (id, contractId) => api.post(`/vendors/${id}/contracts/${contractId}/approve`),
  renewContract: (id, contractId, data) => api.post(`/vendors/${id}/contracts/${contractId}/renew`, data),
  terminateContract: (id, contractId, data) => api.post(`/vendors/${id}/contracts/${contractId}/terminate`, data),
  checkExpiringContracts: () => api.get('/vendors/contracts/check-expiring'),

  // Performance Reviews & Metrics
  getPerformance: (id, params) => api.get(`/vendors/${id}/performance`, { params }),
  createReview: (id, data) => api.post(`/vendors/${id}/performance/reviews`, data),
  completeReview: (id, reviewId) => api.post(`/vendors/${id}/performance/reviews/${reviewId}/complete`),

  // Issues & Grievances
  getIssuesByVendor: (id) => api.get(`/vendors/${id}/issues`),
  listAllIssues: (params) => api.get('/vendors/issues/all', { params }),
  createIssue: (id, data) => api.post(`/vendors/${id}/issues`, data),
  respondToIssue: (issueId, data) => api.post(`/vendors/issues/${issueId}/respond`, data),
  resolveIssue: (id, issueId, data) => api.post(`/vendors/${id}/issues/${issueId}/resolve`, data),
  updateIssueStatus: (issueId, data) => api.patch(`/vendors/issues/${issueId}/status`, data),

  // Change Requests
  getChangeRequests: (id) => api.get(`/vendors/${id}/change-requests`),
  reviewChangeRequest: (id, data) => api.post(`/vendors/change-requests/${id}/review`, data)
};

export default vendorService;
