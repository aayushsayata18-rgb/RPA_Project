const mongoose = require('mongoose');

const BillableItemSchema = new mongoose.Schema(
  {
    chargeId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
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
    visitId: {
      type: String,
      index: true
    },
    admissionId: {
      type: String,
      index: true
    },
    sourceModule: {
      type: String,
      enum: ['ROOM_ACCOMMODATION', 'CONSULTATION', 'LABORATORY', 'PHARMACY', 'RADIOLOGY', 'NURSING', 'PROCEDURE', 'OTHER'],
      required: true,
      index: true
    },
    sourceType: {
      type: String,
      required: true,
      default: 'MANUAL_ENTRY' // e.g. LAB_ORDER, RADIOLOGY_ORDER, BED_STAY, DISPENSED_MEDICINE, CONSULTATION_FEE, MANUAL_ENTRY
    },
    sourceId: {
      type: String,
      index: true
    },
    serviceCode: {
      type: String,
      trim: true,
      index: true
    },
    description: {
      type: String,
      required: true
    },
    quantity: {
      type: Number,
      required: true,
      default: 1,
      min: 0.01
    },
    unitPrice: {
      type: Number,
      required: true,
      default: 0,
      min: 0
    },
    grossAmount: {
      type: Number,
      required: true,
      default: 0
    },
    discountAmount: {
      type: Number,
      default: 0
    },
    insuranceAmount: {
      type: Number,
      default: 0
    },
    taxAmount: {
      type: Number,
      default: 0
    },
    netAmount: {
      type: Number,
      required: true,
      default: 0
    },
    status: {
      type: String,
      enum: ['PENDING', 'VALIDATED', 'INVOICED', 'VOID', 'CANCELLED', 'REVERSED'],
      default: 'PENDING',
      index: true
    },
    invoiceId: {
      type: String,
      index: true
    },
    serviceDate: {
      type: Date,
      default: Date.now,
      index: true
    },
    notes: {
      type: String,
      default: ''
    },
    correlationId: {
      type: String,
      index: true
    }
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// Compound index to prevent duplicate charge ingestion from identical source
BillableItemSchema.index({ sourceModule: 1, sourceType: 1, sourceId: 1 }, { sparse: true });
BillableItemSchema.index({ patientId: 1, status: 1 });
BillableItemSchema.index({ admissionId: 1, status: 1 });

module.exports = mongoose.model('BillableItem', BillableItemSchema);
