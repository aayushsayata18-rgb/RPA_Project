const mongoose = require('mongoose');

const BedStatusHistorySchema = new mongoose.Schema(
  {
    bedId: {
      type: String,
      required: true,
      index: true
    },
    bedRef: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Bed'
    },
    bedNumber: {
      type: String,
      default: ''
    },
    previousStatus: {
      type: String,
      default: null
    },
    newStatus: {
      type: String,
      required: true
    },
    reason: {
      type: String,
      default: ''
    },
    referenceType: {
      type: String,
      enum: ['ADMISSION', 'ADMISSION_REQUEST', 'TRANSFER', 'DISCHARGE', 'HOUSEKEEPING', 'MAINTENANCE', 'ADMIN_BLOCK', 'RECONCILIATION', 'OTHER'],
      default: 'OTHER'
    },
    referenceId: {
      type: String,
      default: null
    },
    patientId: {
      type: String,
      default: null
    },
    changedByUserId: {
      type: String,
      default: 'SYSTEM'
    },
    changedByUserName: {
      type: String,
      default: ''
    },
    source: {
      type: String,
      default: 'MERN_PORTAL'
    },
    correlationId: {
      type: String,
      default: ''
    },
    timestamp: {
      type: Date,
      default: Date.now,
      index: true
    }
  },
  {
    timestamps: true
  }
);

BedStatusHistorySchema.index({ bedId: 1, timestamp: -1 });

module.exports = mongoose.model('BedStatusHistory', BedStatusHistorySchema);
