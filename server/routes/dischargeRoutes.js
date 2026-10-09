const express = require('express');
const router = express.Router();
const DischargeController = require('../controllers/dischargeController');
const { authenticateToken } = require('../middleware/auth');
const { requirePermission } = require('../middleware/permission');
const { PERMISSIONS } = require('../config/permissions');

router.use(authenticateToken);

// List & Stats
router.get('/stats/summary', DischargeController.getStats);
router.get('/stats', DischargeController.getStats);
router.get('/', requirePermission(PERMISSIONS.DISCHARGE_VIEW), DischargeController.listDischarges);

// Single Discharge CRUD & Operations
router.get('/:id', requirePermission(PERMISSIONS.DISCHARGE_VIEW), DischargeController.getDischargeById);
router.post('/', requirePermission(PERMISSIONS.DISCHARGE_REQUEST), DischargeController.initiateDischarge);
router.post('/:id/process', requirePermission(PERMISSIONS.DISCHARGE_APPROVE), DischargeController.processDischarge);
router.post('/:id/complete', requirePermission(PERMISSIONS.DISCHARGE_FINALIZE), DischargeController.completeDischarge);
router.post('/:id/cancel', requirePermission(PERMISSIONS.DISCHARGE_APPROVE), DischargeController.cancelDischarge);

// Nested resource views & actions
router.get('/:id/pending-items', requirePermission(PERMISSIONS.DISCHARGE_VIEW), DischargeController.getPendingItems);
router.get('/:id/pending-services', requirePermission(PERMISSIONS.DISCHARGE_VIEW), DischargeController.getPendingItems);
router.get('/:id/checklist', requirePermission(PERMISSIONS.DISCHARGE_VIEW), DischargeController.getChecklist);
router.put('/:id/checklist', requirePermission(PERMISSIONS.DISCHARGE_APPROVE), DischargeController.updateChecklist);
router.post('/:id/finalize-billing', requirePermission(PERMISSIONS.DISCHARGE_FINALIZE), DischargeController.finalizeBilling);
router.post('/:id/verify-insurance', requirePermission(PERMISSIONS.DISCHARGE_FINALIZE), DischargeController.verifyInsurance);
router.post('/:id/release-bed', requirePermission(PERMISSIONS.BED_ASSIGN), DischargeController.releaseBed);
router.get('/:id/history', requirePermission(PERMISSIONS.DISCHARGE_VIEW), DischargeController.getHistory);
router.get('/:id/documents', requirePermission(PERMISSIONS.DISCHARGE_VIEW), DischargeController.getDocuments);
router.get('/:id/documents/:type', requirePermission(PERMISSIONS.DISCHARGE_VIEW), DischargeController.getDocument);
router.post('/:id/dispute', requirePermission(PERMISSIONS.DISCHARGE_VIEW), DischargeController.disputeCharge);

module.exports = router;
