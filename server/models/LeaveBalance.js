const mongoose = require('mongoose');

const leaveBalanceSchema = new mongoose.Schema(
  {
    balanceId: {
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
      trim: true,
      index: true
    },
    year: {
      type: Number,
      required: true,
      index: true
    },
    openingBalance: {
      type: Number,
      default: 0
    },
    accrued: {
      type: Number,
      default: 0
    },
    carriedForward: {
      type: Number,
      default: 0
    },
    used: {
      type: Number,
      default: 0
    },
    pending: {
      type: Number,
      default: 0
    },
    adjusted: {
      type: Number,
      default: 0
    },
    available: {
      type: Number,
      default: 0
    },
    closingBalance: {
      type: Number,
      default: 0
    },
    lastCalculatedAt: {
      type: Date,
      default: Date.now
    },
    updatedBy: {
      type: String,
      default: 'SYSTEM'
    }
  },
  {
    timestamps: true
  }
);

leaveBalanceSchema.index({ employeeId: 1, leaveTypeId: 1, year: 1 }, { unique: true });
leaveBalanceSchema.index({ employeeCode: 1, leaveTypeCode: 1, year: 1 });

module.exports = mongoose.model('LeaveBalance', leaveBalanceSchema);
