const mongoose = require('mongoose');

const inventoryBatchSchema = new mongoose.Schema(
  {
    batchId: {
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
    medicineId: {
      type: String,
      default: null,
      index: true
    },
    medicineName: {
      type: String,
      default: ''
    },
    itemName: {
      type: String,
      default: ''
    },
    batchNumber: {
      type: String,
      required: true,
      trim: true,
      index: true
    },
    lotNumber: {
      type: String,
      default: ''
    },
    manufacturer: {
      type: String,
      default: ''
    },
    manufacturingDate: {
      type: Date
    },
    expiryDate: {
      type: Date,
      required: true,
      index: true
    },
    receivedDate: {
      type: Date,
      default: Date.now
    },
    purchaseOrderId: {
      type: String,
      default: null,
      index: true
    },
    goodsReceiptId: {
      type: String,
      default: null,
      index: true
    },
    supplierId: {
      type: String,
      default: null
    },
    supplier: {
      type: String,
      default: ''
    },
    locationId: {
      type: String,
      default: 'LOC-MAIN-001',
      index: true
    },
    storageLocation: {
      type: String,
      default: 'Main Store - Rack A1'
    },
    unitCost: {
      type: Number,
      default: 0,
      min: 0
    },
    unitPrice: {
      type: Number,
      default: 0,
      min: 0
    },
    sellingPrice: {
      type: Number,
      default: 0,
      min: 0
    },
    initialQuantity: {
      type: Number,
      default: 0,
      min: 0
    },
    receivedQuantity: {
      type: Number,
      default: 0,
      min: 0
    },
    onHandQuantity: {
      type: Number,
      default: 0,
      min: 0
    },
    availableQuantity: {
      type: Number,
      required: true,
      default: 0,
      min: 0
    },
    reservedQuantity: {
      type: Number,
      default: 0,
      min: 0
    },
    quarantinedQuantity: {
      type: Number,
      default: 0,
      min: 0
    },
    damagedQuantity: {
      type: Number,
      default: 0,
      min: 0
    },
    expiredQuantity: {
      type: Number,
      default: 0,
      min: 0
    },
    status: {
      type: String,
      enum: [
        'RECEIVED',
        'AVAILABLE',
        'ACTIVE',
        'RESERVED',
        'PARTIALLY_RESERVED',
        'QUARANTINED',
        'EXPIRED',
        'DAMAGED',
        'DEPLETED',
        'BLOCKED',
        'RECALLED'
      ],
      default: 'AVAILABLE',
      index: true
    }
  },
  {
    timestamps: true
  }
);

inventoryBatchSchema.pre('validate', function(next) {
  if (!this.batchNumber) {
    this.batchNumber = this.lotNumber || this.batchId || `BAT-${Date.now()}`;
  }
  if (!this.inventoryItemId && this.medicineId) {
    this.inventoryItemId = this.medicineId;
  }
  next();
});

inventoryBatchSchema.index({ inventoryItemId: 1, locationId: 1, expiryDate: 1 });
inventoryBatchSchema.index({ medicineId: 1, expiryDate: 1, status: 1 });
inventoryBatchSchema.index({ availableQuantity: 1, expiryDate: 1 });
inventoryBatchSchema.index({ batchNumber: 1, inventoryItemId: 1 });

module.exports = mongoose.model('InventoryBatch', inventoryBatchSchema);
