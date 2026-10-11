import api from './api';

export const billingService = {
  // --- Invoices ---
  getInvoices: (params) => api.get('/billing/invoices', { params }),
  getInvoiceById: (id) => api.get(`/billing/invoices/${id}`),
  createDraftInvoice: (data) => api.post('/billing/invoices', data),
  finalizeInvoice: (id) => api.post(`/billing/invoices/${id}/finalize`),
  finalizeInvoiceDischarge: (data) => api.post('/billing/invoices/finalize', data),
  cancelInvoice: (id, cancellationReason) => api.post(`/billing/invoices/${id}/cancel`, { cancellationReason }),
  applyDepositToInvoice: (id, data) => api.post(`/billing/invoices/${id}/apply-deposit`, data),

  // --- Billable Items / Charges ---
  getBillableItems: (params) => api.get('/billing/billable-items', { params }),
  getBillableItemById: (id) => api.get(`/billing/billable-items/${id}`),
  addBillableItem: (data) => api.post('/billing/billable-items', data),
  validateBillableItem: (id) => api.post(`/billing/billable-items/${id}/validate`),
  getAdmissionCharges: (admissionId, patientId) => api.get(`/billing/admissions/${admissionId}/charges`, { params: { patientId } }),

  // --- Deposits ---
  getDeposits: (params) => api.get('/billing/deposits', { params }),
  recordDeposit: (data) => api.post('/billing/deposits', data),
  applyDeposit: (depositId, data) => api.post(`/billing/deposits/${depositId}/apply`, data),

  // --- Financial Adjustments ---
  getAdjustments: (params) => api.get('/billing/adjustments', { params }),
  requestAdjustment: (data) => api.post('/billing/adjustments', data),
  approveAdjustment: (id) => api.post(`/billing/adjustments/${id}/approve`),
  rejectAdjustment: (id, rejectionReason) => api.post(`/billing/adjustments/${id}/reject`, { rejectionReason }),

  // --- Billing Queries & Disputes ---
  getQueries: (params) => api.get('/billing/queries', { params }),
  createQuery: (data) => api.post('/billing/queries', data),
  resolveQuery: (id, resolution) => api.post(`/billing/queries/${id}/resolve`, { resolution }),

  // --- Rate Cards ---
  getRates: (params) => api.get('/billing/rates', { params }),
  createRate: (data) => api.post('/billing/rates', data),
  updateRate: (id, data) => api.patch(`/billing/rates/${id}`, data),

  // --- Payments & Cashier ---
  createPaymentSession: (data) => api.post('/payments/checkout-session', data),
  verifyPayment: (data) => api.post('/payments/verify', data),
  recordCounterPayment: (data) => api.post('/payments/counter', data),
  getTransactions: (params) => api.get('/payments/transactions', { params }),
  getTransactionById: (id) => api.get(`/payments/transactions/${id}`),
  getReceipt: (receiptNumber) => api.get(`/payments/receipt/${receiptNumber}`),
  getInvoicePayments: (invoiceNumber) => api.get(`/payments/invoice/${invoiceNumber}`),

  // --- Executive Dashboard & Reconciliation ---
  getDashboardSummary: () => api.get('/billing/dashboard-summary'),
  reconcileGateway: (settlementRecords) => api.post('/billing/reports/reconcile', { settlementRecords })
};

export default billingService;
