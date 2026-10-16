const mongoose = require('mongoose');

const vendorContactSchema = new mongoose.Schema(
  {
    vendorContactId: {
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
    name: {
      type: String,
      required: true,
      trim: true
    },
    designation: {
      type: String,
      trim: true,
      default: ''
    },
    department: {
      type: String,
      trim: true,
      default: ''
    },
    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      index: true
    },
    phone: {
      type: String,
      required: true,
      trim: true
    },
    alternatePhone: {
      type: String,
      trim: true,
      default: ''
    },
    contactType: {
      type: String,
      enum: [
        'SALES',
        'SUPPORT',
        'ACCOUNTS',
        'LOGISTICS',
        'TECHNICAL',
        'MANAGEMENT',
        'PRIMARY',
        'OTHER'
      ],
      default: 'PRIMARY',
      index: true
    },
    isPrimary: {
      type: Boolean,
      default: false,
      index: true
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

vendorContactSchema.index({ vendorId: 1, email: 1 });
vendorContactSchema.index({ vendorId: 1, isPrimary: 1 });

module.exports = mongoose.model('VendorContact', vendorContactSchema);
