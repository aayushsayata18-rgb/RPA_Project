const mongoose = require('mongoose');

const recordAccessLogSchema = new mongoose.Schema(
  {
    patientId: {
      type: String,
      required: true,
      index: true
    },
    patientRef: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Patient'
    },
    userId: {
      type: String,
      required: true,
      index: true
    },
    userName: {
      type: String,
      default: ''
    },
    role: {
      type: String,
      required: true,
      index: true
    },
    resourceType: {
      type: String,
      required: true,
      enum: [
        'PATIENT_SUMMARY',
        'TIMELINE',
        'VISIT',
        'APPOINTMENT',
        'ADMISSION',
        'BED_HISTORY',
        'DISCHARGE',
        'BILLING',
        'PAYMENT',
        'INSURANCE',
        'LABORATORY',
        'RADIOLOGY',
        'PHARMACY',
        'DOCUMENT',
        'DOCUMENT_DOWNLOAD',
        'PROFILE_HISTORY',
        'ACCESS_LOG'
      ],
      index: true
    },
    resourceId: {
      type: String,
      default: ''
    },
    action: {
      type: String,
      required: true,
      enum: [
        'PATIENT_RECORD_VIEWED',
        'DOCUMENT_VIEWED',
        'DOCUMENT_DOWNLOADED',
        'BILLING_RECORD_VIEWED',
        'INSURANCE_RECORD_VIEWED',
        'LAB_REPORT_VIEWED',
        'RADIOLOGY_REPORT_VIEWED',
        'PHARMACY_RECORD_VIEWED',
        'PATIENT_PROFILE_UPDATED',
        'RECORD_ACCESS_DENIED',
        'RECORD_SYNCED',
        'RECORD_RECONCILED'
      ],
      index: true
    },
    purpose: {
      type: String,
      enum: ['TREATMENT', 'BILLING', 'INSURANCE', 'ADMINISTRATION', 'PATIENT_PORTAL', 'AUDIT', 'RESEARCH', 'OTHER'],
      default: 'ADMINISTRATION'
    },
    status: {
      type: String,
      enum: ['GRANTED', 'DENIED'],
      default: 'GRANTED',
      index: true
    },
    denialReason: {
      type: String,
      default: ''
    },
    ipAddress: {
      type: String,
      default: ''
    },
    correlationId: {
      type: String,
      index: true,
      default: ''
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed
    },
    timestamp: {
      type: Date,
      default: Date.now,
      index: true
    }
  },
  {
    timestamps: true
  }
);

// High-speed compound indexes for audit & compliance queries
recordAccessLogSchema.index({ patientId: 1, timestamp: -1 });
recordAccessLogSchema.index({ userId: 1, timestamp: -1 });
recordAccessLogSchema.index({ action: 1, timestamp: -1 });

module.exports = mongoose.model('RecordAccessLog', recordAccessLogSchema);
