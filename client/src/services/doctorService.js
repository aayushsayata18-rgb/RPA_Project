import api from './api';

export const doctorService = {
  // Get all active departments and their specialties
  getDepartments: async () => {
    const response = await api.get('/doctors/departments');
    return response.data;
  },

  // Get doctors list with optional department/specialty/search filter
  getDoctors: async (params = {}) => {
    const response = await api.get('/doctors', { params });
    return response.data;
  },

  // Get single doctor details and full weekly schedule
  getDoctorById: async (doctorId) => {
    const response = await api.get(`/doctors/${doctorId}`);
    return response.data;
  },

  // Record doctor leave
  recordLeave: async (doctorId, leaveData) => {
    const response = await api.post(`/doctors/${doctorId}/leave`, leaveData);
    return response.data;
  }
};
