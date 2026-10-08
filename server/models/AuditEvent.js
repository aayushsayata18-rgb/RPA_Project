const mongoose = require('mongoose');

// Central AuditEvent Model conforming to 00_MASTER.md Section 41
const auditEventSchema = new mongoose.Schema(
  {
    eventId: {
      type: String,
      unique: true,
      required: true,
      index: true
    },
    userId: {
      type: String,
      default: 'SYSTEM',
      index: true
    },
    userEmail: {
      type: String
    },
    role: {
      type: String,
      default: 'SYSTEM',
      index: true
    },
    action: {
      type: String,
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
    oldValue: {
      type: mongoose.Schema.Types.Mixed,
      default: null
    },
    newValue: {
      type: mongoose.Schema.Types.Mixed,
      default: null
    },
    ipAddress: {
      type: String
    },
    userAgent: {
      type: String
    },
    correlationId: {
      type: String,
      index: true
    },
    rpaJobId: {
      type: String,
      index: true
    },
    status: {
      type: String,
      enum: ['SUCCESS', 'FAILURE', 'WARNING', 'INFO'],
      default: 'SUCCESS'
    },
    details: {
      type: String
    }
  },
  {
    timestamps: { createdAt: true, updatedAt: false } // Immutable logs
  }
);

auditEventSchema.index({ module: 1, entityId: 1, createdAt: -1 });

module.exports = mongoose.model('AuditEvent', auditEventSchema);
