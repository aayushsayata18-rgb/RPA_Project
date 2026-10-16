const mongoose = require('mongoose');

const vendorAddressSchema = new mongoose.Schema(
  {
    addressId: {
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
    addressType: {
      type: String,
      enum: ['REGISTERED', 'BILLING', 'SHIPPING', 'WAREHOUSE', 'OFFICE', 'OTHER'],
      default: 'REGISTERED',
      index: true
    },
    line1: {
      type: String,
      required: true,
      trim: true
    },
    line2: {
      type: String,
      trim: true,
      default: ''
    },
    city: {
      type: String,
      required: true,
      trim: true
    },
    state: {
      type: String,
      required: true,
      trim: true
    },
    country: {
      type: String,
      required: true,
      trim: true,
      default: 'India'
    },
    postalCode: {
      type: String,
      required: true,
      trim: true
    },
    isPrimary: {
      type: Boolean,
      default: false
    },
    status: {
      type: String,
      enum: ['ACTIVE', 'INACTIVE'],
      default: 'ACTIVE',
      index: true
    }
  },
  {
    timestamps: true
  }
);

vendorAddressSchema.index({ vendorId: 1, addressType: 1 });

module.exports = mongoose.model('VendorAddress', vendorAddressSchema);
