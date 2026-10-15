const mongoose = require('mongoose');

const payslipSchema = new mongoose.Schema(
  {
    payslipNumber: {
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
    payrollResultId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'PayrollResult',
      required: true,
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
    employeeName: {
      type: String,
      required: true
    },
    departmentName: {
      type: String,
      default: 'General'
    },
    designation: {
      type: String,
      default: 'Staff'
    },
    bankDetailsMasked: {
      bankName: { type: String, default: null },
      accountNumberMasked: { type: String, default: null } // e.g. "••••••••1234"
    },
    documentId: {
      type: String,
      default: null
    },
    grossAmount: {
      type: Number,
      required: true
    },
    deductionAmount: {
      type: Number,
      required: true
    },
    netAmount: {
      type: Number,
      required: true
    },
    currency: {
      type: String,
      default: 'USD'
    },
    attendanceSummary: {
      scheduledDays: Number,
      workedDays: Number,
      absentDays: Number,
      paidLeaveDays: Number,
      unpaidLeaveDays: Number,
      overtimeMinutes: Number
    },
    earningsBreakdown: [
      {
        code: String,
        name: String,
        amount: Number
      }
    ],
    deductionsBreakdown: [
      {
        code: String,
        name: String,
        amount: Number
      }
    ],
    status: {
      type: String,
      enum: ['GENERATED', 'PUBLISHED', 'DELIVERED', 'CANCELLED'],
      default: 'GENERATED',
      index: true
    },
    generatedAt: {
      type: Date,
      default: Date.now
    },
    publishedAt: {
      type: Date,
      default: null
    },
    accessLogs: [
      {
        accessedBy: { type: String, required: true },
        accessedAt: { type: Date, default: Date.now },
        ipAddress: { type: String, default: null },
        correlationId: { type: String, default: null }
      }
    ]
  },
  {
    timestamps: true
  }
);

payslipSchema.index({ employeeId: 1, payrollPeriodId: 1 }, { unique: true });

module.exports = mongoose.model('Payslip', payslipSchema);
