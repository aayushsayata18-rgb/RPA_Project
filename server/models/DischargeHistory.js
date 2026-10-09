const mongoose = require('mongoose');

const DischargeHistorySchema = new mongoose.Schema(
  {
    dischargeId: {
      type: String,
      required: true,
      index: true
    },
    admissionId: {
      type: String,
      index: true
    },
    patientId: {
      type: String,
      index: true
    },
    action: {
      type: String,
      required: true
    },
    previousStatus: {
      type: String
    },
    newStatus: {
      type: String
    },
    changedBy: {
      type: String,
      required: true,
      default: 'SYSTEM'
    },
    changedByRole: {
      type: String,
      default: 'SYSTEM'
    },
    timestamp: {
      type: Date,
      default: Date.now,
      index: true
    },
    details: {
      type: String,
      default: ''
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {}
    },
    correlationId: {
      type: String,
      index: true
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model('DischargeHistory', DischargeHistorySchema);
