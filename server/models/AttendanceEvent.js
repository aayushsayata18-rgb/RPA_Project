const mongoose = require('mongoose');

const attendanceEventSchema = new mongoose.Schema(
  {
    eventId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true
    },
    employeeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Employee',
      default: null,
      index: true
    },
    employeeIdCode: {
      type: String,
      trim: true,
      index: true
    },
    eventDateTime: {
      type: Date,
      required: true,
      index: true
    },
    direction: {
      type: String,
      enum: ['IN', 'OUT'],
      required: true
    },
    source: {
      type: String,
      enum: ['BIOMETRIC', 'EXTERNAL_SYSTEM', 'API', 'CSV_IMPORT', 'EXCEL_IMPORT', 'MANUAL', 'RPA'],
      default: 'BIOMETRIC',
      index: true
    },
    sourceEventId: {
      type: String,
      trim: true,
      index: true
    },
    deviceId: {
      type: String,
      trim: true,
      default: null
    },
    rawPayload: {
      type: mongoose.Schema.Types.Mixed,
      default: {}
    },
    importedAt: {
      type: Date,
      default: Date.now
    },
    importBatchId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'AttendanceImportBatch',
      default: null,
      index: true
    },
    processingStatus: {
      type: String,
      enum: ['RECEIVED', 'PROCESSED', 'DUPLICATE', 'INVALID', 'UNMATCHED', 'FAILED'],
      default: 'RECEIVED',
      index: true
    },
    errorMessage: {
      type: String,
      default: null
    }
  },
  {
    timestamps: true
  }
);

attendanceEventSchema.index({ source: 1, sourceEventId: 1 });
attendanceEventSchema.index({ employeeId: 1, eventDateTime: 1 });
attendanceEventSchema.index({ employeeIdCode: 1, eventDateTime: 1 });

module.exports = mongoose.model('AttendanceEvent', attendanceEventSchema);
