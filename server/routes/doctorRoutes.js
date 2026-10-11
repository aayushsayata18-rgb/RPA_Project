const express = require('express');
const router = express.Router();
const DoctorController = require('../controllers/doctorController');
const DoctorScheduleController = require('../controllers/doctorScheduleController');
const DoctorAvailabilityController = require('../controllers/doctorAvailabilityController');
const { protect, optionalAuth } = require('../middleware/auth');
const { authorizeRoles } = require('../middleware/rbac');
const { ROLES } = require('../config/roles');

// 1. Static and Dashboard endpoints (Must precede /:doctorId)
router.get('/dashboard', optionalAuth, DoctorController.getDashboard);
router.get('/departments', optionalAuth, DoctorController.getDepartments);
router.get('/credentials/expiring', optionalAuth, DoctorController.getExpiringCredentials);
router.get('/availability/dashboard', optionalAuth, DoctorAvailabilityController.getAvailabilityDashboard);

// 2. Doctor Directory & Creation
router.get('/', optionalAuth, DoctorController.getDoctors);
router.post(
  '/',
  protect,
  authorizeRoles(ROLES.HR_MANAGER, ROLES.ADMIN_MANAGER, ROLES.SYSTEM_ADMIN, ROLES.HOSPITAL_MANAGEMENT),
  DoctorController.createDoctor
);

// 3. Single Doctor Profile CRUD
router.get('/:doctorId', optionalAuth, DoctorController.getDoctorById);
router.put(
  '/:doctorId',
  protect,
  authorizeRoles(ROLES.HR_MANAGER, ROLES.ADMIN_MANAGER, ROLES.SYSTEM_ADMIN, ROLES.DOCTOR),
  DoctorController.updateDoctor
);
router.patch(
  '/:doctorId/status',
  protect,
  authorizeRoles(ROLES.ADMIN_MANAGER, ROLES.HR_MANAGER, ROLES.SYSTEM_ADMIN, ROLES.HOSPITAL_MANAGEMENT),
  DoctorController.updateStatus
);

// 4. Professional Information (Qualifications & Registrations)
router.post(
  '/:doctorId/qualifications',
  protect,
  authorizeRoles(ROLES.HR_MANAGER, ROLES.ADMIN_MANAGER, ROLES.SYSTEM_ADMIN, ROLES.DOCTOR),
  DoctorController.addQualification
);
router.put(
  '/:doctorId/qualifications/:qualificationId',
  protect,
  authorizeRoles(ROLES.HR_MANAGER, ROLES.ADMIN_MANAGER, ROLES.SYSTEM_ADMIN, ROLES.DOCTOR),
  DoctorController.updateQualification
);

router.post(
  '/:doctorId/registrations',
  protect,
  authorizeRoles(ROLES.HR_MANAGER, ROLES.ADMIN_MANAGER, ROLES.SYSTEM_ADMIN),
  DoctorController.addRegistration
);
router.put(
  '/:doctorId/registrations/:registrationId',
  protect,
  authorizeRoles(ROLES.HR_MANAGER, ROLES.ADMIN_MANAGER, ROLES.SYSTEM_ADMIN),
  DoctorController.updateRegistration
);

// 5. Department Assignments & Transfers
router.post(
  '/:doctorId/departments',
  protect,
  authorizeRoles(ROLES.HR_MANAGER, ROLES.ADMIN_MANAGER, ROLES.SYSTEM_ADMIN),
  DoctorController.assignDepartment
);
router.post(
  '/:doctorId/departments/transfer',
  protect,
  authorizeRoles(ROLES.HR_MANAGER, ROLES.ADMIN_MANAGER, ROLES.SYSTEM_ADMIN),
  DoctorController.transferDepartment
);

// 6. External Synchronization
router.post(
  '/:doctorId/sync',
  protect,
  authorizeRoles(ROLES.ADMIN_MANAGER, ROLES.SYSTEM_ADMIN),
  DoctorController.triggerSync
);
router.get('/:doctorId/sync', optionalAuth, DoctorController.getSyncStatus);

// 7. Schedule Management (Section 59)
router.get('/:doctorId/schedules', optionalAuth, DoctorScheduleController.getSchedules);
router.post(
  '/:doctorId/schedules',
  protect,
  authorizeRoles(ROLES.ADMIN_MANAGER, ROLES.SYSTEM_ADMIN, ROLES.HR_MANAGER),
  DoctorScheduleController.createSchedule
);
router.put(
  '/:doctorId/schedules/:scheduleId',
  protect,
  authorizeRoles(ROLES.ADMIN_MANAGER, ROLES.SYSTEM_ADMIN, ROLES.HR_MANAGER),
  DoctorScheduleController.updateSchedule
);
router.delete(
  '/:doctorId/schedules/:scheduleId',
  protect,
  authorizeRoles(ROLES.ADMIN_MANAGER, ROLES.SYSTEM_ADMIN, ROLES.HR_MANAGER),
  DoctorScheduleController.cancelSchedule
);
router.post('/:doctorId/schedules/check-conflict', optionalAuth, DoctorScheduleController.checkConflict);

// 8. Availability Management (Section 59)
router.get('/:doctorId/availability', optionalAuth, DoctorAvailabilityController.getDoctorAvailability);
router.post(
  '/:doctorId/availability',
  protect,
  authorizeRoles(ROLES.ADMIN_MANAGER, ROLES.SYSTEM_ADMIN, ROLES.HR_MANAGER, ROLES.DOCTOR),
  DoctorAvailabilityController.recordAvailability
);
router.put(
  '/:doctorId/availability/:availabilityId',
  protect,
  authorizeRoles(ROLES.ADMIN_MANAGER, ROLES.SYSTEM_ADMIN, ROLES.HR_MANAGER, ROLES.DOCTOR),
  DoctorAvailabilityController.updateAvailability
);

// 9. Backward-compatibility endpoints
router.get('/:doctorId/schedule', optionalAuth, DoctorController.getDoctorSchedule);
router.post(
  '/:doctorId/leave',
  protect,
  authorizeRoles(ROLES.DOCTOR, ROLES.RECEPTIONIST, ROLES.ADMIN_MANAGER, ROLES.SYSTEM_ADMIN, ROLES.HR_MANAGER),
  DoctorController.recordLeave
);

module.exports = router;
