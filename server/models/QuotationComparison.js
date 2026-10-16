const mongoose = require('mongoose');

const vendorComparisonEntrySchema = new mongoose.Schema(
  {
    vendorId: {
      type: String,
      required: true
    },
    vendorName: {
      type: String,
      required: true
    },
    quotationId: {
      type: String,
      required: true
    },
    grandTotal: {
      type: Number,
      required: true
    },
    deliveryDays: {
      type: Number,
      default: 0
    },
    warrantyPeriod: {
      type: String,
      default: ''
    },
    paymentTerms: {
      type: String,
      default: ''
    },
    complianceScore: {
      type: Number,
      default: 100 // 0 - 100%
    },
    priceScore: {
      type: Number,
      default: 0 // Calculated objective score
    },
    deliveryScore: {
      type: Number,
      default: 0
    },
    overallScore: {
      type: Number,
      default: 0
    },
    isCompliant: {
      type: Boolean,
      default: true
    },
    notes: {
      type: String,
      default: ''
    }
  },
  { _id: false }
);

const quotationComparisonSchema = new mongoose.Schema(
  {
    comparisonId: {
      type: String,
      required: true,
      unique: true,
      index: true
    },
    rfqId: {
      type: String,
      required: true,
      index: true
    },
    title: {
      type: String,
      required: true
    },
    purchaseRequestIds: [
      {
        type: String,
        index: true
      }
    ],
    quotationIds: [
      {
        type: String,
        required: true
      }
    ],
    comparisonMatrix: [vendorComparisonEntrySchema],
    recommendedVendorId: {
      type: String,
      default: null
    },
    recommendedQuotationId: {
      type: String,
      default: null
    },
    recommendationReason: {
      type: String,
      default: ''
    },
    // Human Vendor Selection (Section 32 & 33)
    selectedVendorId: {
      type: String,
      default: null
    },
    selectedQuotationId: {
      type: String,
      default: null
    },
    selectionReason: {
      type: String,
      default: '' // Mandatory when vendor is selected
    },
    selectedBy: {
      type: String,
      default: null
    },
    selectedAt: {
      type: Date,
      default: null
    },
    approvalStatus: {
      type: String,
      enum: ['DRAFT', 'RECOMMENDED', 'APPROVED', 'REJECTED'],
      default: 'DRAFT',
      index: true
    },
    approvedBy: {
      type: String,
      default: null
    },
    approvedAt: {
      type: Date,
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

quotationComparisonSchema.index({ rfqId: 1, approvalStatus: 1 });

module.exports = mongoose.model('QuotationComparison', quotationComparisonSchema);
