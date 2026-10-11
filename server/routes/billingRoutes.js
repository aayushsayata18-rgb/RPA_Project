const express = require('express');
const router = express.Router();
const BillingController = require('../controllers/billingController');
const { authenticateToken } = require('../middleware/auth');
const { requirePermission } = require('../middleware/permission');
const { PERMISSIONS } = require('../config/permissions');

router.use(authenticateToken);

// ==========================================
// BILLABLE ITEMS / CHARGES
// ==========================================
router.get('/billable-items', requirePermission(PERMISSIONS.INVOICE_VIEW), BillingController.listBillableItems);
router.post('/billable-items', requirePermission(PERMISSIONS.INVOICE_CREATE), BillingController.addBillableItem);
router.get('/billable-items/:id', requirePermission(PERMISSIONS.INVOICE_VIEW), BillingController.getBillableItemById);
router.post('/billable-items/:id/validate', requirePermission(PERMISSIONS.INVOICE_UPDATE), BillingController.validateBillableItem);

// Backward-compatible Charge Aliases
router.get('/charges', requirePermission(PERMISSIONS.INVOICE_VIEW), BillingController.getChargesList);
router.post('/charges', requirePermission(PERMISSIONS.INVOICE_CREATE), BillingController.addCharge);
router.get('/admissions/:admissionId/charges', requirePermission(PERMISSIONS.INVOICE_VIEW), BillingController.getAdmissionCharges);

// ==========================================
// INVOICES
// ==========================================
router.get('/invoices', requirePermission(PERMISSIONS.INVOICE_VIEW), BillingController.listInvoices);
router.post('/invoices', requirePermission(PERMISSIONS.INVOICE_CREATE), BillingController.createInvoice);
router.get('/invoices/:id', requirePermission(PERMISSIONS.INVOICE_VIEW), BillingController.getInvoiceById);
router.post('/invoices/:id/finalize', requirePermission(PERMISSIONS.INVOICE_CREATE), BillingController.finalizeInvoiceById);
router.post('/invoices/:id/cancel', requirePermission(PERMISSIONS.INVOICE_UPDATE), BillingController.cancelInvoice);
router.post('/invoices/:id/apply-deposit', requirePermission(PERMISSIONS.INVOICE_CREATE), BillingController.applyDeposit);
router.post('/invoices/finalize', requirePermission(PERMISSIONS.INVOICE_CREATE), BillingController.finalizeInvoice);

// ==========================================
// DEPOSITS
// ==========================================
router.get('/deposits', requirePermission(PERMISSIONS.INVOICE_VIEW), BillingController.listDeposits);
router.post('/deposits', requirePermission(PERMISSIONS.INVOICE_CREATE), BillingController.recordDeposit);
router.post('/deposits/:id/apply', requirePermission(PERMISSIONS.INVOICE_CREATE), BillingController.applyDeposit);

// ==========================================
// FINANCIAL ADJUSTMENTS
// ==========================================
router.get('/adjustments', requirePermission(PERMISSIONS.INVOICE_VIEW), BillingController.listAdjustments);
router.post('/adjustments', requirePermission(PERMISSIONS.INVOICE_CREATE), BillingController.requestAdjustment);
router.post('/adjustments/:id/approve', requirePermission(PERMISSIONS.FINANCIAL_ADJUSTMENT), BillingController.approveAdjustment);
router.post('/adjustments/:id/reject', requirePermission(PERMISSIONS.FINANCIAL_ADJUSTMENT), BillingController.rejectAdjustment);

// ==========================================
// BILLING QUERIES / DISPUTES
// ==========================================
router.get('/queries', requirePermission(PERMISSIONS.INVOICE_VIEW), BillingController.listQueries);
router.post('/queries', BillingController.createQuery);
router.post('/queries/:id/resolve', requirePermission(PERMISSIONS.INVOICE_UPDATE), BillingController.resolveQuery);
router.post('/disputes', BillingController.raiseDispute);

// ==========================================
// RATE CARDS
// ==========================================
router.get('/rates', requirePermission(PERMISSIONS.INVOICE_VIEW), BillingController.listRates);
router.post('/rates', requirePermission(PERMISSIONS.SYSTEM_CONFIG_MANAGE), BillingController.createRate);
router.patch('/rates/:id', requirePermission(PERMISSIONS.SYSTEM_CONFIG_MANAGE), BillingController.updateRate);

// ==========================================
// DASHBOARD & REPORTS
// ==========================================
router.get('/dashboard-summary', requirePermission(PERMISSIONS.INVOICE_VIEW), BillingController.getDashboardSummary);
router.post('/reports/reconcile', requirePermission(PERMISSIONS.PAYMENT_RECONCILE), BillingController.reconcileGateway);

module.exports = router;
