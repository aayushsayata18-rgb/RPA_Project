const mongoose = require('mongoose');

const resultParameterSchema = new mongoose.Schema(
  {
    parameterName: {
      type: String,
      required: true
    },
    parameterCode: {
      type: String,
      required: true
    },
    resultValue: {
      type: String,
      required: true
    },
    unit: {
      type: String,
      default: ''
    },
    referenceRangeSnapshot: {
      type: String,
      default: ''
    },
    abnormalFlag: {
      type: String,
      enum: ['NORMAL', 'HIGH', 'LOW', 'CRITICAL', 'ABNORMAL'],
      default: 'NORMAL'
    },
    comments: {
      type: String,
      default: ''
    }
  },
  { _id: true }
);

const auditEntrySchema = new mongoose.Schema(
  {
    action: {
      type: String,
      required: true
    },
    performedBy: {
      type: String,
      required: true
    },
    timestamp: {
      type: Date,
      default: Date.now
    },
    details: {
      type: String,
      default: ''
    }
  },
  { _id: true }
);

const labResultSchema = new mongoose.Schema(
  {
    resultId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true
    },
    orderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'LabOrder',
      required: true,
      index: true
    },
    orderIdString: {
      type: String,
      required: true,
      index: true
    },
    orderItemId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'LabOrderItem',
      required: true,
      index: true
    },
    sampleId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'LabSample',
      default: null,
      index: true
    },
    sampleAccessionNumber: {
      type: String,
      default: ''
    },
    patientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Patient',
      required: true,
      index: true
    },
    patientCode: {
      type: String,
      required: true,
      index: true
    },
    testId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'LabTest',
      required: true,
      index: true
    },
    testCodeSnapshot: {
      type: String,
      required: true
    },
    testNameSnapshot: {
      type: String,
      required: true
    },
    parameters: [resultParameterSchema],
    resultValue: {
      type: String,
      default: ''
    },
    resultText: {
      type: String,
      default: ''
    },
    unit: {
      type: String,
      default: ''
    },
    referenceRangeSnapshot: {
      type: String,
      default: ''
    },
    abnormalFlag: {
      type: String,
      enum: ['NORMAL', 'HIGH', 'LOW', 'CRITICAL', 'ABNORMAL'],
      default: 'NORMAL'
    },
    technicianNotes: {
      type: String,
      default: ''
    },
    verifierNotes: {
      type: String,
      default: ''
    },
    status: {
      type: String,
      enum: [
        'DRAFT',
        'ENTERED',
        'PENDING_VERIFICATION',
        'VERIFIED',
        'AMENDED',
        'RELEASED',
        'CANCELLED'
      ],
      default: 'DRAFT',
      index: true
    },
    enteredBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    },
    enteredByName: {
      type: String,
      default: ''
    },
    enteredAt: {
      type: Date,
      default: null
    },
    verifiedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    },
    verifiedByName: {
      type: String,
      default: ''
    },
    verifiedAt: {
      type: Date,
      default: null,
      index: true
    },
    releasedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    },
    releasedByName: {
      type: String,
      default: ''
    },
    releasedAt: {
      type: Date,
      default: null,
      index: true
    },
    version: {
      type: Number,
      default: 1
    },
    amendmentReason: {
      type: String,
      default: ''
    },
    previousResultId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'LabResult',
      default: null
    },
    auditTrail: [auditEntrySchema]
  },
  {
    timestamps: true
  }
);

labResultSchema.index({ orderId: 1, testId: 1, version: -1 });
labResultSchema.index({ status: 1, verifiedAt: -1 });

module.exports = mongoose.model('LabResult', labResultSchema);
