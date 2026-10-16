const mongoose = require('mongoose');

const vendorContractSchema = new mongoose.Schema(
  {
    contractId: {
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
    contractNumber: {
      type: String,
      required: true,
      trim: true,
      index: true
    },
    title: {
      type: String,
      required: true,
      trim: true
    },
    contractType: {
      type: String,
      enum: [
        'SUPPLY',
        'SERVICE',
        'MAINTENANCE',
        'EQUIPMENT',
        'FRAMEWORK',
        'RATE_CONTRACT',
        'OTHER'
      ],
      default: 'SUPPLY',
      index: true
    },
    startDate: {
      type: Date,
      required: true
    },
    endDate: {
      type: Date,
      required: true,
      index: true
    },
    status: {
      type: String,
      enum: [
        'DRAFT',
        'PENDING_APPROVAL',
        'ACTIVE',
        'EXPIRING',
        'EXPIRED',
        'SUSPENDED',
        'TERMINATED',
        'RENEWAL_PENDING'
      ],
      default: 'DRAFT',
      index: true
    },
    scope: {
      type: String,
      default: ''
    },
    value: {
      type: Number,
      default: 0
    },
    currency: {
      type: String,
      default: 'INR'
    },
    renewalType: {
      type: String,
      enum: ['MANUAL', 'AUTO_RENEWABLE', 'FIXED_TERM', 'NON_RENEWABLE'],
      default: 'MANUAL'
    },
    renewalNoticeDays: {
      type: Number,
      default: 30
    },
    documents: [
      {
        type: String
      }
    ],
    terms: {
      type: String,
      default: ''
    },
    approvedBy: {
      type: String,
      default: null
    },
    approvedAt: {
      type: Date,
      default: null
    },
    createdBy: {
      type: String,
      default: 'SYSTEM'
    },
    terminationReason: {
      type: String,
      default: null
    },
    terminatedAt: {
      type: Date,
      default: null
    },
    terminatedBy: {
      type: String,
      default: null
    }
  },
  {
    timestamps: true
  }
);

vendorContractSchema.index({ vendorId: 1, status: 1 });
vendorContractSchema.index({ vendorId: 1, endDate: 1 });

module.exports = mongoose.model('VendorContract', vendorContractSchema);
