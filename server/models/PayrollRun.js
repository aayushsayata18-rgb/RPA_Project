const mongoose = require('mongoose');

const payrollRunSchema = new mongoose.Schema(
  {
    runId: {
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
    runNumber: {
      type: Number,
      required: true
    },
    correlationId: {
      type: String,
      required: true,
      index: true
    },
    status: {
      type: String,
      enum: ['QUEUED', 'VALIDATING', 'PROCESSING', 'PARTIAL_SUCCESS', 'SUCCESS', 'FAILED', 'CANCELLED'],
      default: 'QUEUED',
      index: true
    },
    inputVersion: {
      type: Number,
      default: 1
    },
    employeeCount: {
      type: Number,
      default: 0
    },
    successfulCount: {
      type: Number,
      default: 0
    },
    failedCount: {
      type: Number,
      default: 0
    },
    totals: {
      grossTotal: { type: Number, default: 0 },
      deductionsTotal: { type: Number, default: 0 },
      netTotal: { type: Number, default: 0 },
      currency: { type: String, default: 'USD' }
    },
    startedAt: {
      type: Date,
      default: Date.now
    },
    completedAt: {
      type: Date,
      default: null
    },
    startedBy: {
      type: String,
      required: true
    },
    approvedBy: {
      type: String,
      default: null
    },
    source: {
      type: String,
      enum: ['INTERNAL_ENGINE', 'EXTERNAL_PAYROLL', 'RPA'],
      default: 'INTERNAL_ENGINE'
    },
    externalJobReference: {
      type: String,
      default: null
    },
    errorDetails: [
      {
        employeeIdCode: String,
        error: String,
        timestamp: { type: Date, default: Date.now }
      }
    ],
    logSummary: {
      type: String,
      default: null
    }
  },
  {
    timestamps: true
  }
);

payrollRunSchema.index({ payrollPeriodId: 1, runNumber: 1 }, { unique: true });

module.exports = mongoose.model('PayrollRun', payrollRunSchema);
