import api from './api';

export const appointmentService = {
  // Query available slots for a doctor on a specific date
  getAvailableSlots: async (doctorId, date, appointmentType = 'NEW_CONSULTATION') => {
    const response = await api.get('/appointments/available-slots', {
      params: { doctorId, date, appointmentType }
    });
    return response.data;
  },

  // Create / Book a new appointment
  createAppointment: async (appointmentData) => {
    const response = await api.post('/appointments', appointmentData);
    return response.data;
  },

  // Get appointments with filters and pagination
  getAppointments: async (params = {}) => {
    const response = await api.get('/appointments', { params });
    return response.data;
  },

  // Get appointment details by ID
  getAppointmentById: async (appointmentId) => {
    const response = await api.get(`/appointments/${appointmentId}`);
    return response.data;
  },

  // Cancel appointment
  cancelAppointment: async (appointmentId, cancelData) => {
    const response = await api.post(`/appointments/${appointmentId}/cancel`, cancelData);
    return response.data;
  },

  // Reschedule appointment
  rescheduleAppointment: async (appointmentId, rescheduleData) => {
    const response = await api.post(`/appointments/${appointmentId}/reschedule`, rescheduleData);
    return response.data;
  },

  // Check-In arrival
  checkInAppointment: async (appointmentId) => {
    const response = await api.post(`/appointments/${appointmentId}/check-in`);
    return response.data;
  },

  // Process No-Shows
  processNoShows: async (data = {}) => {
    const response = await api.post('/appointments/process-no-shows', data);
    return response.data;
  },

  // Trigger due reminders
  triggerReminders: async () => {
    const response = await api.post('/appointments/trigger-reminders');
    return response.data;
  },

  // Get Stats
  getStats: async () => {
    const response = await api.get('/appointments/stats');
    return response.data;
  }
};
