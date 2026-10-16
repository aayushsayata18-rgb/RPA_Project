const mongoose = require('mongoose');

const vendorPaymentProfileSchema = new mongoose.Schema(
  {
    profileId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true
    },
    vendorId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true
    },
    accountName: {
      type: String,
      required: true,
      trim: true
    },
    bankName: {
      type: String,
      required: true,
      trim: true
    },
    branchName: {
      type: String,
      trim: true,
      default: ''
    },
    ifscCode: {
      type: String,
      trim: true,
      uppercase: true,
      default: ''
    },
    maskedAccountNumber: {
      type: String,
      required: true,
      trim: true // Sensitive: only store masked representation e.g. "XXXXXXXX4521"
    },
    accountReference: {
      type: String,
      trim: true,
      default: ''
    },
    verificationStatus: {
      type: String,
      enum: ['UNVERIFIED', 'PENDING_VERIFICATION', 'VERIFIED', 'REJECTED'],
      default: 'PENDING_VERIFICATION',
      index: true
    },
    verifiedBy: {
      type: String,
      default: null
    },
    verifiedAt: {
      type: Date,
      default: null
    },
    isRestricted: {
      type: Boolean,
      default: true
    },
    createdBy: {
      type: String,
      default: 'FINANCE'
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model('VendorPaymentProfile', vendorPaymentProfileSchema);
