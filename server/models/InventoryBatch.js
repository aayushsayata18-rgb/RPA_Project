const mongoose = require('mongoose');

const inventoryBatchSchema = new mongoose.Schema(
  {
    batchId: {
      type: String,
      required: true,
      unique: true,
      index: true
    },
    medicineId: {
      type: String,
      required: true,
      index: true
    },
    medicineName: {
      type: String,
      required: true
    },
    lotNumber: {
      type: String,
      default: ''
    },
    initialQuantity: {
      type: Number,
      required: true,
      min: 0
    },
    availableQuantity: {
      type: Number,
      required: true,
      min: 0
    },
    reservedQuantity: {
      type: Number,
      default: 0,
      min: 0
    },
    expiryDate: {
      type: Date,
      required: true,
      index: true
    },
    manufacturingDate: {
      type: Date
    },
    unitCost: {
      type: Number,
      default: 0
    },
    unitPrice: {
      type: Number,
      default: 0
    },
    supplier: {
      type: String,
      default: ''
    },
    storageLocation: {
      type: String,
      default: 'Main Pharmacy Store - Rack A1'
    },
    status: {
      type: String,
      enum: ['ACTIVE', 'DEPLETED', 'QUARANTINED', 'EXPIRED', 'RECALLED'],
      default: 'ACTIVE',
      index: true
    }
  },
  {
    timestamps: true
  }
);

inventoryBatchSchema.index({ medicineId: 1, expiryDate: 1, status: 1 });
inventoryBatchSchema.index({ availableQuantity: 1, expiryDate: 1 });

module.exports = mongoose.model('InventoryBatch', inventoryBatchSchema);
