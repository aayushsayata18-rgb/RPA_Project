const mongoose = require('mongoose');

// Central Notification Model (00_MASTER.md Section 26)
const notificationSchema = new mongoose.Schema(
  {
    notificationId: {
      type: String,
      unique: true,
      required: true,
      index: true
    },
    recipientId: {
      type: String,
      index: true
    },
    recipientPhone: {
      type: String
    },
    recipientEmail: {
      type: String
    },
    channel: {
      type: String,
      enum: ['SMS', 'EMAIL', 'IN_APP'],
      required: true
    },
    event: {
      type: String,
      required: true,
      index: true
    },
    templateCode: {
      type: String
    },
    title: {
      type: String
    },
    message: {
      type: String,
      required: true
    },
    status: {
      type: String,
      enum: ['PENDING', 'SENT', 'DELIVERED', 'FAILED', 'READ'],
      default: 'PENDING',
      index: true
    },
    failureReason: {
      type: String
    },
    retryCount: {
      type: Number,
      default: 0
    },
    correlationId: {
      type: String,
      index: true
    },
    entityType: {
      type: String
    },
    entityId: {
      type: String
    },
    scheduledFor: {
      type: Date
    },
    sentAt: {
      type: Date
    },
    readAt: {
      type: Date
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model('Notification', notificationSchema);
