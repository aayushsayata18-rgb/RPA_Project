const mongoose = require('mongoose');

const radiologyRecordSchema = new mongoose.Schema(
  {
    orderId: {
      type: String,
      required: true,
      unique: true,
      index: true
    },
    patientId: {
      type: String,
      required: true,
      index: true
    },
    patientName: {
      type: String,
      default: ''
    },
    admissionId: {
      type: String,
      index: true
    },
    visitId: {
      type: String,
      index: true
    },
    modality: {
      type: String,
      enum: ['X_RAY', 'CT_SCAN', 'MRI', 'ULTRASOUND', 'ECG', 'ECHO', 'DEXA', 'MAMMOGRAPHY', 'OTHER'],
      required: true,
      index: true
    },
    procedureName: {
      type: String,
      required: true
    },
    bodyPart: {
      type: String,
      default: ''
    },
    orderedByDoctorId: String,
    orderedByDoctorName: String,
    orderDate: {
      type: Date,
      default: Date.now,
      index: true
    },
    scheduledDate: Date,
    status: {
      type: String,
      enum: ['ORDERED', 'SCHEDULED', 'PERFORMED', 'REPORT_PENDING', 'REPORT_COMPLETED', 'CANCELLED'],
      default: 'REPORT_COMPLETED',
      index: true
    },
    performedAt: Date,
    reportDate: Date,
    radiologistName: String,
    findingsSummary: String,
    conclusion: String,
    documentId: String,
    documentUrl: String,
    correlationId: String
  },
  {
    timestamps: true
  }
);

radiologyRecordSchema.index({ patientId: 1, orderDate: -1 });

module.exports = mongoose.model('RadiologyRecord', radiologyRecordSchema);
