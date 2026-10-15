const mongoose = require('mongoose');

const shiftChangeRequestSchema = new mongoose.Schema(
  {
    requestId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true
    },
    employeeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Employee',
      required: true,
      index: true
    },
    employeeIdCode: {
      type: String,
      required: true,
      trim: true,
      index: true
    },
    assignmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ShiftAssignment',
      required: true,
      index: true
    },
    currentShiftId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Shift'
    },
    currentShiftCode: {
      type: String,
      trim: true
    },
    requestedShiftId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Shift',
      required: true
    },
    requestedShiftCode: {
      type: String,
      required: true,
      trim: true
    },
    effectiveDate: {
      type: Date,
      required: true,
      index: true
    },
    reason: {
      type: String,
      required: true,
      trim: true
    },
    status: {
      type: String,
      enum: ['PENDING_APPROVAL', 'APPROVED', 'REJECTED', 'CANCELLED'],
      default: 'PENDING_APPROVAL',
      index: true
    },
    requestedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    requestedAt: {
      type: Date,
      default: Date.now
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

shiftChangeRequestSchema.index({ employeeId: 1, status: 1, requestedAt: -1 });

module.exports = mongoose.model('ShiftChangeRequest', shiftChangeRequestSchema);
