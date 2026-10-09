const mongoose = require('mongoose');

const opdTokenSchema = new mongoose.Schema(
  {
    tokenId: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
      index: true
    },
    tokenNumber: {
      type: String,
      required: true,
      trim: true,
      index: true // e.g. "GM-101"
    },
    sequenceNumber: {
      type: Number,
      required: true
    },
    patientId: {
      type: String,
      required: true,
      index: true
    },
    patientRef: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Patient',
      default: null
    },
    patientName: {
      type: String,
      required: true
    },
    patientPhone: {
      type: String,
      default: ''
    },
    appointmentId: {
      type: String,
      required: true,
      index: true
    },
    appointmentRef: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Appointment',
      default: null
    },
    visitId: {
      type: String,
      default: null,
      index: true
    },
    queueId: {
      type: String,
      required: true,
      index: true
    },
    queueRef: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'OPDQueue',
      default: null
    },
    doctorId: {
      type: String,
      required: true,
      index: true
    },
    doctorName: {
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
    roomNumber: {
      type: String,
      default: 'OPD-101'
    },
    checkInChannel: {
      type: String,
      enum: ['ONLINE_SELF_CHECKIN', 'FRONT_DESK'],
      required: true
    },
    checkInTime: {
      type: Date,
      default: Date.now,
      index: true
    },
    expectedAppointmentTime: {
      type: String, // e.g. "10:30"
      default: ''
    },
    status: {
      type: String,
      enum: [
        'WAITING',
        'CALLED',
        'IN_SERVICE',
        'COMPLETED',
        'SKIPPED',
        'CANCELLED',
        'NO_SHOW',
        'TRANSFERRED'
      ],
      default: 'WAITING',
      index: true
    },
    priorityType: {
      type: String,
      enum: ['NORMAL', 'URGENT', 'EMERGENCY'],
      default: 'NORMAL',
      index: true
    },
    priorityReason: {
      type: String,
      default: null
    },
    priorityAssignedBy: {
      type: String,
      default: null
    },
    priorityAssignedAt: {
      type: Date,
      default: null
    },
    isLate: {
      type: Boolean,
      default: false
    },
    lateMinutes: {
      type: Number,
      default: 0
    },
    calledAt: {
      type: Date,
      default: null
    },
    calledBy: {
      type: String,
      default: null
    },
    serviceStartedAt: {
      type: Date,
      default: null
    },
    serviceStartedBy: {
      type: String,
      default: null
    },
    completedAt: {
      type: Date,
      default: null
    },
    completedBy: {
      type: String,
      default: null
    },
    skippedAt: {
      type: Date,
      default: null
    },
    skippedBy: {
      type: String,
      default: null
    },
    skipReason: {
      type: String,
      default: null
    },
    returnedAt: {
      type: Date,
      default: null
    },
    returnedBy: {
      type: String,
      default: null
    },
    returnReason: {
      type: String,
      default: null
    },
    transferredAt: {
      type: Date,
      default: null
    },
    transferredBy: {
      type: String,
      default: null
    },
    transferReason: {
      type: String,
      default: null
    },
    fromQueueId: {
      type: String,
      default: null
    },
    toQueueId: {
      type: String,
      default: null
    },
    cancelledAt: {
      type: Date,
      default: null
    },
    cancelledBy: {
      type: String,
      default: null
    },
    cancellationReason: {
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

// Compound Unique & Search Indexes
opdTokenSchema.index({ queueId: 1, tokenNumber: 1 });
opdTokenSchema.index({ queueId: 1, status: 1 });
opdTokenSchema.index({ patientId: 1, createdAt: -1 });

module.exports = mongoose.model('OPDToken', opdTokenSchema);
