const mongoose = require('mongoose');

const purchaseOrderRevisionSchema = new mongoose.Schema(
  {
    revisionId: {
      type: String,
      required: true,
      unique: true,
      index: true
    },
    purchaseOrderId: {
      type: String,
      required: true,
      index: true
    },
    revisionNumber: {
      type: Number,
      required: true
    },
    snapshot: {
      type: mongoose.Schema.Types.Mixed,
      required: true
    },
    changedFields: [
      {
        field: { type: String, required: true },
        oldValue: { type: mongoose.Schema.Types.Mixed },
        newValue: { type: mongoose.Schema.Types.Mixed }
      }
    ],
    reason: {
      type: String,
      required: true
    },
    createdBy: {
      type: String,
      required: true
    },
    approvedBy: {
      type: String,
      default: null
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  },
  {
    timestamps: true
  }
);

purchaseOrderRevisionSchema.index({ purchaseOrderId: 1, revisionNumber: 1 });

module.exports = mongoose.model('PurchaseOrderRevision', purchaseOrderRevisionSchema);
