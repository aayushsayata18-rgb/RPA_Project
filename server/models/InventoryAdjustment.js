const mongoose = require('mongoose');

const inventoryAdjustmentSchema = new mongoose.Schema(
  {
    adjustmentId: {
      type: String,
      required: true,
      unique: true,
      index: true
    },
    inventoryItemId: {
      type: String,
      required: true,
      index: true
    },
    itemName: {
      type: String,
      default: ''
    },
    batchId: {
      type: String,
      required: true,
      index: true
    },
    batchNumber: {
      type: String,
      default: ''
    },
    locationId: {
      type: String,
      required: true,
      index: true
    },
    systemQuantity: {
      type: Number,
      required: true
    },
    physicalQuantity: {
      type: Number,
      required: true
    },
    difference: {
      type: Number,
      required: true // physicalQuantity - systemQuantity (+ or -)
    },
    reason: {
      type: String,
      required: true,
      enum: [
        'PHYSICAL_COUNT_DIFFERENCE',
        'DAMAGED_GOODS',
        'EXPIRED_GOODS',
        'DATA_CORRECTION',
        'LOST_ITEM',
        'FOUND_ITEM',
        'BREAKAGE',
        'SUPPLIER_SHORTAGE',
        'OTHER'
      ],
      default: 'PHYSICAL_COUNT_DIFFERENCE'
    },
    notes: {
      type: String,
      default: ''
    },
    supportingDocument: {
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
    status: {
      type: String,
      enum: [
        'DRAFT',
        'PENDING_APPROVAL',
        'APPROVED',
        'REJECTED',
        'PROCESSED',
        'CANCELLED'
      ],
      default: 'PENDING_APPROVAL',
      index: true
    },
    processedAt: {
      type: Date,
      default: null
    }
  },
  {
    timestamps: true
  }
);

inventoryAdjustmentSchema.index({ inventoryItemId: 1, locationId: 1, status: 1 });

module.exports = mongoose.model('InventoryAdjustment', inventoryAdjustmentSchema);
