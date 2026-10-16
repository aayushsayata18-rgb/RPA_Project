const mongoose = require('mongoose');

const rfqItemSchema = new mongoose.Schema(
  {
    rfqItemId: {
      type: String,
      required: true
    },
    inventoryItemId: {
      type: String,
      required: true,
      index: true
    },
    description: {
      type: String,
      required: true
    },
    quantity: {
      type: Number,
      required: true,
      min: 1
    },
    unit: {
      type: String,
      required: true,
      default: 'UNIT'
    },
    specification: {
      type: String,
      default: ''
    },
    requiredDeliveryDate: {
      type: Date
    }
  },
  { _id: false }
);

const rfqSchema = new mongoose.Schema(
  {
    rfqId: {
      type: String,
      required: true,
      unique: true,
      index: true
    },
    title: {
      type: String,
      required: true
    },
    purchaseRequestIds: [
      {
        type: String,
        required: true,
        index: true
      }
    ],
    vendorIds: [
      {
        type: String,
        required: true,
        index: true
      }
    ],
    items: [rfqItemSchema],
    issueDate: {
      type: Date,
      default: null
    },
    responseDeadline: {
      type: Date,
      required: true,
      index: true
    },
    status: {
      type: String,
      enum: ['DRAFT', 'ISSUED', 'PARTIALLY_RESPONDED', 'RESPONDED', 'CLOSED', 'CANCELLED'],
      default: 'DRAFT',
      index: true
    },
    termsAndConditions: {
      type: String,
      default: 'Standard hospital procurement terms apply.'
    },
    notes: {
      type: String,
      default: ''
    },
    createdBy: {
      type: String,
      required: true
    },
    issuedBy: {
      type: String,
      default: null
    },
    closedBy: {
      type: String,
      default: null
    },
    closedAt: {
      type: Date,
      default: null
    }
  },
  {
    timestamps: true
  }
);

rfqSchema.index({ status: 1, responseDeadline: 1 });

module.exports = mongoose.model('RFQ', rfqSchema);
