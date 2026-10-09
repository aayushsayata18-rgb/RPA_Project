import api from './api';

export const patientRecordService = {
  // Summary & Overview
  getPatientSummary: (patientId, params) => api.get(`/patient-records/${patientId}/summary`, { params }),

  // Longitudinal Timeline
  getPatientTimeline: (patientId, params) => api.get(`/patient-records/${patientId}/timeline`, { params }),

  // Domain records
  getPatientVisits: (patientId, params) => api.get(`/patient-records/${patientId}/visits`, { params }),
  getPatientAppointments: (patientId, params) => api.get(`/patient-records/${patientId}/appointments`, { params }),
  getPatientAdmissions: (patientId, params) => api.get(`/patient-records/${patientId}/admissions`, { params }),
  getPatientBedHistory: (patientId, params) => api.get(`/patient-records/${patientId}/beds`, { params }),
  getPatientDischarges: (patientId, params) => api.get(`/patient-records/${patientId}/discharges`, { params }),
  getPatientBilling: (patientId, params) => api.get(`/patient-records/${patientId}/billing`, { params }),
  getPatientInsurance: (patientId, params) => api.get(`/patient-records/${patientId}/insurance`, { params }),
  getPatientLaboratory: (patientId, params) => api.get(`/patient-records/${patientId}/laboratory`, { params }),
  getPatientRadiology: (patientId, params) => api.get(`/patient-records/${patientId}/radiology`, { params }),
  getPatientPharmacy: (patientId, params) => api.get(`/patient-records/${patientId}/pharmacy`, { params }),
  getPatientDocuments: (patientId, params) => api.get(`/patient-records/${patientId}/documents`, { params }),
  getPatientAccessHistory: (patientId, params) => api.get(`/patient-records/${patientId}/access-history`, { params }),

  // Document Download
  downloadDocument: (documentId) => api.get(`/patient-records/documents/${documentId}/download`),

  // Audited Profile Update
  updatePatientProfile: (patientId, payload) => api.patch(`/patient-records/${patientId}/profile`, payload),

  // Access Logging
  logAccess: (patientId, payload) => api.post(`/patient-records/${patientId}/access-log`, payload),

  // RPA & Reconciliation
  syncLegacyRecord: (payload) => api.post('/patient-records/sync', payload),
  importLegacyDocument: (payload) => api.post('/patient-records/import-document', payload),
  reconcilePatientRecord: (patientId) => api.get(`/patient-records/${patientId}/reconcile`)
};

export default patientRecordService;
