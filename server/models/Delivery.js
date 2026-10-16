const mongoose = require('mongoose');

const deliveryItemSchema = new mongoose.Schema(
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
      required: true
    },
    shippedQuantity: {
      type: Number,
      required: true,
      min: 0
    },
    receivedQuantity: {
      type: Number,
      default: 0,
      min: 0
    }
  },
  { _id: false }
);

const deliverySchema = new mongoose.Schema(
  {
    deliveryId: {
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
    expectedDate: {
      type: Date,
      required: true,
      index: true
    },
    actualDate: {
      type: Date,
      default: null
    },
    shipmentReference: {
      type: String,
      default: ''
    },
    carrier: {
      type: String,
      default: ''
    },
    trackingNumber: {
      type: String,
      default: ''
    },
    items: [deliveryItemSchema],
    documents: [
      {
        docType: { type: String, default: 'DELIVERY_NOTE' },
        docName: { type: String },
        fileUrl: { type: String }
      }
    ],
    status: {
      type: String,
      enum: [
        'EXPECTED',
        'SHIPPED',
        'IN_TRANSIT',
        'DELIVERED',
        'PARTIALLY_DELIVERED',
        'DELAYED',
        'CANCELLED'
      ],
      default: 'EXPECTED',
      index: true
    },
    delayDays: {
      type: Number,
      default: 0
    },
    goodsReceiptId: {
      type: String,
      default: null,
      index: true
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

deliverySchema.index({ purchaseOrderId: 1, status: 1 });
deliverySchema.index({ vendorId: 1, status: 1 });

module.exports = mongoose.model('Delivery', deliverySchema);
