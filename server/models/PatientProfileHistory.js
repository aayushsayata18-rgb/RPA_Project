const mongoose = require('mongoose');

const patientProfileHistorySchema = new mongoose.Schema(
  {
    patientId: {
      type: String,
      required: true,
      index: true
    },
    patientRef: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Patient'
    },
    field: {
      type: String,
      required: true
    },
    previousValue: {
      type: mongoose.Schema.Types.Mixed
    },
    newValue: {
      type: mongoose.Schema.Types.Mixed
    },
    reason: {
      type: String,
      default: 'Demographic update'
    },
    changedByUserId: {
      type: String,
      required: true
    },
    changedByName: {
      type: String,
      default: ''
    },
    changedByRole: {
      type: String,
      required: true
    },
    verifiedByUserId: {
      type: String
    },
    isSensitive: {
      type: Boolean,
      default: false
    },
    timestamp: {
      type: Date,
      default: Date.now,
      index: true
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

patientProfileHistorySchema.index({ patientId: 1, timestamp: -1 });

module.exports = mongoose.model('PatientProfileHistory', patientProfileHistorySchema);
