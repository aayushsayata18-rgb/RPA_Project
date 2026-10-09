const mongoose = require('mongoose');

const AdmissionHistorySchema = new mongoose.Schema(
  {
    admissionId: {
      type: String,
      default: null,
      index: true
    },
    admissionRequestId: {
      type: String,
      required: true,
      index: true
    },
    patientId: {
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
      required: true
    },
    actorUserId: {
      type: String,
      default: 'SYSTEM'
    },
    actorRole: {
      type: String,
      default: 'SYSTEM'
    },
    actorName: {
      type: String,
      default: 'System Workflow'
    },
    details: {
      type: mongoose.Schema.Types.Mixed,
      default: {}
    },
    reason: {
      type: String,
      default: ''
    },
    timestamp: {
      type: Date,
      default: Date.now
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

module.exports = mongoose.model('AdmissionHistory', AdmissionHistorySchema);
