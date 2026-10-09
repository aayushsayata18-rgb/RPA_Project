const express = require('express');
const router = express.Router();
const BillingController = require('../controllers/billingController');
const { authenticateToken } = require('../middleware/auth');
const { requirePermission } = require('../middleware/permission');
const { PERMISSIONS } = require('../config/permissions');

router.use(authenticateToken);

// Invoices
router.get('/invoices', requirePermission(PERMISSIONS.INVOICE_VIEW), BillingController.listInvoices);
router.get('/invoices/:id', requirePermission(PERMISSIONS.INVOICE_VIEW), BillingController.getInvoiceById);
router.post('/invoices/finalize', requirePermission(PERMISSIONS.INVOICE_CREATE), BillingController.finalizeInvoice);
router.post('/invoices/:id/apply-deposit', requirePermission(PERMISSIONS.INVOICE_CREATE), BillingController.applyDeposit);

// Charges
router.get('/charges', requirePermission(PERMISSIONS.INVOICE_VIEW), BillingController.getChargesList);
router.post('/charges', requirePermission(PERMISSIONS.INVOICE_CREATE), BillingController.addCharge);
router.get('/admissions/:admissionId/charges', requirePermission(PERMISSIONS.INVOICE_VIEW), BillingController.getAdmissionCharges);

// Disputes
router.post('/queries', BillingController.raiseDispute);
router.post('/disputes', BillingController.raiseDispute);

module.exports = router;
