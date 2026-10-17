const mongoose = require('mongoose');

const SupplyItemSchema = new mongoose.Schema(
  {
    inventoryItemId: {
      type: String,
      default: ''
    },
    itemName: {
      type: String,
      required: true
    },
    quantityRequested: {
      type: Number,
      default: 1
    },
    quantityIssued: {
      type: Number,
      default: 0
    },
    unit: {
      type: String,
      default: 'UNIT'
    }
  },
  { _id: false }
);

const HousekeepingSupplyRequestSchema = new mongoose.Schema(
  {
    requestId: {
      type: String,
      trim: true,
      index: true
    },
    taskId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'HousekeepingTask',
      index: true
    },
    taskNumber: {
      type: String,
      default: ''
    },
    requestedBy: {
      type: String,
      default: ''
    },
    requestedById: {
      type: String,
      default: ''
    },
    requestedByUserId: {
      type: String,
      default: ''
    },
    department: {
      type: String,
      default: 'HOUSEKEEPING'
    },
    shiftType: {
      type: String,
      default: 'MORNING'
    },
    items: [SupplyItemSchema],
    status: {
      type: String,
      enum: ['PENDING', 'REQUESTED', 'APPROVED', 'ISSUED', 'REJECTED', 'RETURNED'],
      default: 'PENDING',
      index: true
    },
    approvedBy: {
      type: String,
      default: ''
    },
    approvedById: {
      type: String,
      default: ''
    },
    approvedByUserId: {
      type: String,
      default: ''
    },
    approvalNotes: {
      type: String,
      default: ''
    },
    issuedBy: {
      type: String,
      default: ''
    },
    issuedById: {
      type: String,
      default: ''
    },
    issuedByUserId: {
      type: String,
      default: ''
    },
    issuedAt: {
      type: Date,
      default: null
    },
    notes: {
      type: String,
      default: ''
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.models.HousekeepingSupplyRequest || mongoose.model('HousekeepingSupplyRequest', HousekeepingSupplyRequestSchema);
