const mongoose = require('mongoose');

const payrollResultSchema = new mongoose.Schema(
  {
    resultId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
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
      required: true,
      index: true
    },
    payrollRunId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'PayrollRun',
      default: null,
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
    payrollInputId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'PayrollInput',
      required: true
    },
    grossEarnings: {
      type: Number,
      required: true,
      min: 0
    },
    totalDeductions: {
      type: Number,
      required: true,
      min: 0
    },
    netPay: {
      type: Number,
      required: true,
      min: 0
    },
    currency: {
      type: String,
      default: 'USD'
    },
    breakdown: {
      earnings: [
        {
          code: String,
          name: String,
          amount: Number,
          type: { type: String, default: 'EARNING' }
        }
      ],
      deductions: [
        {
          code: String,
          name: String,
          amount: Number,
          type: { type: String, default: 'DEDUCTION' }
        }
      ],
      statutory: [
        {
          code: String,
          name: String,
          amount: Number
        }
      ],
      attendanceAdjustments: {
        workedDays: Number,
        scheduledDays: Number,
        paidLeaveDays: Number,
        unpaidLeaveDays: Number,
        unpaidLeaveDeduction: Number,
        overtimePay: Number
      }
    },
    source: {
      type: String,
      enum: ['INTERNAL_ENGINE', 'EXTERNAL_PAYROLL', 'RPA_IMPORT'],
      default: 'INTERNAL_ENGINE'
    },
    externalReference: {
      type: String,
      default: null
    },
    calculationVersion: {
      type: Number,
      default: 1
    },
    status: {
      type: String,
      enum: ['CALCULATED', 'VERIFIED', 'FINALIZED', 'CANCELLED'],
      default: 'CALCULATED',
      index: true
    },
    calculatedAt: {
      type: Date,
      default: Date.now
    },
    finalizedAt: {
      type: Date,
      default: null
    }
  },
  {
    timestamps: true
  }
);

payrollResultSchema.index({ payrollPeriodId: 1, employeeId: 1 });

module.exports = mongoose.model('PayrollResult', payrollResultSchema);
