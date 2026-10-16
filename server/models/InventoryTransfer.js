const mongoose = require('mongoose');

const transferItemSchema = new mongoose.Schema(
  {
    inventoryItemId: {
      type: String,
      required: true
    },
    itemName: {
      type: String,
      default: ''
    },
    batchId: {
      type: String,
      required: true
    },
    batchNumber: {
      type: String,
      default: ''
    },
    requestedQuantity: {
      type: Number,
      required: true,
      min: 1
    },
    dispatchedQuantity: {
      type: Number,
      default: 0
    },
    receivedQuantity: {
      type: Number,
      default: 0
    },
    difference: {
      type: Number,
      default: 0
    },
    status: {
      type: String,
      enum: ['PENDING', 'DISPATCHED', 'MATCHED', 'MISMATCH'],
      default: 'PENDING'
    }
  },
  { _id: false }
);

const inventoryTransferSchema = new mongoose.Schema(
  {
    transferId: {
      type: String,
      required: true,
      unique: true,
      index: true
    },
    sourceLocationId: {
      type: String,
      required: true,
      index: true
    },
    destinationLocationId: {
      type: String,
      required: true,
      index: true
    },
    items: [transferItemSchema],
    reason: {
      type: String,
      default: 'Department Restocking'
    },
    notes: {
      type: String,
      default: ''
    },
    requestedBy: {
      type: String,
      required: true
    },
    approvedBy: {
      type: String,
      default: null
    },
    issuedBy: {
      type: String,
      default: null
    },
    receivedBy: {
      type: String,
      default: null
    },
    status: {
      type: String,
      enum: [
        'REQUESTED',
        'APPROVED',
        'PICKING',
        'DISPATCHED',
        'PARTIALLY_RECEIVED',
        'RECEIVED',
        'REJECTED',
        'CANCELLED'
      ],
      default: 'REQUESTED',
      index: true
    },
    hasMismatch: {
      type: Boolean,
      default: false,
      index: true
    },
    requestedAt: {
      type: Date,
      default: Date.now
    },
    approvedAt: {
      type: Date,
      default: null
    },
    dispatchedAt: {
      type: Date,
      default: null
    },
    receivedAt: {
      type: Date,
      default: null
    }
  },
  {
    timestamps: true
  }
);

inventoryTransferSchema.index({ sourceLocationId: 1, destinationLocationId: 1, status: 1 });

module.exports = mongoose.model('InventoryTransfer', inventoryTransferSchema);
