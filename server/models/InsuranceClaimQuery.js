const mongoose = require('mongoose');

/**
 * InsuranceClaimQuery Model (Section 11, 13 & 35)
 */
const insuranceClaimQuerySchema = new mongoose.Schema(
  {
    queryId: {
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
    queryReference: {
      type: String,
      default: ''
    },
    queryType: {
      type: String,
      enum: ['MISSING_DOCUMENT', 'CLARIFICATION', 'MEDICAL_NECESSITY', 'BILLING_BREAKDOWN', 'OTHER'],
      default: 'MISSING_DOCUMENT',
      index: true
    },
    queryText: {
      type: String,
      required: true
    },
    requestedDocuments: [
      {
        type: String
      }
    ],
    receivedAt: {
      type: Date,
      default: Date.now,
      index: true
    },
    dueDate: {
      type: Date,
      index: true
    },
    status: {
      type: String,
      enum: ['OPEN', 'IN_PROGRESS', 'RESPONSE_READY', 'SUBMITTED', 'RESOLVED', 'CANCELLED'],
      default: 'OPEN',
      index: true
    },
    responsibleDepartment: {
      type: String,
      enum: ['BILLING', 'MEDICAL_RECORDS', 'LABORATORY', 'RADIOLOGY', 'PHARMACY', 'ADMINISTRATION'],
      default: 'BILLING'
    },
    responseText: {
      type: String,
      default: ''
    },
    respondedDocuments: [
      {
        type: String
      }
    ],
    respondedBy: {
      type: String,
      default: ''
    },
    respondedAt: Date,
    insurerReference: {
      type: String,
      default: ''
    },
    notes: String
  },
  {
    timestamps: true
  }
);

insuranceClaimQuerySchema.index({ claimId: 1, status: 1 });
insuranceClaimQuerySchema.index({ status: 1, dueDate: 1 });

module.exports = mongoose.model('InsuranceClaimQuery', insuranceClaimQuerySchema);
