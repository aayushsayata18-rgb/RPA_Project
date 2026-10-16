const mongoose = require('mongoose');

const supplierInvoiceItemSchema = new mongoose.Schema(
  {
    invoiceItemId: {
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
    unitPrice: {
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
    lineTotal: {
      type: Number,
      required: true,
      min: 0
    }
  },
  { _id: false }
);

const matchDiscrepancySchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ['PRICE', 'QUANTITY', 'TAX', 'ITEM', 'TOTAL', 'MISSING_DOC'],
      required: true
    },
    field: { type: String, required: true },
    inventoryItemId: { type: String },
    poValue: { type: mongoose.Schema.Types.Mixed },
    grnValue: { type: mongoose.Schema.Types.Mixed },
    invoiceValue: { type: mongoose.Schema.Types.Mixed },
    difference: { type: Number, default: 0 },
    description: { type: String, required: true }
  },
  { _id: false }
);

const supplierInvoiceSchema = new mongoose.Schema(
  {
    supplierInvoiceId: {
      type: String,
      required: true,
      unique: true,
      index: true
    },
    vendorId: {
      type: String,
      required: true,
      index: true
    },
    vendorName: {
      type: String,
      required: true
    },
    invoiceNumber: {
      type: String,
      required: true,
      index: true
    },
    purchaseOrderId: {
      type: String,
      required: true,
      index: true
    },
    goodsReceiptId: {
      type: String,
      default: null,
      index: true
    },
    invoiceDate: {
      type: Date,
      required: true
    },
    dueDate: {
      type: Date,
      required: true
    },
    currency: {
      type: String,
      default: 'INR'
    },
    items: [supplierInvoiceItemSchema],
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
    grandTotal: {
      type: Number,
      required: true,
      min: 0
    },
    matchStatus: {
      type: String,
      enum: [
        'PENDING_MATCH',
        'MATCHED',
        'PARTIAL_MATCH',
        'PRICE_MISMATCH',
        'QUANTITY_MISMATCH',
        'ITEM_MISMATCH',
        'TAX_MISMATCH',
        'MISSING_RECEIPT',
        'MISSING_INVOICE',
        'REJECTED'
      ],
      default: 'PENDING_MATCH',
      index: true
    },
    matchDiscrepancies: [matchDiscrepancySchema],
    status: {
      type: String,
      enum: [
        'RECEIVED',
        'VALIDATING',
        'MATCHED',
        'MISMATCH',
        'APPROVED_FOR_PAYMENT',
        'SENT_TO_FINANCE',
        'PAID',
        'REJECTED',
        'CANCELLED'
      ],
      default: 'RECEIVED',
      index: true
    },
    financeHandoffStatus: {
      type: String,
      enum: ['NOT_HANDED_OFF', 'SENT_TO_FINANCE', 'PAYMENT_PENDING', 'PAID', 'REJECTED'],
      default: 'NOT_HANDED_OFF',
      index: true
    },
    approvedBy: {
      type: String,
      default: null
    },
    approvedAt: {
      type: Date,
      default: null
    },
    sentToFinanceAt: {
      type: Date,
      default: null
    },
    paidAt: {
      type: Date,
      default: null
    },
    paymentReference: {
      type: String,
      default: ''
    },
    documents: [
      {
        docType: { type: String, default: 'SUPPLIER_INVOICE' },
        docName: { type: String },
        fileUrl: { type: String }
      }
    ],
    notes: {
      type: String,
      default: ''
    }
  },
  {
    timestamps: true
  }
);

supplierInvoiceSchema.index({ vendorId: 1, invoiceNumber: 1 }, { unique: true });
supplierInvoiceSchema.index({ purchaseOrderId: 1, status: 1 });

module.exports = mongoose.model('SupplierInvoice', supplierInvoiceSchema);
