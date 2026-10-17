const mongoose = require('mongoose');

// SLA Tracking Model - 25_PATIENT_FEEDBACK.md Section 24-27
const feedbackSLASchema = new mongoose.Schema(
  {
    slaId: {
      type: String,
      required: true,
      unique: true
    },
    feedbackId: {
      type: String,
      required: true,
      unique: true
    },
    priority: {
      type: String,
      enum: ['LOW', 'MEDIUM', 'HIGH', 'URGENT', 'CRITICAL'],
      default: 'MEDIUM'
    },
    submittedAt: {
      type: Date,
      default: Date.now
    },
    acknowledgedAt: {
      type: Date,
      default: null
    },
    firstResponseAt: {
      type: Date,
      default: null
    },
    dueAt: {
      type: Date,
      required: true
    },
    resolvedAt: {
      type: Date,
      default: null
    },
    closedAt: {
      type: Date,
      default: null
    },
    slaStatus: {
      type: String,
      enum: ['ON_TRACK', 'AT_RISK', 'BREACHED', 'PAUSED'],
      default: 'ON_TRACK',
      index: true
    },
    pauseHistory: [
      {
        pauseStart: { type: Date, required: true },
        pauseEnd: { type: Date, default: null },
        pauseReason: { type: String, required: true },
        pausedBy: { type: String, required: true }
      }
    ],
    escalationHistory: [
      {
        escalatedAt: { type: Date, default: Date.now },
        escalatedBy: { type: String, required: true },
        reason: { type: String, required: true },
        targetRole: { type: String, default: 'ADMIN_MANAGER' }
      }
    ],
    breachedAt: {
      type: Date,
      default: null
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model('FeedbackSLA', feedbackSLASchema);
