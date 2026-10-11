const mongoose = require('mongoose');

const accessRequestSchema = new mongoose.Schema(
  {
    requestId: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
      index: true
    },
    employeeId: {
      type: String,
      required: true,
      index: true
    },
    employeeObjectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Employee'
    },
    requestedRoleId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Role'
    },
    requestedRoleCode: {
      type: String,
      required: true,
      trim: true
    },
    requestedPermissions: [
      {
        type: String,
        trim: true
      }
    ],
    source: {
      type: String,
      enum: ['ONBOARDING', 'TRANSFER', 'PROMOTION', 'MANUAL'],
      default: 'ONBOARDING'
    },
    status: {
      type: String,
      enum: [
        'REQUESTED',
        'PENDING_APPROVAL',
        'APPROVED',
        'PROVISIONING',
        'PROVISIONED',
        'FAILED',
        'REVOKED',
        'REJECTED'
      ],
      default: 'PENDING_APPROVAL',
      index: true
    },
    requestedBy: {
      type: String,
      default: 'SYSTEM'
    },
    approvedBy: {
      type: String,
      default: null
    },
    approvedAt: {
      type: Date,
      default: null
    },
    rejectedBy: {
      type: String,
      default: null
    },
    rejectedAt: {
      type: Date,
      default: null
    },
    rejectionReason: {
      type: String,
      default: ''
    },
    provisionedAt: {
      type: Date,
      default: null
    },
    provisionedBy: {
      type: String,
      default: null
    },
    revokedAt: {
      type: Date,
      default: null
    },
    revokedBy: {
      type: String,
      default: null
    },
    revokeReason: {
      type: String,
      default: ''
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
    reason: {
      type: String,
      default: ''
    },
    notes: {
      type: String,
      default: ''
    }
  },
  {
    timestamps: true
  }
);

accessRequestSchema.index({ employeeId: 1, status: 1 });
accessRequestSchema.index({ status: 1, createdAt: -1 });

module.exports = mongoose.model('AccessRequest', accessRequestSchema);
