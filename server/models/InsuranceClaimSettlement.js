const mongoose = require('mongoose');

/**
 * InsuranceClaimSettlement Model (Section 12, 44 & 47)
 */
const insuranceClaimSettlementSchema = new mongoose.Schema(
  {
    settlementId: {
      type: String,
      required: true,
      unique: true,
      index: true
    },
    claimId: {
      type: String,
      required: true,
      index: true
    },
    claimRef: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'InsuranceClaim'
    },
    invoiceId: {
      type: String,
      index: true
    },
    insurerName: {
      type: String,
      required: true
    },
    insurerReference: {
      type: String,
      default: ''
    },
    approvedAmount: {
      type: Number,
      required: true,
      default: 0
    },
    settledAmount: {
      type: Number,
      required: true,
      default: 0
    },
    differenceAmount: {
      type: Number,
      default: 0
    },
    settlementDate: {
      type: Date,
      default: Date.now,
      index: true
    },
    paymentReference: {
      type: String,
      required: true,
      trim: true
    },
    status: {
      type: String,
      enum: ['PENDING', 'PARTIALLY_PAID', 'PAID', 'DISPUTED'],
      default: 'PENDING',
      index: true
    },
    reconciledWithBilling: {
      type: Boolean,
      default: false,
      index: true
    },
    reconciledAt: Date,
    reconciledBy: String,
    exceptionCaseId: String,
    notes: String,
    recordedBy: {
      type: String,
      default: 'SYSTEM'
    }
  },
  {
    timestamps: true
  }
);

insuranceClaimSettlementSchema.index({ claimId: 1, settlementDate: -1 });

module.exports = mongoose.model('InsuranceClaimSettlement', insuranceClaimSettlementSchema);
