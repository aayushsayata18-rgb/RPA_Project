const Notification = require('../models/Notification');
const NotificationDelivery = require('../models/NotificationDelivery');
const { getSmsProvider } = require('../providers/sms/SmsProvider');
const { getEmailProvider } = require('../providers/email/EmailProvider');

class ReconciliationService {
  /**
   * Reconcile all pending/unknown delivery records with provider APIs
   */
  static async reconcileDeliveries(limit = 50) {
    const unconfirmed = await NotificationDelivery.find({
      status: { $in: ['UNKNOWN', 'PROVIDER_ACCEPTED', 'PROCESSING'] },
      providerMessageId: { $ne: null }
    }).limit(limit);

    let reconciledCount = 0;
    const results = [];

    for (const delivery of unconfirmed) {
      try {
        let statusRes = null;
        if (delivery.channel === 'SMS') {
          const smsProvider = getSmsProvider();
          statusRes = await smsProvider.getDeliveryStatus(delivery.providerMessageId);
        } else if (delivery.channel === 'EMAIL') {
          const emailProvider = getEmailProvider();
          statusRes = await emailProvider.getDeliveryStatus(delivery.providerMessageId);
        }

        if (statusRes && statusRes.status && statusRes.status !== delivery.status) {
          delivery.status = statusRes.status;
          delivery.providerStatus = statusRes.status;
          if (statusRes.status === 'DELIVERED') {
            delivery.deliveredAt = statusRes.deliveredAt || new Date();
          } else if (statusRes.status === 'FAILED') {
            delivery.failedAt = new Date();
            delivery.errorCode = statusRes.errorCode || 'PROVIDER_RECONCILIATION_FAILED';
          }
          await delivery.save();
          reconciledCount++;

          // Re-evaluate parent notification status
          await this.recalculateNotificationStatus(delivery.notificationId);

          results.push({
            deliveryId: delivery.deliveryId,
            providerMessageId: delivery.providerMessageId,
            newStatus: statusRes.status
          });
        }
      } catch (err) {
        console.warn(`[ReconciliationService] Failed to reconcile delivery ${delivery.deliveryId}:`, err.message);
      }
    }

    return {
      reconciledCount,
      details: results
    };
  }

  /**
   * Reconcile specific delivery via Webhook callback (Section 40-42)
   */
  static async processWebhookCallback(providerName, payload, signature = null) {
    const providerMessageId = payload.providerMessageId || payload.messageId || payload.id;
    const rawStatus = (payload.status || payload.event || '').toUpperCase();

    if (!providerMessageId) {
      throw new Error('WEBHOOK_ERROR: Missing providerMessageId in payload');
    }

    // Locate delivery attempt
    const delivery = await NotificationDelivery.findOne({ providerMessageId });
    if (!delivery) {
      console.warn(`[ReconciliationService] Webhook received for untracked providerMessageId: ${providerMessageId}`);
      return { success: true, message: 'Received (untracked)' };
    }

    // Idempotency: if already marked DELIVERED or FAILED with same status, return safely
    let normalizedStatus = 'DELIVERED';
    if (['FAILED', 'BOUNCED', 'REJECTED', 'UNDELIVERED', 'ERROR'].includes(rawStatus)) {
      normalizedStatus = 'FAILED';
    } else if (['ACCEPTED', 'QUEUED', 'SENT'].includes(rawStatus)) {
      normalizedStatus = 'PROVIDER_ACCEPTED';
    }

    if (delivery.status === normalizedStatus) {
      return {
        success: true,
        idempotent: true,
        deliveryId: delivery.deliveryId,
        status: delivery.status
      };
    }

    delivery.status = normalizedStatus;
    delivery.providerStatus = rawStatus;
    if (normalizedStatus === 'DELIVERED') {
      delivery.deliveredAt = new Date();
    } else if (normalizedStatus === 'FAILED') {
      delivery.failedAt = new Date();
      delivery.errorMessage = payload.error || payload.reason || 'Webhook reported failure';
    }

    delivery.responseMetadata = {
      ...(delivery.responseMetadata || {}),
      webhookPayload: payload,
      webhookReceivedAt: new Date()
    };

    await delivery.save();

    // Update parent notification
    await this.recalculateNotificationStatus(delivery.notificationId);

    return {
      success: true,
      deliveryId: delivery.deliveryId,
      status: normalizedStatus
    };
  }

  /**
   * Recalculate parent notification status from child delivery attempts
   */
  static async recalculateNotificationStatus(notificationDocId) {
    const notification = await Notification.findById(notificationDocId);
    if (!notification) return;

    const deliveries = await NotificationDelivery.find({ notificationId: notificationDocId });
    if (deliveries.length === 0) return;

    const statuses = deliveries.map((d) => d.status);
    let finalStatus = 'DELIVERED';

    if (statuses.includes('UNKNOWN')) {
      finalStatus = 'UNKNOWN';
    } else if (statuses.includes('FAILED') && (statuses.includes('DELIVERED') || statuses.includes('PROVIDER_ACCEPTED'))) {
      finalStatus = 'PARTIALLY_DELIVERED';
    } else if (statuses.includes('FAILED') && !statuses.includes('DELIVERED') && !statuses.includes('PROVIDER_ACCEPTED')) {
      finalStatus = 'FAILED';
    } else if (statuses.includes('PROVIDER_ACCEPTED') && !statuses.includes('DELIVERED')) {
      finalStatus = 'PROVIDER_ACCEPTED';
    }

    notification.status = finalStatus;
    if (finalStatus === 'DELIVERED') {
      notification.deliveredAt = notification.deliveredAt || new Date();
    }
    await notification.save();
  }
}

module.exports = ReconciliationService;
