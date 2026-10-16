const mongoose = require('mongoose');

const inventoryReservationSchema = new mongoose.Schema(
  {
    reservationId: {
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
    locationId: {
      type: String,
      default: 'LOC-MAIN-001',
      index: true
    },
    quantity: {
      type: Number,
      required: true,
      min: 1
    },
    consumedQuantity: {
      type: Number,
      default: 0,
      min: 0
    },
    reservedForType: {
      type: String,
      enum: [
        'PHARMACY_ORDER',
        'WARD_ISSUE',
        'SURGERY',
        'LAB_PROCEDURE',
        'RADIOLOGY_PROCEDURE',
        'TRANSFER',
        'OTHER'
      ],
      required: true,
      index: true
    },
    reservedForId: {
      type: String,
      required: true,
      index: true
    },
    status: {
      type: String,
      enum: [
        'ACTIVE',
        'PARTIALLY_CONSUMED',
        'CONSUMED',
        'RELEASED',
        'EXPIRED',
        'CANCELLED'
      ],
      default: 'ACTIVE',
      index: true
    },
    reservedAt: {
      type: Date,
      default: Date.now
    },
    expiresAt: {
      type: Date,
      default: () => new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours default
    },
    releasedAt: {
      type: Date,
      default: null
    },
    createdBy: {
      type: String,
      default: 'SYSTEM'
    }
  },
  {
    timestamps: true
  }
);

inventoryReservationSchema.index({ inventoryItemId: 1, status: 1 });
inventoryReservationSchema.index({ batchId: 1, status: 1 });
inventoryReservationSchema.index({ reservedForType: 1, reservedForId: 1 });

module.exports = mongoose.model('InventoryReservation', inventoryReservationSchema);
