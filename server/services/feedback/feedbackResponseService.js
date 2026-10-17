const Feedback = require('../../models/Feedback');
const FeedbackSLA = require('../../models/FeedbackSLA');
const NotificationService = require('../NotificationService');
const AuditService = require('../AuditService');

class FeedbackResponseService {
  /**
   * Draft patient-facing response (separate from internal notes)
   */
  static async draftResponse({ feedbackId, responseText, user }) {
    const feedback = await Feedback.findOne({ feedbackId });
    if (!feedback) {
      throw new Error(`Feedback ${feedbackId} not found.`);
    }

    feedback.response = {
      ...feedback.response,
      text: responseText,
      respondedBy: user.userId,
      respondedByName: `${user.firstName} ${user.lastName}`,
      respondedAt: new Date(),
      status: 'DRAFTED'
    };
    feedback.status = 'RESPONSE_DRAFT';

    await feedback.save();

    await AuditService.logEvent({
      userId: user.userId,
      role: user.role,
      action: 'FEEDBACK_RESPONSE_DRAFTED',
      module: 'PATIENT_FEEDBACK',
      entityType: 'Feedback',
      entityId: feedbackId,
      details: `Patient-facing response drafted for case ${feedbackId}`
    });

    return feedback;
  }

  /**
   * Submit draft response for administrative approval
   */
  static async submitForApproval({ feedbackId, user }) {
    const feedback = await Feedback.findOne({ feedbackId });
    if (!feedback) throw new Error(`Feedback ${feedbackId} not found.`);

    feedback.response.status = 'PENDING_APPROVAL';
    feedback.status = 'RESPONSE_PENDING_APPROVAL';
    await feedback.save();

    await AuditService.logEvent({
      userId: user.userId,
      role: user.role,
      action: 'FEEDBACK_RESPONSE_SUBMITTED_FOR_APPROVAL',
      module: 'PATIENT_FEEDBACK',
      entityType: 'Feedback',
      entityId: feedbackId,
      details: `Response submitted for supervisory review for case ${feedbackId}`
    });

    return feedback;
  }

  /**
   * Approve draft response by authorized supervisor or admin
   */
  static async approveResponse({ feedbackId, user }) {
    const feedback = await Feedback.findOne({ feedbackId });
    if (!feedback) throw new Error(`Feedback ${feedbackId} not found.`);

    feedback.response.approvedBy = user.userId;
    feedback.response.approvedByName = `${user.firstName} ${user.lastName}`;
    feedback.response.approvedAt = new Date();
    feedback.response.status = 'APPROVED';

    await feedback.save();

    await AuditService.logEvent({
      userId: user.userId,
      role: user.role,
      action: 'FEEDBACK_RESPONSE_APPROVED',
      module: 'PATIENT_FEEDBACK',
      entityType: 'Feedback',
      entityId: feedbackId,
      details: `Response approved by ${feedback.response.approvedByName} for case ${feedbackId}`
    });

    return feedback;
  }

  /**
   * Send response to patient and notify them
   */
  static async sendResponse({ feedbackId, user }) {
    const feedback = await Feedback.findOne({ feedbackId });
    if (!feedback) throw new Error(`Feedback ${feedbackId} not found.`);

    if (!feedback.response || !feedback.response.text) {
      throw new Error('Cannot send response: No response text drafted.');
    }

    feedback.response.status = 'SENT';
    feedback.status = 'RESPONSE_SENT';
    await feedback.save();

    // Dispatch notification to patient if identified
    if (feedback.patientId) {
      await NotificationService.sendNotification({
        recipientId: feedback.patientId,
        recipientPhone: feedback.patientPhone,
        recipientEmail: feedback.patientEmail,
        channel: 'IN_APP',
        event: 'FEEDBACK_RESPONSE_AVAILABLE',
        title: `Response Available: Feedback ${feedback.feedbackId}`,
        message: `Your feedback regarding "${feedback.subject}" has received an official hospital response. Please log in to your patient portal to review the details.`,
        entityType: 'Feedback',
        entityId: feedback.feedbackId
      });
    }

    await AuditService.logEvent({
      userId: user.userId,
      role: user.role,
      action: 'FEEDBACK_RESPONSE_SENT',
      module: 'PATIENT_FEEDBACK',
      entityType: 'Feedback',
      entityId: feedbackId,
      details: `Official patient response dispatched for case ${feedbackId}`
    });

    return feedback;
  }

  /**
   * Mark feedback as RESOLVED
   */
  static async resolveFeedback({ feedbackId, summary, actionTaken, user }) {
    const feedback = await Feedback.findOne({ feedbackId });
    if (!feedback) throw new Error(`Feedback ${feedbackId} not found.`);

    feedback.resolution = {
      summary: summary || 'Matter satisfactorily addressed in compliance with hospital standards.',
      actionTaken: actionTaken || 'Administrative process reviewed and corrective actions deployed.',
      resolvedBy: user.userId,
      resolvedByName: `${user.firstName} ${user.lastName}`,
      resolvedAt: new Date()
    };
    feedback.status = 'RESOLVED';
    await feedback.save();

    // Update SLA record
    await FeedbackSLA.findOneAndUpdate(
      { feedbackId },
      { resolvedAt: new Date(), slaStatus: 'ON_TRACK' }
    );

    // Notify patient
    if (feedback.patientId) {
      await NotificationService.sendNotification({
        recipientId: feedback.patientId,
        channel: 'IN_APP',
        event: 'FEEDBACK_RESOLVED',
        title: `Feedback Case Resolved - ${feedback.feedbackId}`,
        message: `Your feedback case ${feedback.feedbackId} has been marked as resolved. Thank you for helping us enhance our care services.`,
        entityType: 'Feedback',
        entityId: feedback.feedbackId
      });
    }

    await AuditService.logEvent({
      userId: user.userId,
      role: user.role,
      action: 'FEEDBACK_RESOLVED',
      module: 'PATIENT_FEEDBACK',
      entityType: 'Feedback',
      entityId: feedbackId,
      details: `Feedback ${feedbackId} marked as RESOLVED by ${feedback.resolution.resolvedByName}`
    });

    return feedback;
  }

  /**
   * Close feedback case after resolution review period
   */
  static async closeFeedback({ feedbackId, notes = '', user }) {
    const feedback = await Feedback.findOne({ feedbackId });
    if (!feedback) throw new Error(`Feedback ${feedbackId} not found.`);

    feedback.closure = {
      closedBy: user.userId,
      closedByName: `${user.firstName} ${user.lastName}`,
      closedAt: new Date(),
      notes: notes || 'Case closed after satisfactory resolution period.'
    };
    feedback.status = 'CLOSED';
    await feedback.save();

    // Update SLA record
    await FeedbackSLA.findOneAndUpdate({ feedbackId }, { closedAt: new Date() });

    await AuditService.logEvent({
      userId: user.userId,
      role: user.role,
      action: 'FEEDBACK_CLOSED',
      module: 'PATIENT_FEEDBACK',
      entityType: 'Feedback',
      entityId: feedbackId,
      details: `Case ${feedbackId} officially closed by ${feedback.closure.closedByName}`
    });

    return feedback;
  }

  /**
   * Reopen a resolved/closed complaint upon patient or staff request
   */
  static async reopenFeedback({ feedbackId, reason, user }) {
    const feedback = await Feedback.findOne({ feedbackId });
    if (!feedback) throw new Error(`Feedback ${feedbackId} not found.`);

    const previousStatus = feedback.status;
    feedback.reopen = {
      reopenedBy: user.userId,
      reopenedByName: `${user.firstName} ${user.lastName}`,
      reopenedAt: new Date(),
      reason: reason || 'Patient or administrator requested reconsideration.',
      previousStatus
    };
    feedback.status = 'REOPENED';
    await feedback.save();

    // Update SLA record
    await FeedbackSLA.findOneAndUpdate(
      { feedbackId },
      {
        resolvedAt: null,
        closedAt: null,
        $push: {
          escalationHistory: {
            escalatedAt: new Date(),
            escalatedBy: user.userId,
            reason: `Case reopened: ${reason || 'Reopen requested'}`,
            targetRole: 'ADMIN_MANAGER'
          }
        }
      }
    );

    // Notify assigned manager or admin
    await NotificationService.sendNotification({
      recipientId: feedback.assignedTo || 'ADMIN_MANAGER',
      channel: 'IN_APP',
      event: 'FEEDBACK_REOPENED',
      title: `Case Reopened: ${feedback.feedbackId}`,
      message: `Feedback ${feedback.feedbackId} has been reopened. Reason: "${reason || 'Not specified'}". A new review is required.`,
      entityType: 'Feedback',
      entityId: feedback.feedbackId
    });

    await AuditService.logEvent({
      userId: user.userId,
      role: user.role,
      action: 'FEEDBACK_REOPENED',
      module: 'PATIENT_FEEDBACK',
      entityType: 'Feedback',
      entityId: feedbackId,
      oldValue: { status: previousStatus },
      newValue: { status: 'REOPENED', reason },
      details: `Case ${feedbackId} reopened by ${feedback.reopen.reopenedByName}: ${reason}`
    });

    return feedback;
  }
}

module.exports = FeedbackResponseService;
