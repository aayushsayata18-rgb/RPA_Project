const express = require('express');
const router = express.Router();
const PaymentController = require('../controllers/paymentController');
const { authenticateToken } = require('../middleware/auth');
const { requirePermission } = require('../middleware/permission');
const { PERMISSIONS } = require('../config/permissions');

router.use(authenticateToken);

// Checkout & Gateway
router.post('/checkout-session', PaymentController.createCheckoutSession);
router.post('/create-session', PaymentController.createCheckoutSession);
router.post('/callback', PaymentController.verifyCallback);
router.post('/verify', PaymentController.verifyCallback);

// Counter Payments
router.post('/counter', requirePermission(PERMISSIONS.PAYMENT_CREATE), PaymentController.recordCounterPayment);

// Receipts & Invoices
router.get('/receipt/:receiptNumber', requirePermission(PERMISSIONS.PAYMENT_VIEW), PaymentController.getReceipt);
router.get('/invoice/:invoiceNumber', requirePermission(PERMISSIONS.PAYMENT_VIEW), PaymentController.getInvoicePayments);

// Transactions
router.get('/transactions', requirePermission(PERMISSIONS.PAYMENT_VIEW), PaymentController.listTransactions);
router.get('/transactions/:id', requirePermission(PERMISSIONS.PAYMENT_VIEW), PaymentController.getTransactionById);

module.exports = router;
