const mongoose = require('mongoose');

// Central Notification Model (Module 26: 26_NOTIFICATION_SERVICE.md)
const notificationSchema = new mongoose.Schema(
  {
    notificationId: {
      type: String,
      unique: true,
      required: true,
      index: true
    },
    type: {
      type: String,
      required: true,
      index: true
    },
    // Backward compatibility alias for event
    event: {
      type: String,
      index: true
    },
    recipient: {
      userId: {
        type: String,
        default: null,
        index: true
      },
      patientId: {
        type: String,
        default: null,
        index: true
      },
      employeeId: {
        type: String,
        default: null,
        index: true
      },
      phone: {
        type: String,
        trim: true,
        default: null
      },
      email: {
        type: String,
        trim: true,
        lowercase: true,
        default: null
      },
      name: {
        type: String,
        default: null
      }
    },
    // Backward compatibility fields
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

    channels: [
      {
        type: String,
        enum: ['SMS', 'EMAIL', 'IN_APP', 'PUSH', 'WHATSAPP', 'PORTAL', 'WEB']
      }
    ],
    // Backward compatibility channel
    channel: {
      type: String,
      enum: ['SMS', 'EMAIL', 'IN_APP', 'PUSH', 'WHATSAPP', 'PORTAL', 'WEB']
    },

    templateId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'NotificationTemplate',
      default: null
    },
    templateCode: {
      type: String,
      default: null
    },
    templateVersion: {
      type: Number,
      default: 1
    },

    subject: {
      type: String,
      default: null
    },
    title: {
      type: String,
      default: null
    },
    body: {
      type: String,
      default: ''
    },
    message: {
      type: String,
      default: ''
    },

    priority: {
      type: String,
      enum: ['LOW', 'NORMAL', 'HIGH', 'URGENT', 'CRITICAL'],
      default: 'NORMAL',
      index: true
    },

    status: {
      type: String,
      enum: [
        'DRAFT',
        'PENDING',
        'QUEUED',
        'PROCESSING',
        'PROVIDER_ACCEPTED',
        'DELIVERED',
        'PARTIALLY_DELIVERED',
        'FAILED',
        'CANCELLED',
        'EXPIRED',
        'UNKNOWN',
        'READ',
        'SENT'
      ],
      default: 'PENDING',
      index: true
    },

    scheduledAt: {
      type: Date,
      default: null
    },
    scheduledFor: {
      type: Date,
      default: null
    },
    sentAt: {
      type: Date,
      default: null
    },
    deliveredAt: {
      type: Date,
      default: null
    },
    expiresAt: {
      type: Date,
      default: null
    },
    readAt: {
      type: Date,
      default: null
    },

    reference: {
      entityType: { type: String, default: null },
      entityId: { type: String, default: null },
      module: { type: String, default: null },
      route: { type: String, default: null }
    },
    entityType: {
      type: String
    },
    entityId: {
      type: String
    },

    correlationId: {
      type: String,
      index: true
    },
    idempotencyKey: {
      type: String,
      index: true,
      sparse: true
    },

    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {}
    },

    failureReason: {
      type: String,
      default: null
    },
    errorCode: {
      type: String,
      default: null
    },

    retryCount: {
      type: Number,
      default: 0
    },
    maxRetries: {
      type: Number,
      default: 3
    },
    nextRetryAt: {
      type: Date,
      default: null
    },

    createdBy: {
      type: String,
      default: 'SYSTEM'
    },
    updatedBy: {
      type: String,
      default: 'SYSTEM'
    }
  },
  {
    timestamps: true
  }
);

// Indexes defined in 26_NOTIFICATION_SERVICE.md Section 88
notificationSchema.index({ 'recipient.userId': 1, createdAt: -1 });
notificationSchema.index({ 'recipient.patientId': 1, createdAt: -1 });
notificationSchema.index({ 'recipient.employeeId': 1, createdAt: -1 });
notificationSchema.index({ status: 1, scheduledAt: 1 });
notificationSchema.index({ type: 1, createdAt: -1 });
notificationSchema.index({ 'reference.entityType': 1, 'reference.entityId': 1 });

module.exports = mongoose.model('Notification', notificationSchema);
