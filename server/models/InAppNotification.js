const mongoose = require('mongoose');

// In-App Notification Model (26_NOTIFICATION_SERVICE.md Section 21)
const inAppNotificationSchema = new mongoose.Schema(
  {
    notificationId: {
      type: String,
      required: true,
      index: true
    },
    recipientUserId: {
      type: String,
      index: true,
      default: null
    },
    recipientPatientId: {
      type: String,
      index: true,
      default: null
    },
    recipientEmployeeId: {
      type: String,
      index: true,
      default: null
    },
    title: {
      type: String,
      required: true
    },
    message: {
      type: String,
      required: true
    },
    type: {
      type: String,
      index: true
    },
    priority: {
      type: String,
      enum: ['LOW', 'NORMAL', 'HIGH', 'URGENT', 'CRITICAL'],
      default: 'NORMAL'
    },
    reference: {
      entityType: { type: String, default: null },
      entityId: { type: String, default: null },
      route: { type: String, default: null }
    },
    isRead: {
      type: Boolean,
      default: false,
      index: true
    },
    readAt: {
      type: Date,
      default: null
    }
  },
  {
    timestamps: true
  }
);

inAppNotificationSchema.index({ recipientUserId: 1, isRead: 1, createdAt: -1 });
inAppNotificationSchema.index({ recipientPatientId: 1, isRead: 1, createdAt: -1 });

module.exports = mongoose.model('InAppNotification', inAppNotificationSchema);
