const mongoose = require('mongoose');

const PaymentTransactionSchema = new mongoose.Schema(
  {
    transactionId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true
    },
    invoiceId: {
      type: String,
      required: true,
      index: true
    },
    patientId: {
      type: String,
      required: true,
      index: true
    },
    admissionId: {
      type: String,
      index: true
    },
    dischargeId: {
      type: String,
      index: true
    },
    amount: {
      type: Number,
      required: true,
      min: 0.01
    },
    currency: {
      type: String,
      default: 'INR'
    },
    paymentMethod: {
      type: String,
      enum: ['ONLINE_GATEWAY', 'UPI', 'CARD', 'NET_BANKING', 'COUNTER_CASH', 'COUNTER_CARD', 'COUNTER_UPI', 'BANK_TRANSFER', 'INSURANCE_CLAIM'],
      required: true
    },
    gatewayName: {
      type: String,
      default: 'MOCK_HOSPITAL_GATEWAY' // Configurable e.g. Razorpay, Stripe, Mock
    },
    gatewayReferenceId: {
      type: String,
      index: true
    },
    gatewaySignature: {
      type: String
    },
    paymentReference: {
      type: String
    },
    status: {
      type: String,
      enum: ['INITIATED', 'PENDING', 'SUCCESS', 'FAILED', 'CANCELLED', 'REFUNDED', 'PARTIALLY_REFUNDED'],
      default: 'INITIATED',
      index: true
    },
    failureReason: {
      type: String
    },
    initiatedAt: {
      type: Date,
      default: Date.now
    },
    completedAt: {
      type: Date
    },
    verifiedAt: {
      type: Date
    },
    receiptId: {
      type: String,
      index: true
    },
    recordedBy: {
      type: String,
      default: 'SYSTEM'
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

PaymentTransactionSchema.virtual('paymentNumber').get(function() {
  return this.transactionId;
});

PaymentTransactionSchema.virtual('method').get(function() {
  return this.paymentMethod;
});

PaymentTransactionSchema.virtual('receiptNumber').get(function() {
  return this.receiptId || this.transactionId;
});

PaymentTransactionSchema.virtual('receivedAt').get(function() {
  return this.completedAt || this.initiatedAt;
});

PaymentTransactionSchema.index({ invoiceId: 1, createdAt: -1 });
PaymentTransactionSchema.index({ status: 1, createdAt: -1 });

module.exports = mongoose.model('PaymentTransaction', PaymentTransactionSchema);
