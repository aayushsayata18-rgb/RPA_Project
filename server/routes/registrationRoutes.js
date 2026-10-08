const express = require('express');
const router = express.Router();
const registrationController = require('../controllers/registrationController');
const { verifyToken, optionalAuth } = require('../middleware/auth');
const { authorizeRoles } = require('../middleware/rbac');
const { ROLES } = require('../config/roles');

// Submit Registration (Online Self-Registration or Front Desk)
router.post('/', optionalAuth, registrationController.submitRegistration);

// Emergency Registration (Trauma / Fast Intake)
router.post(
  '/emergency',
  verifyToken,
  authorizeRoles(ROLES.RECEPTIONIST, ROLES.ADMIN_MANAGER, ROLES.SYSTEM_ADMIN, ROLES.DOCTOR, ROLES.NURSE),
  registrationController.submitEmergencyRegistration
);

// Link Emergency Temporary Record to Permanent Patient Master ID
router.post(
  '/emergency/:temporaryEmergencyId/link',
  verifyToken,
  authorizeRoles(ROLES.RECEPTIONIST, ROLES.ADMIN_MANAGER, ROLES.SYSTEM_ADMIN),
  registrationController.linkEmergencyRecord
);

// Human Review of Ambiguous Registration Match
router.post(
  '/:registrationId/review',
  verifyToken,
  authorizeRoles(ROLES.RECEPTIONIST, ROLES.ADMIN_MANAGER, ROLES.SYSTEM_ADMIN),
  registrationController.reviewRegistration
);

// List all Emergency Temporary Records
router.get(
  '/emergency-records',
  verifyToken,
  authorizeRoles(ROLES.RECEPTIONIST, ROLES.ADMIN_MANAGER, ROLES.SYSTEM_ADMIN, ROLES.DOCTOR, ROLES.NURSE),
  registrationController.listEmergencyRecords
);

// List registrations
router.get(
  '/',
  verifyToken,
  authorizeRoles(ROLES.RECEPTIONIST, ROLES.ADMIN_MANAGER, ROLES.SYSTEM_ADMIN, ROLES.HOSPITAL_MANAGEMENT),
  registrationController.listRegistrations
);

// Get single registration details
router.get('/:registrationId', verifyToken, registrationController.getRegistrationById);

module.exports = router;
