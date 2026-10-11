const express = require('express');
const router = express.Router();

const insuranceClaimController = require('../controllers/insuranceClaimController');
const insuranceClaimQueryController = require('../controllers/insuranceClaimQueryController');
const insuranceClaimSettlementController = require('../controllers/insuranceClaimSettlementController');

const { protect } = require('../middleware/auth');
const { authorizeRoles } = require('../middleware/rbac');
const { ROLES } = require('../config/roles');

// Role definitions
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
  ROLES.BILLING_STAFF,
  ROLES.ADMIN_MANAGER,
  ROLES.SYSTEM_ADMIN
];

// Protect all routes
router.use(protect);

// -------------------------------------------------------------
// DASHBOARD & STATS (Section 74)
// -------------------------------------------------------------
router.get(
  '/dashboard/stats',
  authorizeRoles(...FINANCE_AND_ADMIN),
  insuranceClaimController.getDashboardStats
);

// -------------------------------------------------------------
// BILLING INTEGRATION ENDPOINTS (Section 46)
// -------------------------------------------------------------
router.get(
  '/patient/:patientId',
  authorizeRoles(...ALL_STAFF_AND_PATIENT),
  insuranceClaimController.getClaimsByPatient
);

router.get(
  '/invoice/:invoiceId',
  authorizeRoles(...FINANCE_AND_ADMIN),
  insuranceClaimController.getClaimsByInvoice
);

// -------------------------------------------------------------
// CLAIMS LIFECYCLE ENDPOINTS (Section 63)
// -------------------------------------------------------------
router.post(
  '/',
  authorizeRoles(...FINANCE_AND_ADMIN),
  insuranceClaimController.createClaim
);

router.get(
  '/',
  authorizeRoles(...FINANCE_AND_ADMIN),
  insuranceClaimController.getClaims
);

router.get(
  '/:id',
  authorizeRoles(...ALL_STAFF_AND_PATIENT),
  insuranceClaimController.getClaimById
);

router.put(
  '/:id',
  authorizeRoles(...FINANCE_AND_ADMIN),
  insuranceClaimController.updateClaim
);

router.post(
  '/:id/validate',
  authorizeRoles(...FINANCE_AND_ADMIN),
  insuranceClaimController.validateClaim
);

router.post(
  '/:id/ready',
  authorizeRoles(...FINANCE_AND_ADMIN),
  insuranceClaimController.markReady
);

router.post(
  '/:id/submit',
  authorizeRoles(...INSURANCE_OFFICERS),
  insuranceClaimController.submitClaim
);

router.post(
  '/:id/cancel',
  authorizeRoles(...FINANCE_AND_ADMIN),
  insuranceClaimController.cancelClaim
);

// -------------------------------------------------------------
// CLAIM STATUS ENDPOINTS (Section 63)
// -------------------------------------------------------------
router.post(
  '/:id/check-status',
  authorizeRoles(...FINANCE_AND_ADMIN),
  insuranceClaimController.checkStatus
);

router.get(
  '/:id/status-history',
  authorizeRoles(...ALL_STAFF_AND_PATIENT),
  insuranceClaimController.getStatusHistory
);

// -------------------------------------------------------------
// QUERIES ENDPOINTS (Section 63)
// -------------------------------------------------------------
router.get(
  '/:id/queries',
  authorizeRoles(...FINANCE_AND_ADMIN),
  insuranceClaimQueryController.getQueries
);

router.post(
  '/:id/queries',
  authorizeRoles(...FINANCE_AND_ADMIN),
  insuranceClaimQueryController.createQuery
);

router.post(
  '/:id/queries/:queryId/respond',
  authorizeRoles(...FINANCE_AND_ADMIN),
  insuranceClaimQueryController.respondToQuery
);

router.post(
  '/:id/queries/:queryId/resolve',
  authorizeRoles(...FINANCE_AND_ADMIN),
  insuranceClaimQueryController.resolveQuery
);

// -------------------------------------------------------------
// DOCUMENTS ENDPOINTS (Section 63)
// -------------------------------------------------------------
router.get(
  '/:id/documents',
  authorizeRoles(...ALL_STAFF_AND_PATIENT),
  insuranceClaimController.getDocuments
);

router.post(
  '/:id/documents',
  authorizeRoles(...FINANCE_AND_ADMIN),
  insuranceClaimController.addDocument
);

router.delete(
  '/:id/documents/:documentId',
  authorizeRoles(...FINANCE_AND_ADMIN),
  insuranceClaimController.deleteDocument
);

// -------------------------------------------------------------
// SETTLEMENT & RECONCILIATION ENDPOINTS (Section 63)
// -------------------------------------------------------------
router.get(
  '/:id/settlement',
  authorizeRoles(...FINANCE_AND_ADMIN),
  insuranceClaimSettlementController.getSettlement
);

router.post(
  '/:id/settlement',
  authorizeRoles(...FINANCE_AND_ADMIN),
  insuranceClaimSettlementController.recordSettlement
);

router.post(
  '/:id/reconcile',
  authorizeRoles(...FINANCE_AND_ADMIN),
  insuranceClaimSettlementController.reconcile
);

module.exports = router;
