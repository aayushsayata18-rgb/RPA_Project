const mongoose = require('mongoose');

const DischargeRequestSchema = new mongoose.Schema(
  {
    requestId: {
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
    requestedByUserId: {
      type: String,
      required: true
    },
    requestedByRole: {
      type: String,
      required: true,
      default: 'DOCTOR'
    },
    doctorName: {
      type: String,
      default: ''
    },
    requestType: {
      type: String,
      enum: ['PLANNED', 'EMERGENCY', 'TRANSFER_OUT', 'OTHER'],
      default: 'PLANNED'
    },
    clinicalDecisionReference: {
      type: String,
      default: function() { return `CLIN-DEC-${Date.now()}`; },
      trim: true
    },
    clinicalSummaryNotes: {
      type: String,
      default: ''
    },
    status: {
      type: String,
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
    effectiveDischargeDate: {
      type: Date,
      default: Date.now
    },
    notes: {
      type: String,
      default: ''
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
    correlationId: {
      type: String,
      index: true
    }
  },
  {
    timestamps: true
  }
);

DischargeRequestSchema.index({ admissionId: 1, status: 1 });
DischargeRequestSchema.index({ patientId: 1, requestedAt: -1 });

module.exports = mongoose.model('DischargeRequest', DischargeRequestSchema);
