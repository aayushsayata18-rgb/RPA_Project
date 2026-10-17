const mongoose = require('mongoose');

// Bulk Campaign Model (26_NOTIFICATION_SERVICE.md Section 63)
const notificationCampaignSchema = new mongoose.Schema(
  {
    campaignId: {
      type: String,
      required: true,
      unique: true,
      index: true
    },
    name: {
      type: String,
      required: true,
      trim: true
    },
    type: {
      type: String,
      default: 'ANNOUNCEMENT',
      index: true
    },
    createdBy: {
      type: String,
      default: 'SYSTEM'
    },
    audienceDefinition: {
      targetGroup: {
        type: String,
        enum: ['ALL_PATIENTS', 'INPATIENTS', 'OPD_TODAY', 'ALL_STAFF', 'DEPARTMENT', 'CUSTOM'],
        default: 'CUSTOM'
      },
      departmentId: {
        type: String,
        default: null
      },
      filterCriteria: {
        type: mongoose.Schema.Types.Mixed,
        default: {}
      }
    },
    recipientCount: {
      type: Number,
      default: 0
    },
    messageTemplateId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'NotificationTemplate',
      default: null
    },
    templateCode: {
      type: String,
      default: null
    },
    customSubject: {
      type: String,
      default: null
    },
    customBody: {
      type: String,
      default: null
    },
    channels: [
      {
        type: String,
        enum: ['SMS', 'EMAIL', 'IN_APP', 'PUSH']
      }
    ],
    status: {
      type: String,
      enum: [
        'DRAFT',
        'PENDING_APPROVAL',
        'APPROVED',
        'SCHEDULED',
        'PROCESSING',
        'COMPLETED',
        'PARTIALLY_COMPLETED',
        'CANCELLED',
        'FAILED'
      ],
      default: 'DRAFT',
      index: true
    },
    scheduledAt: {
      type: Date,
      default: null
    },
    startedAt: {
      type: Date,
      default: null
    },
    completedAt: {
      type: Date,
      default: null
    },
    approvalRequired: {
      type: Boolean,
      default: true
    },
    approvedBy: {
      type: String,
      default: null
    },
    approvedAt: {
      type: Date,
      default: null
    },
    deliveryStats: {
      total: { type: Number, default: 0 },
      delivered: { type: Number, default: 0 },
      failed: { type: Number, default: 0 },
      pending: { type: Number, default: 0 }
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model('NotificationCampaign', notificationCampaignSchema);
