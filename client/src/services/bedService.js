import api from './api';

export const bedService = {
  // Operational Metrics & Dashboard
  getAvailabilityDashboard: () => api.get('/beds/availability'),

  // Accommodation Categories
  getCategories: (params) => api.get('/accommodation-categories', { params }),
  createCategory: (data) => api.post('/accommodation-categories', data),
  updateCategory: (id, data) => api.patch(`/accommodation-categories/${id}`, data),

  // Wards & Rooms
  getWards: (params) => api.get('/wards', { params }),
  getWardById: (id) => api.get(`/wards/${id}`),
  createWard: (data) => api.post('/wards', data),
  updateWard: (id, data) => api.patch(`/wards/${id}`, data),
  getRooms: (params) => api.get('/rooms', { params }),
  createRoom: (data) => api.post('/rooms', data),

  // Beds Inventory & Details
  getBeds: (params) => api.get('/beds', { params }),
  getBedById: (bedId) => api.get(`/beds/${bedId}`),
  createBed: (data) => api.post('/beds', data),
  updateBed: (bedId, data) => api.patch(`/beds/${bedId}`, data),

  // Search Engine & Compatibility Filtering
  searchBeds: (payload) => api.post('/beds/search', payload),
  findSuitableBeds: (payload) => api.post('/beds/suitable', payload),

  // Reservations
  getReservations: (params) => api.get('/bed-reservations', { params }),
  reserveBed: (payload) => api.post('/bed-reservations', payload),
  cancelReservation: (bedId, data) => api.post(`/beds/${bedId}/cancel-reservation`, data),

  // Assignments
  getAssignments: (params) => api.get('/bed-assignments', { params }),
  assignBed: (payload) => api.post('/bed-assignments', payload),

  // Transfers
  transferBed: (payload) => api.post('/bed-transfers', payload),

  // Release (Discharge & Vacate)
  releaseBed: (bedId, data) => api.post(`/beds/${bedId}/release`, data),

  // State Machine Transitions (Available, Maintenance, Blocked, etc.)
  updateBedStatus: (bedId, payload) => api.patch(`/beds/${bedId}/status`, payload),

  // History & Audit Timeline
  getBedHistory: (bedId) => api.get(`/beds/${bedId}/history`),

  // Housekeeping Tasks
  getHousekeepingTasks: (params) => api.get('/housekeeping/tasks', { params }),
  completeCleaning: (payload) => api.post('/housekeeping/complete', payload),

  // Waiting List
  getWaitingList: (params) => api.get('/beds/waiting-list', { params }),
  addToWaitingList: (payload) => api.post('/beds/waiting-list', payload),

  // RPA & Reconciliation
  reconcileInventory: (payload) => api.post('/beds/reconcile', payload)
};

export default bedService;
