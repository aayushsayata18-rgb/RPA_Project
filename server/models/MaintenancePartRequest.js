const mongoose = require('mongoose');

const maintenancePartRequestSchema = new mongoose.Schema(
  {
    requestId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true
    },
    workOrderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'MaintenanceWorkOrder',
      required: true,
      index: true
    },
    inventoryItemId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'InventoryItem',
      index: true
    },
    partName: {
      type: String,
      required: true,
      trim: true
    },
    partNumber: {
      type: String,
      trim: true
    },
    quantityRequested: {
      type: Number,
      required: true,
      min: 1
    },
    quantityIssued: {
      type: Number,
      default: 0
    },
    unitCost: {
      type: Number,
      default: 0
    },
    totalCost: {
      type: Number,
      default: 0
    },
    status: {
      type: String,
      enum: [
        'REQUESTED',
        'PENDING',
        'PENDING_APPROVAL',
        'APPROVED',
        'REJECTED',
        'PARTIALLY_ISSUED',
        'ISSUED',
        'RETURNED',
        'CANCELLED'
      ],
      default: 'REQUESTED',
      index: true
    },
    requestedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    approvedAt: {
      type: Date
    },
    issuedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    issuedAt: {
      type: Date
    },
    notes: {
      type: String
    },
    sourceModule: {
      type: String,
      default: 'MAINTENANCE'
    },
    purchaseRequestId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'PurchaseRequest'
    },
    idempotencyKey: {
      type: String,
      trim: true,
      index: true
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model('MaintenancePartRequest', maintenancePartRequestSchema);
