const mongoose = require('mongoose');

const insuranceClaimSchema = new mongoose.Schema(
  {
    claimId: {
      type: String,
      required: true,
      unique: true,
      index: true
    },
    policyId: {
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
    invoiceId: {
      type: String,
      index: true
    },
    providerName: String,
    policyNumber: String,
    claimAmount: {
      type: Number,
      required: true
    },
    approvedAmount: {
      type: Number,
      default: 0
    },
    settledAmount: {
      type: Number,
      default: 0
    },
    status: {
      type: String,
      enum: [
        'DRAFT',
        'READY',
        'SUBMITTED',
        'UNDER_REVIEW',
        'QUERY',
        'MORE_INFORMATION_REQUIRED',
        'APPROVED',
        'PARTIALLY_APPROVED',
        'REJECTED',
        'PAID',
        'CANCELLED'
      ],
      default: 'SUBMITTED',
      index: true
    },
    submissionDate: {
      type: Date,
      default: Date.now,
      index: true
    },
    settlementDate: Date,
    queryNotes: String,
    rejectionReason: String,
    documentIds: [String],
    correlationId: String
  },
  {
    timestamps: true
  }
);

insuranceClaimSchema.index({ patientId: 1, submissionDate: -1 });

module.exports = mongoose.model('InsuranceClaim', insuranceClaimSchema);
