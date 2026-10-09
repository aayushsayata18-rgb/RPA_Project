const mongoose = require('mongoose');

const appointmentHistorySchema = new mongoose.Schema(
  {
    historyId: {
      type: String,
      required: true,
      unique: true
    },
    appointmentId: {
      type: String,
      required: true,
      index: true
    },
    action: {
      type: String,
      enum: [
        'CREATED',
        'CONFIRMED',
        'CANCELLED',
        'RESCHEDULED',
        'CHECKED_IN',
        'IN_PROGRESS',
        'NO_SHOW',
        'COMPLETED',
        'REMINDER_SCHEDULED',
        'REMINDER_SENT',
        'REMINDER_CANCELLED',
        'UPDATED'
      ],
      required: true
    },
    previousStatus: {
      type: String,
      default: null
    },
    newStatus: {
      type: String,
      default: null
    },
    previousDate: {
      type: String,
      default: null
    },
    newDate: {
      type: String,
      default: null
    },
    previousStartTime: {
      type: String,
      default: null
    },
    newStartTime: {
      type: String,
      default: null
    },
    previousDoctorId: {
      type: String,
      default: null
    },
    newDoctorId: {
      type: String,
      default: null
    },
    reason: {
      type: String,
      default: ''
    },
    actorUserId: {
      type: String,
      default: 'SYSTEM'
    },
    actorRole: {
      type: String,
      default: 'SYSTEM'
    },
    correlationId: {
      type: String,
      required: true
    },
    details: {
      type: String,
      default: ''
    }
  },
  {
    timestamps: true
  }
);

appointmentHistorySchema.index({ appointmentId: 1, createdAt: -1 });

module.exports = mongoose.model('AppointmentHistory', appointmentHistorySchema);
