const mongoose = require('mongoose');

// Central ExceptionCase Model conforming to 00_MASTER.md Section 39
const exceptionCaseSchema = new mongoose.Schema(
  {
    exceptionId: {
      type: String,
      unique: true,
      required: true,
      index: true
    },
    module: {
      type: String,
      required: true,
      index: true
    },
    entityType: {
      type: String,
      required: true,
      index: true
    },
    entityId: {
      type: String,
      required: true,
      index: true
    },
    rpaJobId: {
      type: String,
      index: true
    },
    exceptionType: {
      type: String,
      required: true,
      index: true
    },
    description: {
      type: String,
      required: true
    },
    severity: {
      type: String,
      enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'],
      default: 'MEDIUM',
      index: true
    },
    source: {
      type: String,
      enum: ['SYSTEM', 'RPA', 'API', 'USER', 'PORTAL'],
      default: 'SYSTEM'
    },
    currentStatus: {
      type: String,
      enum: ['OPEN', 'UNDER_REVIEW', 'RESOLVED', 'DISMISSED', 'ESCALATED'],
      default: 'OPEN',
      index: true
    },
    assignedRole: {
      type: String,
      index: true
    },
    assignedUserId: {
      type: String
    },
    resolution: {
      type: String
    },
    resolvedBy: {
      type: String
    },
    resolvedAt: {
      type: Date
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed
    }
  },
  {
    timestamps: true
  }
);

exceptionCaseSchema.index({ module: 1, currentStatus: 1 });

module.exports = mongoose.model('ExceptionCase', exceptionCaseSchema);
