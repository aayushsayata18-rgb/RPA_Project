const mongoose = require('mongoose');

const purchaseRequestItemSchema = new mongoose.Schema(
  {
    requestItemId: {
      type: String,
      required: true
    },
    inventoryItemId: {
      type: String,
      required: true,
      index: true
    },
    itemNameSnapshot: {
      type: String,
      required: true
    },
    description: {
      type: String,
      default: ''
    },
    quantity: {
      type: Number,
      required: true,
      min: 1
    },
    unit: {
      type: String,
      required: true,
      default: 'UNIT'
    },
    estimatedUnitPrice: {
      type: Number,
      default: 0,
      min: 0
    },
    estimatedTotal: {
      type: Number,
      default: 0,
      min: 0
    },
    preferredSpecification: {
      type: String,
      default: ''
    },
    requiredByDate: {
      type: Date
    }
  },
  { _id: false }
);

const timelineEventSchema = new mongoose.Schema(
  {
    status: {
      type: String,
      required: true
    },
    actorId: {
      type: String,
      required: true
    },
    actorName: {
      type: String,
      default: ''
    },
    role: {
      type: String,
      default: ''
    },
    note: {
      type: String,
      default: ''
    },
    timestamp: {
      type: Date,
      default: Date.now
    }
  },
  { _id: false }
);

const attachmentSchema = new mongoose.Schema(
  {
    docName: { type: String, required: true },
    fileUrl: { type: String, required: true },
    uploadedAt: { type: Date, default: Date.now }
  },
  { _id: false }
);

const purchaseRequestSchema = new mongoose.Schema(
  {
    purchaseRequestId: {
      type: String,
      required: true,
      unique: true,
      index: true
    },
    requesterId: {
      type: String,
      required: true,
      index: true
    },
    requesterName: {
      type: String,
      required: true
    },
    departmentId: {
      type: String,
      required: true,
      index: true
    },
    departmentName: {
      type: String,
      required: true
    },
    requestDate: {
      type: Date,
      default: Date.now,
      index: true
    },
    requiredByDate: {
      type: Date,
      required: true,
      index: true
    },
    priority: {
      type: String,
      enum: ['LOW', 'NORMAL', 'HIGH', 'URGENT'],
      default: 'NORMAL',
      index: true
    },
    category: {
      type: String,
      enum: [
        'MEDICINE',
        'MEDICAL_CONSUMABLE',
        'SURGICAL_SUPPLY',
        'LABORATORY_SUPPLY',
        'RADIOLOGY_SUPPLY',
        'PPE',
        'EQUIPMENT',
        'MAINTENANCE_MATERIAL',
        'HOUSEKEEPING_MATERIAL',
        'GENERAL_SUPPLIES',
        'OTHER'
      ],
      required: true,
      index: true
    },
    items: [purchaseRequestItemSchema],
    reason: {
      type: String,
      required: true
    },
    justification: {
      type: String,
      default: ''
    },
    status: {
      type: String,
      enum: [
        'DRAFT',
        'SUBMITTED',
        'UNDER_REVIEW',
        'PENDING_APPROVAL',
        'APPROVED',
        'REJECTED',
        'RETURNED_FOR_CORRECTION',
        'RFQ_IN_PROGRESS',
        'PO_CREATED',
        'PARTIALLY_ORDERED',
        'ORDERED',
        'FULFILLED',
        'CANCELLED',
        'CLOSED'
      ],
      default: 'DRAFT',
      index: true
    },
    estimatedTotal: {
      type: Number,
      default: 0,
      min: 0
    },
    departmentReviewerId: {
      type: String,
      default: null
    },
    departmentReviewedAt: {
      type: Date,
      default: null
    },
    approverId: {
      type: String,
      default: null
    },
    approverName: {
      type: String,
      default: null
    },
    approvedAt: {
      type: Date,
      default: null
    },
    approvalNotes: {
      type: String,
      default: ''
    },
    rejectionReason: {
      type: String,
      default: ''
    },
    rejectedBy: {
      type: String,
      default: null
    },
    rejectedAt: {
      type: Date,
      default: null
    },
    correctionReason: {
      type: String,
      default: ''
    },
    returnedBy: {
      type: String,
      default: null
    },
    returnedAt: {
      type: Date,
      default: null
    },
    rfqId: {
      type: String,
      default: null,
      index: true
    },
    purchaseOrderId: {
      type: String,
      default: null,
      index: true
    },
    attachments: [attachmentSchema],
    timeline: [timelineEventSchema]
  },
  {
    timestamps: true
  }
);

purchaseRequestSchema.index({ departmentId: 1, status: 1 });
purchaseRequestSchema.index({ priority: 1, status: 1 });
purchaseRequestSchema.index({ category: 1, status: 1 });

module.exports = mongoose.model('PurchaseRequest', purchaseRequestSchema);
