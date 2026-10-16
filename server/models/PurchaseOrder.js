const mongoose = require('mongoose');

const purchaseOrderItemSchema = new mongoose.Schema(
  {
    poItemId: {
      type: String,
      required: true
    },
    inventoryItemId: {
      type: String,
      required: true,
      index: true
    },
    description: {
      type: String,
      required: true
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
    unitPrice: {
      type: Number,
      required: true,
      min: 0
    },
    taxPercent: {
      type: Number,
      default: 0,
      min: 0
    },
    tax: {
      type: Number,
      default: 0,
      min: 0
    },
    discount: {
      type: Number,
      default: 0,
      min: 0
    },
    lineTotal: {
      type: Number,
      required: true,
      min: 0
    },
    requiredByDate: {
      type: Date
    },
    specification: {
      type: String,
      default: ''
    },
    deliveredQuantity: {
      type: Number,
      default: 0,
      min: 0
    },
    receivedQuantity: {
      type: Number,
      default: 0,
      min: 0
    }
  },
  { _id: false }
);

const purchaseOrderSchema = new mongoose.Schema(
  {
    purchaseOrderId: {
      type: String,
      required: true,
      unique: true,
      index: true
    },
    purchaseRequestIds: [
      {
        type: String,
        required: true,
        index: true
      }
    ],
    vendorId: {
      type: String,
      required: true,
      index: true
    },
    vendorName: {
      type: String,
      required: true
    },
    quotationId: {
      type: String,
      default: null,
      index: true
    },
    orderDate: {
      type: Date,
      default: Date.now,
      index: true
    },
    expectedDeliveryDate: {
      type: Date,
      required: true,
      index: true
    },
    currency: {
      type: String,
      default: 'INR'
    },
    items: [purchaseOrderItemSchema],
    subtotal: {
      type: Number,
      required: true,
      min: 0
    },
    tax: {
      type: Number,
      default: 0,
      min: 0
    },
    discount: {
      type: Number,
      default: 0,
      min: 0
    },
    shipping: {
      type: Number,
      default: 0,
      min: 0
    },
    grandTotal: {
      type: Number,
      required: true,
      min: 0
    },
    paymentTerms: {
      type: String,
      default: 'Net 30'
    },
    deliveryTerms: {
      type: String,
      default: 'FOB Destination'
    },
    billingAddress: {
      type: String,
      default: 'Apex Care Hospital, Main Campus, Finance Wing, Medical Enclave'
    },
    shippingAddress: {
      type: String,
      default: 'Apex Care Hospital, Central Stores / Receiving Bay 2, Ground Floor'
    },
    status: {
      type: String,
      enum: [
        'DRAFT',
        'PENDING_APPROVAL',
        'APPROVED',
        'SENT_TO_VENDOR',
        'ACKNOWLEDGED',
        'PARTIALLY_DELIVERED',
        'DELIVERED',
        'PARTIALLY_RECEIVED',
        'RECEIVED',
        'CLOSED',
        'CANCELLED',
        'REJECTED'
      ],
      default: 'DRAFT',
      index: true
    },
    approvalStatus: {
      type: String,
      enum: ['PENDING', 'APPROVED', 'REJECTED', 'RETURNED'],
      default: 'PENDING',
      index: true
    },
    approvedBy: {
      type: String,
      default: null
    },
    approvedByName: {
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
    vendorAcknowledgement: {
      status: {
        type: String,
        enum: ['PENDING', 'ACCEPTED', 'REJECTED', 'ACCEPT_WITH_CHANGES'],
        default: 'PENDING'
      },
      acknowledgedAt: { type: Date, default: null },
      comments: { type: String, default: '' },
      externalPoRef: { type: String, default: '' }
    },
    revisionsCount: {
      type: Number,
      default: 0
    },
    currentRevisionId: {
      type: String,
      default: null
    },
    externalReference: {
      type: String,
      default: null,
      index: true
    },
    documents: [
      {
        docType: { type: String, default: 'PO_DOCUMENT' },
        docName: { type: String },
        fileUrl: { type: String },
        uploadedAt: { type: Date, default: Date.now }
      }
    ],
    createdBy: {
      type: String,
      required: true
    },
    sentAt: {
      type: Date,
      default: null
    },
    closedAt: {
      type: Date,
      default: null
    },
    cancellationReason: {
      type: String,
      default: ''
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

purchaseOrderSchema.index({ vendorId: 1, status: 1 });
purchaseOrderSchema.index({ expectedDeliveryDate: 1, status: 1 });

module.exports = mongoose.model('PurchaseOrder', purchaseOrderSchema);
