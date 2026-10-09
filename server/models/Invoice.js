const mongoose = require('mongoose');

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
    admissionId: {
      type: String,
      required: true,
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
    invoiceDate: {
      type: Date,
      default: Date.now
    },
    items: [
      {
        category: {
          type: String,
          enum: ['ROOM_ACCOMMODATION', 'CONSULTATION', 'LABORATORY', 'PHARMACY', 'RADIOLOGY', 'NURSING', 'PROCEDURE', 'OTHER'],
          required: true
        },
        description: {
          type: String,
          required: true
        },
        quantity: {
          type: Number,
          default: 1
        },
        unitPrice: {
          type: Number,
          required: true
        },
        totalPrice: {
          type: Number,
          required: true
        },
        serviceDate: {
          type: Date,
          default: Date.now
        },
        serviceReferenceId: String
      }
    ],
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
      default: 0 // Insurance / Third party
    },
    depositAmount: {
      type: Number,
      default: 0 // Advances / Prepayment
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
      enum: ['DRAFT', 'FINALIZED', 'PAID', 'PARTIALLY_PAID', 'CANCELLED', 'DISPUTED'],
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

InvoiceSchema.virtual('netPayable').get(function() {
  return this.payableAmount;
});

InvoiceSchema.virtual('lineItems').get(function() {
  return this.items;
});

module.exports = mongoose.model('Invoice', InvoiceSchema);

