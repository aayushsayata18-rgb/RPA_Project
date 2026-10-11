import api from './api';

export const insuranceService = {
  // Dashboard & Stats
  getDashboardStats: async () => {
    const res = await api.get('/insurance/dashboard/stats');
    return res.data;
  },

  // Verifications
  listVerifications: async (params = {}) => {
    const res = await api.get('/insurance/verifications', { params });
    return res.data;
  },

  getVerificationById: async (verificationId) => {
    const res = await api.get(`/insurance/verifications/${verificationId}`);
    return res.data;
  },

  requestVerification: async (policyId, payload = {}) => {
    const res = await api.post(`/insurance/policies/${policyId}/verify`, payload);
    return res.data;
  },

  retryVerification: async (verificationId) => {
    const res = await api.post(`/insurance/verifications/${verificationId}/retry`);
    return res.data;
  },

  recordManualVerification: async (verificationId, data) => {
    const res = await api.post(`/insurance/verifications/${verificationId}/manual`, data);
    return res.data;
  },

  // Policies
  getPatientPolicies: async (patientId) => {
    const res = await api.get(`/insurance/patients/${patientId}/policies`);
    return res.data;
  },

  getActivePolicyForBilling: async (patientId) => {
    const res = await api.get(`/insurance/patients/${patientId}/active`);
    return res.data;
  },

  getPolicyById: async (policyId) => {
    const res = await api.get(`/insurance/policies/${policyId}`);
    return res.data;
  },

  createPolicy: async (data) => {
    const res = await api.post('/insurance/policies', data);
    return res.data;
  },

  checkDuplicatePolicy: async (data) => {
    const res = await api.post('/insurance/policies/check-duplicate', data);
    return res.data;
  },

  updatePolicy: async (policyId, data) => {
    const res = await api.put(`/insurance/policies/${policyId}`, data);
    return res.data;
  },

  deletePolicy: async (policyId) => {
    const res = await api.delete(`/insurance/policies/${policyId}`);
    return res.data;
  },

  // Exceptions
  listExceptions: async (params = {}) => {
    const res = await api.get('/insurance/exceptions', { params });
    return res.data;
  },

  assignException: async (exceptionId, assignedTo) => {
    const res = await api.post(`/insurance/exceptions/${exceptionId}/assign`, { assignedTo });
    return res.data;
  },

  resolveException: async (exceptionId, data) => {
    const res = await api.post(`/insurance/exceptions/${exceptionId}/resolve`, data);
    return res.data;
  },

  // Documents & Evidence
  getVerificationEvidence: async (verificationId) => {
    const res = await api.get(`/insurance/verifications/${verificationId}/evidence`);
    return res.data;
  },

  uploadEvidence: async (verificationId, data) => {
    const res = await api.post(`/insurance/verifications/${verificationId}/evidence`, data);
    return res.data;
  },

  getPolicyDocuments: async (policyId) => {
    const res = await api.get(`/insurance/policies/${policyId}/documents`);
    return res.data;
  }
};

export default insuranceService;
