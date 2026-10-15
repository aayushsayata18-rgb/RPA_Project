const mongoose = require('mongoose');

const payrollPeriodSchema = new mongoose.Schema(
  {
    periodCode: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true
    },
    name: {
      type: String,
      required: true,
      trim: true
    },
    startDate: {
      type: Date,
      required: true,
      index: true
    },
    endDate: {
      type: Date,
      required: true,
      index: true
    },
    frequency: {
      type: String,
      enum: ['MONTHLY', 'BIWEEKLY', 'WEEKLY'],
      default: 'MONTHLY'
    },
    status: {
      type: String,
      enum: [
        'DRAFT',
        'OPEN',
        'INPUT_COLLECTION',
        'VALIDATION',
        'PENDING_REVIEW',
        'PENDING_APPROVAL',
        'APPROVED',
        'PROCESSING',
        'PROCESSED',
        'FINALIZED',
        'CANCELLED'
      ],
      default: 'DRAFT',
      index: true
    },
    cutoffDate: {
      type: Date,
      default: null
    },
    attendanceCutoffDate: {
      type: Date,
      default: null
    },
    leaveCutoffDate: {
      type: Date,
      default: null
    },
    inputLockDate: {
      type: Date,
      default: null
    },
    isLocked: {
      type: Boolean,
      default: false
    },
    lockDetails: {
      lockedAt: { type: Date, default: null },
      lockedBy: { type: String, default: null },
      reason: { type: String, default: null }
    },
    summary: {
      totalEmployees: { type: Number, default: 0 },
      validCount: { type: Number, default: 0 },
      warningCount: { type: Number, default: 0 },
      errorCount: { type: Number, default: 0 },
      grossTotal: { type: Number, default: 0 },
      deductionsTotal: { type: Number, default: 0 },
      netTotal: { type: Number, default: 0 }
    },
    validationResults: {
      validatedAt: { type: Date, default: null },
      validatedBy: { type: String, default: null },
      errors: [
        {
          employeeIdCode: String,
          employeeName: String,
          code: String,
          message: String,
          severity: { type: String, enum: ['ERROR', 'WARNING', 'INFO'], default: 'ERROR' }
        }
      ]
    },
    approvalDetails: {
      submittedAt: { type: Date, default: null },
      submittedBy: { type: String, default: null },
      reviewedAt: { type: Date, default: null },
      reviewedBy: { type: String, default: null },
      reviewNotes: { type: String, default: null },
      approvedAt: { type: Date, default: null },
      approvedBy: { type: String, default: null },
      approvalNotes: { type: String, default: null }
    },
    processingDetails: {
      processedAt: { type: Date, default: null },
      processedBy: { type: String, default: null },
      runCount: { type: Number, default: 0 },
      lastRunId: { type: String, default: null }
    },
    finalizedAt: {
      type: Date,
      default: null
    },
    finalizedBy: {
      type: String,
      default: null
    },
    createdBy: {
      type: String,
      required: true
    },
    updatedBy: {
      type: String,
      default: null
    }
  },
  {
    timestamps: true
  }
);

payrollPeriodSchema.index({ startDate: 1, endDate: 1 });

module.exports = mongoose.model('PayrollPeriod', payrollPeriodSchema);
