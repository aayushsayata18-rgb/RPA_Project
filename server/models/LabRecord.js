const mongoose = require('mongoose');

const labRecordSchema = new mongoose.Schema(
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
    testCode: {
      type: String,
      required: true
    },
    testName: {
      type: String,
      required: true
    },
    category: {
      type: String,
      enum: ['HEMATOLOGY', 'BIOCHEMISTRY', 'MICROBIOLOGY', 'PATHOLOGY', 'SEROLOGY', 'URINALYSIS', 'OTHER'],
      default: 'HEMATOLOGY'
    },
    orderedByDoctorId: String,
    orderedByDoctorName: String,
    orderDate: {
      type: Date,
      default: Date.now,
      index: true
    },
    sampleStatus: {
      type: String,
      enum: ['ORDERED', 'COLLECTED', 'RECEIVED_IN_LAB', 'PROCESSING', 'REJECTED'],
      default: 'RECEIVED_IN_LAB'
    },
    sampleCollectedAt: Date,
    resultStatus: {
      type: String,
      enum: ['PENDING', 'PRELIMINARY', 'FINAL_VERIFIED', 'CANCELLED'],
      default: 'FINAL_VERIFIED',
      index: true
    },
    reportDate: Date,
    verifiedByTechnician: String,
    results: [
      {
        parameter: String,
        value: String,
        unit: String,
        referenceRange: String,
        flag: {
          type: String,
          enum: ['NORMAL', 'HIGH', 'LOW', 'CRITICAL', 'ABNORMAL'],
          default: 'NORMAL'
        }
      }
    ],
    documentId: String,
    documentUrl: String,
    correlationId: String
  },
  {
    timestamps: true
  }
);

labRecordSchema.index({ patientId: 1, orderDate: -1 });

module.exports = mongoose.model('LabRecord', labRecordSchema);
