const mongoose = require('mongoose');

const labExceptionSchema = new mongoose.Schema(
  {
    exceptionId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true
    },
    type: {
      type: String,
      required: true,
      enum: [
        'PATIENT_MISMATCH',
        'INVALID_ORDER',
        'UNKNOWN_TEST',
        'DUPLICATE_ORDER',
        'DUPLICATE_ACCESSION',
        'SAMPLE_MISMATCH',
        'SAMPLE_REJECTED',
        'EXTERNAL_LIS_UNAVAILABLE',
        'EXTERNAL_RESULT_UNKNOWN',
        'RESULT_MISMATCH',
        'REPORT_MISSING',
        'BILLING_MISMATCH',
        'INVENTORY_SYNC_FAILURE',
        'UNAUTHORIZED_RESULT_CHANGE',
        'DOCUMENT_FAILURE',
        'NOTIFICATION_FAILURE'
      ],
      index: true
    },
    severity: {
      type: String,
      required: true,
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
    patientCode: {
      type: String,
      default: ''
    },
    orderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'LabOrder',
      default: null,
      index: true
    },
    orderIdString: {
      type: String,
      default: ''
    },
    sampleId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'LabSample',
      default: null
    },
    sampleAccessionNumber: {
      type: String,
      default: ''
    },
    resultId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'LabResult',
      default: null
    },
    description: {
      type: String,
      required: true
    },
    source: {
      type: String,
      enum: ['MERN_VALIDATION', 'RPA_WORKER', 'EXTERNAL_LIS', 'USER_ACTION'],
      default: 'MERN_VALIDATION'
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

labExceptionSchema.index({ status: 1, severity: 1 });
labExceptionSchema.index({ orderId: 1, type: 1 });

module.exports = mongoose.model('LabException', labExceptionSchema);
