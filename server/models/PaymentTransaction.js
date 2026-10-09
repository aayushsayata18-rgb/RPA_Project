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
      required: true,
      index: true
    },
    dischargeId: {
      type: String,
      index: true
    },
    amount: {
      type: Number,
      required: true
    },
    currency: {
      type: String,
      default: 'INR'
    },
    paymentMethod: {
      type: String,
      enum: ['ONLINE_GATEWAY', 'UPI', 'CARD', 'NET_BANKING', 'COUNTER_CASH', 'COUNTER_CARD', 'COUNTER_UPI', 'INSURANCE_CLAIM'],
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
    status: {
      type: String,
      enum: ['INITIATED', 'PENDING', 'SUCCESS', 'FAILED', 'CANCELLED', 'REFUNDED'],
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
    receiptId: {
      type: String
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
    timestamps: true
  }
);

module.exports = mongoose.model('PaymentTransaction', PaymentTransactionSchema);
