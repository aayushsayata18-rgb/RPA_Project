const mongoose = require('mongoose');

const FinancialAdjustmentSchema = new mongoose.Schema(
  {
    adjustmentNumber: {
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
    type: {
      type: String,
      enum: ['DISCOUNT', 'WAIVER', 'CREDIT', 'DEBIT', 'OTHER_CONFIGURED_ADJUSTMENT'],
      required: true,
      index: true
    },
    amount: {
      type: Number,
      required: true,
      min: 0.01
    },
    reason: {
      type: String,
      required: true
    },
    status: {
      type: String,
      enum: ['REQUESTED', 'UNDER_REVIEW', 'APPROVED', 'REJECTED', 'CANCELLED', 'APPLIED'],
      default: 'REQUESTED',
      index: true
    },
    requestedBy: {
      type: String,
      required: true
    },
    requestedAt: {
      type: Date,
      default: Date.now
    },
    approvedBy: {
      type: String
    },
    approvedAt: {
      type: Date
    },
    appliedAt: {
      type: Date
    },
    rejectionReason: {
      type: String
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

FinancialAdjustmentSchema.index({ invoiceId: 1, status: 1 });

module.exports = mongoose.model('FinancialAdjustment', FinancialAdjustmentSchema);
