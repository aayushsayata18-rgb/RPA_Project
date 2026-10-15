const mongoose = require('mongoose');

const leaveCancellationRequestSchema = new mongoose.Schema(
  {
    cancellationId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true
    },
    leaveRequestId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'LeaveRequest',
      required: true,
      index: true
    },
    requestNumber: {
      type: String,
      required: true,
      trim: true
    },
    employeeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Employee',
      required: true,
      index: true
    },
    employeeCode: {
      type: String,
      required: true,
      trim: true
    },
    reason: {
      type: String,
      required: true,
      trim: true
    },
    status: {
      type: String,
      enum: ['PENDING', 'APPROVED', 'REJECTED'],
      default: 'PENDING',
      index: true
    },
    requestedBy: {
      type: String,
      default: 'EMPLOYEE'
    },
    requestedAt: {
      type: Date,
      default: Date.now
    },
    reviewedBy: {
      type: String,
      default: null
    },
    reviewedAt: {
      type: Date,
      default: null
    },
    reviewerComments: {
      type: String,
      default: null
    },
    correlationId: {
      type: String,
      default: null
    }
  },
  {
    timestamps: true
  }
);

leaveCancellationRequestSchema.index({ leaveRequestId: 1, status: 1 });
leaveCancellationRequestSchema.index({ employeeId: 1, status: 1 });

module.exports = mongoose.model('LeaveCancellationRequest', leaveCancellationRequestSchema);
