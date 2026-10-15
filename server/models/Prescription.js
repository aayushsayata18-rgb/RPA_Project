const mongoose = require('mongoose');

const prescriptionItemSchema = new mongoose.Schema(
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
    medicineNameSnapshot: {
      type: String,
      required: true
    },
    strengthSnapshot: {
      type: String,
      default: ''
    },
    dosageFormSnapshot: {
      type: String,
      default: ''
    },
    unitPriceSnapshot: {
      type: Number,
      default: 0
    },
    dose: {
      type: String,
      required: true // e.g. "500 mg", "1 tablet", "10 ml"
    },
    route: {
      type: String,
      enum: ['ORAL', 'INTRAVENOUS', 'INTRAMUSCULAR', 'TOPICAL', 'INHALATION', 'SUBLINGUAL', 'OPHTHALMIC', 'OTIC', 'RECTAL', 'OTHER'],
      default: 'ORAL'
    },
    frequency: {
      type: String,
      required: true // e.g. "ONCE_DAILY", "TWICE_DAILY", "THREE_TIMES_DAILY", "EVERY_8_HOURS", "AS_NEEDED"
    },
    duration: {
      type: String,
      required: true // e.g. "5 DAYS", "7 DAYS", "30 DAYS"
    },
    quantity: {
      type: Number,
      required: true,
      min: 1
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
    instructions: {
      type: String,
      default: '' // e.g. "Take after food with plenty of water"
    },
    refillAllowed: {
      type: Boolean,
      default: false
    },
    status: {
      type: String,
      enum: ['PENDING', 'VALIDATED', 'PARTIALLY_DISPENSED', 'DISPENSED', 'CANCELLED', 'REJECTED'],
      default: 'PENDING'
    }
  },
  { _id: false }
);

const prescriptionSchema = new mongoose.Schema(
  {
    prescriptionId: {
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
      required: true,
      index: true
    },
    doctorName: {
      type: String,
      default: ''
    },
    departmentId: {
      type: String,
      default: ''
    },
    departmentName: {
      type: String,
      default: ''
    },
    diagnosis: {
      type: String,
      default: ''
    },
    clinicalNotes: {
      type: String,
      default: ''
    },
    prescriptionDate: {
      type: Date,
      default: Date.now,
      index: true
    },
    validUntil: {
      type: Date,
      index: true
    },
    items: [prescriptionItemSchema],
    instructions: {
      type: String,
      default: ''
    },
    status: {
      type: String,
      enum: [
        'DRAFT',
        'ISSUED',
        'SENT_TO_PHARMACY',
        'UNDER_REVIEW',
        'VALIDATED',
        'PARTIALLY_DISPENSED',
        'DISPENSED',
        'ON_HOLD',
        'CANCELLED',
        'EXPIRED',
        'REJECTED'
      ],
      default: 'ISSUED',
      index: true
    },
    holdReason: {
      type: String,
      default: ''
    },
    rejectionReason: {
      type: String,
      default: ''
    },
    cancellationReason: {
      type: String,
      default: ''
    },
    cancelledAt: Date,
    cancelledBy: String,
    createdBy: {
      type: String,
      default: 'DOCTOR'
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

prescriptionSchema.index({ patientId: 1, prescriptionDate: -1 });
prescriptionSchema.index({ doctorId: 1, prescriptionDate: -1 });
prescriptionSchema.index({ status: 1, prescriptionDate: -1 });

module.exports = mongoose.model('Prescription', prescriptionSchema);
