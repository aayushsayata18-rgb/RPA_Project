const mongoose = require('mongoose');

const vendorIssueSchema = new mongoose.Schema(
  {
    issueId: {
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
    purchaseOrderId: {
      type: String,
      default: null,
      index: true
    },
    deliveryId: {
      type: String,
      default: null,
      index: true
    },
    category: {
      type: String,
      enum: [
        'Late Delivery',
        'Wrong Quantity',
        'Damaged Goods',
        'Quality Concern',
        'Documentation Issue',
        'Invoice Issue',
        'Communication Issue',
        'Contract Issue',
        'Other'
      ],
      default: 'Late Delivery',
      index: true
    },
    severity: {
      type: String,
      enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'],
      default: 'MEDIUM',
      index: true
    },
    title: {
      type: String,
      default: ''
    },
    description: {
      type: String,
      required: true
    },
    reportedBy: {
      type: String,
      required: true
    },
    assignedTo: {
      type: String,
      default: null
    },
    status: {
      type: String,
      enum: [
        'OPEN',
        'UNDER_REVIEW',
        'VENDOR_RESPONSE_REQUIRED',
        'IN_PROGRESS',
        'RESOLVED',
        'CLOSED',
        'REJECTED'
      ],
      default: 'OPEN',
      index: true
    },
    vendorResponse: {
      response: { type: String, default: '' },
      respondedAt: { type: Date, default: null },
      respondedBy: { type: String, default: null },
      attachments: [{ type: String }]
    },
    resolution: {
      type: String,
      default: ''
    },
    resolvedBy: {
      type: String,
      default: null
    },
    resolvedAt: {
      type: Date,
      default: null
    },
    resolutionNotes: {
      type: String,
      default: ''
    }
  },
  {
    timestamps: true
  }
);

vendorIssueSchema.index({ vendorId: 1, status: 1 });
vendorIssueSchema.index({ vendorId: 1, severity: 1 });

module.exports = mongoose.model('VendorIssue', vendorIssueSchema);
