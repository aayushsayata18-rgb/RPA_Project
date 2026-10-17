const mongoose = require('mongoose');

// Delivery Attempt Model (26_NOTIFICATION_SERVICE.md Section 12)
const notificationDeliverySchema = new mongoose.Schema(
  {
    deliveryId: {
      type: String,
      required: true,
      unique: true,
      index: true
    },
    notificationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Notification',
      required: true,
      index: true
    },
    notificationCode: {
      type: String,
      index: true
    },
    channel: {
      type: String,
      enum: ['SMS', 'EMAIL', 'IN_APP', 'PUSH', 'WHATSAPP'],
      required: true
    },
    provider: {
      type: String,
      required: true
    },
    recipient: {
      phone: { type: String, default: null },
      email: { type: String, default: null },
      userId: { type: String, default: null }
    },
    status: {
      type: String,
      enum: ['PENDING', 'PROCESSING', 'PROVIDER_ACCEPTED', 'DELIVERED', 'FAILED', 'UNKNOWN', 'CANCELLED'],
      default: 'PENDING',
      index: true
    },
    attemptNumber: {
      type: Number,
      default: 1
    },
    providerMessageId: {
      type: String,
      index: true,
      default: null
    },
    providerStatus: {
      type: String,
      default: null
    },
    requestedAt: {
      type: Date,
      default: Date.now
    },
    acceptedAt: {
      type: Date,
      default: null
    },
    deliveredAt: {
      type: Date,
      default: null
    },
    failedAt: {
      type: Date,
      default: null
    },
    errorCode: {
      type: String,
      default: null
    },
    errorMessage: {
      type: String,
      default: null
    },
    responseMetadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {}
    }
  },
  {
    timestamps: true
  }
);

notificationDeliverySchema.index({ notificationId: 1, channel: 1, attemptNumber: -1 });

module.exports = mongoose.model('NotificationDelivery', notificationDeliverySchema);
