const mongoose = require('mongoose');

const goodsReceiptItemSchema = new mongoose.Schema(
  {
    inventoryItemId: {
      type: String,
      required: true
    },
    itemName: {
      type: String,
      default: ''
    },
    orderedQuantity: {
      type: Number,
      required: true,
      min: 0
    },
    receivedQuantity: {
      type: Number,
      required: true,
      min: 0
    },
    acceptedQuantity: {
      type: Number,
      default: 0,
      min: 0
    },
    rejectedQuantity: {
      type: Number,
      default: 0,
      min: 0
    },
    batchNumber: {
      type: String,
      required: true,
      trim: true
    },
    lotNumber: {
      type: String,
      default: ''
    },
    manufacturingDate: {
      type: Date
    },
    expiryDate: {
      type: Date,
      required: true
    },
    unitCost: {
      type: Number,
      default: 0,
      min: 0
    },
    locationId: {
      type: String,
      default: 'LOC-MAIN-001'
    },
    inspectionStatus: {
      type: String,
      enum: ['PENDING', 'ACCEPTED', 'REJECTED', 'PARTIAL'],
      default: 'ACCEPTED'
    },
    rejectionReason: {
      type: String,
      default: ''
    }
  },
  { _id: false }
);

const goodsReceiptSchema = new mongoose.Schema(
  {
    goodsReceiptId: {
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
      default: ''
    },
    receivedDate: {
      type: Date,
      default: Date.now
    },
    receivedBy: {
      type: String,
      required: true
    },
    status: {
      type: String,
      enum: [
        'DRAFT',
        'PENDING_INSPECTION',
        'ACCEPTED',
        'PARTIALLY_ACCEPTED',
        'REJECTED',
        'POSTED'
      ],
      default: 'POSTED',
      index: true
    },
    items: [goodsReceiptItemSchema],
    documents: [
      {
        docType: { type: String, default: 'DELIVERY_CHALLAN' },
        docName: { type: String },
        fileUrl: { type: String }
      }
    ],
    notes: {
      type: String,
      default: ''
    }
  },
  {
    timestamps: true
  }
);

goodsReceiptSchema.index({ purchaseOrderId: 1, vendorId: 1 });

module.exports = mongoose.model('GoodsReceipt', goodsReceiptSchema);
