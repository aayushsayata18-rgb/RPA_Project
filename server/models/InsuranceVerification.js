const mongoose = require('mongoose');

/**
 * InsuranceVerification Model
 * Conforms to 09_INSURANCE_VERIFICATION.md Section 7 & Section 9
 */
const insuranceVerificationSchema = new mongoose.Schema(
  {
    verificationId: {
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
    patientRef: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Patient'
    },
    patientName: {
      type: String,
      default: ''
    },
    policyId: {
      type: String,
      required: true,
      index: true
    },
    policyRef: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'InsurancePolicy'
    },
    requestedBy: {
      type: String,
      required: true,
      default: 'SYSTEM'
    },
    verificationSource: {
      type: String,
      enum: ['API', 'INSURER_PORTAL', 'MANUAL'],
      default: 'API',
      index: true
    },
    integrationType: {
      type: String,
      enum: ['OFFICIAL_API', 'BROWSER_AUTOMATION', 'MANUAL_REVIEW'],
      default: 'OFFICIAL_API'
    },
    status: {
      type: String,
      enum: [
        'REQUESTED',
        'QUEUED',
        'IN_PROGRESS',
        'VERIFIED',
        'PARTIALLY_VERIFIED',
        'NOT_ELIGIBLE',
        'EXPIRED',
        'NOT_FOUND',
        'AMBIGUOUS',
        'FAILED',
        'MANUAL_REVIEW',
        'CANCELLED'
      ],
      default: 'REQUESTED'
    },
    requestedAt: {
      type: Date,
      default: Date.now
    },
    startedAt: {
      type: Date
    },
    completedAt: {
      type: Date
    },
    insurerName: {
      type: String,
      required: true
    },
    providerCode: {
      type: String,
      default: 'GENERIC_INSURER'
    },
    policyNumber: {
      type: String,
      required: true,
      index: true
    },
    memberId: {
      type: String,
      default: ''
    },
    eligibilityStatus: {
      type: String,
      enum: ['ELIGIBLE', 'NOT_ELIGIBLE', 'UNKNOWN', 'PENDING'],
      default: 'UNKNOWN'
    },
    policyStatus: {
      type: String,
      enum: ['ACTIVE', 'EXPIRED', 'CANCELLED', 'SUSPENDED', 'UNKNOWN'],
      default: 'UNKNOWN'
    },
    effectiveDate: {
      type: Date
    },
    expiryDate: {
      type: Date
    },
    networkStatus: {
      type: String,
      enum: ['IN_NETWORK', 'OUT_OF_NETWORK', 'UNKNOWN', 'NOT_AVAILABLE'],
      default: 'UNKNOWN'
    },
    coverageType: {
      type: String,
      default: 'UNKNOWN'
    },
    // Coverage amounts from insurer (Never invented)
    deductibleAmount: {
      type: Number,
      default: null
    },
    deductibleUsed: {
      type: Number,
      default: null
    },
    deductibleRemaining: {
      type: Number,
      default: null
    },
    copayAmount: {
      type: Number,
      default: null
    },
    coverageLimit: {
      type: Number,
      default: null
    },
    coverageUsed: {
      type: Number,
      default: null
    },
    coverageRemaining: {
      type: Number,
      default: null
    },
    authorizationRequired: {
      type: String,
      enum: ['REQUIRED', 'NOT_REQUIRED', 'UNKNOWN', 'NOT_AVAILABLE'],
      default: 'UNKNOWN'
    },
    verificationReference: {
      type: String,
      default: ''
    },
    insurerResponseSummary: {
      type: mongoose.Schema.Types.Mixed,
      default: {}
    },
    rawResponse: {
      type: mongoose.Schema.Types.Mixed,
      default: null
    },
    evidenceDocumentIds: [
      {
        type: String
      }
    ],
    evidencePaths: [
      {
        type: String
      }
    ],
    errorCode: {
      type: String,
      default: null
    },
    errorMessage: {
      type: String,
      default: null
    },
    exceptionCaseId: {
      type: String,
      default: null
    },
    rpaJobId: {
      type: String,
      default: null
    },
    correlationId: {
      type: String,
      default: null
    },
    retryCount: {
      type: Number,
      default: 0
    },
    maxRetries: {
      type: Number,
      default: 3
    },
    manualReview: {
      reviewedBy: String,
      reviewedAt: Date,
      decision: String,
      notes: String,
      evidenceFile: String
    }
  },
  {
    timestamps: true
  }
);

insuranceVerificationSchema.index({ patientId: 1, createdAt: -1 });
insuranceVerificationSchema.index({ policyId: 1, createdAt: -1 });
insuranceVerificationSchema.index({ status: 1 });
insuranceVerificationSchema.index({ correlationId: 1 });
insuranceVerificationSchema.index({ rpaJobId: 1 });

module.exports = mongoose.model('InsuranceVerification', insuranceVerificationSchema);
