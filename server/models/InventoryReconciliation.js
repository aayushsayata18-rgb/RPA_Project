const mongoose = require('mongoose');

const reconciliationResultSchema = new mongoose.Schema(
  {
    inventoryItemId: {
      type: String,
      default: ''
    },
    itemName: {
      type: String,
      default: ''
    },
    batchId: {
      type: String,
      default: ''
    },
    batchNumber: {
      type: String,
      default: ''
    },
    systemQuantity: {
      type: Number,
      default: 0
    },
    externalQuantity: {
      type: Number,
      default: 0
    },
    difference: {
      type: Number,
      default: 0
    },
    status: {
      type: String,
      enum: [
        'MATCHED',
        'MISMATCH',
        'UNKNOWN_ITEM',
        'UNKNOWN_BATCH',
        'MISSING_EXTERNAL',
        'MISSING_INTERNAL',
        'PENDING_REVIEW',
        'RESOLVED'
      ],
      default: 'PENDING_REVIEW'
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
    }
  },
  { _id: false }
);

const inventoryReconciliationSchema = new mongoose.Schema(
  {
    reconciliationId: {
      type: String,
      required: true,
      unique: true,
      index: true
    },
    source: {
      type: String,
      required: true,
      enum: [
        'EXTERNAL_ERP',
        'LEGACY_PHARMACY',
        'SUPPLIER_REPORT',
        'PHYSICAL_COUNT',
        'MANUAL_IMPORT'
      ],
      default: 'EXTERNAL_ERP',
      index: true
    },
    locationId: {
      type: String,
      required: true,
      index: true
    },
    startedAt: {
      type: Date,
      default: Date.now
    },
    completedAt: {
      type: Date,
      default: null
    },
    status: {
      type: String,
      enum: ['PENDING_REVIEW', 'MATCHED', 'MISMATCH', 'RESOLVED'],
      default: 'PENDING_REVIEW',
      index: true
    },
    totalItems: {
      type: Number,
      default: 0
    },
    matchedItems: {
      type: Number,
      default: 0
    },
    mismatchedItems: {
      type: Number,
      default: 0
    },
    unknownItems: {
      type: Number,
      default: 0
    },
    results: [reconciliationResultSchema],
    createdBy: {
      type: String,
      required: true
    }
  },
  {
    timestamps: true
  }
);

inventoryReconciliationSchema.index({ locationId: 1, status: 1 });

module.exports = mongoose.model('InventoryReconciliation', inventoryReconciliationSchema);
