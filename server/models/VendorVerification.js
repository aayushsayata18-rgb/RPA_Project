const mongoose = require('mongoose');

const vendorVerificationSchema = new mongoose.Schema(
  {
    verificationId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true
    },
    vendorId: {
      type: String,
      required: true,
      trim: true,
      index: true
    },
    verificationType: {
      type: String,
      enum: [
        'IDENTITY',
        'BUSINESS_REGISTRATION',
        'TAX',
        'LICENSE',
        'BANK',
        'ADDRESS',
        'COMPLIANCE',
        'PRODUCT_AUTHORIZATION',
        'CONTRACT',
        'OTHER'
      ],
      default: 'IDENTITY',
      index: true
    },
    requestedAt: {
      type: Date,
      default: Date.now
    },
    startedAt: {
      type: Date,
      default: null
    },
    completedAt: {
      type: Date,
      default: null
    },
    status: {
      type: String,
      enum: [
        'NOT_STARTED',
        'IN_PROGRESS',
        'PASSED',
        'FAILED',
        'PARTIAL',
        'PENDING_HUMAN_REVIEW',
        'EXPIRED'
      ],
      default: 'NOT_STARTED',
      index: true
    },
    result: {
      type: String,
      default: ''
    },
    verifiedBy: {
      type: String,
      default: null
    },
    evidence: [
      {
        type: { type: String, default: 'DOCUMENT' },
        source: { type: String, default: 'INTERNAL' },
        referenceId: { type: String, default: '' },
        capturedAt: { type: Date, default: Date.now },
        notes: { type: String, default: '' },
        data: { type: mongoose.Schema.Types.Mixed }
      }
    ],
    notes: {
      type: String,
      default: ''
    }
  },
  {
    timestamps: true
  }
);

vendorVerificationSchema.index({ vendorId: 1, status: 1 });
vendorVerificationSchema.index({ vendorId: 1, verificationType: 1 });

module.exports = mongoose.model('VendorVerification', vendorVerificationSchema);
