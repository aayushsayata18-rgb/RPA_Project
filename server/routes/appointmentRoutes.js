const express = require('express');
const router = express.Router();
const AppointmentController = require('../controllers/appointmentController');
const { protect, optionalAuth } = require('../middleware/auth');
const { authorizeRoles } = require('../middleware/rbac');
const { ROLES } = require('../config/roles');

// 1. Available slots query (can be accessed by patient, staff or unauthenticated for preview)
router.get('/available-slots', optionalAuth, AppointmentController.getAvailableSlots);

// 2. Stats & Analytics (Staff & Admin)
router.get(
  '/stats',
  protect,
  authorizeRoles(
    ROLES.RECEPTIONIST,
    ROLES.DOCTOR,
    ROLES.ADMIN_MANAGER,
    ROLES.SYSTEM_ADMIN,
    ROLES.HOSPITAL_MANAGEMENT
  ),
  AppointmentController.getStats
);

// 3. Automation triggers (Admin, Operations, RPA)
router.post(
  '/process-no-shows',
  protect,
  authorizeRoles(ROLES.RECEPTIONIST, ROLES.ADMIN_MANAGER, ROLES.SYSTEM_ADMIN),
  AppointmentController.triggerNoShowProcessing
);

router.post(
  '/trigger-reminders',
  protect,
  authorizeRoles(ROLES.ADMIN_MANAGER, ROLES.SYSTEM_ADMIN),
  AppointmentController.triggerReminders
);

// 4. Create appointment (Patients, Front-Desk, Doctors, Admin)
router.post(
  '/',
  protect,
  authorizeRoles(ROLES.PATIENT, ROLES.RECEPTIONIST, ROLES.DOCTOR, ROLES.ADMIN_MANAGER, ROLES.SYSTEM_ADMIN),
  AppointmentController.createAppointment
);

// 5. List / Search appointments
router.get(
  '/',
  protect,
  AppointmentController.getAppointments
);

// 6. Get single appointment details & history
router.get(
  '/:appointmentId',
  protect,
  AppointmentController.getAppointmentById
);

// 7. Cancel appointment
router.post(
  '/:appointmentId/cancel',
  protect,
  AppointmentController.cancelAppointment
);

// 8. Reschedule appointment
router.post(
  '/:appointmentId/reschedule',
  protect,
  AppointmentController.rescheduleAppointment
);

// 9. Arrival Check-In
router.post(
  '/:appointmentId/check-in',
  protect,
  authorizeRoles(
    ROLES.RECEPTIONIST,
    ROLES.NURSE,
    ROLES.DOCTOR,
    ROLES.ADMIN_MANAGER,
    ROLES.SYSTEM_ADMIN
  ),
  AppointmentController.checkInAppointment
);

module.exports = router;
