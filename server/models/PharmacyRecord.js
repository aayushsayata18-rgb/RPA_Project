const mongoose = require('mongoose');

const pharmacyRecordSchema = new mongoose.Schema(
  {
    dispenseId: {
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
    admissionId: {
      type: String,
      index: true
    },
    visitId: {
      type: String,
      index: true
    },
    prescribedByDoctorId: String,
    prescribedByDoctorName: String,
    dispensedByPharmacist: String,
    dispenseDate: {
      type: Date,
      default: Date.now,
      index: true
    },
    status: {
      type: String,
      enum: ['PENDING', 'PARTIALLY_DISPENSED', 'DISPENSED', 'CANCELLED', 'RETURNED'],
      default: 'DISPENSED',
      index: true
    },
    medications: [
      {
        medicineName: { type: String, required: true },
        dosage: String,
        frequency: String,
        duration: String,
        quantity: Number,
        unitPrice: Number,
        totalPrice: Number,
        batchNumber: String,
        expiryDate: Date,
        instructions: String
      }
    ],
    totalAmount: {
      type: Number,
      default: 0
    },
    billingReferenceId: String,
    correlationId: String
  },
  {
    timestamps: true
  }
);

pharmacyRecordSchema.index({ patientId: 1, dispenseDate: -1 });

module.exports = mongoose.model('PharmacyRecord', pharmacyRecordSchema);
