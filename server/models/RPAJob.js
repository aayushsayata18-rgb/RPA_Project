const mongoose = require('mongoose');

// RPA Job Lifecycle: CREATED -> QUEUED -> RUNNING -> SUCCESS / FAILED / RETRYING / EXCEPTION / CANCELLED
const rpaJobSchema = new mongoose.Schema(
  {
    jobId: {
      type: String,
      unique: true,
      required: true,
      index: true
    },
    jobName: {
      type: String,
      required: true,
      index: true
    },
    module: {
      type: String,
      required: true,
      index: true
    },
    targetSystem: {
      type: String,
      required: true // e.g., 'INSURANCE_PORTAL', 'EXTERNAL_LIS', 'HRMS_PORTAL', 'SMS_GATEWAY'
    },
    action: {
      type: String,
      required: true
    },
    entityType: {
      type: String,
      required: true
    },
    entityId: {
      type: String,
      required: true,
      index: true
    },
    status: {
      type: String,
      enum: ['CREATED', 'QUEUED', 'RUNNING', 'SUCCESS', 'FAILED', 'RETRYING', 'EXCEPTION', 'CANCELLED'],
      default: 'CREATED',
      index: true
    },
    payload: {
      type: mongoose.Schema.Types.Mixed,
      default: {}
    },
    result: {
      type: mongoose.Schema.Types.Mixed,
      default: null
    },
    error: {
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
    idempotencyKey: {
      type: String,
      unique: true,
      sparse: true,
      index: true
    },
    evidencePaths: [
      {
        type: String // screenshots, logs, HTML snapshots
      }
    ],
    startedAt: {
      type: Date
    },
    completedAt: {
      type: Date
    },
    createdBy: {
      type: String,
      default: 'SYSTEM'
    }
  },
  {
    timestamps: true
  }
);

rpaJobSchema.index({ module: 1, status: 1, createdAt: -1 });

module.exports = mongoose.model('RPAJob', rpaJobSchema);
