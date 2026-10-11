import api from './api';

export const insuranceClaimService = {
  // Dashboard & Statistics (Section 74)
  getDashboardStats: async () => {
    const res = await api.get('/insurance/claims/dashboard/stats');
    return res.data;
  },

  // Claims List & CRUD (Section 63)
  getClaims: async (params = {}) => {
    const res = await api.get('/insurance/claims', { params });
    return res.data;
  },

  getClaimById: async (claimId) => {
    const res = await api.get(`/insurance/claims/${claimId}`);
    return res.data;
  },

  createClaim: async (data) => {
    const res = await api.post('/insurance/claims', data);
    return res.data;
  },

  updateClaim: async (claimId, data) => {
    const res = await api.put(`/insurance/claims/${claimId}`, data);
    return res.data;
  },

  validateClaim: async (claimId) => {
    const res = await api.post(`/insurance/claims/${claimId}/validate`);
    return res.data;
  },

  markReady: async (claimId) => {
    const res = await api.post(`/insurance/claims/${claimId}/ready`);
    return res.data;
  },

  submitClaim: async (claimId, payload = {}) => {
    const res = await api.post(`/insurance/claims/${claimId}/submit`, payload);
    return res.data;
  },

  cancelClaim: async (claimId, reason = '') => {
    const res = await api.post(`/insurance/claims/${claimId}/cancel`, { reason });
    return res.data;
  },

  // Status & Polling (Section 32 & 63)
  checkClaimStatus: async (claimId, payload = {}) => {
    const res = await api.post(`/insurance/claims/${claimId}/check-status`, payload);
    return res.data;
  },

  getStatusHistory: async (claimId) => {
    const res = await api.get(`/insurance/claims/${claimId}/status-history`);
    return res.data;
  },

  // Queries (Section 37 & 63)
  getQueries: async (claimId) => {
    const res = await api.get(`/insurance/claims/${claimId}/queries`);
    return res.data;
  },

  createQuery: async (claimId, queryData) => {
    const res = await api.post(`/insurance/claims/${claimId}/queries`, queryData);
    return res.data;
  },

  respondToQuery: async (claimId, queryId, responseData) => {
    const res = await api.post(`/insurance/claims/${claimId}/queries/${queryId}/respond`, responseData);
    return res.data;
  },

  resolveQuery: async (claimId, queryId) => {
    const res = await api.post(`/insurance/claims/${claimId}/queries/${queryId}/resolve`);
    return res.data;
  },

  // Documents (Section 20 & 63)
  getDocuments: async (claimId) => {
    const res = await api.get(`/insurance/claims/${claimId}/documents`);
    return res.data;
  },

  addDocument: async (claimId, documentData) => {
    const res = await api.post(`/insurance/claims/${claimId}/documents`, documentData);
    return res.data;
  },

  deleteDocument: async (claimId, documentId) => {
    const res = await api.delete(`/insurance/claims/${claimId}/documents/${documentId}`);
    return res.data;
  },

  // Settlement & Billing Reconciliation (Section 44, 47 & 63)
  getSettlement: async (claimId) => {
    const res = await api.get(`/insurance/claims/${claimId}/settlement`);
    return res.data;
  },

  recordSettlement: async (claimId, settlementData) => {
    const res = await api.post(`/insurance/claims/${claimId}/settlement`, settlementData);
    return res.data;
  },

  reconcileClaim: async (claimId) => {
    const res = await api.post(`/insurance/claims/${claimId}/reconcile`);
    return res.data;
  },

  // Integration queries (Section 46)
  getPatientClaims: async (patientId) => {
    const res = await api.get(`/insurance/claims/patient/${patientId}`);
    return res.data;
  },

  getInvoiceClaims: async (invoiceId) => {
    const res = await api.get(`/insurance/claims/invoice/${invoiceId}`);
    return res.data;
  }
};

export default insuranceClaimService;
