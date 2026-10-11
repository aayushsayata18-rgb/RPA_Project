const mongoose = require('mongoose');

/**
 * InsuranceClaimDocument Model (Section 9 & Section 54)
 */
const insuranceClaimDocumentSchema = new mongoose.Schema(
  {
    documentId: {
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
    patientId: {
      type: String,
      required: true,
      index: true
    },
    documentType: {
      type: String,
      enum: [
        'INSURANCE_CARD',
        'POLICY_DOCUMENT',
        'FINAL_INVOICE',
        'DISCHARGE_DOCUMENT',
        'LAB_REPORT',
        'RADIOLOGY_REPORT',
        'PHARMACY_DOCUMENT',
        'SERVICE_DOCUMENT',
        'IDENTITY_DOCUMENT',
        'INSURER_CORRESPONDENCE',
        'CLAIM_SUBMISSION_EVIDENCE',
        'CLAIM_APPROVAL_EVIDENCE',
        'CLAIM_REJECTION_EVIDENCE',
        'PAYMENT_EVIDENCE',
        'OTHER'
      ],
      required: true,
      index: true
    },
    fileName: {
      type: String,
      required: true
    },
    fileUrl: {
      type: String,
      default: ''
    },
    storageKey: {
      type: String,
      default: ''
    },
    fileSize: {
      type: Number,
      default: 0
    },
    mimeType: {
      type: String,
      default: 'application/pdf'
    },
    version: {
      type: Number,
      default: 1
    },
    required: {
      type: Boolean,
      default: false
    },
    submittedToInsurer: {
      type: Boolean,
      default: false
    },
    uploadedBy: {
      type: String,
      default: 'SYSTEM'
    },
    uploadedAt: {
      type: Date,
      default: Date.now
    },
    verificationStatus: {
      type: String,
      enum: ['PENDING', 'VALID', 'INVALID', 'WAIVED'],
      default: 'PENDING'
    },
    notes: String,
    isArchived: {
      type: Boolean,
      default: false
    }
  },
  {
    timestamps: true
  }
);

insuranceClaimDocumentSchema.index({ claimId: 1, documentType: 1, version: -1 });

module.exports = mongoose.model('InsuranceClaimDocument', insuranceClaimDocumentSchema);
