const mongoose = require('mongoose');

const checkInSchema = new mongoose.Schema(
  {
    checkInId: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
      index: true
    },
    patientId: {
      type: String,
      required: true,
      index: true
    },
    patientName: {
      type: String,
      required: true
    },
    appointmentId: {
      type: String,
      required: true,
      index: true
    },
    visitId: {
      type: String,
      default: null,
      index: true
    },
    tokenId: {
      type: String,
      required: true,
      index: true
    },
    tokenNumber: {
      type: String,
      required: true
    },
    queueId: {
      type: String,
      required: true,
      index: true
    },
    channel: {
      type: String,
      enum: ['ONLINE_SELF_CHECKIN', 'FRONT_DESK'],
      required: true
    },
    checkInTime: {
      type: Date,
      default: Date.now
    },
    checkedInBy: {
      type: String, // User ID or 'PATIENT_SELF'
      required: true
    },
    checkedInRole: {
      type: String,
      default: 'PATIENT'
    },
    status: {
      type: String,
      enum: ['SUCCESS', 'FAILED', 'OVERRIDDEN'],
      default: 'SUCCESS'
    },
    overrideUsed: {
      type: Boolean,
      default: false
    },
    overrideReason: {
      type: String,
      default: null
    },
    correlationId: {
      type: String,
      required: true
    },
    idempotencyKey: {
      type: String,
      default: null,
      index: true
    }
  },
  {
    timestamps: true
  }
);

checkInSchema.index({ appointmentId: 1, status: 1 });

module.exports = mongoose.model('CheckIn', checkInSchema);
