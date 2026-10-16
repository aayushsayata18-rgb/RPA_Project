const express = require('express');
const router = express.Router();

const { protect } = require('../middleware/auth');
const { authorizePermission } = require('../middleware/rbac');

const LabTestController = require('../controllers/laboratory/labTestController');
const LabOrderController = require('../controllers/laboratory/labOrderController');
const LabSampleController = require('../controllers/laboratory/labSampleController');
const LabResultController = require('../controllers/laboratory/labResultController');
const LabReportController = require('../controllers/laboratory/labReportController');
const LabExceptionController = require('../controllers/laboratory/labExceptionController');
const LabAnalyticsController = require('../controllers/laboratory/labAnalyticsController');

// ==========================================
// 1. TEST MASTER APIs
// ==========================================
router.get('/tests', protect, LabTestController.listTests);
router.get('/tests/:id', protect, LabTestController.getTestById);
router.post('/tests', protect, authorizePermission('LAB_TEST_MANAGE'), LabTestController.createTest);
router.put('/tests/:id', protect, authorizePermission('LAB_TEST_MANAGE'), LabTestController.updateTest);
router.patch('/tests/:id/status', protect, authorizePermission('LAB_TEST_MANAGE'), LabTestController.updateTestStatus);

// ==========================================
// 2. ORDER APIs
// ==========================================
router.get('/orders', protect, authorizePermission('LAB_ORDER_VIEW'), LabOrderController.listOrders);
router.get('/orders/:id', protect, authorizePermission('LAB_ORDER_VIEW'), LabOrderController.getOrderById);
router.post('/orders', protect, authorizePermission('LAB_ORDER_CREATE'), LabOrderController.createOrder);
router.post('/orders/check-duplicate', protect, LabOrderController.checkDuplicate);
router.post('/orders/:id/cancel', protect, LabOrderController.cancelOrder);

// ==========================================
// 3. COLLECTION & SAMPLE APIs
// ==========================================
router.get('/collections/queue', protect, authorizePermission('LAB_SAMPLE_COLLECT'), LabSampleController.getCollectionQueue);
router.post('/collections/:id/collect', protect, authorizePermission('LAB_SAMPLE_COLLECT'), LabSampleController.collectSample);

router.get('/samples', protect, authorizePermission('LAB_SAMPLE_PROCESS'), LabSampleController.listSamples);
router.get('/samples/:id', protect, authorizePermission('LAB_SAMPLE_PROCESS'), LabSampleController.getSampleById);
router.post('/samples', protect, authorizePermission('LAB_SAMPLE_PROCESS'), LabSampleController.registerSample);
router.post('/samples/:id/collect', protect, authorizePermission('LAB_SAMPLE_COLLECT'), LabSampleController.collectSample);
router.post('/samples/:id/receive', protect, authorizePermission('LAB_SAMPLE_RECEIVE'), LabSampleController.receiveSample);
router.post('/samples/:id/accept', protect, authorizePermission('LAB_SAMPLE_PROCESS'), LabSampleController.acceptSample);
router.post('/samples/:id/reject', protect, authorizePermission('LAB_SAMPLE_REJECT'), LabSampleController.rejectSample);

// ==========================================
// 4. RESULT APIs
// ==========================================
router.get('/results/verification-queue', protect, authorizePermission('LAB_RESULT_VERIFY'), LabResultController.getVerificationQueue);
router.get('/results/:id', protect, authorizePermission('LAB_RESULT_VERIFY'), LabResultController.getResultById);
router.post('/results', protect, authorizePermission('LAB_RESULT_ENTER'), LabResultController.enterResult);
router.post('/results/:id/verify', protect, authorizePermission('LAB_RESULT_VERIFY'), LabResultController.verifyResult);
router.post('/results/:id/amend', protect, authorizePermission('LAB_RESULT_VERIFY'), LabResultController.amendResult);

// ==========================================
// 5. REPORT APIs
// ==========================================
router.get('/reports', protect, authorizePermission('LAB_REPORT_VIEW'), LabReportController.listReports);
router.get('/reports/:id', protect, authorizePermission('LAB_REPORT_VIEW'), LabReportController.getReportById);
router.post('/reports/generate', protect, authorizePermission('LAB_REPORT_GENERATE'), LabReportController.generateReport);
router.post('/reports/:id/release', protect, authorizePermission('LAB_REPORT_RELEASE'), LabReportController.releaseReport);
router.post('/reports/:id/download', protect, authorizePermission('LAB_REPORT_VIEW'), LabReportController.recordDownload);
router.get('/reports/:id/download', protect, authorizePermission('LAB_REPORT_VIEW'), LabReportController.recordDownload);

// ==========================================
// 6. EXCEPTION APIs
// ==========================================
router.get('/exceptions', protect, authorizePermission('LAB_EXCEPTION_MANAGE'), LabExceptionController.listExceptions);
router.get('/exceptions/:id', protect, authorizePermission('LAB_EXCEPTION_MANAGE'), LabExceptionController.getExceptionById);
router.post('/exceptions', protect, LabExceptionController.createException);
router.post('/exceptions/:id/resolve', protect, authorizePermission('LAB_EXCEPTION_MANAGE'), LabExceptionController.resolveException);

// ==========================================
// 7. ANALYTICS & DASHBOARD APIs
// ==========================================
router.get('/analytics/dashboard', protect, LabAnalyticsController.getDashboardMetrics);
router.get('/analytics/metrics', protect, LabAnalyticsController.getDashboardMetrics);

// ==========================================
// 8. INTEGRATIONS, INVENTORY & RPA APIs
// ==========================================
router.post('/integrations/sync-order', protect, LabAnalyticsController.syncOrderToExternalLis);
router.post('/integrations/fetch-results', protect, LabAnalyticsController.fetchResultsFromExternalLis);
router.post('/integrations/reconcile', protect, LabAnalyticsController.reconcileOrder);
router.post('/inventory/consume', protect, LabAnalyticsController.consumeInventory);
router.post('/rpa/trigger', protect, LabAnalyticsController.triggerRpaJob);
router.post('/rpa/:id/execute', protect, LabAnalyticsController.executeRpaJob);
router.get('/rpa/jobs', protect, LabAnalyticsController.listRpaJobs);

module.exports = router;
