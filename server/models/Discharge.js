const mongoose = require('mongoose');

const DischargeSchema = new mongoose.Schema(
  {
    dischargeNumber: {
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
      required: true,
      index: true
    },
    visitRef: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Visit'
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
    dischargeRequestId: {
      type: String,
      index: true
    },
    dischargeRequestRef: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'DischargeRequest'
    },
    dischargeType: {
      type: String,
      enum: ['PLANNED', 'EMERGENCY', 'TRANSFER_OUT', 'OTHER'],
      default: 'PLANNED',
      index: true
    },
    status: {
      type: String,
      required: true,
      enum: [
        'DRAFT',
        'REQUESTED',
        'VALIDATING',
        'PENDING_ADMIN_REVIEW',
        'PENDING_SERVICES',
        'PENDING_BILLING',
        'PENDING_INSURANCE',
        'PENDING_PAYMENT',
        'READY_FOR_DISCHARGE',
        'PROCESSING',
        'COMPLETED',
        'CANCELLED',
        'EXCEPTION'
      ],
      default: 'REQUESTED',
      index: true
    },
    requestedAt: {
      type: Date,
      default: Date.now,
      index: true
    },
    approvedAt: {
      type: Date
    },
    processingStartedAt: {
      type: Date
    },
    completedAt: {
      type: Date,
      index: true
    },
    cancelledAt: {
      type: Date
    },
    cancellationReason: {
      type: String
    },
    cancelledBy: {
      type: String
    },
    dischargeDate: {
      type: Date,
      default: Date.now
    },
    actualDepartureAt: {
      type: Date
    },
    assignedWardId: {
      type: String,
      default: ''
    },
    assignedWardName: {
      type: String,
      default: ''
    },
    assignedBedId: {
      type: String,
      default: ''
    },
    assignedBedNumber: {
      type: String,
      default: ''
    },
    admittingDoctorName: {
      type: String,
      default: ''
    },
    // Billing and Financials
    finalInvoiceId: {
      type: String,
      index: true
    },
    finalInvoiceRef: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Invoice'
    },
    grossAmount: {
      type: Number,
      default: 0
    },
    coveredAmount: {
      type: Number,
      default: 0
    },
    depositAmount: {
      type: Number,
      default: 0
    },
    discountAmount: {
      type: Number,
      default: 0
    },
    payableAmount: {
      type: Number,
      default: 0
    },
    paymentStatus: {
      type: String,
      enum: ['UNPAID', 'PENDING', 'PARTIALLY_PAID', 'PAID', 'WAIVED', 'FAILED'],
      default: 'UNPAID',
      index: true
    },
    paymentMethod: {
      type: String,
      enum: ['ONLINE_GATEWAY', 'UPI', 'CARD', 'NET_BANKING', 'COUNTER_CASH', 'COUNTER_CARD', 'COUNTER_UPI', 'INSURANCE_CLAIM', 'INSURANCE_SETTLED', 'NOT_APPLICABLE', 'OTHER'],
      default: 'NOT_APPLICABLE'
    },
    paymentTransactionId: {
      type: String,
      default: ''
    },
    paymentVerifiedAt: {
      type: Date
    },
    insuranceStatus: {
      type: String,
      enum: ['NOT_APPLICABLE', 'PENDING', 'VERIFIED', 'APPROVED', 'UNDER_REVIEW', 'REJECTED'],
      default: 'NOT_APPLICABLE',
      index: true
    },
    bedReleaseStatus: {
      type: String,
      enum: ['PENDING', 'REQUESTED', 'RELEASED', 'FAILED'],
      default: 'PENDING',
      index: true
    },
    bedReleaseTaskId: {
      type: String,
      default: ''
    },
    pendingItems: [
      {
        serviceType: {
          type: String,
          enum: ['LABORATORY', 'RADIOLOGY', 'PHARMACY', 'CONSULTATION', 'OTHER']
        },
        itemReference: String,
        description: String,
        status: String,
        isBlocking: {
          type: Boolean,
          default: false
        },
        detectedAt: {
          type: Date,
          default: Date.now
        },
        resolvedAt: Date
      }
    ],
    exceptionCount: {
      type: Number,
      default: 0
    },
    finalInvoiceNumber: {
      type: String,
      index: true
    },
    notes: {
      type: String,
      default: ''
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

DischargeSchema.virtual('dischargeId').get(function() {
  return this.dischargeNumber;
});

// Indexes
DischargeSchema.index({ admissionId: 1, status: 1 });
DischargeSchema.index({ patientId: 1, dischargeDate: -1 });

module.exports = mongoose.model('Discharge', DischargeSchema);

