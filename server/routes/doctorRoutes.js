const express = require('express');
const router = express.Router();
const DoctorController = require('../controllers/doctorController');
const { protect, optionalAuth } = require('../middleware/auth');
const { authorizeRoles } = require('../middleware/rbac');
const { ROLES } = require('../config/roles');

// Departments & Specialties list
router.get('/departments', optionalAuth, DoctorController.getDepartments);

// Doctor directory / search
router.get('/', optionalAuth, DoctorController.getDoctors);

// Doctor profile details & schedule
router.get('/:doctorId', optionalAuth, DoctorController.getDoctorById);

// Doctor schedule details
router.get('/:doctorId/schedule', optionalAuth, DoctorController.getDoctorSchedule);

// Record doctor leave (Doctor, Admin, Receptionist)
router.post(
  '/:doctorId/leave',
  protect,
  authorizeRoles(ROLES.DOCTOR, ROLES.RECEPTIONIST, ROLES.ADMIN_MANAGER, ROLES.SYSTEM_ADMIN),
  DoctorController.recordLeave
);

module.exports = router;
