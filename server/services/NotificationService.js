const Notification = require('../models/Notification');
const NotificationTemplate = require('../models/NotificationTemplate');
const InAppNotification = require('../models/InAppNotification');
const AuditService = require('./AuditService');
const IdGeneratorService = require('./IdGeneratorService');
const RecipientService = require('./recipientService');
const PreferenceService = require('./preferenceService');
const TemplateService = require('./templateService');
const DeliveryService = require('./deliveryService');
const RetryService = require('./retryService');

class NotificationService {
  /**
   * Central Send Notification Engine (Module 26: 26_NOTIFICATION_SERVICE.md Section 8)
   */
  static async sendNotification({
    type = null,
    event = null,
    recipient = null,
    recipientId = null,
    recipientPhone = null,
    recipientEmail = null,
    channels = null,
    channel = null,
    templateCode = null,
    templateId = null,
    templateData = null,
    variables = null,
    title = null,
    subject = null,
    message = null,
    body = null,
    priority = 'NORMAL',
    reference = null,
    entityType = null,
    entityId = null,
    module = null,
    scheduledAt = null,
    scheduledFor = null,
    expiresAt = null,
    correlationId = null,
    idempotencyKey = null,
    metadata = {}
  }) {
    try {
      const notifType = type || event || 'GENERAL_NOTIFICATION';
      const notifEvent = event || type || notifType;

      // 1. Idempotency Check (Section 45 & 49)
      if (idempotencyKey) {
        const existing = await Notification.findOne({ idempotencyKey });
        if (existing) {
          console.log(`[NotificationService] Duplicate notification suppressed for idempotencyKey: ${idempotencyKey}`);
          return existing;
        }
      }

      // 2. Resolve Recipient Target (Section 53-56)
      const rawRecipient = recipient || {
        userId: recipientId,
        phone: recipientPhone,
        email: recipientEmail
      };
      const resolvedRecipient = await RecipientService.resolveRecipient(rawRecipient);

      // 3. Resolve Channels and Evaluate User Preferences (Section 27-29, 60)
      let requestedChannels = channels || (channel ? [channel] : ['IN_APP']);
      if (!Array.isArray(requestedChannels) || requestedChannels.length === 0) {
        requestedChannels = ['IN_APP'];
      }

      const prefEvaluation = await PreferenceService.evaluatePreferences({
        userId: resolvedRecipient.userId,
        patientId: resolvedRecipient.patientId,
        type: notifType,
        requestedChannels
      });

      let finalChannels = prefEvaluation.allowedChannels;
      if (finalChannels.length === 0) {
        console.log(`[NotificationService] Notification ${notifType} suppressed due to recipient preferences`);
      }

      // 4. Resolve Template & Render Content (Section 22-26)
      const dataPayload = templateData || variables || {};
      let finalSubject = subject || title || null;
      let finalBody = body || message || '';
      let usedTemplateId = templateId;
      let usedTemplateVersion = 1;
      let resolvedTmplCode = templateCode;

      const template = await TemplateService.resolveTemplate({
        type: notifType,
        templateCode,
        channel: finalChannels[0] || 'ALL',
        language: 'en-IN'
      });

      if (template) {
        usedTemplateId = template._id;
        usedTemplateVersion = template.version || 1;
        resolvedTmplCode = template.templateCode;

        try {
          const rendered = TemplateService.render(template, dataPayload);
          finalSubject = rendered.subject || finalSubject;
          finalBody = rendered.body || finalBody;
        } catch (templateError) {
          // If required variables are missing (Section 25)
          console.error(`[NotificationService] Template validation error:`, templateError.message);
          const notificationId = await IdGeneratorService.generateNotificationId();
          const failedNotif = new Notification({
            notificationId,
            type: notifType,
            event: notifEvent,
            recipient: resolvedRecipient,
            recipientId: resolvedRecipient.userId ? String(resolvedRecipient.userId) : null,
            recipientPhone: resolvedRecipient.phone,
            recipientEmail: resolvedRecipient.email,
            channels: requestedChannels,
            channel: requestedChannels[0] || 'IN_APP',
            templateId: usedTemplateId,
            templateCode: resolvedTmplCode,
            templateVersion: usedTemplateVersion,
            subject: finalSubject,
            title: finalSubject,
            body: finalBody,
            message: finalBody,
            priority,
            status: 'FAILED',
            failureReason: `MISSING_TEMPLATE_VARIABLE: ${templateError.message}`,
            errorCode: 'MISSING_TEMPLATE_VARIABLE',
            idempotencyKey,
            correlationId,
            reference: reference || { entityType, entityId, module }
          });
          await failedNotif.save();
          return failedNotif;
        }
      }

      // 5. Generate Concurrency-Safe NTF ID (Section 10)
      const notificationId = await IdGeneratorService.generateNotificationId();

      // Determine schedule / quiet hours deferral
      let finalSchedule = scheduledAt || scheduledFor || null;
      if (!finalSchedule && prefEvaluation.isQuietHoursActive && prefEvaluation.deferUntil) {
        finalSchedule = prefEvaluation.deferUntil;
        console.log(`[NotificationService] Deferred notification ${notificationId} to ${finalSchedule} due to quiet hours.`);
      }

      const isScheduledForFuture = finalSchedule && new Date(finalSchedule) > new Date();

      const notification = new Notification({
        notificationId,
        type: notifType,
        event: notifEvent,
        recipient: resolvedRecipient,
        recipientId: resolvedRecipient.userId ? String(resolvedRecipient.userId) : null,
        recipientPhone: resolvedRecipient.phone,
        recipientEmail: resolvedRecipient.email,
        channels: finalChannels,
        channel: finalChannels[0] || 'IN_APP',
        templateId: usedTemplateId,
        templateCode: resolvedTmplCode,
        templateVersion: usedTemplateVersion,
        subject: finalSubject || notifType,
        title: finalSubject || notifType,
        body: finalBody,
        message: finalBody,
        priority,
        status: isScheduledForFuture ? 'PENDING' : 'QUEUED',
        scheduledAt: finalSchedule,
        scheduledFor: finalSchedule,
        expiresAt: expiresAt ? new Date(expiresAt) : null,
        reference: reference || {
          entityType,
          entityId,
          module
        },
        entityType,
        entityId,
        correlationId: correlationId || notificationId,
        idempotencyKey,
        metadata
      });

      await notification.save();

      // 6. Immediate dispatch if not scheduled for future (Section 33-34)
      if (!isScheduledForFuture && finalChannels.length > 0) {
        notification.status = 'PROCESSING';
        await notification.save();
        await DeliveryService.dispatchNotification(notification, finalChannels);
      }

      // 7. Audit log (Section 91)
      try {
        await AuditService.log({
          action: 'NOTIFICATION_CREATED',
          entityType: 'Notification',
          entityId: notification.notificationId,
          performedBy: 'SYSTEM',
          details: {
            type: notifType,
            channels: finalChannels,
            status: notification.status
          }
        });
      } catch (e) {}

      return notification;
    } catch (error) {
      console.error('[NotificationService sendNotification Error]:', error.message);
      throw error;
    }
  }

  /**
   * Cancel scheduled notification before dispatch (Section 46-47 & 77)
   */
  static async cancelScheduledNotification(notificationId, reason = 'Cancelled by system/user') {
    const notif = await Notification.findOne({ notificationId });
    if (!notif) {
      throw new Error(`Notification ${notificationId} not found`);
    }

    if (['DELIVERED', 'PROCESSING'].includes(notif.status)) {
      throw new Error(`Cannot cancel notification with status: ${notif.status}`);
    }

    notif.status = 'CANCELLED';
    notif.failureReason = reason;
    await notif.save();

    return notif;
  }

  /**
   * Cancel pending reminders associated with an appointment (Section 46: Cancellation of Scheduled Notification)
   */
  static async cancelAppointmentReminders(appointmentId) {
    return await Notification.updateMany(
      {
        'reference.entityId': String(appointmentId),
        status: { $in: ['PENDING', 'QUEUED', 'DRAFT'] }
      },
      {
        $set: {
          status: 'CANCELLED',
          failureReason: 'Associated appointment was cancelled/rescheduled'
        }
      }
    );
  }

  /**
   * Sweep and expire notifications that passed expiresAt (Section 48)
   */
  static async expireOutdatedNotifications() {
    const now = new Date();
    const result = await Notification.updateMany(
      {
        expiresAt: { $lte: now },
        status: { $in: ['PENDING', 'QUEUED', 'DRAFT'] }
      },
      {
        $set: {
          status: 'EXPIRED',
          failureReason: 'Notification expired before dispatch'
        }
      }
    );
    return result;
  }

  /**
   * Get In-App Notifications for a specific user (Section 73)
   */
  static async getUserNotifications(userId, unreadOnly = false) {
    const query = {
      $or: [
        { recipientUserId: String(userId) },
        { recipientPatientId: String(userId) },
        { recipientUserId: 'GLOBAL' }
      ]
    };
    if (unreadOnly) {
      query.isRead = false;
    }

    const inAppList = await InAppNotification.find(query)
      .sort({ createdAt: -1 })
      .limit(50)
      .lean();

    // Map to normalized structure
    return inAppList.map((item) => ({
      notificationId: item.notificationId,
      title: item.title,
      message: item.message,
      type: item.type,
      priority: item.priority,
      isRead: item.isRead,
      createdAt: item.createdAt,
      readAt: item.readAt,
      reference: item.reference
    }));
  }

  /**
   * Mark notification as read (Section 74)
   */
  static async markAsRead(notificationId) {
    await InAppNotification.updateMany(
      { notificationId },
      { $set: { isRead: true, readAt: new Date() } }
    );

    return await Notification.findOneAndUpdate(
      { notificationId },
      { $set: { status: 'READ', readAt: new Date() } },
      { new: true }
    );
  }

  /**
   * Retry notification (Section 76)
   */
  static async retryNotification(notificationId, force = false) {
    return await RetryService.retryNotification(notificationId, force);
  }

  /**
   * Notification Dashboard metrics & aggregates (Section 65-67)
   */
  static async getDashboardMetrics() {
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const [
      totalToday,
      pendingCount,
      processingCount,
      deliveredCount,
      failedCount,
      unknownCount,
      scheduledCount,
      partiallyDeliveredCount
    ] = await Promise.all([
      Notification.countDocuments({ createdAt: { $gte: startOfToday } }),
      Notification.countDocuments({ status: 'PENDING' }),
      Notification.countDocuments({ status: 'PROCESSING' }),
      Notification.countDocuments({ status: 'DELIVERED' }),
      Notification.countDocuments({ status: 'FAILED' }),
      Notification.countDocuments({ status: 'UNKNOWN' }),
      Notification.countDocuments({ scheduledAt: { $gt: new Date() } }),
      Notification.countDocuments({ status: 'PARTIALLY_DELIVERED' })
    ]);

    // Breakdown by channel from NotificationDelivery
    const channelStats = await Notification.aggregate([
      { $unwind: '$channels' },
      { $group: { _id: '$channels', count: { $sum: 1 } } }
    ]);

    // Breakdown by notification type
    const typeStats = await Notification.aggregate([
      { $group: { _id: '$type', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 8 }
    ]);

    return {
      today: {
        total: totalToday,
        pending: pendingCount,
        processing: processingCount,
        delivered: deliveredCount,
        failed: failedCount,
        unknown: unknownCount,
        scheduled: scheduledCount,
        partiallyDelivered: partiallyDeliveredCount
      },
      channelStats: channelStats.map((c) => ({ channel: c._id, count: c.count })),
      typeStats: typeStats.map((t) => ({ type: t._id, count: t.count }))
    };
  }

  /**
   * List notifications with comprehensive filtering (Section 75)
   */
  static async listNotifications({
    type,
    channel,
    status,
    patientId,
    userId,
    search,
    dateFrom,
    dateTo,
    page = 1,
    limit = 20
  }) {
    const filter = {};
    if (type) filter.type = type;
    if (channel) filter.channels = channel;
    if (status) filter.status = status;
    if (patientId) filter['recipient.patientId'] = patientId;
    if (userId) filter['recipient.userId'] = userId;
    if (dateFrom || dateTo) {
      filter.createdAt = {};
      if (dateFrom) filter.createdAt.$gte = new Date(dateFrom);
      if (dateTo) filter.createdAt.$lte = new Date(dateTo);
    }
    if (search) {
      filter.$or = [
        { notificationId: new RegExp(search, 'i') },
        { subject: new RegExp(search, 'i') },
        { 'recipient.phone': new RegExp(search, 'i') },
        { 'recipient.email': new RegExp(search, 'i') }
      ];
    }

    const skip = (parseInt(page, 10) - 1) * parseInt(limit, 10);
    const [total, data] = await Promise.all([
      Notification.countDocuments(filter),
      Notification.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit, 10))
        .lean()
    ]);

    return {
      total,
      page: parseInt(page, 10),
      pages: Math.ceil(total / limit),
      data
    };
  }
}

module.exports = NotificationService;
