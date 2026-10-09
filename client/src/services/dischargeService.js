import api from './api';

export const dischargeService = {
  // --- Discharge Requests ---
  createDischargeRequest: (data) => api.post('/discharge-requests', data),
  getDischargeRequests: (params) => api.get('/discharge-requests', { params }),
  getDischargeRequestById: (id) => api.get(`/discharge-requests/${id}`),
  cancelDischargeRequest: (id, cancellationReason) => api.post(`/discharge-requests/${id}/cancel`, { cancellationReason }),

  // --- Discharges Orchestration ---
  getDischarges: (params) => api.get('/discharges', { params }),
  getDischargeById: (id) => api.get(`/discharges/${id}`),
  getDischargeStats: () => api.get('/discharges/stats/summary'),
  initiateDischarge: (data) => api.post('/discharges', data),
  processDischarge: (id, payload = {}) => api.post(`/discharges/${id}/process`, payload),
  completeDischarge: (id, payload = {}) => api.post(`/discharges/${id}/complete`, payload),
  cancelDischarge: (id, cancellationReason) => api.post(`/discharges/${id}/cancel`, { cancellationReason }),

  // --- Sub-resources ---
  getPendingItems: (id) => api.get(`/discharges/${id}/pending-items`),
  getChecklist: (id) => api.get(`/discharges/${id}/checklist`),
  getDocuments: (id) => api.get(`/discharges/${id}/documents`),
  releaseBed: (id) => api.post(`/discharges/${id}/release-bed`),

  // --- Billing Integration ---
  getAdmissionCharges: (admissionId, patientId) => api.get(`/billing/admissions/${admissionId}/charges`, { params: { patientId } }),
  finalizeInvoice: (data) => api.post('/billing/invoices/finalize', data),
  getInvoiceById: (id) => api.get(`/billing/invoices/${id}`),
  raiseBillingDispute: (data) => api.post('/billing/queries', data),

  // --- Payment Integration ---
  createPaymentSession: (data) => api.post('/payments/checkout-session', data),
  verifyPaymentCallback: (data) => api.post('/payments/verify', data),
  recordCounterPayment: (data) => api.post('/payments/counter', data),
  getTransactions: (params) => api.get('/payments/transactions', { params })
};

export default dischargeService;
