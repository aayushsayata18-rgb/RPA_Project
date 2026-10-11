const mongoose = require('mongoose');

const employeeExternalSyncSchema = new mongoose.Schema(
  {
    employeeId: {
      type: String,
      required: true,
      index: true
    },
    employeeObjectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Employee'
    },
    externalSystem: {
      type: String,
      required: true,
      default: 'EXTERNAL_HR_SYSTEM'
    },
    externalEmployeeId: {
      type: String,
      default: null
    },
    syncType: {
      type: String,
      enum: ['ONBOARDING', 'UPDATE', 'ACCESS_PROVISION', 'ROLE_UPDATE', 'OFFBOARDING', 'REVOKE'],
      required: true
    },
    status: {
      type: String,
      enum: ['NOT_SYNCED', 'QUEUED', 'SYNCING', 'SYNCED', 'FAILED', 'MANUAL_REVIEW'],
      default: 'QUEUED',
      index: true
    },
    lastSyncedAt: {
      type: Date,
      default: null
    },
    lastAttemptAt: {
      type: Date,
      default: Date.now
    },
    errorCode: {
      type: String,
      default: null
    },
    errorMessage: {
      type: String,
      default: null
    },
    rpaJobId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'RPAJob',
      default: null
    },
    correlationId: {
      type: String,
      default: null
    },
    syncPayload: {
      type: mongoose.Schema.Types.Mixed,
      default: null
    },
    verificationResult: {
      type: mongoose.Schema.Types.Mixed,
      default: null
    }
  },
  {
    timestamps: true
  }
);

employeeExternalSyncSchema.index({ employeeId: 1, externalSystem: 1 });

module.exports = mongoose.model('EmployeeExternalSync', employeeExternalSyncSchema);
