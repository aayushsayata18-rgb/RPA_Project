import api from './api';

export const bedService = {
  getWards: () => api.get('/beds/wards'),
  getBeds: (params) => api.get('/beds/beds', { params }),
  findSuitableBeds: (payload) => api.post('/beds/beds/suitable', payload),
  reserveBed: (bedId, data) => api.post(`/beds/beds/${bedId}/reserve`, data),
  releaseBed: (bedId, data) => api.post(`/beds/beds/${bedId}/release`, data),
  updateBedStatus: (bedId, status) => api.put(`/beds/beds/${bedId}/status`, { status })
};

export default bedService;
