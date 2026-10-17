const Notification = require('../models/Notification');
const NotificationDelivery = require('../models/NotificationDelivery');
const DeliveryService = require('./deliveryService');

const RETRYABLE_ERRORS = new Set([
  'TIMEOUT',
  'PROVIDER_TIMEOUT',
  'TEMPORARY_PROVIDER_ERROR',
  'RATE_LIMIT',
  'PROVIDER_RATE_LIMIT',
  'NETWORK_ERROR',
  'PROVIDER_UNAVAILABLE'
]);

const NON_RETRYABLE_ERRORS = new Set([
  'INVALID_PHONE',
  'INVALID_EMAIL',
  'INVALID_TEMPLATE',
  'MISSING_TEMPLATE_VARIABLE',
  'UNAUTHORIZED_PROVIDER_REQUEST',
  'UNSUBSCRIBED',
  'PERMANENT_PROVIDER_ERROR',
  'USER_OPTED_OUT',
  'NOTIFICATION_EXPIRED'
]);

class RetryService {
  /**
   * Determine if an error is eligible for automated retry
   */
  static isRetryable(errorCode) {
    if (!errorCode) return false;
    const normalized = String(errorCode).toUpperCase();
    if (NON_RETRYABLE_ERRORS.has(normalized)) return false;
    return RETRYABLE_ERRORS.has(normalized);
  }

  /**
   * Calculate next retry delay in milliseconds (Exponential Backoff: 1min, 5min, 15min)
   */
  static calculateBackoffDelay(attemptNumber) {
    const delays = [60 * 1000, 5 * 60 * 1000, 15 * 60 * 1000];
    const index = Math.min(attemptNumber - 1, delays.length - 1);
    return delays[Math.max(0, index)];
  }

  /**
   * Execute retry for a failed notification channel
   */
  static async retryNotification(notificationId, force = false) {
    const notification = await Notification.findOne({ notificationId });
    if (!notification) {
      throw new Error(`Notification ${notificationId} not found`);
    }

    // Safety rule (Section 39): Never retry if current status is UNKNOWN without reconciliation
    if (notification.status === 'UNKNOWN' && !force) {
      throw new Error('Cannot blindly retry notification in UNKNOWN state. Run status reconciliation first.');
    }

    if (notification.retryCount >= notification.maxRetries && !force) {
      throw new Error(`Notification has reached maximum retry limit (${notification.maxRetries})`);
    }

    // Check failed delivery attempts
    const failedDeliveries = await NotificationDelivery.find({
      notificationId: notification._id,
      status: { $in: ['FAILED', 'UNKNOWN'] }
    });

    if (failedDeliveries.length === 0 && !force) {
      throw new Error('No failed delivery attempts available to retry');
    }

    const channelsToRetry = failedDeliveries.length > 0
      ? [...new Set(failedDeliveries.map((d) => d.channel))]
      : notification.channels || ['IN_APP'];

    notification.retryCount = (notification.retryCount || 0) + 1;
    notification.status = 'PROCESSING';
    await notification.save();

    // Re-dispatch failed channels with incremented attempt number
    const retryResults = [];
    for (const channel of channelsToRetry) {
      const res = await DeliveryService.dispatchChannel(notification, channel, notification.retryCount + 1);
      retryResults.push(res);
    }

    // Re-evaluate aggregate status
    const allDeliveries = await NotificationDelivery.find({ notificationId: notification._id });
    const statuses = allDeliveries.map((d) => d.status);
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
      notification.deliveredAt = new Date();
    }
    await notification.save();

    return {
      notificationId: notification.notificationId,
      status: finalStatus,
      retryCount: notification.retryCount,
      retriedDeliveries: retryResults
    };
  }
}

module.exports = RetryService;
