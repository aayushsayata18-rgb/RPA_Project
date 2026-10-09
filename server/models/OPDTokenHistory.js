const mongoose = require('mongoose');

const opdTokenHistorySchema = new mongoose.Schema(
  {
    tokenId: {
      type: String,
      required: true,
      index: true
    },
    tokenNumber: {
      type: String,
      required: true
    },
    queueId: {
      type: String,
      required: true,
      index: true
    },
    previousStatus: {
      type: String,
      default: null
    },
    newStatus: {
      type: String,
      required: true
    },
    action: {
      type: String,
      enum: [
        'CHECKED_IN',
        'CALLED',
        'SERVICE_STARTED',
        'COMPLETED',
        'SKIPPED',
        'RETURNED',
        'TRANSFERRED',
        'CANCELLED',
        'PRIORITY_ASSIGNED',
        'LATE_RECORDED',
        'NO_SHOW_MARKED'
      ],
      required: true
    },
    actorUserId: {
      type: String,
      required: true
    },
    actorRole: {
      type: String,
      default: 'SYSTEM'
    },
    actorName: {
      type: String,
      default: 'System User'
    },
    reason: {
      type: String,
      default: null
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {}
    },
    timestamp: {
      type: Date,
      default: Date.now,
      index: true
    },
    correlationId: {
      type: String,
      required: true
    }
  },
  {
    timestamps: true
  }
);

opdTokenHistorySchema.index({ tokenId: 1, timestamp: -1 });

module.exports = mongoose.model('OPDTokenHistory', opdTokenHistorySchema);
