const mongoose = require('mongoose');

const leaveBalanceTransactionSchema = new mongoose.Schema(
  {
    transactionId: {
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
    employeeCode: {
      type: String,
      required: true,
      trim: true,
      index: true
    },
    leaveTypeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'LeaveType',
      required: true,
      index: true
    },
    leaveTypeCode: {
      type: String,
      required: true,
      uppercase: true,
      trim: true
    },
    year: {
      type: Number,
      required: true,
      index: true
    },
    transactionType: {
      type: String,
      enum: [
        'OPENING_BALANCE',
        'ACCRUAL',
        'CARRY_FORWARD',
        'LEAVE_USED',
        'LEAVE_CANCELLED',
        'ADJUSTMENT',
        'EXPIRY'
      ],
      required: true,
      index: true
    },
    amount: {
      type: Number,
      required: true
    },
    balanceBefore: {
      type: Number,
      required: true
    },
    balanceAfter: {
      type: Number,
      required: true
    },
    referenceType: {
      type: String,
      default: null // 'LeaveRequest', 'LeaveCancellationRequest', 'AccrualJob', 'ManualHRAdjustment', 'CarryForwardJob'
    },
    referenceId: {
      type: String,
      default: null
    },
    reason: {
      type: String,
      required: true,
      trim: true
    },
    createdBy: {
      type: String,
      default: 'SYSTEM'
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

leaveBalanceTransactionSchema.index({ employeeId: 1, leaveTypeId: 1, createdAt: -1 });
leaveBalanceTransactionSchema.index({ employeeCode: 1, year: 1, createdAt: -1 });

module.exports = mongoose.model('LeaveBalanceTransaction', leaveBalanceTransactionSchema);
