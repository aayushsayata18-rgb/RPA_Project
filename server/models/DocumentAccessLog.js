const mongoose = require('mongoose');

/**
 * Module 27: DocumentAccessLog Schema
 * Auditing every document interaction, download, view and access denial
 * (27_DOCUMENT_GENERATION.md Section 68, 97, 105)
 */
const documentAccessLogSchema = new mongoose.Schema(
  {
    logId: {
      type: String,
      required: true,
      unique: true,
      index: true
    },
    documentId: {
      type: String,
      required: true,
      index: true
    },
    documentType: {
      type: String,
      default: ''
    },
    title: {
      type: String,
      default: ''
    },
    userId: {
      type: String,
      default: 'ANONYMOUS'
    },
    userName: {
      type: String,
      default: ''
    },
    role: {
      type: String,
      default: 'GUEST'
    },
    department: {
      type: String,
      default: 'GENERAL'
    },
    action: {
      type: String,
      enum: [
        'REQUESTED',
        'GENERATED',
        'VIEWED',
        'PREVIEWED',
        'DOWNLOADED',
        'APPROVED',
        'RELEASED',
        'REGENERATED',
        'SUPERSEDED',
        'CANCELLED',
        'ARCHIVED',
        'UPLOADED',
        'ACCESS_DENIED'
      ],
      required: true,
      index: true
    },
    status: {
      type: String,
      enum: ['SUCCESS', 'DENIED', 'ERROR'],
      default: 'SUCCESS'
    },
    ipAddress: {
      type: String,
      default: '127.0.0.1'
    },
    userAgent: {
      type: String,
      default: ''
    },
    details: {
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

documentAccessLogSchema.index({ documentId: 1, timestamp: -1 });
documentAccessLogSchema.index({ userId: 1, timestamp: -1 });

module.exports = mongoose.model('DocumentAccessLog', documentAccessLogSchema);
