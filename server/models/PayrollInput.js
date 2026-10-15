const mongoose = require('mongoose');

const payrollInputSchema = new mongoose.Schema(
  {
    inputId: {
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
    version: {
      type: Number,
      default: 1
    },
    isStale: {
      type: Boolean,
      default: false,
      index: true
    },
    staleReason: {
      type: String,
      default: null
    },
    employeeSnapshot: {
      employeeCode: { type: String, required: true },
      employeeName: { type: String, required: true },
      departmentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Department', default: null },
      departmentName: { type: String, default: 'General' },
      designation: { type: String, default: 'Staff' },
      employmentType: { type: String, default: 'FULL_TIME' },
      salaryStructureReference: { type: String, default: null }
    },
    attendanceSummary: {
      scheduledDays: { type: Number, default: 0 },
      workedDays: { type: Number, default: 0 },
      absentDays: { type: Number, default: 0 },
      lateDays: { type: Number, default: 0 },
      lateMinutes: { type: Number, default: 0 },
      workedMinutes: { type: Number, default: 0 },
      earlyDepartures: { type: Number, default: 0 }
    },
    leaveSummary: {
      paidLeaveDays: { type: Number, default: 0 },
      unpaidLeaveDays: { type: Number, default: 0 },
      otherLeaveDays: { type: Number, default: 0 }
    },
    overtime: {
      candidateMinutes: { type: Number, default: 0 },
      approvedMinutes: { type: Number, default: 0 }
    },
    allowances: [
      {
        code: { type: String, required: true },
        name: { type: String, required: true },
        amount: { type: Number, required: true },
        type: { type: String, default: 'TAXABLE' }
      }
    ],
    deductions: [
      {
        code: { type: String, required: true },
        name: { type: String, required: true },
        amount: { type: Number, required: true },
        type: { type: String, default: 'STANDARD' }
      }
    ],
    reimbursements: [
      {
        category: { type: String, required: true },
        amount: { type: Number, required: true },
        status: { type: String, default: 'APPROVED' },
        documentIds: [{ type: String }],
        approvedAt: { type: Date, default: Date.now }
      }
    ],
    sourceReferences: [
      {
        sourceType: {
          type: String,
          enum: [
            'ATTENDANCE',
            'LEAVE',
            'SHIFT',
            'OVERTIME',
            'EXPENSE',
            'BONUS',
            'DEDUCTION',
            'MANUAL_ADJUSTMENT',
            'EXTERNAL_PAYROLL'
          ],
          required: true
        },
        sourceId: { type: String, default: null },
        sourceVersion: { type: Number, default: 1 },
        timestamp: { type: Date, default: Date.now }
      }
    ],
    status: {
      type: String,
      enum: ['DRAFT', 'CALCULATED', 'PENDING_REVIEW', 'REVIEWED', 'EXCEPTION', 'APPROVED', 'LOCKED'],
      default: 'DRAFT',
      index: true
    },
    validationStatus: {
      isValid: { type: Boolean, default: true },
      errors: [
        {
          code: String,
          message: String,
          severity: { type: String, enum: ['ERROR', 'WARNING', 'INFO'], default: 'ERROR' }
        }
      ]
    },
    calculatedAt: {
      type: Date,
      default: null
    },
    reviewedBy: {
      type: String,
      default: null
    },
    reviewedAt: {
      type: Date,
      default: null
    },
    reviewNotes: {
      type: String,
      default: null
    },
    approvedBy: {
      type: String,
      default: null
    },
    approvedAt: {
      type: Date,
      default: null
    }
  },
  {
    timestamps: true
  }
);

payrollInputSchema.index({ payrollPeriodId: 1, employeeId: 1, version: 1 }, { unique: true });

module.exports = mongoose.model('PayrollInput', payrollInputSchema);
