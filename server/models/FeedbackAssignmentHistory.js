const mongoose = require('mongoose');

// Assignment History Model - 25_PATIENT_FEEDBACK.md Section 23
const feedbackAssignmentHistorySchema = new mongoose.Schema(
  {
    assignmentId: {
      type: String,
      required: true,
      unique: true,
      index: true
    },
    feedbackId: {
      type: String,
      required: true,
      index: true
    },
    fromDepartmentId: {
      type: String,
      default: null
    },
    fromDepartmentName: {
      type: String,
      default: null
    },
    toDepartmentId: {
      type: String,
      default: null
    },
    toDepartmentName: {
      type: String,
      default: null
    },
    fromUserId: {
      type: String,
      default: null
    },
    fromUserName: {
      type: String,
      default: null
    },
    toUserId: {
      type: String,
      default: null
    },
    toUserName: {
      type: String,
      default: null
    },
    reason: {
      type: String,
      default: ''
    },
    assignedBy: {
      type: String,
      required: true
    },
    assignedByName: {
      type: String,
      default: ''
    },
    assignedAt: {
      type: Date,
      default: Date.now
    }
  },
  {
    timestamps: true
  }
);

feedbackAssignmentHistorySchema.index({ feedbackId: 1, assignedAt: -1 });

module.exports = mongoose.model('FeedbackAssignmentHistory', feedbackAssignmentHistorySchema);
