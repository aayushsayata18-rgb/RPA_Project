const Notification = require('../models/Notification');
const DeliveryService = require('../services/deliveryService');
const NotificationService = require('../services/NotificationService');

class NotificationWorker {
  /**
   * Process all pending notifications whose scheduled time has arrived
   */
  static async processScheduledQueue(batchSize = 25) {
    const now = new Date();
    const readyNotifications = await Notification.find({
      status: { $in: ['PENDING', 'QUEUED'] },
      $or: [
        { scheduledAt: null },
        { scheduledAt: { $lte: now } }
      ]
    })
      .sort({ priority: -1, createdAt: 1 })
      .limit(batchSize);

    let processedCount = 0;

    for (const notif of readyNotifications) {
      try {
        notif.status = 'PROCESSING';
        await notif.save();

        await DeliveryService.dispatchNotification(notif, notif.channels);
        processedCount++;
      } catch (err) {
        console.error(`[NotificationWorker] Failed to process notification ${notif.notificationId}:`, err.message);
        notif.status = 'FAILED';
        notif.failureReason = err.message;
        await notif.save();
      }
    }

    // Sweep expired notifications
    await NotificationService.expireOutdatedNotifications();

    return { processedCount };
  }
}

module.exports = NotificationWorker;
