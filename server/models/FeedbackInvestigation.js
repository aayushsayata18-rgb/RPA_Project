const mongoose = require('mongoose');

// Investigation Model - 25_PATIENT_FEEDBACK.md Section 20
const feedbackInvestigationSchema = new mongoose.Schema(
  {
    investigationId: {
      type: String,
      required: true,
      unique: true
    },
    feedbackId: {
      type: String,
      required: true
    },
    investigatorId: {
      type: String,
      required: true
    },
    investigatorName: {
      type: String,
      required: true
    },
    startedAt: {
      type: Date,
      default: Date.now
    },
    dueAt: {
      type: Date,
      default: null
    },
    findings: {
      type: String,
      default: ''
    },
    evidence: [
      {
        documentId: { type: String },
        description: { type: String },
        url: { type: String },
        uploadedAt: { type: Date, default: Date.now }
      }
    ],
    conclusion: {
      type: String,
      default: ''
    },
    recommendation: {
      type: String,
      default: ''
    },
    status: {
      type: String,
      enum: [
        'OPEN',
        'IN_PROGRESS',
        'WAITING_FOR_INFORMATION',
        'COMPLETED',
        'PENDING_APPROVAL',
        'APPROVED',
        'CANCELLED'
      ],
      default: 'OPEN',
      index: true
    },
    approvedBy: {
      type: String,
      default: null
    },
    approvedByName: {
      type: String,
      default: null
    },
    approvedAt: {
      type: Date,
      default: null
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

feedbackInvestigationSchema.index({ feedbackId: 1, status: 1 });

module.exports = mongoose.model('FeedbackInvestigation', feedbackInvestigationSchema);
