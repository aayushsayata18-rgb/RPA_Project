const mongoose = require('mongoose');

const labOrderItemSchema = new mongoose.Schema(
  {
    orderItemId: {
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
    labTestId: {
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
    specimenTypeSnapshot: {
      type: String,
      default: ''
    },
    containerTypeSnapshot: {
      type: String,
      default: ''
    },
    collectionInstructionsSnapshot: {
      type: String,
      default: ''
    },
    priceSnapshot: {
      type: Number,
      required: true,
      default: 0
    },
    status: {
      type: String,
      enum: [
        'ORDERED',
        'AWAITING_COLLECTION',
        'COLLECTED',
        'RECEIVED',
        'IN_PROCESS',
        'RESULT_ENTERED',
        'VERIFIED',
        'REPORT_READY',
        'RELEASED',
        'REJECTED',
        'CANCELLED'
      ],
      default: 'ORDERED',
      index: true
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
    reportId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'LabReport',
      default: null
    }
  },
  {
    timestamps: true
  }
);

labOrderItemSchema.index({ orderId: 1, labTestId: 1 });

module.exports = mongoose.model('LabOrderItem', labOrderItemSchema);
