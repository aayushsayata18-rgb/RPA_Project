const mongoose = require('mongoose');

/**
 * InsuranceVerificationAttempt Model
 * Conforms to 09_INSURANCE_VERIFICATION.md Section 10
 */
const insuranceVerificationAttemptSchema = new mongoose.Schema(
  {
    verificationId: {
      type: String,
      required: true,
      index: true
    },
    attemptNumber: {
      type: Number,
      required: true,
      default: 1
    },
    source: {
      type: String,
      enum: ['API', 'PORTAL', 'MANUAL'],
      default: 'API'
    },
    startedAt: {
      type: Date,
      default: Date.now
    },
    completedAt: {
      type: Date
    },
    status: {
      type: String,
      enum: ['SUCCESS', 'FAILED', 'TIMEOUT', 'CANCELLED'],
      default: 'SUCCESS'
    },
    externalReference: {
      type: String,
      default: ''
    },
    responseCode: {
      type: String,
      default: '200'
    },
    errorCode: {
      type: String,
      default: null
    },
    errorMessage: {
      type: String,
      default: null
    },
    evidenceDocumentId: {
      type: String,
      default: null
    },
    rpaExecutionId: {
      type: String,
      default: null
    }
  },
  {
    timestamps: true
  }
);

insuranceVerificationAttemptSchema.index({ verificationId: 1, attemptNumber: 1 });

module.exports = mongoose.model('InsuranceVerificationAttempt', insuranceVerificationAttemptSchema);
