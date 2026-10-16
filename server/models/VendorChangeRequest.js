const mongoose = require('mongoose');

const vendorChangeRequestSchema = new mongoose.Schema(
  {
    changeRequestId: {
      type: String,
      required: true,
      unique: true,
      index: true
    },
    purchaseOrderId: {
      type: String,
      required: true,
      index: true
    },
    vendorId: {
      type: String,
      required: true,
      index: true
    },
    vendorName: {
      type: String,
      required: true
    },
    proposedChanges: [
      {
        field: { type: String, required: true },
        currentValue: { type: mongoose.Schema.Types.Mixed },
        proposedValue: { type: mongoose.Schema.Types.Mixed },
        justification: { type: String, default: '' }
      }
    ],
    reason: {
      type: String,
      required: true
    },
    status: {
      type: String,
      enum: ['PENDING', 'ACCEPTED', 'REJECTED'],
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
