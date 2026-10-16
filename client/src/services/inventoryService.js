import api from './api';

const inventoryService = {
  // ==========================================
  // 1. Dashboard & Reports
  // ==========================================
  getDashboardKPIs: () => api.get('/inventory/dashboard/kpis'),
  getValuationReport: (params) => api.get('/inventory/reports/valuation', { params }),
  getLedgerReport: (params) => api.get('/inventory/reports/ledger', { params }),
  getNearExpiryReport: (days = 30) => api.get('/inventory/reports/near-expiry', { params: { days } }),
  getLowStockReport: () => api.get('/inventory/reports/low-stock'),

  // ==========================================
  // 2. Inventory Items (Master Catalog)
  // ==========================================
  getItems: (params) => api.get('/inventory/items', { params }),
  getItemById: (id) => api.get(`/inventory/items/${id}`),
  createItem: (data) => api.post('/inventory/items', data),
  updateItem: (id, data) => api.put(`/inventory/items/${id}`, data),
  updateItemStatus: (id, status) => api.patch(`/inventory/items/${id}/status`, { status }),
  checkAvailability: (id, locationId) => api.get(`/inventory/availability/${id}`, { params: { locationId } }),

  // ==========================================
  // 3. Batches
  // ==========================================
  getBatches: (params) => api.get('/inventory/batches', { params }),
  getBatchById: (id) => api.get(`/inventory/batches/${id}`),
  createBatch: (data) => api.post('/inventory/batches', data),
  updateBatchStatus: (id, status, notes) => api.patch(`/inventory/batches/${id}/status`, { status, notes }),

  // ==========================================
  // 4. Goods Receipts
  // ==========================================
  getGoodsReceipts: (params) => api.get('/inventory/goods-receipts', { params }),
  getGoodsReceiptById: (id) => api.get(`/inventory/goods-receipts/${id}`),
  createGoodsReceipt: (data) => api.post('/inventory/goods-receipts', data),

  // ==========================================
  // 5. Stock Movements & Issues
  // ==========================================
  getMovements: (params) => api.get('/inventory/movements', { params }),
  issueStock: (data) => api.post('/inventory/issues', data),

  // ==========================================
  // 6. Reservations
  // ==========================================
  getReservations: (params) => api.get('/inventory/reservations', { params }),
  getReservationById: (id) => api.get(`/inventory/reservations/${id}`),
  createReservation: (data) => api.post('/inventory/reservations', data),
  releaseReservation: (id, releaseReason) => api.post(`/inventory/reservations/${id}/release`, { releaseReason }),
  consumeReservation: (id, quantity) => api.post(`/inventory/reservations/${id}/consume`, { quantity }),

  // ==========================================
  // 7. Transfers
  // ==========================================
  getTransfers: (params) => api.get('/inventory/transfers', { params }),
  getTransferById: (id) => api.get(`/inventory/transfers/${id}`),
  createTransfer: (data) => api.post('/inventory/transfers', data),
  approveTransfer: (id, notes) => api.post(`/inventory/transfers/${id}/approve`, { notes }),
  dispatchTransfer: (id, trackingNumber, notes) => api.post(`/inventory/transfers/${id}/dispatch`, { trackingNumber, notes }),
  receiveTransfer: (id, receivedItems, notes) => api.post(`/inventory/transfers/${id}/receive`, { receivedItems, notes }),
  cancelTransfer: (id, reason) => api.post(`/inventory/transfers/${id}/cancel`, { reason }),

  // ==========================================
  // 8. Adjustments
  // ==========================================
  getAdjustments: (params) => api.get('/inventory/adjustments', { params }),
  getAdjustmentById: (id) => api.get(`/inventory/adjustments/${id}`),
  createAdjustment: (data) => api.post('/inventory/adjustments', data),
  approveAdjustment: (id, notes) => api.post(`/inventory/adjustments/${id}/approve`, { notes }),
  rejectAdjustment: (id, rejectionReason) => api.post(`/inventory/adjustments/${id}/reject`, { rejectionReason }),

  // ==========================================
  // 9. Stock Counts & Sessions
  // ==========================================
  getStockCounts: (params) => api.get('/inventory/stock-counts', { params }),
  getStockCountById: (id) => api.get(`/inventory/stock-counts/${id}`),
  startStockCount: (data) => api.post('/inventory/stock-counts/start', data),
  submitCountSheet: (id, counts) => api.post(`/inventory/stock-counts/${id}/counts`, { counts }),
  completeStockCount: (id, notes) => api.post(`/inventory/stock-counts/${id}/complete`, { notes }),

  // ==========================================
  // 10. Reconciliations
  // ==========================================
  getReconciliations: (params) => api.get('/inventory/reconciliations', { params }),
  getReconciliationById: (id) => api.get(`/inventory/reconciliations/${id}`),
  createReconciliation: (data) => api.post('/inventory/reconciliations', data),
  resolveReconciliation: (id, resolutionAction, reason) => api.post(`/inventory/reconciliations/${id}/resolve`, { resolutionAction, reason }),

  // ==========================================
  // 11. Alerts & Scanners
  // ==========================================
  getAlerts: (params) => api.get('/inventory/alerts', { params }),
  acknowledgeAlert: (id) => api.patch(`/inventory/alerts/${id}/acknowledge`),
  resolveAlert: (id) => api.patch(`/inventory/alerts/${id}/resolve`),
  scanNearExpiry: (nearExpiryDays = 30) => api.post('/inventory/alerts/scan-expiry', null, { params: { nearExpiryDays } }),
  scanLowStock: () => api.post('/inventory/alerts/scan-low-stock'),

  // ==========================================
  // 12. Stock Locations
  // ==========================================
  getLocations: (params) => api.get('/inventory/locations', { params }),
  getLocationById: (id) => api.get(`/inventory/locations/${id}`),
  createLocation: (data) => api.post('/inventory/locations', data),
  updateLocation: (id, data) => api.put(`/inventory/locations/${id}`, data)
};

export default inventoryService;
