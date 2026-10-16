const mongoose = require('mongoose');

const labSampleSchema = new mongoose.Schema(
  {
    sampleId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true
    },
    accessionNumber: {
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
      default: null,
      index: true
    },
    orderItemIdString: {
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
    patientName: {
      type: String,
      default: ''
    },
    specimenType: {
      type: String,
      required: true
    },
    containerType: {
      type: String,
      default: ''
    },
    collectionDateTime: {
      type: Date,
      default: null,
      index: true
    },
    collectedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    },
    collectedByName: {
      type: String,
      default: ''
    },
    collectionLocation: {
      type: String,
      default: ''
    },
    collectionNotes: {
      type: String,
      default: ''
    },
    receivedDateTime: {
      type: Date,
      default: null
    },
    receivedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    },
    receivedByName: {
      type: String,
      default: ''
    },
    processingLocation: {
      type: String,
      default: 'MAIN_LAB'
    },
    status: {
      type: String,
      enum: [
        'REGISTERED',
        'COLLECTED',
        'RECEIVED',
        'ACCEPTED',
        'REJECTED',
        'IN_PROCESS',
        'COMPLETED',
        'DISPOSED',
        'ARCHIVED'
      ],
      default: 'REGISTERED',
      index: true
    },
    rejectionReason: {
      type: String,
      enum: [
        '',
        'INSUFFICIENT_SAMPLE',
        'WRONG_CONTAINER',
        'MISSING_LABEL',
        'LABEL_MISMATCH',
        'LEAKED_CONTAINER',
        'DAMAGED_CONTAINER',
        'SAMPLE_NOT_RECEIVED',
        'SAMPLE_STABILITY_EXCEEDED',
        'DUPLICATE_SAMPLE',
        'HEMOLYZED',
        'CLOTTED',
        'LIPEMIC',
        'ICTERIC',
        'OTHER'
      ],
      default: ''
    },
    rejectionNotes: {
      type: String,
      default: ''
    },
    rejectionRecordedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    },
    rejectionRecordedAt: {
      type: Date,
      default: null
    },
    recollectionRequired: {
      type: Boolean,
      default: false
    },
    recollectedSampleId: {
      type: String,
      default: null
    },
    externalLisSampleId: {
      type: String,
      default: null,
      index: true
    }
  },
  {
    timestamps: true
  }
);

labSampleSchema.index({ accessionNumber: 1, patientId: 1 });
labSampleSchema.index({ status: 1, collectionDateTime: -1 });

module.exports = mongoose.model('LabSample', labSampleSchema);
