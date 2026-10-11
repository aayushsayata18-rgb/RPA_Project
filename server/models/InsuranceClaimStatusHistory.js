const mongoose = require('mongoose');

/**
 * InsuranceClaimStatusHistory Model (Section 10 & Section 13)
 */
const insuranceClaimStatusHistorySchema = new mongoose.Schema(
  {
    claimId: {
      type: String,
      required: true,
      index: true
    },
    previousStatus: {
      type: String,
      required: true
    },
    newStatus: {
      type: String,
      required: true
    },
    changedBy: {
      type: String,
      default: 'SYSTEM'
    },
    source: {
      type: String,
      enum: ['API', 'INSURER_PORTAL_RPA', 'MANUAL', 'SYSTEM'],
      default: 'SYSTEM'
    },
    reason: {
      type: String,
      default: ''
    },
    insurerReference: {
      type: String,
      default: ''
    },
    timestamp: {
      type: Date,
      default: Date.now,
      index: true
    },
    metadata: {
      type: Object,
      default: {}
    }
  },
  {
    timestamps: true
  }
);

insuranceClaimStatusHistorySchema.index({ claimId: 1, timestamp: -1 });

module.exports = mongoose.model('InsuranceClaimStatusHistory', insuranceClaimStatusHistorySchema);
