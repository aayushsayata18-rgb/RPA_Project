const mongoose = require('mongoose');

/**
 * Embedded Claim Line Item Subschema (Section 8)
 */
const claimItemSchema = new mongoose.Schema(
  {
    serviceType: {
      type: String,
      enum: ['CONSULTATION', 'ROOM', 'ROOM_ACCOMMODATION', 'LAB', 'LABORATORY', 'RADIOLOGY', 'PHARMACY', 'PROCEDURE', 'NURSING', 'OTHER'],
      default: 'OTHER'
    },
    serviceId: String,
    description: {
      type: String,
      required: true
    },
    serviceDate: {
      type: Date,
      default: Date.now
    },
    quantity: {
      type: Number,
      default: 1
    },
    unitAmount: {
      type: Number,
      default: 0
    },
    claimedAmount: {
      type: Number,
      required: true,
      default: 0
    },
    approvedAmount: {
      type: Number,
      default: 0
    },
    rejectedAmount: {
      type: Number,
      default: 0
    },
    rejectionReason: String
  },
  { _id: true }
);

/**
 * Claim Checklist Item Subschema (Section 20)
 */
const documentChecklistItemSchema = new mongoose.Schema(
  {
    documentType: {
      type: String,
      required: true
    },
    title: String,
    required: {
      type: Boolean,
      default: true
    },
    available: {
      type: Boolean,
      default: false
    },
    validated: {
      type: Boolean,
      default: false
    },
    submitted: {
      type: Boolean,
      default: false
    },
    documentId: String
  },
  { _id: false }
);

/**
 * InsuranceClaim Schema (Section 7)
 */
const insuranceClaimSchema = new mongoose.Schema(
  {
    claimId: {
      type: String,
      required: true,
      unique: true,
      index: true
    },
    claimNumber: {
      type: String,
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
    policyNumber: {
      type: String,
      required: true,
      index: true
    },
    memberId: {
      type: String,
      default: ''
    },
    insurerName: {
      type: String,
      required: true,
      index: true
    },
    providerName: {
      type: String // Backward compatibility with legacy code
    },
    providerCode: {
      type: String,
      default: 'GENERIC_INSURER'
    },
    verificationId: {
      type: String,
      index: true
    },
    verificationRef: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'InsuranceVerification'
    },
    admissionId: {
      type: String,
      index: true
    },
    admissionRef: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Admission'
    },
    visitId: {
      type: String,
      index: true
    },
    visitRef: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Visit'
    },
    dischargeId: {
      type: String,
      index: true
    },
    dischargeRef: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Discharge'
    },
    invoiceId: {
      type: String,
      required: true,
      index: true
    },
    invoiceRef: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Invoice'
    },
    claimType: {
      type: String,
      enum: ['INPATIENT', 'OUTPATIENT', 'EMERGENCY', 'DAYCARE', 'SURGICAL', 'PHARMACY', 'OTHER'],
      default: 'INPATIENT',
      index: true
    },
    admissionDate: Date,
    dischargeDate: Date,
    totalClaimAmount: {
      type: Number,
      required: true,
      min: 0
    },
    claimAmount: {
      type: Number // Backward compatibility
    },
    approvedAmount: {
      type: Number,
      default: 0
    },
    rejectedAmount: {
      type: Number,
      default: 0
    },
    patientResponsibilityAmount: {
      type: Number,
      default: 0
    },
    settlementAmount: {
      type: Number,
      default: 0
    },
    settledAmount: {
      type: Number,
      default: 0 // Backward compatibility
    },
    currency: {
      type: String,
      default: 'INR'
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
      default: 'DRAFT',
      index: true
    },
    submissionSource: {
      type: String,
      enum: ['API', 'INSURER_PORTAL_RPA', 'MANUAL'],
      default: 'API'
    },
    insurerReferenceNumber: {
      type: String,
      index: true
    },
    insurerDecisionDate: Date,
    submittedAt: Date,
    submissionDate: {
      type: Date // Backward compatibility
    },
    lastStatusCheckedAt: Date,
    paidAt: Date,
    settlementDate: Date,
    cancellationReason: String,
    rejectionReason: String,
    queryReason: String,
    queryNotes: String,
    notes: String,
    rpaJobId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'RPAJob'
    },
    correlationId: String,
    submissionIdempotencyKey: {
      type: String,
      index: true
    },
    items: [claimItemSchema],
    documentChecklist: [documentChecklistItemSchema],
    documentIds: [String],
    rawInsurerResponse: {
      type: Object,
      default: {}
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

// Pre-save hook to synchronize legacy fields
insuranceClaimSchema.pre('save', function (next) {
  if (!this.claimNumber) {
    this.claimNumber = this.claimId;
  }
  if (!this.providerName) {
    this.providerName = this.insurerName;
  }
  if (this.totalClaimAmount !== undefined && this.claimAmount === undefined) {
    this.claimAmount = this.totalClaimAmount;
  } else if (this.claimAmount !== undefined && this.totalClaimAmount === undefined) {
    this.totalClaimAmount = this.claimAmount;
  }
  if (this.submittedAt && !this.submissionDate) {
    this.submissionDate = this.submittedAt;
  } else if (this.submissionDate && !this.submittedAt) {
    this.submittedAt = this.submissionDate;
  }
  if (this.settlementAmount !== undefined && this.settledAmount === undefined) {
    this.settledAmount = this.settlementAmount;
  }
  next();
});

// Compound indexes specified in Section 13
insuranceClaimSchema.index({ patientId: 1, createdAt: -1 });
insuranceClaimSchema.index({ patientId: 1, submissionDate: -1 });
insuranceClaimSchema.index({ status: 1, createdAt: -1 });
insuranceClaimSchema.index({ insurerName: 1, status: 1 });

module.exports = mongoose.model('InsuranceClaim', insuranceClaimSchema);
