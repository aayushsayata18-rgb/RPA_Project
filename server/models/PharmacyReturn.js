const mongoose = require('mongoose');

const pharmacyReturnItemSchema = new mongoose.Schema(
  {
    medicineId: {
      type: String,
      required: true,
      index: true
    },
    medicineName: {
      type: String,
      required: true
    },
    inventoryBatchId: {
      type: String,
      default: ''
    },
    quantity: {
      type: Number,
      required: true,
      min: 1
    },
    unit: {
      type: String,
      default: 'Tablet'
    },
    unitPrice: {
      type: Number,
      default: 0
    },
    refundAmount: {
      type: Number,
      default: 0
    },
    condition: {
      type: String,
      enum: ['UNOPENED', 'OPENED', 'DAMAGED', 'EXPIRED', 'UNKNOWN'],
      default: 'UNOPENED'
    },
    disposition: {
      type: String,
      enum: ['QUARANTINE', 'RETURN_TO_STOCK', 'DISPOSE', 'REJECT', 'PENDING'],
      default: 'QUARANTINE'
    },
    dispositionNotes: {
      type: String,
      default: ''
    }
  },
  { _id: false }
);

const pharmacyReturnSchema = new mongoose.Schema(
  {
    returnId: {
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
    pharmacyOrderId: {
      type: String,
      required: true,
      index: true
    },
    dispensingRecordId: {
      type: String,
      required: true,
      index: true
    },
    reason: {
      type: String,
      enum: [
        'PATIENT_RETURN',
        'WRONG_MEDICINE',
        'WRONG_QUANTITY',
        'DAMAGED',
        'EXPIRED',
        'CANCELLED_ORDER',
        'DISCHARGE_RETURN',
        'OTHER'
      ],
      required: true
    },
    reasonDetails: {
      type: String,
      default: ''
    },
    status: {
      type: String,
      enum: ['REQUESTED', 'UNDER_REVIEW', 'APPROVED', 'REJECTED', 'PROCESSED', 'QUARANTINED', 'CANCELLED'],
      default: 'REQUESTED',
      index: true
    },
    items: [pharmacyReturnItemSchema],
    totalRefundAmount: {
      type: Number,
      default: 0
    },
    requestedBy: {
      type: String,
      required: true
    },
    approvedBy: String,
    approvedAt: Date,
    processedBy: String,
    processedAt: Date,
    reviewNotes: {
      type: String,
      default: ''
    },
    correlationId: String
  },
  {
    timestamps: true
  }
);

pharmacyReturnSchema.index({ patientId: 1, status: 1 });
pharmacyReturnSchema.index({ createdAt: -1, status: 1 });

module.exports = mongoose.model('PharmacyReturn', pharmacyReturnSchema);
