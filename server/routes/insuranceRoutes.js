const express = require('express');
const router = express.Router();

const insurancePolicyController = require('../controllers/insurancePolicyController');
const insuranceVerificationController = require('../controllers/insuranceVerificationController');
const insuranceExceptionController = require('../controllers/insuranceExceptionController');
const insuranceDocumentController = require('../controllers/insuranceDocumentController');

const { protect } = require('../middleware/auth');
const { authorizeRoles } = require('../middleware/rbac');
const { ROLES } = require('../config/roles');

// Common access role sets
const ALL_STAFF_AND_PATIENT = [
  ROLES.PATIENT,
  ROLES.RECEPTIONIST,
  ROLES.BILLING_STAFF,
  ROLES.INSURANCE_REPRESENTATIVE,
  ROLES.ADMIN_MANAGER,
  ROLES.HOSPITAL_MANAGEMENT,
  ROLES.SYSTEM_ADMIN,
  ROLES.DOCTOR,
  ROLES.NURSE
];

const FINANCE_AND_ADMIN = [
  ROLES.RECEPTIONIST,
  ROLES.BILLING_STAFF,
  ROLES.INSURANCE_REPRESENTATIVE,
  ROLES.ADMIN_MANAGER,
  ROLES.HOSPITAL_MANAGEMENT,
  ROLES.SYSTEM_ADMIN
];

const INSURANCE_OFFICERS = [
  ROLES.INSURANCE_REPRESENTATIVE,
  ROLES.ADMIN_MANAGER,
  ROLES.SYSTEM_ADMIN
];

// Protect all routes by default
router.use(protect);

// -------------------------------------------------------------
// DASHBOARD & STATS
// -------------------------------------------------------------
router.get(
  '/dashboard/stats',
  authorizeRoles(...FINANCE_AND_ADMIN),
  insuranceVerificationController.getDashboardStats
);

// -------------------------------------------------------------
// POLICIES ENDPOINTS (Section 52)
// -------------------------------------------------------------
router.post(
  '/policies',
  authorizeRoles(...ALL_STAFF_AND_PATIENT),
  insurancePolicyController.createPolicy
);

router.post(
  '/policies/check-duplicate',
  authorizeRoles(...ALL_STAFF_AND_PATIENT),
  insurancePolicyController.checkDuplicate
);

router.get(
  '/policies/:id',
  authorizeRoles(...ALL_STAFF_AND_PATIENT),
  insurancePolicyController.getPolicyById
);

router.put(
  '/policies/:id',
  authorizeRoles(...FINANCE_AND_ADMIN),
  insurancePolicyController.updatePolicy
);

router.delete(
  '/policies/:id',
  authorizeRoles(...INSURANCE_OFFICERS),
  insurancePolicyController.deletePolicy
);

router.get(
  '/patients/:patientId/policies',
  authorizeRoles(...ALL_STAFF_AND_PATIENT),
  insurancePolicyController.getPatientPolicies
);

// Integration endpoint for Billing, Admission, Discharge (Section 48, 49, 50)
router.get(
  '/patients/:patientId/active',
  authorizeRoles(...ALL_STAFF_AND_PATIENT),
  insurancePolicyController.getActivePolicyForBilling
);

// -------------------------------------------------------------
// VERIFICATION ENDPOINTS (Section 52)
// -------------------------------------------------------------
router.post(
  '/policies/:policyId/verify',
  authorizeRoles(...ALL_STAFF_AND_PATIENT),
  insuranceVerificationController.requestVerification
);

router.get(
  '/verifications',
  authorizeRoles(...FINANCE_AND_ADMIN),
  insuranceVerificationController.listVerifications
);

router.get(
  '/verifications/:verificationId',
  authorizeRoles(...ALL_STAFF_AND_PATIENT),
  insuranceVerificationController.getVerificationById
);

router.get(
  '/policies/:policyId/verifications',
  authorizeRoles(...ALL_STAFF_AND_PATIENT),
  insuranceVerificationController.getPolicyVerifications
);

router.get(
  '/patients/:patientId/verifications',
  authorizeRoles(...ALL_STAFF_AND_PATIENT),
  insuranceVerificationController.getPatientVerifications
);

router.post(
  '/verifications/:verificationId/retry',
  authorizeRoles(...FINANCE_AND_ADMIN),
  insuranceVerificationController.retryVerification
);

router.post(
  '/verifications/:verificationId/manual',
  authorizeRoles(...INSURANCE_OFFICERS),
  insuranceVerificationController.recordManualVerification
);

// -------------------------------------------------------------
// EXCEPTIONS ENDPOINTS (Section 39, 40, 52)
// -------------------------------------------------------------
router.get(
  '/exceptions',
  authorizeRoles(...INSURANCE_OFFICERS, ROLES.BILLING_STAFF),
  insuranceExceptionController.listExceptions
);

router.get(
  '/exceptions/:id',
  authorizeRoles(...INSURANCE_OFFICERS, ROLES.BILLING_STAFF),
  insuranceExceptionController.getExceptionById
);

router.post(
  '/exceptions/:id/assign',
  authorizeRoles(...INSURANCE_OFFICERS),
  insuranceExceptionController.assignException
);

router.post(
  '/exceptions/:id/resolve',
  authorizeRoles(...INSURANCE_OFFICERS),
  insuranceExceptionController.resolveException
);

// -------------------------------------------------------------
// EVIDENCE & DOCUMENTS ENDPOINTS (Section 52, 72)
// -------------------------------------------------------------
router.get(
  '/verifications/:verificationId/evidence',
  authorizeRoles(...FINANCE_AND_ADMIN),
  insuranceDocumentController.getVerificationEvidence
);

router.post(
  '/verifications/:verificationId/evidence',
  authorizeRoles(...FINANCE_AND_ADMIN),
  insuranceDocumentController.uploadEvidence
);

router.post(
  '/policies/:policyId/documents',
  authorizeRoles(...ALL_STAFF_AND_PATIENT),
  insuranceDocumentController.uploadEvidence
);

router.get(
  '/policies/:policyId/documents',
  authorizeRoles(...ALL_STAFF_AND_PATIENT),
  insuranceDocumentController.getPolicyDocuments
);

module.exports = router;
