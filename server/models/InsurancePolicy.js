const mongoose = require('mongoose');

/**
 * InsurancePolicy Model
 * Conforms to 09_INSURANCE_VERIFICATION.md Section 8 & Section 13
 */
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
    patientRef: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Patient'
    },
    patientName: {
      type: String,
      default: ''
    },
    policyNumber: {
      type: String,
      required: true,
      trim: true,
      index: true
    },
    memberId: {
      type: String,
      trim: true,
      index: true,
      default: ''
    },
    groupNumber: {
      type: String,
      trim: true,
      default: ''
    },
    providerName: {
      type: String,
      required: true,
      trim: true,
      index: true
    },
    providerCode: {
      type: String,
      trim: true,
      default: 'GENERIC_INSURER'
    },
    planName: {
      type: String,
      default: ''
    },
    planType: {
      type: String,
      default: 'COMPREHENSIVE'
    },
    relationshipToPatient: {
      type: String,
      enum: ['SELF', 'SPOUSE', 'CHILD', 'PARENT', 'OTHER'],
      default: 'SELF'
    },
    policyHolderName: {
      type: String,
      required: true,
      trim: true
    },
    policyHolderPatientId: {
      type: String,
      default: ''
    },
    startDate: {
      type: Date
    },
    endDate: {
      type: Date
    },
    validFrom: {
      type: Date
    },
    validTo: {
      type: Date
    },
    status: {
      type: String,
      enum: ['DRAFT', 'ACTIVE', 'EXPIRED', 'CANCELLED', 'SUSPENDED', 'UNKNOWN'],
      default: 'DRAFT',
      index: true
    },
    isPrimary: {
      type: Boolean,
      default: true,
      index: true
    },
    priority: {
      type: Number,
      default: 1
    },
    networkStatus: {
      type: String,
      enum: ['IN_NETWORK', 'OUT_OF_NETWORK', 'UNKNOWN', 'NOT_AVAILABLE'],
      default: 'UNKNOWN'
    },
    coverageType: {
      type: String,
      default: 'INPATIENT_AND_OUTPATIENT'
    },
    // Coverage & Cost Sharing details - Populated only when insurer provides it
    coverageAmount: {
      type: Number,
      default: 0
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
    coPayPercentage: {
      type: Number,
      default: 0
    },
    authorizationRequired: {
      type: String,
      enum: ['REQUIRED', 'NOT_REQUIRED', 'UNKNOWN', 'NOT_AVAILABLE'],
      default: 'UNKNOWN'
    },
    // Verification Tracking
    lastVerifiedAt: {
      type: Date
    },
    lastVerificationStatus: {
      type: String,
      enum: [
        'UNVERIFIED',
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
      default: 'UNVERIFIED',
      index: true
    },
    verificationStatus: {
      // Legacy compatibility alias
      type: String,
      default: 'UNVERIFIED',
      index: true
    },
    lastVerificationId: {
      type: String,
      default: null
    },
    verifiedAt: {
      type: Date
    },
    verifiedBy: {
      type: String,
      default: null
    },
    source: {
      type: String,
      enum: ['API', 'INSURER_PORTAL', 'MANUAL', 'SELF', 'SYSTEM', 'STAFF'],
      default: 'SELF'
    },
    documents: [
      {
        documentId: String,
        documentType: {
          type: String,
          enum: ['INSURANCE_CARD', 'POLICY_DOCUMENT', 'MEMBER_CARD', 'CONFIRMATION', 'OTHER'],
          default: 'INSURANCE_CARD'
        },
        fileName: String,
        fileUrl: String,
        uploadedAt: {
          type: Date,
          default: Date.now
        }
      }
    ],
    notes: {
      type: String,
      default: ''
    },
    correlationId: {
      type: String,
      default: null
    },
    isDeleted: {
      type: Boolean,
      default: false,
      index: true
    },
    createdBy: {
      type: String,
      default: 'SYSTEM'
    },
    updatedBy: {
      type: String,
      default: 'SYSTEM'
    }
  },
  {
    timestamps: true
  }
);

// Synchronization pre-save hook
insurancePolicySchema.pre('save', function (next) {
  if (this.startDate && !this.validFrom) this.validFrom = this.startDate;
  if (this.endDate && !this.validTo) this.validTo = this.endDate;
  if (this.validFrom && !this.startDate) this.startDate = this.validFrom;
  if (this.validTo && !this.endDate) this.endDate = this.validTo;

  if (this.lastVerificationStatus) {
    this.verificationStatus = this.lastVerificationStatus;
  }
  next();
});

// Compound indexes for high-performance searches and duplicate checks
insurancePolicySchema.index({ patientId: 1, isDeleted: 1 });
insurancePolicySchema.index({ patientId: 1, isPrimary: 1 });
insurancePolicySchema.index({ patientId: 1, providerName: 1, policyNumber: 1, memberId: 1 });

module.exports = mongoose.model('InsurancePolicy', insurancePolicySchema);
