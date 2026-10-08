const Notification = require('../models/Notification');
const NotificationTemplate = require('../models/NotificationTemplate');
const AuditService = require('./AuditService');
const { v4: uuidv4 } = require('uuid');

class NotificationService {
  /**
   * Dispatch or schedule a notification (00_MASTER.md Section 26)
   */
  static async sendNotification({
    recipientId = null,
    recipientPhone = null,
    recipientEmail = null,
    channel = 'IN_APP', // 'SMS', 'EMAIL', 'IN_APP'
    event,
    templateCode = null,
    title = null,
    message = null,
    variables = {},
    entityType = null,
    entityId = null,
    correlationId = null
  }) {
    try {
      let finalTitle = title;
      let finalMessage = message;

      // If templateCode is provided, render the template
      if (templateCode) {
        const template = await NotificationTemplate.findOne({ templateCode, isActive: true });
        if (template) {
          finalTitle = template.subjectTemplate || title;
          finalMessage = template.bodyTemplate;

          // Replace placeholder variables: e.g. {{patientName}}
          for (const [key, val] of Object.entries(variables)) {
            const regex = new RegExp(`{{${key}}}`, 'g');
            finalMessage = finalMessage.replace(regex, val || '');
            if (finalTitle) {
              finalTitle = finalTitle.replace(regex, val || '');
            }
          }
        }
      }

      const notificationId = `NOTIF-${Date.now()}-${uuidv4().substring(0, 6).toUpperCase()}`;

      // Simulate provider dispatch (Mock adapter)
      let status = 'DELIVERED';
      let failureReason = null;

      if (!finalMessage) {
        status = 'FAILED';
        failureReason = 'Notification content cannot be empty.';
      }

      console.log(`[NotificationService] [${channel}] to ${recipientPhone || recipientEmail || recipientId}: [${event}] ${finalTitle || ''} - ${finalMessage}`);

      const notification = new Notification({
        notificationId,
        recipientId,
        recipientPhone,
        recipientEmail,
        channel,
        event,
        templateCode,
        title: finalTitle || event,
        message: finalMessage || '',
        status,
        failureReason,
        correlationId: correlationId || notificationId,
        entityType,
        entityId: entityId ? String(entityId) : null,
        sentAt: new Date()
      });

      await notification.save();

      return notification;
    } catch (error) {
      console.error('[NotificationService Error]:', error.message);
      return null;
    }
  }

  /**
   * Get In-App Notifications for a specific user
   */
  static async getUserNotifications(userId, unreadOnly = false) {
    const query = { recipientId: String(userId), channel: 'IN_APP' };
    if (unreadOnly) query.status = { $ne: 'READ' };
    return await Notification.find(query).sort({ createdAt: -1 }).limit(50).lean();
  }

  /**
   * Mark notification as read
   */
  static async markAsRead(notificationId) {
    return await Notification.findOneAndUpdate(
      { notificationId },
      { status: 'READ', readAt: new Date() },
      { new: true }
    );
  }
}

module.exports = NotificationService;
