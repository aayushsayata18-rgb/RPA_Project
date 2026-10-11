const mongoose = require('mongoose');

const InvoiceItemSubSchema = new mongoose.Schema(
  {
    category: {
      type: String,
      enum: ['ROOM_ACCOMMODATION', 'CONSULTATION', 'LABORATORY', 'PHARMACY', 'RADIOLOGY', 'NURSING', 'PROCEDURE', 'OTHER'],
      required: true
    },
    sourceModule: {
      type: String,
      enum: ['ROOM_ACCOMMODATION', 'CONSULTATION', 'LABORATORY', 'PHARMACY', 'RADIOLOGY', 'NURSING', 'PROCEDURE', 'OTHER'],
      default: 'OTHER'
    },
    sourceType: {
      type: String,
      default: 'SERVICE_CHARGE'
    },
    sourceId: {
      type: String
    },
    serviceCode: {
      type: String
    },
    description: {
      type: String,
      required: true
    },
    quantity: {
      type: Number,
      required: true,
      default: 1
    },
    unitPrice: {
      type: Number,
      required: true,
      default: 0
    },
    grossAmount: {
      type: Number,
      default: 0
    },
    discountAmount: {
      type: Number,
      default: 0
    },
    insuranceAmount: {
      type: Number,
      default: 0
    },
    taxAmount: {
      type: Number,
      default: 0
    },
    netAmount: {
      type: Number,
      default: 0
    },
    totalPrice: {
      type: Number,
      required: true
    },
    serviceDate: {
      type: Date,
      default: Date.now
    },
    serviceReferenceId: String,
    metadata: {
      type: Object,
      default: {}
    }
  },
  { _id: true }
);

const InvoiceSchema = new mongoose.Schema(
  {
    invoiceId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true
    },
    patientId: {
      type: String,
      required: true,
      index: true
    },
    patientRef: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Patient'
    },
    patientName: {
      type: String,
      default: ''
    },
    visitId: {
      type: String,
      index: true
    },
    admissionId: {
      type: String,
      index: true
    },
    admissionRef: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Admission'
    },
    dischargeId: {
      type: String,
      index: true
    },
    dischargeRef: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Discharge'
    },
    invoiceType: {
      type: String,
      enum: ['FINAL_DISCHARGE', 'OPD', 'IPD', 'EMERGENCY', 'GENERAL'],
      default: 'FINAL_DISCHARGE'
    },
    currency: {
      type: String,
      default: 'INR'
    },
    invoiceDate: {
      type: Date,
      default: Date.now,
      index: true
    },
    dueDate: {
      type: Date
    },
    finalizedAt: {
      type: Date
    },
    cancelledAt: {
      type: Date
    },
    cancellationReason: {
      type: String
    },
    items: [InvoiceItemSubSchema],
    grossTotal: {
      type: Number,
      required: true,
      default: 0
    },
    taxAmount: {
      type: Number,
      default: 0
    },
    discountAmount: {
      type: Number,
      default: 0
    },
    coveredAmount: {
      type: Number,
      default: 0 // Insurance / Third party coverage
    },
    depositAmount: {
      type: Number,
      default: 0 // Prepayment / Advance applied
    },
    adjustmentTotal: {
      type: Number,
      default: 0 // Authorized financial adjustments
    },
    payableAmount: {
      type: Number,
      required: true,
      default: 0
    },
    paidAmount: {
      type: Number,
      default: 0
    },
    outstandingBalance: {
      type: Number,
      default: 0
    },
    status: {
      type: String,
      enum: ['DRAFT', 'PENDING_REVIEW', 'FINALIZED', 'PAID', 'PARTIALLY_PAID', 'OVERDUE', 'CANCELLED', 'VOID', 'DISPUTED'],
      default: 'FINALIZED',
      index: true
    },
    disputeReason: {
      type: String
    },
    disputeStatus: {
      type: String,
      enum: ['NONE', 'RAISED', 'UNDER_REVIEW', 'RESOLVED', 'REJECTED'],
      default: 'NONE'
    },
    createdByUserId: {
      type: String,
      default: 'SYSTEM'
    },
    correlationId: {
      type: String,
      index: true
    }
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

InvoiceSchema.virtual('invoiceNumber').get(function() {
  return this.invoiceId;
});

InvoiceSchema.virtual('grossAmount').get(function() {
  return this.grossTotal;
});

InvoiceSchema.virtual('subtotal').get(function() {
  return this.grossTotal;
});

InvoiceSchema.virtual('taxTotal').get(function() {
  return this.taxAmount;
});

InvoiceSchema.virtual('discountTotal').get(function() {
  return this.discountAmount;
});

InvoiceSchema.virtual('insuranceCoverage').get(function() {
  return this.coveredAmount;
});

InvoiceSchema.virtual('depositApplied').get(function() {
  return this.depositAmount;
});

InvoiceSchema.virtual('netPayable').get(function() {
  return this.payableAmount;
});

InvoiceSchema.virtual('balanceAmount').get(function() {
  return this.outstandingBalance;
});

InvoiceSchema.virtual('lineItems').get(function() {
  return this.items;
});

InvoiceSchema.virtual('issueDate').get(function() {
  return this.invoiceDate;
});

InvoiceSchema.index({ invoiceNumber: 1 });
InvoiceSchema.index({ patientId: 1, invoiceDate: -1 });
InvoiceSchema.index({ admissionId: 1, status: 1 });
InvoiceSchema.index({ status: 1, invoiceDate: -1 });

module.exports = mongoose.model('Invoice', InvoiceSchema);
