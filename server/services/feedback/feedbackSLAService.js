const Feedback = require('../../models/Feedback');
const FeedbackSLA = require('../../models/FeedbackSLA');
const ConfigService = require('../ConfigService');
const NotificationService = require('../NotificationService');
const AuditService = require('../AuditService');
const IdGeneratorService = require('../IdGeneratorService');

class FeedbackSLAService {
  /**
   * Determine target SLA hours based on priority from configuration or fallback defaults
   */
  static async getSLADurationHours(priority) {
    const configKey = `FEEDBACK_SLA_${(priority || 'MEDIUM').toUpperCase()}_HOURS`;
    const defaultHoursMap = {
      CRITICAL: 1,
      URGENT: 4,
      HIGH: 24,
      MEDIUM: 72,
      LOW: 120
    };

    const configured = await ConfigService.get(configKey, defaultHoursMap[priority] || 72);
    return Number(configured);
  }

  /**
   * Calculate dueAt date from submitted time and priority
   */
  static async calculateDueDate(priority, submittedAt = new Date()) {
    const hours = await this.getSLADurationHours(priority);
    const dueAt = new Date(submittedAt.getTime() + hours * 60 * 60 * 1000);
    return dueAt;
  }

  /**
   * Initialize or update SLA tracking record for a feedback case
   */
  static async initializeSLA(feedbackId, priority, submittedAt = new Date()) {
    const dueAt = await this.calculateDueDate(priority, submittedAt);
    let slaRecord = await FeedbackSLA.findOne({ feedbackId });

    if (!slaRecord) {
      const slaId = await IdGeneratorService.generateFeedbackSlaId();
      slaRecord = new FeedbackSLA({
        slaId,
        feedbackId,
        priority,
        submittedAt,
        dueAt,
        slaStatus: 'ON_TRACK'
      });
    } else {
      slaRecord.priority = priority;
      slaRecord.dueAt = dueAt;
    }

    await slaRecord.save();

    await Feedback.findOneAndUpdate(
      { feedbackId },
      { dueAt, slaStatus: 'ON_TRACK' }
    );

    return { slaRecord, dueAt };
  }

  /**
   * Calculate SLA status for a given case
   */
  static evaluateSLAStatus(dueAt, status, pauseHistory = []) {
    // If resolved or closed, status remains fixed
    if (['RESOLVED', 'CLOSED', 'WITHDRAWN', 'REJECTED'].includes(status)) {
      return 'ON_TRACK';
    }

    // Check if currently paused
    const isPaused = pauseHistory.some((p) => p.pauseStart && !p.pauseEnd);
    if (isPaused || status === 'WAITING_FOR_INFORMATION') {
      return 'PAUSED';
    }

    if (!dueAt) return 'ON_TRACK';

    const now = new Date();
    const remainingMs = new Date(dueAt).getTime() - now.getTime();

    if (remainingMs <= 0) {
      return 'BREACHED';
    }

    // If less than 20% or 4 hours remaining, consider AT_RISK
    if (remainingMs < 4 * 60 * 60 * 1000) {
      return 'AT_RISK';
    }

    return 'ON_TRACK';
  }

  /**
   * Pause SLA timer (e.g. when WAITING_FOR_INFORMATION)
   */
  static async pauseSLA(feedbackId, pauseReason, user) {
    const sla = await FeedbackSLA.findOne({ feedbackId });
    if (!sla) return null;

    sla.pauseHistory.push({
      pauseStart: new Date(),
      pauseReason,
      pausedBy: user ? user.userId : 'SYSTEM'
    });
    sla.slaStatus = 'PAUSED';
    await sla.save();

    await Feedback.findOneAndUpdate(
      { feedbackId },
      { slaStatus: 'PAUSED', status: 'WAITING_FOR_INFORMATION' }
    );

    await AuditService.logEvent({
      userId: user ? user.userId : 'SYSTEM',
      action: 'FEEDBACK_SLA_PAUSED',
      module: 'PATIENT_FEEDBACK',
      entityType: 'Feedback',
      entityId: feedbackId,
      details: `SLA paused: ${pauseReason}`
    });

    return sla;
  }

  /**
   * Resume paused SLA timer with recalculated due date
   */
  static async resumeSLA(feedbackId, user) {
    const sla = await FeedbackSLA.findOne({ feedbackId });
    if (!sla) return null;

    const activePause = sla.pauseHistory.find((p) => p.pauseStart && !p.pauseEnd);
    if (activePause) {
      activePause.pauseEnd = new Date();
      const pausedDurationMs = activePause.pauseEnd.getTime() - activePause.pauseStart.getTime();

      // Extend dueAt by paused duration
      sla.dueAt = new Date(sla.dueAt.getTime() + pausedDurationMs);
    }

    sla.slaStatus = this.evaluateSLAStatus(sla.dueAt, 'UNDER_REVIEW', sla.pauseHistory);
    await sla.save();

    await Feedback.findOneAndUpdate(
      { feedbackId },
      { dueAt: sla.dueAt, slaStatus: sla.slaStatus, status: 'UNDER_REVIEW' }
    );

    await AuditService.logEvent({
      userId: user ? user.userId : 'SYSTEM',
      action: 'FEEDBACK_SLA_RESUMED',
      module: 'PATIENT_FEEDBACK',
      entityType: 'Feedback',
      entityId: feedbackId,
      details: `SLA resumed. New Due Date: ${sla.dueAt.toISOString()}`
    });

    return sla;
  }

  /**
   * Monitor cases and trigger alerts for approaching or breached SLAs
   */
  static async checkAndEscalateBreaches() {
    const openStatuses = [
      'SUBMITTED',
      'ACKNOWLEDGED',
      'ASSIGNED',
      'UNDER_REVIEW',
      'INVESTIGATION',
      'RESPONSE_DRAFT',
      'RESPONSE_PENDING_APPROVAL'
    ];

    const cases = await Feedback.find({
      status: { $in: openStatuses },
      dueAt: { $ne: null }
    }).lean();

    const results = { scanned: cases.length, atRisk: 0, breached: 0, escalated: 0 };

    for (const item of cases) {
      const currentStatus = this.evaluateSLAStatus(item.dueAt, item.status);

      if (currentStatus === 'BREACHED' && item.slaStatus !== 'BREACHED') {
        results.breached++;

        await Feedback.findOneAndUpdate(
          { feedbackId: item.feedbackId },
          { slaStatus: 'BREACHED' }
        );

        await FeedbackSLA.findOneAndUpdate(
          { feedbackId: item.feedbackId },
          {
            slaStatus: 'BREACHED',
            breachedAt: new Date(),
            $push: {
              escalationHistory: {
                escalatedAt: new Date(),
                escalatedBy: 'SYSTEM_SLA_ROBOT',
                reason: 'SLA Breached automatically by system timer',
                targetRole: 'ADMIN_MANAGER'
              }
            }
          }
        );

        // Notify responsible manager and admin
        await NotificationService.sendNotification({
          recipientId: item.assignedTo || 'ADMIN_MANAGER',
          channel: 'IN_APP',
          event: 'FEEDBACK_SLA_BREACHED',
          title: `[SLA BREACHED] Case ${item.feedbackId}`,
          message: `Feedback/Complaint ${item.feedbackId} (${item.category} - ${item.priority}) has breached its resolution SLA. Immediate administrative intervention required.`,
          entityType: 'Feedback',
          entityId: item.feedbackId
        });

        await AuditService.logEvent({
          action: 'FEEDBACK_SLA_BREACHED',
          module: 'PATIENT_FEEDBACK',
          entityType: 'Feedback',
          entityId: item.feedbackId,
          details: `Feedback ${item.feedbackId} breached SLA timer.`
        });
      } else if (currentStatus === 'AT_RISK' && item.slaStatus === 'ON_TRACK') {
        results.atRisk++;

        await Feedback.findOneAndUpdate(
          { feedbackId: item.feedbackId },
          { slaStatus: 'AT_RISK' }
        );

        await FeedbackSLA.findOneAndUpdate(
          { feedbackId: item.feedbackId },
          { slaStatus: 'AT_RISK' }
        );

        await NotificationService.sendNotification({
          recipientId: item.assignedTo || 'ADMIN_MANAGER',
          channel: 'IN_APP',
          event: 'FEEDBACK_SLA_WARNING',
          title: `[SLA Warning] Case ${item.feedbackId} Approaching Due Time`,
          message: `Feedback ${item.feedbackId} SLA deadline is approaching (< 4 hours remaining). Please prioritize investigation and response.`,
          entityType: 'Feedback',
          entityId: item.feedbackId
        });
      }
    }

    return results;
  }
}

module.exports = FeedbackSLAService;
