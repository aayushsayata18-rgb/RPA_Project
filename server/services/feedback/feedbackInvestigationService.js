const Feedback = require('../../models/Feedback');
const FeedbackInvestigation = require('../../models/FeedbackInvestigation');
const IdGeneratorService = require('../IdGeneratorService');
const AuditService = require('../AuditService');

class FeedbackInvestigationService {
  /**
   * Start a formal investigation for a complaint or feedback
   */
  static async startInvestigation({
    feedbackId,
    investigatorId,
    investigatorName,
    dueAt = null,
    notes = '',
    user
  }) {
    const feedback = await Feedback.findOne({ feedbackId });
    if (!feedback) {
      throw new Error(`Feedback ${feedbackId} not found.`);
    }

    // Check if an investigation already exists
    let investigation = await FeedbackInvestigation.findOne({ feedbackId, status: { $ne: 'CANCELLED' } });
    if (investigation) {
      return investigation;
    }

    const investigationId = await IdGeneratorService.generateInvestigationId();
    investigation = new FeedbackInvestigation({
      investigationId,
      feedbackId,
      investigatorId: investigatorId || user.userId,
      investigatorName: investigatorName || `${user.firstName} ${user.lastName}`,
      dueAt: dueAt || feedback.dueAt,
      status: 'IN_PROGRESS',
      notes
    });

    await investigation.save();

    // Transition feedback status to INVESTIGATION
    feedback.status = 'INVESTIGATION';
    await feedback.save();

    await AuditService.logEvent({
      userId: user.userId,
      role: user.role,
      action: 'FEEDBACK_INVESTIGATION_STARTED',
      module: 'PATIENT_FEEDBACK',
      entityType: 'FeedbackInvestigation',
      entityId: investigationId,
      details: `Formal investigation initiated for feedback ${feedbackId} by ${investigation.investigatorName}`
    });

    return investigation;
  }

  /**
   * Update findings, evidence, conclusion, and recommendations
   */
  static async updateInvestigation({
    investigationId,
    findings,
    evidence = [],
    conclusion,
    recommendation,
    status = 'IN_PROGRESS',
    notes,
    user
  }) {
    const investigation = await FeedbackInvestigation.findOne({ investigationId });
    if (!investigation) {
      throw new Error(`Investigation ${investigationId} not found.`);
    }

    if (findings !== undefined) investigation.findings = findings;
    if (conclusion !== undefined) investigation.conclusion = conclusion;
    if (recommendation !== undefined) investigation.recommendation = recommendation;
    if (status !== undefined) investigation.status = status;
    if (notes !== undefined) investigation.notes = notes;

    if (evidence && Array.isArray(evidence) && evidence.length > 0) {
      investigation.evidence.push(...evidence);
    }

    await investigation.save();

    await AuditService.logEvent({
      userId: user.userId,
      role: user.role,
      action: 'FEEDBACK_INVESTIGATION_UPDATED',
      module: 'PATIENT_FEEDBACK',
      entityType: 'FeedbackInvestigation',
      entityId: investigationId,
      details: `Investigation ${investigationId} findings and recommendations updated (Status: ${status})`
    });

    return investigation;
  }

  /**
   * Sign off / approve completed investigation by authorized supervisor
   */
  static async approveInvestigation({ investigationId, notes = '', user }) {
    const investigation = await FeedbackInvestigation.findOne({ investigationId });
    if (!investigation) {
      throw new Error(`Investigation ${investigationId} not found.`);
    }

    investigation.status = 'APPROVED';
    investigation.approvedBy = user.userId;
    investigation.approvedByName = `${user.firstName} ${user.lastName}`;
    investigation.approvedAt = new Date();
    if (notes) investigation.notes = (investigation.notes ? `${investigation.notes}\n` : '') + notes;

    await investigation.save();

    await AuditService.logEvent({
      userId: user.userId,
      role: user.role,
      action: 'FEEDBACK_INVESTIGATION_APPROVED',
      module: 'PATIENT_FEEDBACK',
      entityType: 'FeedbackInvestigation',
      entityId: investigationId,
      details: `Investigation ${investigationId} signed off by ${investigation.approvedByName}`
    });

    return investigation;
  }

  /**
   * Get investigation details for a feedback
   */
  static async getByFeedbackId(feedbackId) {
    return await FeedbackInvestigation.findOne({ feedbackId }).lean();
  }
}

module.exports = FeedbackInvestigationService;
