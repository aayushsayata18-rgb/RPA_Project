const mongoose = require('mongoose');

const appointmentReminderSchema = new mongoose.Schema(
  {
    reminderId: {
      type: String,
      required: true,
      unique: true
    },
    appointmentId: {
      type: String,
      required: true,
      index: true
    },
    patientId: {
      type: String,
      required: true
    },
    recipientPhone: {
      type: String,
      required: true
    },
    recipientEmail: {
      type: String,
      default: ''
    },
    reminderType: {
      type: String,
      enum: ['PRIMARY_24H', 'SECONDARY_2H', 'CUSTOM'],
      default: 'PRIMARY_24H'
    },
    scheduledFor: {
      type: Date,
      required: true,
      index: true
    },
    status: {
      type: String,
      enum: ['SCHEDULED', 'QUEUED', 'SENT', 'DELIVERED', 'FAILED', 'CANCELLED'],
      default: 'SCHEDULED',
      index: true
    },
    idempotencyKey: {
      type: String,
      required: true,
      unique: true
    },
    channel: {
      type: String,
      enum: ['ALL', 'SMS', 'EMAIL', 'IN_APP'],
      default: 'ALL'
    },
    sentAt: {
      type: Date,
      default: null
    },
    deliveryDetails: {
      type: Object,
      default: {}
    },
    failureReason: {
      type: String,
      default: null
    },
    retryCount: {
      type: Number,
      default: 0
    },
    correlationId: {
      type: String,
      required: true
    }
  },
  {
    timestamps: true
  }
);

appointmentReminderSchema.index({ status: 1, scheduledFor: 1 });

module.exports = mongoose.model('AppointmentReminder', appointmentReminderSchema);
