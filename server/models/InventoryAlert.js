const mongoose = require('mongoose');

const inventoryAlertSchema = new mongoose.Schema(
  {
    alertId: {
      type: String,
      required: true,
      unique: true,
      index: true
    },
    inventoryItemId: {
      type: String,
      default: null,
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
    locationId: {
      type: String,
      default: null,
      index: true
    },
    alertType: {
      type: String,
      required: true,
      enum: [
        'LOW_STOCK',
        'NEAR_EXPIRY',
        'EXPIRED',
        'NEGATIVE_STOCK_ATTEMPT',
        'STOCK_MISMATCH',
        'TRANSFER_MISMATCH',
        'UNKNOWN_BATCH',
        'UNKNOWN_ITEM',
        'RECONCILIATION_FAILURE',
        'RPA_FAILURE'
      ],
      index: true
    },
    severity: {
      type: String,
      enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'],
      default: 'MEDIUM',
      index: true
    },
    message: {
      type: String,
      required: true
    },
    thresholdValue: {
      type: Number,
      default: null
    },
    currentValue: {
      type: Number,
      default: null
    },
    status: {
      type: String,
      enum: ['OPEN', 'ACKNOWLEDGED', 'IN_PROGRESS', 'RESOLVED', 'DISMISSED'],
      default: 'OPEN',
      index: true
    },
    acknowledgedBy: {
      type: String,
      default: null
    },
    resolvedBy: {
      type: String,
      default: null
    },
    resolvedAt: {
      type: Date,
      default: null
    }
  },
  {
    timestamps: true
  }
);

inventoryAlertSchema.index({ alertType: 1, status: 1 });
inventoryAlertSchema.index({ severity: 1, status: 1 });

module.exports = mongoose.model('InventoryAlert', inventoryAlertSchema);
