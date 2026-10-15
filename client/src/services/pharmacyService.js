import api from './api';

const pharmacyService = {
  // ==========================================
  // 1. Medicine Master Catalog
  // ==========================================
  getMedicines: (params) => api.get('/pharmacy/medicines', { params }),
  getMedicineById: (medicineId) => api.get(`/pharmacy/medicines/${medicineId}`),
  createMedicine: (data) => api.post('/pharmacy/medicines', data),
  updateMedicine: (medicineId, data) => api.put(`/pharmacy/medicines/${medicineId}`, data),
  updateMedicineStatus: (medicineId, status) => api.patch(`/pharmacy/medicines/${medicineId}/status`, { status }),
  getAvailability: (medicineId) => api.get(`/pharmacy/availability/${medicineId}`),

  // ==========================================
  // 2. Prescriptions
  // ==========================================
  getPrescriptions: (params) => api.get('/pharmacy/prescriptions', { params }),
  getPrescriptionById: (id) => api.get(`/pharmacy/prescriptions/${id}`),
  createPrescription: (data) => api.post('/pharmacy/prescriptions', data),
  sendToPharmacy: (id, data) => api.post(`/pharmacy/prescriptions/${id}/send`, data),
  validatePrescription: (id) => api.post(`/pharmacy/prescriptions/${id}/validate`),
  holdPrescription: (id, reason) => api.post(`/pharmacy/prescriptions/${id}/hold`, { reason }),
  cancelPrescription: (id, reason) => api.post(`/pharmacy/prescriptions/${id}/cancel`, { reason }),

  // ==========================================
  // 3. Pharmacy Orders
  // ==========================================
  getOrders: (params) => api.get('/pharmacy/orders', { params }),
  getOrderById: (id) => api.get(`/pharmacy/orders/${id}`),
  receiveOrder: (id) => api.post(`/pharmacy/orders/${id}/receive`),
  reserveStock: (id, data) => api.post(`/pharmacy/orders/${id}/reserve`, data),
  releaseReservation: (id) => api.delete(`/pharmacy/orders/${id}/reservation`),
  holdOrder: (id, reason) => api.post(`/pharmacy/orders/${id}/hold`, { reason }),
  cancelOrder: (id, reason) => api.post(`/pharmacy/orders/${id}/cancel`, { reason }),

  // ==========================================
  // 4. Dispensing Console
  // ==========================================
  dispense: (data) => api.post('/pharmacy/dispensing', data),
  getDispensingRecords: (params) => api.get('/pharmacy/dispensing', { params }),
  getDispensingRecordById: (id) => api.get(`/pharmacy/dispensing/${id}`),

  // ==========================================
  // 5. Pharmacy Returns
  // ==========================================
  createReturn: (data) => api.post('/pharmacy/returns', data),
  getReturns: (params) => api.get('/pharmacy/returns', { params }),
  getReturnById: (id) => api.get(`/pharmacy/returns/${id}`),
  reviewReturn: (id, data) => api.post(`/pharmacy/returns/${id}/approve`, data),
  rejectReturn: (id, data) => api.post(`/pharmacy/returns/${id}/reject`, data),
  processReturn: (id, data) => api.post(`/pharmacy/returns/${id}/process`, data),

  // ==========================================
  // 6. Reports & Analytics
  // ==========================================
  getDashboardKPIs: () => api.get('/pharmacy/reports/kpis'),
  getDispensingReport: (params) => api.get('/pharmacy/reports/dispensing', { params }),
  getOrdersReport: (params) => api.get('/pharmacy/reports/orders', { params }),
  getOutOfStockReport: () => api.get('/pharmacy/reports/out-of-stock'),
  getNearExpiryReport: (days = 30) => api.get('/pharmacy/reports/near-expiry', { params: { days } })
};

export default pharmacyService;
