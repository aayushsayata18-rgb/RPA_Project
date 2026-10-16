const mongoose = require('mongoose');

const countItemSchema = new mongoose.Schema(
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
    systemQuantity: {
      type: Number,
      required: true
    },
    countedQuantity: {
      type: Number,
      default: null
    },
    difference: {
      type: Number,
      default: 0
    },
    status: {
      type: String,
      enum: ['PENDING', 'COUNTED', 'MATCHED', 'VARIANCE'],
      default: 'PENDING'
    },
    notes: {
      type: String,
      default: ''
    }
  },
  { _id: false }
);

const stockCountSessionSchema = new mongoose.Schema(
  {
    countSessionId: {
      type: String,
      required: true,
      unique: true,
      index: true
    },
    locationId: {
      type: String,
      required: true,
      index: true
    },
    countType: {
      type: String,
      enum: ['FULL', 'CYCLE_COUNT', 'CATEGORY', 'BATCH', 'SPOT_CHECK'],
      default: 'CYCLE_COUNT'
    },
    category: {
      type: String,
      default: 'ALL'
    },
    status: {
      type: String,
      enum: [
        'DRAFT',
        'IN_PROGRESS',
        'PENDING_REVIEW',
        'APPROVED',
        'POSTED',
        'CANCELLED'
      ],
      default: 'DRAFT',
      index: true
    },
    items: [countItemSchema],
    totalVarianceItems: {
      type: Number,
      default: 0
    },
    startedAt: {
      type: Date,
      default: Date.now
    },
    completedAt: {
      type: Date,
      default: null
    },
    createdBy: {
      type: String,
      required: true
    },
    approvedBy: {
      type: String,
      default: null
    }
  },
  {
    timestamps: true
  }
);

stockCountSessionSchema.index({ locationId: 1, status: 1 });

module.exports = mongoose.model('StockCountSession', stockCountSessionSchema);
