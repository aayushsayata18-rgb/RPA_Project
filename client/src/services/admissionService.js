import api from './api';

export const admissionService = {
  // --- Admission Requests ---
  createAdmissionRequest: (data) => api.post('/admissions/admission-requests', data),
  getAdmissionRequests: (params) => api.get('/admissions/admission-requests', { params }),
  getAdmissionRequestById: (id) => api.get(`/admissions/admission-requests/${id}`),
  approveAdmissionRequest: (id, reason) => api.post(`/admissions/admission-requests/${id}/approve`, { reason }),
  rejectAdmissionRequest: (id, reason) => api.post(`/admissions/admission-requests/${id}/reject`, { reason }),
  cancelAdmissionRequest: (id, reason) => api.post(`/admissions/admission-requests/${id}/cancel`, { reason }),
  assignBed: (id, bedId) => api.post(`/admissions/admission-requests/${id}/assign-bed`, { bedId }),

  // --- Inpatient Admissions ---
  completeAdmission: (admissionRequestId, payload = {}) =>
    api.post('/admissions', { admissionRequestId, ...payload }),
  getAdmissions: (params) => api.get('/admissions', { params }),
  getAdmissionById: (admissionId) => api.get(`/admissions/${admissionId}`),
  getActiveAdmission: (patientId) => api.get(`/admissions/active/${patientId}`),

  // --- Emergency Pipeline ---
  createEmergencyAdmission: (data) => api.post('/admissions/emergency', data),
  linkEmergencyIdentity: (temporaryEmergencyId, permanentPatientId) =>
    api.post('/admissions/link-temporary-identity', { temporaryEmergencyId, permanentPatientId }),

  // --- Checklist Management ---
  updateChecklistItem: (checklistId, code, status, notes = '') =>
    api.put(`/admissions/checklists/${checklistId}/items/${code}`, { status, notes }),
  overrideChecklistItem: (checklistId, code, overrideReason) =>
    api.post(`/admissions/checklists/${checklistId}/override`, { code, overrideReason }),

  // --- RPA External Sync ---
  syncExternalSystem: (admissionId, forceFail = false) =>
    api.post(`/admissions/${admissionId}/sync-external`, { forceFail })
};

export default admissionService;
