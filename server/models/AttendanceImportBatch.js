const mongoose = require('mongoose');

const attendanceImportBatchSchema = new mongoose.Schema(
  {
    batchId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true
    },
    source: {
      type: String,
      enum: ['BIOMETRIC', 'CSV', 'EXCEL', 'EXTERNAL_API', 'RPA'],
      default: 'CSV',
      index: true
    },
    fileName: {
      type: String,
      trim: true,
      default: null
    },
    fileHash: {
      type: String,
      trim: true,
      index: true,
      default: null
    },
    uploadedBy: {
      type: String,
      default: 'SYSTEM'
    },
    uploadedByName: {
      type: String,
      default: 'System Admin'
    },
    uploadedAt: {
      type: Date,
      default: Date.now,
      index: true
    },
    recordCount: {
      type: Number,
      default: 0
    },
    processedCount: {
      type: Number,
      default: 0
    },
    successCount: {
      type: Number,
      default: 0
    },
    duplicateCount: {
      type: Number,
      default: 0
    },
    errorCount: {
      type: Number,
      default: 0
    },
    status: {
      type: String,
      enum: [
        'UPLOADED',
        'VALIDATING',
        'PROCESSING',
        'COMPLETED',
        'COMPLETED_WITH_ERRORS',
        'FAILED',
        'CANCELLED'
      ],
      default: 'UPLOADED',
      index: true
    },
    errorReport: [
      {
        rowNumber: { type: Number },
        employeeIdCode: { type: String },
        errorReason: { type: String }
      }
    ],
    startedAt: {
      type: Date,
      default: null
    },
    completedAt: {
      type: Date,
      default: null
    }
  },
  {
    timestamps: true
  }
);

attendanceImportBatchSchema.index({ source: 1, uploadedAt: -1 });

module.exports = mongoose.model('AttendanceImportBatch', attendanceImportBatchSchema);
