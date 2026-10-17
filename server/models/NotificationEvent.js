const mongoose = require('mongoose');

// Normalized Notification Event Model (26_NOTIFICATION_SERVICE.md Section 51)
const notificationEventSchema = new mongoose.Schema(
  {
    eventId: {
      type: String,
      required: true,
      unique: true,
      index: true
    },
    eventType: {
      type: String,
      required: true,
      index: true
    },
    sourceModule: {
      type: String,
      required: true,
      index: true
    },
    entityType: {
      type: String,
      default: null
    },
    entityId: {
      type: String,
      default: null
    },
    recipient: {
      userId: { type: String, default: null },
      patientId: { type: String, default: null },
      employeeId: { type: String, default: null },
      email: { type: String, default: null },
      phone: { type: String, default: null },
      role: { type: String, default: null },
      department: { type: String, default: null }
    },
    payload: {
      type: mongoose.Schema.Types.Mixed,
      default: {}
    },
    occurredAt: {
      type: Date,
      default: Date.now
    },
    correlationId: {
      type: String,
      default: null,
      index: true
    },
    status: {
      type: String,
      enum: ['PENDING', 'PROCESSED', 'FAILED'],
      default: 'PENDING',
      index: true
    },
    processedNotificationId: {
      type: String,
      default: null
    },
    processingError: {
      type: String,
      default: null
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model('NotificationEvent', notificationEventSchema);
