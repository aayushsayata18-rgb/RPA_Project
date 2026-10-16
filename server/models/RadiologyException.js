const mongoose = require('mongoose');

const radiologyExceptionSchema = new mongoose.Schema(
  {
    exceptionId: {
      type: String,
      required: true,
      unique: true,
      index: true
    },
    type: {
      type: String,
      enum: [
        'PATIENT_MISMATCH',
        'ORDER_MISMATCH',
        'DUPLICATE_ORDER',
        'SCHEDULING_CONFLICT',
        'MODALITY_UNAVAILABLE',
        'MAINTENANCE_CONFLICT',
        'PREPARATION_INCOMPLETE',
        'CHECKIN_MISMATCH',
        'DUPLICATE_ACCESSION',
        'PACS_STUDY_MISMATCH',
        'RIS_UNAVAILABLE',
        'PACS_UNAVAILABLE',
        'EXTERNAL_STUDY_UNKNOWN',
        'REPORT_MISSING',
        'REPORT_MISMATCH',
        'BILLING_MISMATCH',
        'INVENTORY_SYNC_FAILURE',
        'DOCUMENT_FAILURE',
        'NOTIFICATION_FAILURE',
        'UNAUTHORIZED_REPORT_CHANGE'
      ],
      required: true,
      index: true
    },
    severity: {
      type: String,
      enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'],
      default: 'MEDIUM',
      index: true
    },
    patientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Patient',
      default: null,
      index: true
    },
    patientName: {
      type: String,
      default: ''
    },
    orderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'RadiologyOrder',
      default: null,
      index: true
    },
    scheduleId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'RadiologySchedule',
      default: null
    },
    studyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'RadiologyStudy',
      default: null
    },
    reportId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'RadiologyReport',
      default: null
    },
    description: {
      type: String,
      required: true
    },
    source: {
      type: String,
      default: 'SYSTEM'
    },
    status: {
      type: String,
      enum: [
        'OPEN',
        'UNDER_REVIEW',
        'WAITING_FOR_EXTERNAL_SYSTEM',
        'WAITING_FOR_USER',
        'RESOLVED',
        'CANCELLED'
      ],
      default: 'OPEN',
      index: true
    },
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    },
    resolution: {
      type: String,
      default: ''
    },
    resolvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    },
    resolvedAt: {
      type: Date,
      default: null
    },
    rpaJobId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'RPAJob',
      default: null
    },
    evidenceDocumentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'GeneratedDocument',
      default: null
    }
  },
  {
    timestamps: true
  }
);

radiologyExceptionSchema.index({ status: 1, severity: 1 });
radiologyExceptionSchema.index({ createdAt: -1 });

module.exports = mongoose.model('RadiologyException', radiologyExceptionSchema);
