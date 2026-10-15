const mongoose = require('mongoose');

const dispensingItemSchema = new mongoose.Schema(
  {
    prescriptionItemId: {
      type: String,
      required: true
    },
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
      required: true,
      index: true
    },
    batchExpiryDate: Date,
    prescribedQuantity: {
      type: Number,
      required: true,
      min: 1
    },
    dispensedQuantity: {
      type: Number,
      required: true,
      min: 0
    },
    unit: {
      type: String,
      default: 'Tablet'
    },
    unitPrice: {
      type: Number,
      default: 0
    },
    totalPrice: {
      type: Number,
      default: 0
    },
    dispensingStatus: {
      type: String,
      enum: ['PENDING', 'PARTIALLY_DISPENSED', 'DISPENSED', 'NOT_DISPENSED', 'RETURNED'],
      default: 'DISPENSED'
    },
    substitution: {
      type: Boolean,
      default: false
    },
    originalMedicineId: String,
    originalMedicineName: String,
    substitutionReason: String,
    approvedBy: String,
    approvedAt: Date,
    instructions: String
  },
  { _id: false }
);

const dispensingRecordSchema = new mongoose.Schema(
  {
    dispensingRecordId: {
      type: String,
      required: true,
      unique: true,
      index: true
    },
    pharmacyOrderId: {
      type: String,
      required: true,
      index: true
    },
    prescriptionId: {
      type: String,
      required: true,
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
    pharmacistId: {
      type: String,
      required: true,
      index: true
    },
    pharmacistName: {
      type: String,
      default: ''
    },
    dispensedAt: {
      type: Date,
      default: Date.now,
      index: true
    },
    status: {
      type: String,
      enum: ['PENDING', 'COMPLETED', 'CANCELLED', 'RETURNED'],
      default: 'COMPLETED',
      index: true
    },
    items: [dispensingItemSchema],
    totalAmount: {
      type: Number,
      default: 0
    },
    billingReferenceId: {
      type: String,
      index: true
    },
    idempotencyKey: {
      type: String,
      unique: true,
      sparse: true,
      index: true
    },
    notes: {
      type: String,
      default: ''
    },
    cancelledAt: Date,
    cancelledBy: String,
    cancellationReason: String,
    correlationId: String
  },
  {
    timestamps: true
  }
);

dispensingRecordSchema.index({ patientId: 1, dispensedAt: -1 });
dispensingRecordSchema.index({ pharmacistId: 1, dispensedAt: -1 });
dispensingRecordSchema.index({ prescriptionId: 1, pharmacyOrderId: 1 });

module.exports = mongoose.model('DispensingRecord', dispensingRecordSchema);
