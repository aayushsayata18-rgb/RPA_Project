const express = require('express');
const router = express.Router();

const { protect, optionalAuth } = require('../middleware/auth');
const FeedbackController = require('../controllers/feedbackController');

// ==========================================
// 1. PATIENT / PUBLIC FEEDBACK APIS
// ==========================================
// Submit feedback (logged in or anonymous)
router.post('/', optionalAuth, FeedbackController.submitFeedback);

// Patient own feedback list
router.get('/my', protect, FeedbackController.getMyFeedback);

// ==========================================
// 2. REPORTING & ANALYTICS APIS
// ==========================================
router.get('/reports/summary', protect, FeedbackController.getSummaryReport);
router.get('/reports/by-category', protect, FeedbackController.getCategoryReport);
router.get('/reports/by-department', protect, FeedbackController.getDepartmentReport);
router.get('/reports/sla', protect, FeedbackController.getSLAReport);
router.get('/reports/ratings', protect, FeedbackController.getRatingReport);

// ==========================================
// 3. RPA & AUTOMATION APIS
// ==========================================
router.post('/rpa/import', protect, FeedbackController.rpaImport);
router.post('/rpa/sync', protect, FeedbackController.rpaSync);
router.post('/rpa/reconcile', protect, FeedbackController.rpaReconcile);
router.post('/sla/check-breaches', protect, FeedbackController.checkSLABreaches);

// ==========================================
// 4. ADMIN & MANAGEMENT DOSSIER APIS
// ==========================================
// List all feedback (with RBAC / department filters)
router.get('/', protect, FeedbackController.getFeedbackList);

// Get single feedback dossier (supports optionalAuth for tracking ID lookup)
router.get('/:feedbackId', optionalAuth, FeedbackController.getFeedbackById);

// Case management transitions
router.post('/:feedbackId/assign', protect, FeedbackController.assignFeedback);
router.post('/:feedbackId/priority', protect, FeedbackController.changePriority);
router.post('/:feedbackId/internal-notes', protect, FeedbackController.addInternalNote);
router.post('/:feedbackId/attachments', protect, FeedbackController.uploadAttachment);

// Investigation workflow
router.post('/:feedbackId/investigation', protect, FeedbackController.startInvestigation);
router.patch('/:feedbackId/investigation', protect, FeedbackController.updateInvestigation);
router.post('/:feedbackId/investigation/approve', protect, FeedbackController.approveInvestigation);

// Response workflow
router.post('/:feedbackId/response', protect, FeedbackController.draftResponse);
router.post('/:feedbackId/response/submit-approval', protect, FeedbackController.submitForApproval);
router.post('/:feedbackId/response/approve', protect, FeedbackController.approveResponse);
router.post('/:feedbackId/response/send', protect, FeedbackController.sendResponse);

// Lifecycle actions
router.post('/:feedbackId/resolve', protect, FeedbackController.resolveFeedback);
router.post('/:feedbackId/close', protect, FeedbackController.closeFeedback);
router.post('/:feedbackId/reopen', protect, FeedbackController.reopenFeedback);
router.post('/:feedbackId/escalate', protect, FeedbackController.escalateFeedback);
router.post('/:feedbackId/sla/pause', protect, FeedbackController.pauseSLA);
router.post('/:feedbackId/sla/resume', protect, FeedbackController.resumeSLA);

module.exports = router;
