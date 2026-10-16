const express = require('express');
const router = express.Router();

const { protect } = require('../middleware/auth');
const { authorizePermission } = require('../middleware/rbac');

const ExamController = require('../controllers/radiology/examController');
const ModalityController = require('../controllers/radiology/modalityController');
const OrderController = require('../controllers/radiology/orderController');
const ScheduleController = require('../controllers/radiology/scheduleController');
const StudyController = require('../controllers/radiology/studyController');
const ReportController = require('../controllers/radiology/reportController');
const ExceptionController = require('../controllers/radiology/exceptionController');
const AnalyticsController = require('../controllers/radiology/analyticsController');

// ==========================================
// 1. EXAM MASTER APIs
// ==========================================
router.get('/exams', protect, ExamController.listExams);
router.get('/exams/:id', protect, ExamController.getExamById);
router.post('/exams', protect, authorizePermission('RAD_EXAM_MANAGE'), ExamController.createExam);
router.put('/exams/:id', protect, authorizePermission('RAD_EXAM_MANAGE'), ExamController.updateExam);
router.patch('/exams/:id/status', protect, authorizePermission('RAD_EXAM_MANAGE'), ExamController.updateTestStatus);

// ==========================================
// 2. MODALITY MASTER APIs
// ==========================================
router.get('/modalities', protect, ModalityController.listModalities);
router.get('/modalities/:id', protect, ModalityController.getModalityById);
router.post('/modalities', protect, authorizePermission('RAD_MODALITY_MANAGE'), ModalityController.createModality);
router.put('/modalities/:id', protect, authorizePermission('RAD_MODALITY_MANAGE'), ModalityController.updateModality);
router.patch('/modalities/:id/status', protect, authorizePermission('RAD_MODALITY_MANAGE'), ModalityController.updateStatus);

// ==========================================
// 3. ORDER APIs
// ==========================================
router.get('/orders', protect, authorizePermission('RAD_ORDER_VIEW'), OrderController.listOrders);
router.get('/orders/:id', protect, authorizePermission('RAD_ORDER_VIEW'), OrderController.getOrderById);
router.post('/orders', protect, authorizePermission('RAD_ORDER_CREATE'), OrderController.createOrder);
router.post('/orders/check-duplicate', protect, OrderController.checkDuplicate);
router.post('/orders/:id/cancel', protect, OrderController.cancelOrder);

// ==========================================
// 4. SCHEDULING & APPOINTMENT APIs
// ==========================================
router.get('/schedules', protect, authorizePermission('RAD_ORDER_VIEW'), ScheduleController.listSchedules);
router.get('/schedules/availability', protect, ScheduleController.getAvailability);
router.post('/schedules', protect, authorizePermission('RAD_SCHEDULE_MANAGE'), ScheduleController.bookSchedule);
router.post('/schedules/:id/reschedule', protect, authorizePermission('RAD_SCHEDULE_MANAGE'), ScheduleController.reschedule);
router.post('/schedules/:id/cancel', protect, authorizePermission('RAD_SCHEDULE_MANAGE'), ScheduleController.cancelSchedule);
router.post('/schedules/:id/check-in', protect, authorizePermission('RAD_CHECKIN'), ScheduleController.checkIn);

// ==========================================
// 5. PROCEDURE & STUDY APIs
// 5. PROCEDURE & STUDY APIs
// ==========================================
router.get('/studies', protect, authorizePermission('RAD_STUDY_MANAGE'), StudyController.listStudies);
router.get('/studies/:id', protect, authorizePermission('RAD_STUDY_MANAGE'), StudyController.getStudyById);
router.post('/studies', protect, authorizePermission('RAD_STUDY_MANAGE'), StudyController.createStudy);
router.post('/studies/start', protect, authorizePermission('RAD_STUDY_MANAGE'), StudyController.createStudy);
router.post('/studies/:id/start', protect, authorizePermission('RAD_STUDY_MANAGE'), StudyController.startExamination);
router.post('/studies/:id/complete', protect, authorizePermission('RAD_STUDY_MANAGE'), StudyController.completeExamination);

// ==========================================
// 6. REPORT APIs
// ==========================================
router.get('/reports', protect, authorizePermission('RAD_REPORT_VIEW'), ReportController.listReports);
router.get('/reports/:id', protect, authorizePermission('RAD_REPORT_VIEW'), ReportController.getReportById);
router.post('/reports', protect, authorizePermission('RAD_REPORT_ENTRY'), ReportController.createReport);
router.post('/reports/draft', protect, authorizePermission('RAD_REPORT_ENTRY'), ReportController.createReport);
router.put('/reports/:id', protect, authorizePermission('RAD_REPORT_ENTRY'), ReportController.updateReport);
router.post('/reports/:id/verify', protect, authorizePermission('RAD_REPORT_VERIFY'), ReportController.verifyReport);
router.post('/reports/:id/finalize', protect, authorizePermission('RAD_REPORT_VERIFY'), ReportController.finalizeReport);
router.post('/reports/:id/release', protect, authorizePermission('RAD_REPORT_RELEASE'), ReportController.releaseReport);
router.post('/reports/:id/amend', protect, authorizePermission('RAD_REPORT_AMEND'), ReportController.amendReport);
router.get('/reports/:id/download', protect, authorizePermission('RAD_REPORT_VIEW'), ReportController.downloadReport);
router.post('/reports/:id/download', protect, authorizePermission('RAD_REPORT_VIEW'), ReportController.downloadReport);

// ==========================================
// 7. EXCEPTION APIs
// ==========================================
router.get('/exceptions', protect, authorizePermission('RAD_EXCEPTION_MANAGE'), ExceptionController.listExceptions);
router.get('/exceptions/:id', protect, authorizePermission('RAD_EXCEPTION_MANAGE'), ExceptionController.getExceptionById);
router.post('/exceptions', protect, ExceptionController.createException);
router.post('/exceptions/:id/resolve', protect, authorizePermission('RAD_EXCEPTION_MANAGE'), ExceptionController.resolveException);

// ==========================================
// 8. ANALYTICS & DASHBOARD APIs
// ==========================================
router.get('/analytics/dashboard', protect, AnalyticsController.getDashboardMetrics);
router.get('/analytics/scheduling', protect, AnalyticsController.getSchedulingAnalytics);
router.get('/analytics/modalities', protect, AnalyticsController.getModalityAnalytics);
router.get('/analytics/turnaround', protect, AnalyticsController.getTurnaroundAnalytics);
router.get('/analytics/rpa', protect, AnalyticsController.getRpaAnalytics);
router.get('/analytics/rpa-jobs', protect, AnalyticsController.getRpaAnalytics);
router.post('/analytics/rpa-jobs/trigger', protect, AnalyticsController.triggerRpaJob);

// ==========================================
// 9. INTEGRATIONS, INVENTORY & RPA APIs
// ==========================================
router.post('/integrations/sync-order', protect, AnalyticsController.syncOrderToExternalRis);
router.post('/integrations/ris/sync-worklist', protect, AnalyticsController.syncOrderToExternalRis);
router.post('/integrations/sync-pacs', protect, AnalyticsController.syncPacsMetadata);
router.post('/integrations/pacs/mock-study', protect, AnalyticsController.syncPacsMetadata);
router.post('/integrations/reconcile', protect, AnalyticsController.reconcileOrder);
router.post('/inventory/consume', protect, AnalyticsController.recordConsumableUsage);
router.post('/rpa/trigger', protect, AnalyticsController.triggerRpaJob);
router.post('/rpa/:id/execute', protect, AnalyticsController.executeRpaJob);
router.get('/rpa/jobs', protect, AnalyticsController.getRpaAnalytics);

module.exports = router;
