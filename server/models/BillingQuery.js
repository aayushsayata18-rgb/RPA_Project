const mongoose = require('mongoose');

const BillingQuerySchema = new mongoose.Schema(
  {
    queryNumber: {
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
    invoiceId: {
      type: String,
      required: true,
      index: true
    },
    submittedByUserId: {
      type: String,
      required: true
    },
    category: {
      type: String,
      enum: ['CHARGE_CLARIFICATION', 'DISCOUNT_QUERY', 'INSURANCE_DISPUTE', 'DEPOSIT_ISSUE', 'PAYMENT_ISSUE', 'OTHER'],
      default: 'CHARGE_CLARIFICATION'
    },
    description: {
      type: String,
      required: true
    },
    status: {
      type: String,
      enum: ['OPEN', 'UNDER_REVIEW', 'WAITING_FOR_INFORMATION', 'RESOLVED', 'REJECTED', 'CLOSED'],
      default: 'OPEN',
      index: true
    },
    assignedTo: {
      type: String
    },
    resolution: {
      type: String
    },
    resolvedBy: {
      type: String
    },
    resolvedAt: {
      type: Date
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

BillingQuerySchema.index({ invoiceId: 1, status: 1 });
BillingQuerySchema.index({ patientId: 1, status: 1 });

module.exports = mongoose.model('BillingQuery', BillingQuerySchema);
