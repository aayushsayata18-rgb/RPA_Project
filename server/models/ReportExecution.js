const mongoose = require('mongoose');

// Module 28: ReportExecution Model (28_REPORTS_ANALYTICS.md Section 8 & 9)
const reportExecutionSchema = new mongoose.Schema(
  {
    executionId: {
      type: String,
      required: true,
      unique: true,
      index: true
    },
    reportId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ReportDefinition'
    },
    reportCode: {
      type: String,
      required: true,
      index: true
    },
    reportName: {
      type: String
    },
    category: {
      type: String,
      index: true
    },
    version: {
      type: Number,
      default: 1
    },
    requestedBy: {
      type: String, // userId or string
      required: true,
      index: true
    },
    requestedByRole: {
      type: String,
      default: 'SYSTEM_ADMIN'
    },
    filters: {
      type: mongoose.Schema.Types.Mixed,
      default: {}
    },
    period: {
      periodStart: Date,
      periodEnd: Date,
      label: String
    },
    status: {
      type: String,
      enum: ['QUEUED', 'RUNNING', 'COMPLETED', 'PARTIAL', 'FAILED', 'CANCELLED', 'EXPIRED'],
      default: 'QUEUED',
      index: true
    },
    startedAt: {
      type: Date,
      default: Date.now
    },
    completedAt: {
      type: Date
    },
    durationMs: {
      type: Number
    },
    rowCount: {
      type: Number,
      default: 0
    },
    summary: {
      type: mongoose.Schema.Types.Mixed,
      default: {}
    },
    data: {
      type: [mongoose.Schema.Types.Mixed],
      default: []
    },
    outputFormat: {
      type: String,
      enum: ['JSON', 'CSV', 'PDF', 'XLSX'],
      default: 'JSON'
    },
    outputFile: {
      type: String
    },
    outputDocumentId: {
      type: String
    },
    fileChecksum: {
      type: String // SHA-256
    },
    fileSizeBytes: {
      type: Number
    },
    isMasked: {
      type: Boolean,
      default: false
    },
    downloadCount: {
      type: Number,
      default: 0
    },
    errorCode: {
      type: String
    },
    errorMessage: {
      type: String
    },
    correlationId: {
      type: String
    }
  },
  {
    timestamps: true
  }
);

reportExecutionSchema.index({ reportCode: 1, createdAt: -1 });
reportExecutionSchema.index({ requestedBy: 1, createdAt: -1 });
reportExecutionSchema.index({ status: 1, createdAt: -1 });

module.exports = mongoose.model('ReportExecution', reportExecutionSchema);
