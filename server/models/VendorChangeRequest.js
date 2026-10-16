const mongoose = require('mongoose');

const vendorChangeRequestSchema = new mongoose.Schema(
  {
    changeRequestId: {
      type: String,
      required: true,
      unique: true,
      index: true
    },
    changeType: {
      type: String,
      enum: ['PURCHASE_ORDER', 'PROFILE_UPDATE', 'BANK_DETAILS', 'CONTACT_UPDATE', 'ADDRESS_UPDATE', 'DOCUMENT_UPDATE', 'OTHER'],
      default: 'PROFILE_UPDATE',
      index: true
    },
    purchaseOrderId: {
      type: String,
      default: null,
      index: true
    },
    vendorId: {
      type: String,
      required: true,
      index: true
    },
    vendorName: {
      type: String,
      default: ''
    },
    requestedBy: {
      type: String,
      default: 'VENDOR_USER'
    },
    proposedChanges: [
      {
        field: { type: String, required: true },
        currentValue: { type: mongoose.Schema.Types.Mixed },
        proposedValue: { type: mongoose.Schema.Types.Mixed },
        justification: { type: String, default: '' }
      }
    ],
    before: {
      type: mongoose.Schema.Types.Mixed,
      default: {}
    },
    after: {
      type: mongoose.Schema.Types.Mixed,
      default: {}
    },
    reason: {
      type: String,
      required: true
    },
    documents: [
      {
        type: String
      }
    ],
    status: {
      type: String,
      enum: ['PENDING', 'ACCEPTED', 'REJECTED', 'DRAFT', 'SUBMITTED', 'UNDER_REVIEW', 'APPROVED', 'CANCELLED'],
      default: 'PENDING',
      index: true
    },
    reviewedBy: {
      type: String,
      default: null
    },
    reviewedAt: {
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

module.exports = mongoose.model('VendorChangeRequest', vendorChangeRequestSchema);
