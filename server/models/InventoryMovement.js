const mongoose = require('mongoose');

const inventoryMovementSchema = new mongoose.Schema(
  {
    movementId: {
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
      default: null,
      index: true
    },
    batchNumber: {
      type: String,
      default: ''
    },
    sourceLocationId: {
      type: String,
      default: null,
      index: true
    },
    destinationLocationId: {
      type: String,
      default: null,
      index: true
    },
    movementType: {
      type: String,
      required: true,
      enum: [
        'RECEIPT',
        'ISSUE',
        'RESERVATION',
        'RELEASE_RESERVATION',
        'TRANSFER_OUT',
        'TRANSFER_IN',
        'RETURN',
        'ADJUSTMENT_IN',
        'ADJUSTMENT_OUT',
        'DAMAGE',
        'EXPIRY',
        'QUARANTINE',
        'UNQUARANTINE',
        'DISPOSAL',
        'CONSUMPTION'
      ],
      index: true
    },
    quantity: {
      type: Number,
      required: true
    },
    unit: {
      type: String,
      default: 'UNIT'
    },
    referenceType: {
      type: String,
      enum: [
        'PURCHASE_ORDER',
        'GOODS_RECEIPT',
        'PHARMACY_ORDER',
        'PRESCRIPTION',
        'TRANSFER',
        'ADJUSTMENT',
        'STOCK_COUNT',
        'DEPARTMENT_ISSUE',
        'WARD_ISSUE',
        'SURGERY',
        'LAB_PROCEDURE',
        'RADIOLOGY_PROCEDURE',
        'RETURN',
        'DISPOSAL',
        'MANUAL',
        'OTHER'
      ],
      default: 'MANUAL',
      index: true
    },
    referenceId: {
      type: String,
      default: '',
      index: true
    },
    reason: {
      type: String,
      default: ''
    },
    performedBy: {
      type: String,
      default: 'SYSTEM'
    },
    approvedBy: {
      type: String,
      default: null
    },
    correlationId: {
      type: String,
      default: ''
    },
    timestamp: {
      type: Date,
      default: Date.now,
      index: true
    }
  },
  {
    timestamps: true
  }
);

inventoryMovementSchema.index({ inventoryItemId: 1, timestamp: -1 });
inventoryMovementSchema.index({ movementType: 1, timestamp: -1 });
inventoryMovementSchema.index({ batchId: 1, timestamp: -1 });

module.exports = mongoose.model('InventoryMovement', inventoryMovementSchema);
