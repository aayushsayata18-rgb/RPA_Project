const FeedbackService = require('../services/feedback/feedbackService');
const FeedbackRoutingService = require('../services/feedback/feedbackRoutingService');
const FeedbackSLAService = require('../services/feedback/feedbackSLAService');
const FeedbackInvestigationService = require('../services/feedback/feedbackInvestigationService');
const FeedbackResponseService = require('../services/feedback/feedbackResponseService');
const FeedbackAnalyticsService = require('../services/feedback/feedbackAnalyticsService');
const FeedbackRpaService = require('../services/feedback/feedbackRpaService');

class FeedbackController {
  /**
   * Submit new feedback or complaint
   * POST /api/feedback
   */
  static async submitFeedback(req, res, next) {
    try {
      const feedback = await FeedbackService.submitFeedback(req.body, req.user);
      res.status(201).json({
        success: true,
        message: 'Feedback submitted successfully.',
        data: feedback
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Query / list feedback
   * GET /api/feedback
   */
  static async getFeedbackList(req, res, next) {
    try {
      const result = await FeedbackService.getFeedbackList({
        page: req.query.page,
        limit: req.query.limit,
        status: req.query.status,
        type: req.query.type,
        category: req.query.category,
        departmentId: req.query.departmentId,
        priority: req.query.priority,
        assignedTo: req.query.assignedTo,
        source: req.query.source,
        slaStatus: req.query.slaStatus,
        dateFrom: req.query.dateFrom,
        dateTo: req.query.dateTo,
        search: req.query.search,
        user: req.user
      });

      res.json({
        success: true,
        data: result.items,
        pagination: {
          page: result.page,
          totalPages: result.totalPages,
          total: result.total
        }
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Patient: Get own feedback history
   * GET /api/feedback/my
   */
  static async getMyFeedback(req, res, next) {
    try {
      const result = await FeedbackService.getFeedbackList({
        page: req.query.page,
        limit: req.query.limit,
        status: req.query.status,
        type: req.query.type,
        search: req.query.search,
        user: req.user
      });

      res.json({
        success: true,
        data: result.items,
        pagination: {
          page: result.page,
          totalPages: result.totalPages,
          total: result.total
        }
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get single feedback dossier by feedbackId
   * GET /api/feedback/:feedbackId
   */
  static async getFeedbackById(req, res, next) {
    try {
      const feedback = await FeedbackService.getFeedbackById(req.params.feedbackId, req.user);
      res.json({
        success: true,
        data: feedback
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Reassign feedback to department/user
   * POST /api/feedback/:feedbackId/assign
   */
  static async assignFeedback(req, res, next) {
    try {
      const { departmentId, departmentName, assignedTo, assignedToName, reason } = req.body;
      const feedback = await FeedbackService.assignFeedback({
        feedbackId: req.params.feedbackId,
        departmentId,
        departmentName,
        assignedTo,
        assignedToName,
        reason,
        user: req.user
      });

      res.json({
        success: true,
        message: 'Feedback successfully assigned.',
        data: feedback
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update priority & recalculate SLA
   * POST /api/feedback/:feedbackId/priority
   */
  static async changePriority(req, res, next) {
    try {
      const { priority } = req.body;
      const feedback = await FeedbackService.changePriority({
        feedbackId: req.params.feedbackId,
        priority,
        user: req.user
      });

      res.json({
        success: true,
        message: 'Priority updated successfully.',
        data: feedback
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Add private internal note (restricted from patient view)
   * POST /api/feedback/:feedbackId/internal-notes
   */
  static async addInternalNote(req, res, next) {
    try {
      const { note, visibility } = req.body;
      const internalNote = await FeedbackService.addInternalNote({
        feedbackId: req.params.feedbackId,
        note,
        visibility,
        user: req.user
      });

      res.status(201).json({
        success: true,
        message: 'Internal note added.',
        data: internalNote
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Attach document/file to feedback
   * POST /api/feedback/:feedbackId/attachments
   */
  static async uploadAttachment(req, res, next) {
    try {
      const feedback = await FeedbackService.addAttachment({
        feedbackId: req.params.feedbackId,
        attachment: req.body,
        user: req.user
      });

      res.status(201).json({
        success: true,
        message: 'Attachment added successfully.',
        data: feedback
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Start formal investigation
   * POST /api/feedback/:feedbackId/investigation
   */
  static async startInvestigation(req, res, next) {
    try {
      const { investigatorId, investigatorName, dueAt, notes } = req.body;
      const investigation = await FeedbackInvestigationService.startInvestigation({
        feedbackId: req.params.feedbackId,
        investigatorId,
        investigatorName,
        dueAt,
        notes,
        user: req.user
      });

      res.status(201).json({
        success: true,
        message: 'Investigation initiated.',
        data: investigation
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update findings & evidence
   * PATCH /api/feedback/:feedbackId/investigation
   */
  static async updateInvestigation(req, res, next) {
    try {
      const { investigationId, findings, evidence, conclusion, recommendation, status, notes } = req.body;
      const investigation = await FeedbackInvestigationService.updateInvestigation({
        investigationId,
        findings,
        evidence,
        conclusion,
        recommendation,
        status,
        notes,
        user: req.user
      });

      res.json({
        success: true,
        message: 'Investigation updated.',
        data: investigation
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Sign off / approve investigation
   * POST /api/feedback/:feedbackId/investigation/approve
   */
  static async approveInvestigation(req, res, next) {
    try {
      const { investigationId, notes } = req.body;
      const investigation = await FeedbackInvestigationService.approveInvestigation({
        investigationId,
        notes,
        user: req.user
      });

      res.json({
        success: true,
        message: 'Investigation signed off.',
        data: investigation
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Draft patient response
   * POST /api/feedback/:feedbackId/response
   */
  static async draftResponse(req, res, next) {
    try {
      const { responseText } = req.body;
      const feedback = await FeedbackResponseService.draftResponse({
        feedbackId: req.params.feedbackId,
        responseText,
        user: req.user
      });

      res.json({
        success: true,
        message: 'Response drafted.',
        data: feedback
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Submit draft for supervisory approval
   * POST /api/feedback/:feedbackId/response/submit-approval
   */
  static async submitForApproval(req, res, next) {
    try {
      const feedback = await FeedbackResponseService.submitForApproval({
        feedbackId: req.params.feedbackId,
        user: req.user
      });

      res.json({
        success: true,
        message: 'Response submitted for approval.',
        data: feedback
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Approve draft response
   * POST /api/feedback/:feedbackId/response/approve
   */
  static async approveResponse(req, res, next) {
    try {
      const feedback = await FeedbackResponseService.approveResponse({
        feedbackId: req.params.feedbackId,
        user: req.user
      });

      res.json({
        success: true,
        message: 'Response approved.',
        data: feedback
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Send official response to patient
   * POST /api/feedback/:feedbackId/response/send
   */
  static async sendResponse(req, res, next) {
    try {
      const feedback = await FeedbackResponseService.sendResponse({
        feedbackId: req.params.feedbackId,
        user: req.user
      });

      res.json({
        success: true,
        message: 'Response sent to patient.',
        data: feedback
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Mark case as resolved
   * POST /api/feedback/:feedbackId/resolve
   */
  static async resolveFeedback(req, res, next) {
    try {
      const { summary, actionTaken } = req.body;
      const feedback = await FeedbackResponseService.resolveFeedback({
        feedbackId: req.params.feedbackId,
        summary,
        actionTaken,
        user: req.user
      });

      res.json({
        success: true,
        message: 'Case marked as resolved.',
        data: feedback
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Close resolved feedback case
   * POST /api/feedback/:feedbackId/close
   */
  static async closeFeedback(req, res, next) {
    try {
      const { notes } = req.body;
      const feedback = await FeedbackResponseService.closeFeedback({
        feedbackId: req.params.feedbackId,
        notes,
        user: req.user
      });

      res.json({
        success: true,
        message: 'Case successfully closed.',
        data: feedback
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Reopen closed or resolved case
   * POST /api/feedback/:feedbackId/reopen
   */
  static async reopenFeedback(req, res, next) {
    try {
      const { reason } = req.body;
      const feedback = await FeedbackResponseService.reopenFeedback({
        feedbackId: req.params.feedbackId,
        reason,
        user: req.user
      });

      res.json({
        success: true,
        message: 'Case reopened for re-investigation.',
        data: feedback
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Manually escalate case
   * POST /api/feedback/:feedbackId/escalate
   */
  static async escalateFeedback(req, res, next) {
    try {
      const { reason, targetRole } = req.body;
      const feedback = await FeedbackService.escalateFeedback({
        feedbackId: req.params.feedbackId,
        reason,
        targetRole,
        user: req.user
      });

      res.json({
        success: true,
        message: 'Feedback case escalated.',
        data: feedback
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Pause SLA
   * POST /api/feedback/:feedbackId/sla/pause
   */
  static async pauseSLA(req, res, next) {
    try {
      const { reason } = req.body;
      const sla = await FeedbackSLAService.pauseSLA(req.params.feedbackId, reason, req.user);
      res.json({
        success: true,
        message: 'SLA timer paused.',
        data: sla
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Resume SLA
   * POST /api/feedback/:feedbackId/sla/resume
   */
  static async resumeSLA(req, res, next) {
    try {
      const sla = await FeedbackSLAService.resumeSLA(req.params.feedbackId, req.user);
      res.json({
        success: true,
        message: 'SLA timer resumed.',
        data: sla
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Run background SLA check & trigger escalations
   * POST /api/feedback/sla/check-breaches
   */
  static async checkSLABreaches(req, res, next) {
    try {
      const results = await FeedbackSLAService.checkAndEscalateBreaches();
      res.json({
        success: true,
        message: 'SLA breach scan completed.',
        data: results
      });
    } catch (error) {
      next(error);
    }
  }

  // --- Reports & Analytics Endpoints ---

  static async getSummaryReport(req, res, next) {
    try {
      const summary = await FeedbackAnalyticsService.getSummary();
      res.json({ success: true, data: summary });
    } catch (error) {
      next(error);
    }
  }

  static async getCategoryReport(req, res, next) {
    try {
      const report = await FeedbackAnalyticsService.getByCategory();
      res.json({ success: true, data: report });
    } catch (error) {
      next(error);
    }
  }

  static async getDepartmentReport(req, res, next) {
    try {
      const report = await FeedbackAnalyticsService.getByDepartment();
      res.json({ success: true, data: report });
    } catch (error) {
      next(error);
    }
  }

  static async getSLAReport(req, res, next) {
    try {
      const report = await FeedbackAnalyticsService.getSLAPerformance();
      res.json({ success: true, data: report });
    } catch (error) {
      next(error);
    }
  }

  static async getRatingReport(req, res, next) {
    try {
      const report = await FeedbackAnalyticsService.getRatingDistribution();
      res.json({ success: true, data: report });
    } catch (error) {
      next(error);
    }
  }

  // --- RPA Endpoints ---

  static async rpaImport(req, res, next) {
    try {
      const result = await FeedbackRpaService.importExternalComplaint({
        ...req.body,
        user: req.user
      });

      res.status(result.duplicateDetected ? 200 : 201).json({
        success: true,
        data: result
      });
    } catch (error) {
      next(error);
    }
  }

  static async rpaSync(req, res, next) {
    try {
      const { feedbackId, externalStatus, externalNotes } = req.body;
      const result = await FeedbackRpaService.syncComplaintStatus({
        feedbackId,
        externalStatus,
        externalNotes,
        user: req.user
      });

      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }

  static async rpaReconcile(req, res, next) {
    try {
      const result = await FeedbackRpaService.reconcileExternalCases();
      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = FeedbackController;
