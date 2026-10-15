const mongoose = require('mongoose');

const orderItemReservationSchema = new mongoose.Schema(
  {
    batchId: {
      type: String,
      required: true
    },
    quantity: {
      type: Number,
      required: true,
      min: 1
    },
    expiryDate: Date,
    reservedAt: {
      type: Date,
      default: Date.now
    }
  },
  { _id: false }
);

const pharmacyOrderItemSchema = new mongoose.Schema(
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
    dosageForm: String,
    strength: String,
    prescribedQuantity: {
      type: Number,
      required: true,
      min: 1
    },
    reservedQuantity: {
      type: Number,
      default: 0,
      min: 0
    },
    dispensedQuantity: {
      type: Number,
      default: 0,
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
    batchReservations: [orderItemReservationSchema],
    status: {
      type: String,
      enum: ['PENDING', 'RESERVED', 'PARTIALLY_DISPENSED', 'DISPENSED', 'OUT_OF_STOCK', 'CANCELLED'],
      default: 'PENDING'
    }
  },
  { _id: false }
);

const pharmacyOrderSchema = new mongoose.Schema(
  {
    pharmacyOrderId: {
      type: String,
      required: true,
      unique: true,
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
    doctorId: {
      type: String,
      index: true
    },
    doctorName: {
      type: String,
      default: ''
    },
    orderType: {
      type: String,
      enum: ['OUTPATIENT', 'INPATIENT', 'EMERGENCY', 'WARD_STOCK', 'DISCHARGE_MEDICATION'],
      default: 'OUTPATIENT',
      index: true
    },
    priority: {
      type: String,
      enum: ['NORMAL', 'URGENT', 'STAT', 'EMERGENCY'],
      default: 'NORMAL',
      index: true
    },
    status: {
      type: String,
      enum: [
        'NEW',
        'RECEIVED',
        'VALIDATING',
        'READY_FOR_DISPENSING',
        'PARTIALLY_FULFILLED',
        'DISPENSED',
        'ON_HOLD',
        'CANCELLED',
        'COMPLETED'
      ],
      default: 'NEW',
      index: true
    },
    items: [pharmacyOrderItemSchema],
    requestedAt: {
      type: Date,
      default: Date.now,
      index: true
    },
    receivedAt: Date,
    processedAt: Date,
    completedAt: Date,
    pharmacistId: String,
    pharmacistName: String,
    notes: {
      type: String,
      default: ''
    },
    holdReason: {
      type: String,
      default: ''
    },
    cancellationReason: {
      type: String,
      default: ''
    },
    createdBy: {
      type: String,
      default: 'SYSTEM'
    },
    updatedBy: {
      type: String,
      default: 'SYSTEM'
    },
    correlationId: String
  },
  {
    timestamps: true
  }
);

pharmacyOrderSchema.index({ patientId: 1, status: 1 });
pharmacyOrderSchema.index({ orderType: 1, status: 1, priority: 1 });
pharmacyOrderSchema.index({ requestedAt: -1, status: 1 });

module.exports = mongoose.model('PharmacyOrder', pharmacyOrderSchema);
