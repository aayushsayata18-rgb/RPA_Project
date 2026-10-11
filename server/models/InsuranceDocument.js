const mongoose = require('mongoose');

/**
 * InsuranceDocument Model
 * Conforms to 09_INSURANCE_VERIFICATION.md Section 11 & Section 72
 */
const insuranceDocumentSchema = new mongoose.Schema(
  {
    documentId: {
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
    policyId: {
      type: String,
      required: true,
      index: true
    },
    verificationId: {
      type: String,
      default: null
    },
    documentType: {
      type: String,
      enum: [
        'INSURANCE_CARD',
        'POLICY_DOCUMENT',
        'PORTAL_SCREENSHOT',
        'ELIGIBILITY_CONFIRMATION',
        'CORRESPONDENCE',
        'MANUAL_EVIDENCE',
        'VERIFICATION_SUMMARY'
      ],
      required: true
    },
    fileName: {
      type: String,
      required: true
    },
    storageKey: {
      type: String,
      required: true
    },
    fileUrl: {
      type: String,
      default: ''
    },
    mimeType: {
      type: String,
      default: 'application/pdf'
    },
    fileSize: {
      type: Number,
      default: 0
    },
    uploadedBy: {
      type: String,
      default: 'SYSTEM'
    },
    source: {
      type: String,
      enum: ['PATIENT_UPLOAD', 'STAFF_UPLOAD', 'RPA_CAPTURE', 'API_EXPORT'],
      default: 'STAFF_UPLOAD'
    },
    notes: {
      type: String,
      default: ''
    }
  },
  {
    timestamps: true
  }
);

insuranceDocumentSchema.index({ patientId: 1, policyId: 1 });
insuranceDocumentSchema.index({ verificationId: 1 });

module.exports = mongoose.model('InsuranceDocument', insuranceDocumentSchema);
