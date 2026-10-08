import api from './api';

export const patientService = {
  // Search Patients
  searchPatients: (params) => api.get('/patients/search', { params }),

  // Duplicate check
  checkDuplicates: (patientData) => api.post('/patients/check-duplicates', patientData),

  // Get patient dossier
  getPatientById: (patientId) => api.get(`/patients/${patientId}`),

  // Create patient directly
  createPatient: (patientData) => api.post('/patients', patientData),

  // Update patient details
  updatePatient: (patientId, data) => api.patch(`/patients/${patientId}`, data),

  // Submit standard registration (Self or Front-Desk)
  submitRegistration: (payload) => api.post('/registrations', payload),

  // Submit emergency intake
  submitEmergencyRegistration: (payload) => api.post('/registrations/emergency', payload),

  // Link emergency record
  linkEmergencyRecord: (temporaryEmergencyId, data) =>
    api.post(`/registrations/emergency/${temporaryEmergencyId}/link`, data),

  // Review ambiguous registration
  reviewRegistration: (registrationId, data) =>
    api.post(`/registrations/${registrationId}/review`, data),

  // List all registrations
  listRegistrations: (params) => api.get('/registrations', { params }),

  // Get single registration
  getRegistrationById: (registrationId) => api.get(`/registrations/${registrationId}`),

  // List emergency temporary cases
  listEmergencyRecords: (params) => api.get('/registrations/emergency-records', { params }),

  // Visits
  createVisit: (visitData) => api.post('/visits', visitData),
  getPatientVisits: (patientId) => api.get(`/visits/patient/${patientId}`),
  getVisitById: (visitId) => api.get(`/visits/${visitId}`),
  listVisits: (params) => api.get('/visits', { params })
};

export default patientService;
