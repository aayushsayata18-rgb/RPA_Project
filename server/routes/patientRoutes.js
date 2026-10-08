const express = require('express');
const router = express.Router();
const patientController = require('../controllers/patientController');
const { verifyToken, optionalAuth } = require('../middleware/auth');
const { authorizeRoles } = require('../middleware/rbac');
const { ROLES } = require('../config/roles');

// Search patients in Patient Master
router.get(
  '/search',
  verifyToken,
  authorizeRoles(
    ROLES.RECEPTIONIST,
    ROLES.ADMIN_MANAGER,
    ROLES.SYSTEM_ADMIN,
    ROLES.DOCTOR,
    ROLES.NURSE,
    ROLES.BILLING_STAFF,
    ROLES.INSURANCE_REPRESENTATIVE,
    ROLES.HOSPITAL_MANAGEMENT
  ),
  patientController.searchPatients
);

// Check duplicate candidates
router.post('/check-duplicates', optionalAuth, patientController.checkDuplicates);

// Get patient details by ID
router.get('/:patientId', verifyToken, patientController.getPatientById);

// Direct create patient (Staff only)
router.post(
  '/',
  verifyToken,
  authorizeRoles(ROLES.RECEPTIONIST, ROLES.ADMIN_MANAGER, ROLES.SYSTEM_ADMIN),
  patientController.createPatient
);

// Update patient details
router.patch('/:patientId', verifyToken, patientController.updatePatient);

module.exports = router;
