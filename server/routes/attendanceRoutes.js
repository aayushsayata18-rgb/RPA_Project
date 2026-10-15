const express = require('express');
const router = express.Router();
const AttendanceController = require('../controllers/attendanceController');
const {
  validatePunchEvent,
  validateManualAttendance,
  validateCorrectionRequest,
  validateCorrectionRejection,
  validateImportBatch
} = require('../validators/attendanceValidators');
const { protect, optionalAuth } = require('../middleware/auth');
const { authorizeRoles } = require('../middleware/rbac');
const { ROLES } = require('../config/roles');

// 1. Dashboard & Reports (Precede /:id)
router.get('/dashboard/metrics', optionalAuth, AttendanceController.getDashboardMetrics);
router.get('/reports/daily', optionalAuth, AttendanceController.getDailyReport);
router.get('/reports/monthly', optionalAuth, AttendanceController.getMonthlyReport);
router.get('/reports/department', optionalAuth, AttendanceController.getDepartmentReport);
router.get('/reports/exceptions', optionalAuth, AttendanceController.getExceptionReport);

// 2. Import Batches
router.get('/imports', optionalAuth, AttendanceController.getImportBatches);
router.get('/imports/:id', optionalAuth, AttendanceController.getImportBatchById);
router.post(
  '/import',
  optionalAuth,
  validateImportBatch,
  AttendanceController.importBatch
);

// 3. Reconciliation
router.get('/reconciliation', optionalAuth, AttendanceController.getReconciliation);
router.post(
  '/reconcile',
  optionalAuth,
  AttendanceController.runReconciliation
);

// 4. Corrections Queue & Review
router.get('/corrections', optionalAuth, AttendanceController.getCorrections);
router.get('/corrections/:id', optionalAuth, AttendanceController.getCorrectionById);
router.post(
  '/corrections/:id/approve',
  protect,
  authorizeRoles(ROLES.HR_MANAGER, ROLES.ADMIN_MANAGER, ROLES.SYSTEM_ADMIN, ROLES.HOSPITAL_MANAGEMENT),
  AttendanceController.approveCorrection
);
router.post(
  '/corrections/:id/reject',
  protect,
  authorizeRoles(ROLES.HR_MANAGER, ROLES.ADMIN_MANAGER, ROLES.SYSTEM_ADMIN, ROLES.HOSPITAL_MANAGEMENT),
  validateCorrectionRejection,
  AttendanceController.rejectCorrection
);

// 5. Punch Ingestion & Manual Entry
router.post('/punch', optionalAuth, validatePunchEvent, AttendanceController.recordPunch);
router.post(
  '/manual',
  protect,
  authorizeRoles(ROLES.HR_MANAGER, ROLES.ADMIN_MANAGER, ROLES.SYSTEM_ADMIN),
  validateManualAttendance,
  AttendanceController.createManualAttendance
);

// 6. Employee Self-Service Attendance
router.get('/me', optionalAuth, AttendanceController.getMyAttendance);

// 7. Attendance List & Single Record
router.get('/', optionalAuth, AttendanceController.getAttendanceList);
router.get('/:id', optionalAuth, AttendanceController.getAttendanceById);
router.post(
  '/:id/correction',
  optionalAuth,
  validateCorrectionRequest,
  AttendanceController.submitCorrection
);

module.exports = router;
