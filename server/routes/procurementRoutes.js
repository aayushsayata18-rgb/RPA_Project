const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');

const PurchaseRequestController = require('../controllers/purchaseRequestController');
const RfqController = require('../controllers/rfqController');
const QuotationController = require('../controllers/quotationController');
const ComparisonController = require('../controllers/comparisonController');
const PurchaseOrderController = require('../controllers/purchaseOrderController');
const DeliveryController = require('../controllers/deliveryController');
const SupplierInvoiceController = require('../controllers/supplierInvoiceController');
const ProcurementController = require('../controllers/procurementController');

// All procurement routes require authentication
router.use(protect);

// Dashboard KPIs & Reports
router.get('/stats', ProcurementController.getDashboardKPIs);
router.get('/reports/spend', ProcurementController.getSpendAnalytics);
router.get('/reports/delivery', ProcurementController.getDeliveryPerformance);

// Exceptions & Vendor Changes
router.get('/exceptions', ProcurementController.getExceptions);
router.post('/exceptions/:exceptionId/resolve', ProcurementController.resolveException);
router.get('/change-requests', ProcurementController.getChangeRequests);
router.post('/change-requests/:id/review', ProcurementController.reviewChangeRequest);

// Purchase Requests
router.get('/requests', PurchaseRequestController.getRequests);
router.get('/requests/:id', PurchaseRequestController.getRequestById);
router.post('/requests', PurchaseRequestController.createRequest);
router.put('/requests/:id', PurchaseRequestController.updateRequest);
router.post('/requests/:id/submit', PurchaseRequestController.submitRequest);
router.post('/requests/:id/approve', PurchaseRequestController.approveRequest);
router.post('/requests/:id/reject', PurchaseRequestController.rejectRequest);
router.post('/requests/:id/return', PurchaseRequestController.returnRequest);
router.post('/requests/:id/cancel', PurchaseRequestController.cancelRequest);

// RFQs
router.get('/rfqs', RfqController.getRfqs);
router.get('/rfqs/:id', RfqController.getRfqById);
router.post('/rfqs', RfqController.createRfq);
router.post('/rfqs/:id/issue', RfqController.issueRfq);
router.post('/rfqs/:id/close', RfqController.closeRfq);

// Quotations
router.get('/quotations', QuotationController.getQuotations);
router.get('/quotations/:id', QuotationController.getQuotationById);
router.post('/quotations', QuotationController.recordQuotation);
router.put('/quotations/:id', QuotationController.updateQuotationStatus);

// Quotation Comparisons
router.get('/comparisons', ComparisonController.getComparisons);
router.get('/comparisons/:id', ComparisonController.getComparisonById);
router.post('/comparisons', ComparisonController.createComparison);
router.post('/comparisons/:id/select', ComparisonController.selectVendor);

// Purchase Orders
router.get('/purchase-orders', PurchaseOrderController.getPurchaseOrders);
router.get('/purchase-orders/:id', PurchaseOrderController.getPurchaseOrderById);
router.post('/purchase-orders', PurchaseOrderController.createPurchaseOrder);
router.post('/purchase-orders/:id/submit', PurchaseOrderController.submitPoForApproval);
router.post('/purchase-orders/:id/approve', PurchaseOrderController.approvePurchaseOrder);
router.post('/purchase-orders/:id/reject', PurchaseOrderController.rejectPurchaseOrder);
router.post('/purchase-orders/:id/send', PurchaseOrderController.sendPoToVendor);
router.post('/purchase-orders/:id/acknowledge', PurchaseOrderController.recordVendorAcknowledgement);
router.post('/purchase-orders/:id/revise', PurchaseOrderController.createPoRevision);
router.post('/purchase-orders/:id/cancel', PurchaseOrderController.cancelPurchaseOrder);

// Deliveries
router.get('/deliveries', DeliveryController.getDeliveries);
router.get('/deliveries/:id', DeliveryController.getDeliveryById);
router.post('/deliveries', DeliveryController.createDelivery);
router.put('/deliveries/:id', DeliveryController.updateDeliveryStatus);
router.post('/deliveries/check-delayed', DeliveryController.checkDelayedDeliveries);

// Supplier Invoices & Three-Way Match
router.get('/invoices', SupplierInvoiceController.getInvoices);
router.get('/invoices/:id', SupplierInvoiceController.getInvoiceById);
router.post('/invoices', SupplierInvoiceController.registerInvoice);
router.post('/invoices/:id/match', SupplierInvoiceController.performMatch);
router.post('/invoices/:id/approve', SupplierInvoiceController.approveMatch);

module.exports = router;
