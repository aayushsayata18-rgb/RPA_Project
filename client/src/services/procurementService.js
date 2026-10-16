import api from './api';

export const ProcurementService = {
  // Dashboard & Reports
  getDashboardKPIs: () => api.get('/procurement/stats'),
  getSpendAnalytics: () => api.get('/procurement/reports/spend'),
  getDeliveryPerformance: () => api.get('/procurement/reports/delivery'),

  // Exceptions & Vendor Change Requests
  getExceptions: (params) => api.get('/procurement/exceptions', { params }),
  resolveException: (exceptionId, data) => api.post(`/procurement/exceptions/${exceptionId}/resolve`, data),
  getChangeRequests: () => api.get('/procurement/change-requests'),
  reviewChangeRequest: (id, data) => api.post(`/procurement/change-requests/${id}/review`, data),

  // Purchase Requests
  getRequests: (params) => api.get('/procurement/requests', { params }),
  getRequestById: (id) => api.get(`/procurement/requests/${id}`),
  createRequest: (data) => api.post('/procurement/requests', data),
  updateRequest: (id, data) => api.put(`/procurement/requests/${id}`, data),
  submitRequest: (id) => api.post(`/procurement/requests/${id}/submit`),
  approveRequest: (id, data) => api.post(`/procurement/requests/${id}/approve`, data),
  rejectRequest: (id, data) => api.post(`/procurement/requests/${id}/reject`, data),
  returnRequest: (id, data) => api.post(`/procurement/requests/${id}/return`, data),
  cancelRequest: (id, data) => api.post(`/procurement/requests/${id}/cancel`, data),

  // RFQs
  getRfqs: (params) => api.get('/procurement/rfqs', { params }),
  getRfqById: (id) => api.get(`/procurement/rfqs/${id}`),
  createRfq: (data) => api.post('/procurement/rfqs', data),
  issueRfq: (id) => api.post(`/procurement/rfqs/${id}/issue`),
  closeRfq: (id) => api.post(`/procurement/rfqs/${id}/close`),

  // Quotations
  getQuotations: (params) => api.get('/procurement/quotations', { params }),
  getQuotationById: (id) => api.get(`/procurement/quotations/${id}`),
  recordQuotation: (data) => api.post('/procurement/quotations', data),
  updateQuotationStatus: (id, data) => api.put(`/procurement/quotations/${id}`, data),

  // Quotation Comparisons
  getComparisons: (params) => api.get('/procurement/comparisons', { params }),
  getComparisonById: (id) => api.get(`/procurement/comparisons/${id}`),
  createComparison: (data) => api.post('/procurement/comparisons', data),
  selectVendor: (id, data) => api.post(`/procurement/comparisons/${id}/select`, data),

  // Purchase Orders
  getPurchaseOrders: (params) => api.get('/procurement/purchase-orders', { params }),
  getPurchaseOrderById: (id) => api.get(`/procurement/purchase-orders/${id}`),
  createPurchaseOrder: (data) => api.post('/procurement/purchase-orders', data),
  submitPoForApproval: (id) => api.post(`/procurement/purchase-orders/${id}/submit`),
  approvePurchaseOrder: (id, data) => api.post(`/procurement/purchase-orders/${id}/approve`, data),
  rejectPurchaseOrder: (id, data) => api.post(`/procurement/purchase-orders/${id}/reject`, data),
  sendPoToVendor: (id) => api.post(`/procurement/purchase-orders/${id}/send`),
  recordVendorAcknowledgement: (id, data) => api.post(`/procurement/purchase-orders/${id}/acknowledge`, data),
  createPoRevision: (id, data) => api.post(`/procurement/purchase-orders/${id}/revise`, data),
  cancelPurchaseOrder: (id, data) => api.post(`/procurement/purchase-orders/${id}/cancel`, data),

  // Deliveries
  getDeliveries: (params) => api.get('/procurement/deliveries', { params }),
  getDeliveryById: (id) => api.get(`/procurement/deliveries/${id}`),
  createDelivery: (data) => api.post('/procurement/deliveries', data),
  updateDeliveryStatus: (id, data) => api.put(`/procurement/deliveries/${id}`, data),
  checkDelayedDeliveries: () => api.post('/procurement/deliveries/check-delayed'),

  // Supplier Invoices & Three-Way Matching
  getInvoices: (params) => api.get('/procurement/invoices', { params }),
  getInvoiceById: (id) => api.get(`/procurement/invoices/${id}`),
  registerInvoice: (data) => api.post('/procurement/invoices', data),
  performMatch: (id) => api.post(`/procurement/invoices/${id}/match`),
  approveInvoiceMatch: (id) => api.post(`/procurement/invoices/${id}/approve`)
};

export default ProcurementService;
