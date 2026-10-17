const NotificationDelivery = require('../models/NotificationDelivery');
const InAppNotification = require('../models/InAppNotification');
const IdGeneratorService = require('./IdGeneratorService');
const { getSmsProvider } = require('../providers/sms/SmsProvider');
const { getEmailProvider } = require('../providers/email/EmailProvider');

class DeliveryService {
  /**
   * Dispatch notification across specified channels
   * @param {Object} notification Mongoose Notification document
   * @param {Array<string>} channels List of channels to dispatch (e.g. ['SMS', 'EMAIL', 'IN_APP'])
   */
  static async dispatchNotification(notification, channels = []) {
    const dispatchChannels = channels && channels.length > 0 ? channels : notification.channels || ['IN_APP'];
    const deliveryResults = [];

    for (const channel of dispatchChannels) {
      try {
        const result = await this.dispatchChannel(notification, channel);
        deliveryResults.push(result);
      } catch (err) {
        console.error(`[DeliveryService] Error dispatching channel ${channel}:`, err.message);
        deliveryResults.push({
          channel,
          status: 'FAILED',
          error: err.message
        });
      }
    }

    // Determine aggregate notification status (Section 11 & 31)
    const statuses = deliveryResults.map((r) => r.status);
    let finalStatus = 'DELIVERED';

    const hasDelivered = statuses.includes('DELIVERED');
    const hasAccepted = statuses.includes('PROVIDER_ACCEPTED');
    const hasFailed = statuses.includes('FAILED');
    const hasUnknown = statuses.includes('UNKNOWN');

    if (hasUnknown) {
      finalStatus = 'UNKNOWN';
    } else if (hasFailed && (hasDelivered || hasAccepted)) {
      finalStatus = 'PARTIALLY_DELIVERED';
    } else if (hasFailed && !hasDelivered && !hasAccepted) {
      finalStatus = 'FAILED';
    } else if (hasAccepted && !hasDelivered) {
      finalStatus = 'PROVIDER_ACCEPTED';
    } else if (hasDelivered) {
      finalStatus = 'DELIVERED';
    }

    notification.status = finalStatus;
    if (finalStatus === 'DELIVERED') {
      notification.deliveredAt = new Date();
    } else if (finalStatus === 'FAILED') {
      notification.failureReason = deliveryResults.find((r) => r.error)?.error || 'Channel dispatch failed';
    }

    await notification.save();

    return {
      notificationId: notification.notificationId,
      status: finalStatus,
      deliveries: deliveryResults
    };
  }

  /**
   * Dispatch single channel attempt
   */
  static async dispatchChannel(notification, channel, attemptNumber = 1) {
    const deliveryId = await IdGeneratorService.generateNotificationDeliveryId();
    const recipient = notification.recipient || {};
    const title = notification.subject || notification.title || notification.type;
    const body = notification.body || notification.message || '';

    let providerName = 'INTERNAL';
    let providerRes = null;
    let channelStatus = 'PENDING';
    let errorCode = null;
    let errorMessage = null;

    if (channel === 'SMS') {
      const smsProvider = getSmsProvider();
      providerName = smsProvider.name;
      providerRes = await smsProvider.send({
        to: recipient.phone || notification.recipientPhone,
        message: body,
        correlationId: notification.correlationId,
        notificationId: notification.notificationId
      });

      channelStatus = providerRes.status;
      if (!providerRes.success) {
        errorCode = providerRes.error || 'PROVIDER_REJECTED';
        errorMessage = providerRes.raw?.reason || providerRes.error || 'SMS delivery failed';
      }
    } else if (channel === 'EMAIL') {
      const emailProvider = getEmailProvider();
      providerName = emailProvider.name;
      providerRes = await emailProvider.send({
        to: recipient.email || notification.recipientEmail,
        subject: title,
        body,
        correlationId: notification.correlationId,
        notificationId: notification.notificationId
      });

      channelStatus = providerRes.status;
      if (!providerRes.success) {
        errorCode = providerRes.error || 'EMAIL_REJECTED';
        errorMessage = providerRes.raw?.reason || providerRes.error || 'Email delivery failed';
      }
    } else if (channel === 'IN_APP') {
      providerName = 'IN_APP_PORTAL';
      try {
        const inApp = new InAppNotification({
          notificationId: notification.notificationId,
          recipientUserId: recipient.userId ? String(recipient.userId) : (notification.recipientId || 'GLOBAL'),
          recipientPatientId: recipient.patientId,
          recipientEmployeeId: recipient.employeeId,
          title,
          message: body,
          type: notification.type,
          priority: notification.priority,
          reference: notification.reference || {
            entityType: notification.entityType,
            entityId: notification.entityId
          }
        });
        await inApp.save();
        channelStatus = 'DELIVERED';
      } catch (err) {
        channelStatus = 'FAILED';
        errorCode = 'IN_APP_DB_ERROR';
        errorMessage = err.message;
      }
    } else {
      channelStatus = 'FAILED';
      errorCode = 'UNSUPPORTED_CHANNEL';
      errorMessage = `Channel ${channel} is not currently supported`;
    }

    const delivery = new NotificationDelivery({
      deliveryId,
      notificationId: notification._id,
      notificationCode: notification.notificationId,
      channel,
      provider: providerName,
      recipient: {
        phone: recipient.phone || notification.recipientPhone,
        email: recipient.email || notification.recipientEmail,
        userId: recipient.userId ? String(recipient.userId) : notification.recipientId
      },
      status: channelStatus,
      attemptNumber,
      providerMessageId: providerRes?.providerMessageId || null,
      providerStatus: providerRes?.status || channelStatus,
      requestedAt: new Date(),
      acceptedAt: channelStatus === 'PROVIDER_ACCEPTED' ? new Date() : null,
      deliveredAt: channelStatus === 'DELIVERED' ? new Date() : null,
      failedAt: channelStatus === 'FAILED' ? new Date() : null,
      errorCode,
      errorMessage,
      responseMetadata: providerRes?.raw || {}
    });

    await delivery.save();

    return {
      deliveryId,
      channel,
      provider: providerName,
      status: channelStatus,
      providerMessageId: providerRes?.providerMessageId || null,
      error: errorMessage
    };
  }
}

module.exports = DeliveryService;
