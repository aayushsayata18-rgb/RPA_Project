const mongoose = require('mongoose');

const insurancePolicySchema = new mongoose.Schema(
  {
    policyId: {
      type: String,
      required: true,
      unique: true,
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
    providerName: {
      type: String,
      required: true,
      index: true
    },
    policyNumber: {
      type: String,
      required: true,
      index: true
    },
    policyHolderName: {
      type: String,
      required: true
    },
    relationshipToPatient: {
      type: String,
      default: 'SELF'
    },
    coverageAmount: {
      type: Number,
      default: 0
    },
    coPayPercentage: {
      type: Number,
      default: 0
    },
    validFrom: {
      type: Date
    },
    validTo: {
      type: Date
    },
    verificationStatus: {
      type: String,
      enum: ['UNVERIFIED', 'PENDING', 'VERIFIED', 'EXPIRED', 'REJECTED'],
      default: 'VERIFIED',
      index: true
    },
    verifiedAt: Date,
    verifiedBy: String,
    documentId: String,
    notes: String,
    correlationId: String
  },
  {
    timestamps: true
  }
);

insurancePolicySchema.index({ patientId: 1, verificationStatus: 1 });

module.exports = mongoose.model('InsurancePolicy', insurancePolicySchema);
