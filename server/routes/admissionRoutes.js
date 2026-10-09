const express = require('express');
const router = express.Router();
const AdmissionController = require('../controllers/admissionController');
const { authMiddleware, requirePermission, requireRoles } = require('../middleware/authMiddleware');
const { PERMISSIONS } = require('../config/permissions');
const {
  validateAdmissionRequest,
  validateAdmissionApproval,
  validateAdmissionRejection,
  validateBedAssignment
} = require('../validators/admissionValidator');

// All admission endpoints require authentication
router.use(authMiddleware);

// --- Admission Request Endpoints ---
router.post(
  '/admission-requests',
  requirePermission(PERMISSIONS.ADMISSION_CREATE),
  validateAdmissionRequest,
  AdmissionController.createAdmissionRequest
);

router.get(
  '/admission-requests',
  requirePermission(PERMISSIONS.ADMISSION_VIEW),
  AdmissionController.listAdmissionRequests
);

router.get(
  '/admission-requests/:id',
  requirePermission(PERMISSIONS.ADMISSION_VIEW),
  AdmissionController.getAdmissionRequestById
);

router.post(
  '/admission-requests/:id/approve',
  requirePermission(PERMISSIONS.ADMISSION_APPROVE),
  validateAdmissionApproval,
  AdmissionController.approveAdmissionRequest
);

router.post(
  '/admission-requests/:id/reject',
  requirePermission(PERMISSIONS.ADMISSION_APPROVE),
  validateAdmissionRejection,
  AdmissionController.rejectAdmissionRequest
);

router.post(
  '/admission-requests/:id/cancel',
  requirePermission(PERMISSIONS.ADMISSION_CREATE),
  AdmissionController.cancelAdmissionRequest
);

router.post(
  '/admission-requests/:id/assign-bed',
  requirePermission(PERMISSIONS.BED_ASSIGN),
  validateBedAssignment,
  AdmissionController.assignBed
);

// --- Inpatient Admission Episode Endpoints ---
router.post(
  '/admissions',
  requirePermission(PERMISSIONS.ADMISSION_CREATE),
  AdmissionController.completeAdmission
);

router.post(
  '/admissions/:admissionId/complete-admission',
  requirePermission(PERMISSIONS.ADMISSION_CREATE),
  AdmissionController.completeAdmission
);

router.get(
  '/admissions',
  requirePermission(PERMISSIONS.ADMISSION_VIEW),
  AdmissionController.listAdmissions
);

router.get(
  '/admissions/active/:patientId',
  requirePermission(PERMISSIONS.ADMISSION_VIEW),
  AdmissionController.getActiveAdmission
);

router.get(
  '/admissions/:admissionId',
  requirePermission(PERMISSIONS.ADMISSION_VIEW),
  AdmissionController.getAdmissionById
);

// Emergency admission pipeline
router.post(
  '/admissions/emergency',
  requireRoles(['RECEPTIONIST', 'DOCTOR', 'NURSE', 'ADMIN_MANAGER', 'SYSTEM_ADMIN']),
  AdmissionController.createEmergencyAdmission
);

// Link temporary identity
router.post(
  '/admissions/link-temporary-identity',
  requirePermission(PERMISSIONS.PATIENT_LINK),
  AdmissionController.linkEmergencyTemporaryIdentity
);

// Checklist endpoints
router.put(
  '/checklists/:checklistId/items/:code',
  requireRoles(['NURSE', 'RECEPTIONIST', 'ADMIN_MANAGER', 'SYSTEM_ADMIN']),
  AdmissionController.updateChecklistItem
);

router.post(
  '/checklists/:checklistId/override',
  requireRoles(['ADMIN_MANAGER', 'SYSTEM_ADMIN', 'HOSPITAL_MANAGEMENT']),
  AdmissionController.overrideChecklistItem
);

// RPA / External Sync endpoint
router.post(
  '/admissions/:admissionId/sync-external',
  requireRoles(['ADMIN_MANAGER', 'SYSTEM_ADMIN', 'HOSPITAL_MANAGEMENT']),
  AdmissionController.syncExternalSystem
);

module.exports = router;
