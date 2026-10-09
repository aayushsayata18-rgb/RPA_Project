const mongoose = require('mongoose');

const BillingChargeSchema = new mongoose.Schema(
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
    admissionId: {
      type: String,
      required: true,
      index: true
    },
    serviceType: {
      type: String,
      enum: ['ROOM_ACCOMMODATION', 'CONSULTATION', 'LABORATORY', 'PHARMACY', 'RADIOLOGY', 'NURSING', 'PROCEDURE', 'OTHER'],
      required: true,
      index: true
    },
    serviceName: {
      type: String,
      required: true
    },
    serviceReferenceId: {
      type: String
    },
    quantity: {
      type: Number,
      default: 1
    },
    unitPrice: {
      type: Number,
      required: true
    },
    totalAmount: {
      type: Number,
      required: true
    },
    status: {
      type: String,
      enum: ['PENDING', 'RECONCILED', 'INVOICED', 'CANCELLED', 'DISPUTED'],
      default: 'PENDING',
      index: true
    },
    invoiceId: {
      type: String,
      index: true
    },
    chargeDate: {
      type: Date,
      default: Date.now
    },
    notes: String
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model('BillingCharge', BillingChargeSchema);
