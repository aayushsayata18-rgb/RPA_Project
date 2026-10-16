const mongoose = require('mongoose');

const quotationItemSchema = new mongoose.Schema(
  {
    quotationItemId: {
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
    quotedQuantity: {
      type: Number,
      required: true,
      min: 1
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
    deliveryDays: {
      type: Number,
      default: 7,
      min: 0
    },
    brand: {
      type: String,
      default: ''
    },
    manufacturer: {
      type: String,
      default: ''
    },
    specification: {
      type: String,
      default: ''
    },
    compliance: {
      type: Boolean,
      default: true
    }
  },
  { _id: false }
);

const quotationSchema = new mongoose.Schema(
  {
    quotationId: {
      type: String,
      required: true,
      unique: true,
      index: true
    },
    rfqId: {
      type: String,
      required: true,
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
    vendorContactEmail: {
      type: String,
      default: ''
    },
    vendorContactPhone: {
      type: String,
      default: ''
    },
    quotationReference: {
      type: String,
      default: ''
    },
    quotationDate: {
      type: Date,
      default: Date.now
    },
    validUntil: {
      type: Date,
      required: true,
      index: true
    },
    items: [quotationItemSchema],
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
    otherCharges: {
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
    warrantyPeriod: {
      type: String,
      default: '1 Year'
    },
    documents: [
      {
        docName: { type: String },
        fileUrl: { type: String }
      }
    ],
    status: {
      type: String,
      enum: [
        'DRAFT',
        'RECEIVED',
        'UNDER_REVIEW',
        'SHORTLISTED',
        'ACCEPTED',
        'REJECTED',
        'EXPIRED',
        'CANCELLED'
      ],
      default: 'RECEIVED',
      index: true
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

quotationSchema.index({ rfqId: 1, vendorId: 1 });
quotationSchema.index({ status: 1, validUntil: 1 });

module.exports = mongoose.model('Quotation', quotationSchema);
