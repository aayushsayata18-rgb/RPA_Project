const mongoose = require('mongoose');

const BedReservationSchema = new mongoose.Schema(
  {
    reservationId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true
    },
    bedId: {
      type: String,
      required: true,
      index: true
    },
    bedRef: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Bed'
    },
    bedNumber: {
      type: String,
      default: ''
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
      default: null,
      index: true
    },
    admissionRequestId: {
      type: String,
      default: null,
      index: true
    },
    reservationReason: {
      type: String,
      enum: ['INITIAL_ADMISSION', 'TRANSFER', 'EMERGENCY_HOLD', 'CLINICAL_PREPARATION', 'OTHER'],
      default: 'INITIAL_ADMISSION'
    },
    reservedAt: {
      type: Date,
      default: Date.now,
      required: true
    },
    expiresAt: {
      type: Date,
      required: true,
      index: true
    },
    status: {
      type: String,
      enum: ['ACTIVE', 'EXPIRED', 'CONVERTED', 'CANCELLED'],
      default: 'ACTIVE',
      index: true
    },
    createdByUserId: {
      type: String,
      default: 'SYSTEM'
    },
    cancelledByUserId: {
      type: String,
      default: null
    },
    cancellationReason: {
      type: String,
      default: ''
    },
    correlationId: {
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

BedReservationSchema.index({ bedId: 1, status: 1 });
BedReservationSchema.index({ expiresAt: 1, status: 1 });

module.exports = mongoose.model('BedReservation', BedReservationSchema);
