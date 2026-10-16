const mongoose = require('mongoose');

const vendorDocumentSchema = new mongoose.Schema(
  {
    vendorDocumentId: {
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
    documentType: {
      type: String,
      required: true,
      trim: true,
      index: true
    },
    documentNumber: {
      type: String,
      trim: true,
      default: ''
    },
    title: {
      type: String,
      trim: true,
      default: ''
    },
    issueDate: {
      type: Date,
      default: null
    },
    expiryDate: {
      type: Date,
      default: null,
      index: true
    },
    issuer: {
      type: String,
      trim: true,
      default: ''
    },
    fileReference: {
      type: String,
      default: ''
    },
    fileName: {
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
    status: {
      type: String,
      enum: [
        'UPLOADED',
        'UNDER_REVIEW',
        'VERIFIED',
        'REJECTED',
        'EXPIRED',
        'REPLACED',
        'CANCELLED'
      ],
      default: 'UPLOADED',
      index: true
    },
    verificationStatus: {
      type: String,
      enum: ['NOT_VERIFIED', 'VERIFIED', 'REJECTED'],
      default: 'NOT_VERIFIED',
      index: true
    },
    uploadedBy: {
      type: String,
      default: 'SYSTEM'
    },
    verifiedBy: {
      type: String,
      default: null
    },
    verifiedAt: {
      type: Date,
      default: null
    },
    rejectionReason: {
      type: String,
      default: null
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

vendorDocumentSchema.index({ vendorId: 1, documentType: 1 });
vendorDocumentSchema.index({ vendorId: 1, expiryDate: 1 });
vendorDocumentSchema.index({ vendorId: 1, status: 1 });

module.exports = mongoose.model('VendorDocument', vendorDocumentSchema);
