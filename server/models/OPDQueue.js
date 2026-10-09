const mongoose = require('mongoose');

const opdQueueSchema = new mongoose.Schema(
  {
    queueId: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
      index: true
    },
    hospitalId: {
      type: String,
      default: 'HOSP-001',
      index: true
    },
    queueDate: {
      type: Date,
      required: true,
      index: true
    },
    queueDateStr: {
      type: String, // "YYYY-MM-DD"
      required: true,
      index: true
    },
    departmentId: {
      type: String,
      required: true,
      index: true
    },
    departmentName: {
      type: String,
      required: true
    },
    doctorId: {
      type: String,
      default: null,
      index: true
    },
    doctorName: {
      type: String,
      default: null
    },
    roomNumber: {
      type: String,
      default: 'OPD-101'
    },
    queueType: {
      type: String,
      enum: ['DOCTOR_SPECIFIC', 'DEPARTMENT_SPECIFIC', 'CLINIC_SPECIFIC', 'GENERAL_OPD'],
      default: 'DEPARTMENT_SPECIFIC',
      index: true
    },
    status: {
      type: String,
      enum: ['OPEN', 'PAUSED', 'CLOSED'],
      default: 'OPEN',
      index: true
    },
    currentToken: {
      type: String,
      default: null // e.g. "GM-101"
    },
    currentTokenId: {
      type: String,
      default: null // e.g. "TOKEN-20261009-00101"
    },
    totalCheckedIn: {
      type: Number,
      default: 0
    },
    totalWaiting: {
      type: Number,
      default: 0
    },
    totalInService: {
      type: Number,
      default: 0
    },
    totalCompleted: {
      type: Number,
      default: 0
    },
    totalSkipped: {
      type: Number,
      default: 0
    },
    totalCancelled: {
      type: Number,
      default: 0
    },
    pauseReason: {
      type: String,
      default: null
    },
    pausedAt: {
      type: Date,
      default: null
    },
    pausedBy: {
      type: String,
      default: null
    },
    resumedAt: {
      type: Date,
      default: null
    },
    resumedBy: {
      type: String,
      default: null
    },
    openedAt: {
      type: Date,
      default: Date.now
    },
    openedBy: {
      type: String,
      default: 'SYSTEM'
    },
    closedAt: {
      type: Date,
      default: null
    },
    closedBy: {
      type: String,
      default: null
    },
    closurePolicyApplied: {
      type: String,
      default: null
    }
  },
  {
    timestamps: true
  }
);

// Compound indexes for fast query resolution
opdQueueSchema.index({ departmentId: 1, queueDateStr: 1 });
opdQueueSchema.index({ doctorId: 1, queueDateStr: 1 });
opdQueueSchema.index({ status: 1, queueDateStr: 1 });

module.exports = mongoose.model('OPDQueue', opdQueueSchema);
