const mongoose = require('mongoose');

const payrollAdjustmentSchema = new mongoose.Schema(
  {
    adjustmentId: {
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
      index: true
    },
    payrollPeriodId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'PayrollPeriod',
      required: true,
      index: true
    },
    periodCode: {
      type: String,
      required: true
    },
    adjustmentType: {
      type: String,
      enum: ['EARNING', 'DEDUCTION', 'REIMBURSEMENT', 'CORRECTION'],
      required: true
    },
    code: {
      type: String,
      default: 'ADJUSTMENT'
    },
    name: {
      type: String,
      required: true
    },
    amount: {
      type: Number,
      required: true
    },
    reason: {
      type: String,
      required: true
    },
    sourceReference: {
      sourceType: { type: String, default: 'MANUAL_ADJUSTMENT' },
      sourceId: { type: String, default: null }
    },
    status: {
      type: String,
      enum: ['PENDING', 'APPROVED', 'REJECTED', 'APPLIED', 'CANCELLED'],
      default: 'PENDING',
      index: true
    },
    requestedBy: {
      type: String,
      required: true
    },
    approvedBy: {
      type: String,
      default: null
    },
    approvedAt: {
      type: Date,
      default: null
    },
    rejectionReason: {
      type: String,
      default: null
    },
    appliedAt: {
      type: Date,
      default: null
    }
  },
  {
    timestamps: true
  }
);

payrollAdjustmentSchema.index({ payrollPeriodId: 1, employeeId: 1 });

module.exports = mongoose.model('PayrollAdjustment', payrollAdjustmentSchema);
