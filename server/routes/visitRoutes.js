const express = require('express');
const router = express.Router();
const visitController = require('../controllers/visitController');
const { verifyToken } = require('../middleware/auth');
const { authorizeRoles } = require('../middleware/rbac');
const { ROLES } = require('../config/roles');

// Create new visit encounter for an existing patient
router.post(
  '/',
  verifyToken,
  authorizeRoles(ROLES.RECEPTIONIST, ROLES.DOCTOR, ROLES.NURSE, ROLES.ADMIN_MANAGER, ROLES.SYSTEM_ADMIN),
  visitController.createVisit
);

// List visits with filters
router.get(
  '/',
  verifyToken,
  authorizeRoles(
    ROLES.RECEPTIONIST,
    ROLES.DOCTOR,
    ROLES.NURSE,
    ROLES.ADMIN_MANAGER,
    ROLES.SYSTEM_ADMIN,
    ROLES.BILLING_STAFF,
    ROLES.HOSPITAL_MANAGEMENT
  ),
  visitController.listVisits
);

// Get visits for a specific patient
router.get('/patient/:patientId', verifyToken, visitController.getPatientVisits);

// Get specific visit by ID
router.get('/:visitId', verifyToken, visitController.getVisitById);

module.exports = router;
