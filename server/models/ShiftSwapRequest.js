const mongoose = require('mongoose');

const shiftSwapRequestSchema = new mongoose.Schema(
  {
    swapId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true
    },
    requesterEmployeeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Employee',
      required: true,
      index: true
    },
    requesterEmployeeCode: {
      type: String,
      required: true,
      trim: true
    },
    requesterAssignmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ShiftAssignment',
      required: true
    },
    targetEmployeeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Employee',
      required: true,
      index: true
    },
    targetEmployeeCode: {
      type: String,
      required: true,
      trim: true
    },
    targetAssignmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ShiftAssignment',
      required: true
    },
    reason: {
      type: String,
      required: true,
      trim: true
    },
    status: {
      type: String,
      enum: ['PENDING_TARGET_ACCEPTANCE', 'PENDING_APPROVAL', 'APPROVED', 'REJECTED', 'CANCELLED', 'COMPLETED'],
      default: 'PENDING_TARGET_ACCEPTANCE',
      index: true
    },
    targetResponseAt: {
      type: Date,
      default: null
    },
    targetResponseComments: {
      type: String,
      default: ''
    },
    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    reviewedAt: {
      type: Date,
      default: null
    },
    reviewerComments: {
      type: String,
      default: ''
    }
  },
  {
    timestamps: true
  }
);

shiftSwapRequestSchema.index({ requesterEmployeeId: 1, status: 1 });
shiftSwapRequestSchema.index({ targetEmployeeId: 1, status: 1 });

module.exports = mongoose.model('ShiftSwapRequest', shiftSwapRequestSchema);
