const mongoose = require('mongoose');

const PaymentAttemptSchema = new mongoose.Schema(
  {
    paymentId: {
      type: String,
      index: true
    },
    invoiceId: {
      type: String,
      required: true,
      index: true
    },
    patientId: {
      type: String,
      index: true
    },
    attemptNumber: {
      type: Number,
      default: 1
    },
    amount: {
      type: Number,
      required: true
    },
    method: {
      type: String,
      required: true
    },
    gatewayProvider: {
      type: String,
      default: 'MOCK_HOSPITAL_GATEWAY'
    },
    gatewayReference: {
      type: String,
      index: true
    },
    status: {
      type: String,
      enum: ['INITIATED', 'SUCCESS', 'FAILED', 'CANCELLED'],
      default: 'INITIATED',
      index: true
    },
    failureCode: {
      type: String
    },
    failureMessage: {
      type: String
    },
    initiatedAt: {
      type: Date,
      default: Date.now
    },
    completedAt: {
      type: Date
    }
  },
  {
    timestamps: true
  }
);

PaymentAttemptSchema.index({ invoiceId: 1, initiatedAt: -1 });

module.exports = mongoose.model('PaymentAttempt', PaymentAttemptSchema);
