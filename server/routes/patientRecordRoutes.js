const express = require('express');
const router = express.Router();
const patientRecordController = require('../controllers/patientRecordController');
const { verifyToken } = require('../middleware/auth');
const { authorizeRoles } = require('../middleware/rbac');
const { ROLES } = require('../config/roles');

// All patient record endpoints require authenticated session
router.use(verifyToken);

// RPA / System level synchronization & document import
router.post(
  '/sync',
  authorizeRoles(ROLES.SYSTEM_ADMIN, ROLES.ADMIN_MANAGER, ROLES.HOSPITAL_MANAGEMENT),
  patientRecordController.syncLegacyRecord
);

router.post(
  '/import-document',
  authorizeRoles(ROLES.SYSTEM_ADMIN, ROLES.ADMIN_MANAGER, ROLES.RECEPTIONIST, ROLES.DOCTOR),
  patientRecordController.importLegacyDocument
);

// Summary & Aggregated Record Overview (07_PATIENT_RECORDS.md Section 65)
router.get('/:patientId/records/summary', patientRecordController.getPatientSummary);
router.get('/:patientId/summary', patientRecordController.getPatientSummary);
router.get('/:patientId/records', patientRecordController.getPatientSummary);

// Longitudinal Timeline (07_PATIENT_RECORDS.md Section 66)
router.get('/:patientId/timeline', patientRecordController.getPatientTimeline);

// Historical Domain Specific Endpoints (07_PATIENT_RECORDS.md Section 68-74)
router.get('/:patientId/visits', patientRecordController.getPatientVisits);
router.get('/:patientId/appointments', patientRecordController.getPatientAppointments);
router.get('/:patientId/admissions', patientRecordController.getPatientAdmissions);
router.get('/:patientId/beds', patientRecordController.getPatientBedHistory);
router.get('/:patientId/bed-history', patientRecordController.getPatientBedHistory);
router.get('/:patientId/discharges', patientRecordController.getPatientDischarges);
router.get('/:patientId/billing', patientRecordController.getPatientBilling);
router.get('/:patientId/insurance', patientRecordController.getPatientInsurance);
router.get('/:patientId/laboratory', patientRecordController.getPatientLaboratory);
router.get('/:patientId/radiology', patientRecordController.getPatientRadiology);
router.get('/:patientId/pharmacy', patientRecordController.getPatientPharmacy);
router.get('/:patientId/documents', patientRecordController.getPatientDocuments);
router.get('/:patientId/access-history', patientRecordController.getPatientAccessHistory);

// Reconciliation Endpoint
router.get('/:patientId/reconcile', patientRecordController.reconcilePatientRecord);

// Access Logging & Purpose capture (07_PATIENT_RECORDS.md Section 50 & 85)
router.post('/:patientId/access-log', patientRecordController.logAccess);

// Profile Editing with Audit History (07_PATIENT_RECORDS.md Section 13-15)
router.patch('/:patientId/profile', patientRecordController.updatePatientProfile);

// Document download authorization route (07_PATIENT_RECORDS.md Section 37 & 67)
router.get('/documents/:documentId/download', patientRecordController.downloadDocument);

module.exports = router;
