import api from './api';

export const opdService = {
  // Process Check-In (Online Self or Front Desk)
  checkIn: async (data) => {
    const response = await api.post('/v1/opd/check-in', data);
    return response.data;
  },

  // Get list of queues
  getQueues: async (params = {}) => {
    const response = await api.get('/v1/opd/queues', { params });
    return response.data;
  },

  // Get specific queue details with ordered tokens
  getQueueById: async (queueId) => {
    const response = await api.get(`/v1/opd/queues/${queueId}`);
    return response.data;
  },

  // Get tokens for a specific queue
  getQueueTokens: async (queueId) => {
    const response = await api.get(`/v1/opd/queues/${queueId}/tokens`);
    return response.data;
  },

  // Get token details
  getTokenById: async (tokenId) => {
    const response = await api.get(`/v1/opd/tokens/${tokenId}`);
    return response.data;
  },

  // Get active token for patient
  getPatientToken: async (patientId) => {
    const response = await api.get(`/v1/opd/tokens/patient/${patientId}`);
    return response.data;
  },

  // Call token
  callToken: async (tokenId) => {
    const response = await api.post(`/v1/opd/tokens/${tokenId}/call`);
    return response.data;
  },

  // Start service
  startService: async (tokenId) => {
    const response = await api.post(`/v1/opd/tokens/${tokenId}/start`);
    return response.data;
  },

  // Complete service
  completeService: async (tokenId, notes = '') => {
    const response = await api.post(`/v1/opd/tokens/${tokenId}/complete`, { notes });
    return response.data;
  },

  // Skip token
  skipToken: async (tokenId, reason = 'PATIENT_NOT_PRESENT') => {
    const response = await api.post(`/v1/opd/tokens/${tokenId}/skip`, { reason });
    return response.data;
  },

  // Return skipped token
  returnToken: async (tokenId, reason = 'PATIENT_RETURNED_TO_DESK') => {
    const response = await api.post(`/v1/opd/tokens/${tokenId}/return`, { reason });
    return response.data;
  },

  // Transfer token
  transferToken: async (tokenId, data) => {
    const response = await api.post(`/v1/opd/tokens/${tokenId}/transfer`, data);
    return response.data;
  },

  // Cancel token
  cancelToken: async (tokenId, reason = 'PATIENT_REQUEST') => {
    const response = await api.post(`/v1/opd/tokens/${tokenId}/cancel`, { reason });
    return response.data;
  },

  // Assign priority
  assignPriority: async (tokenId, priorityType, priorityReason) => {
    const response = await api.post(`/v1/opd/tokens/${tokenId}/priority`, {
      priorityType,
      priorityReason
    });
    return response.data;
  },

  // Queue lifecycle
  pauseQueue: async (queueId, reason = 'DOCTOR_UNAVAILABLE') => {
    const response = await api.post(`/v1/opd/queues/${queueId}/pause`, { reason });
    return response.data;
  },

  resumeQueue: async (queueId) => {
    const response = await api.post(`/v1/opd/queues/${queueId}/resume`);
    return response.data;
  },

  closeQueue: async (queueId, policy = 'AUTO_RESOLVE') => {
    const response = await api.post(`/v1/opd/queues/${queueId}/close`, { policy });
    return response.data;
  },

  // RPA & Admin tasks
  processNoShows: async (params = {}) => {
    const response = await api.post('/v1/opd/no-show/process', params);
    return response.data;
  },

  reconcileQueue: async (params = {}) => {
    const response = await api.post('/v1/opd/reconcile', params);
    return response.data;
  },

  getStats: async (date) => {
    const response = await api.get('/v1/opd/reports/stats', { params: { date } });
    return response.data;
  }
};

export default opdService;
