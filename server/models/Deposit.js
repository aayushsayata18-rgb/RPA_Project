const mongoose = require('mongoose');

const DepositSchema = new mongoose.Schema(
  {
    depositNumber: {
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
    amount: {
      type: Number,
      required: true,
      min: 0.01
    },
    usedAmount: {
      type: Number,
      default: 0,
      min: 0
    },
    remainingAmount: {
      type: Number,
      required: true,
      default: function() {
        return this.amount;
      },
      min: 0
    },
    paymentMethod: {
      type: String,
      enum: ['CASH', 'UPI', 'CARD', 'NET_BANKING', 'BANK_TRANSFER', 'ONLINE_GATEWAY'],
      default: 'CASH'
    },
    paymentId: {
      type: String,
      index: true
    },
    appliedInvoices: [
      {
        invoiceId: String,
        amountApplied: Number,
        appliedAt: {
          type: Date,
          default: Date.now
        }
      }
    ],
    status: {
      type: String,
      enum: ['ACTIVE', 'PARTIALLY_APPLIED', 'FULLY_APPLIED', 'REFUNDED', 'CANCELLED'],
      default: 'ACTIVE',
      index: true
    },
    receivedAt: {
      type: Date,
      default: Date.now
    },
    notes: {
      type: String,
      default: ''
    },
    createdByUserId: {
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

DepositSchema.index({ patientId: 1, status: 1 });
DepositSchema.index({ admissionId: 1, status: 1 });

module.exports = mongoose.model('Deposit', DepositSchema);
