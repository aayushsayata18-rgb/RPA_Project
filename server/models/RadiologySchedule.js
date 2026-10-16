const mongoose = require('mongoose');

const radiologyScheduleSchema = new mongoose.Schema(
  {
    scheduleId: {
      type: String,
      required: true,
      unique: true,
      index: true
    },
    orderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'RadiologyOrder',
      required: true,
      index: true
    },
    patientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Patient',
      required: true,
      index: true
    },
    patientName: {
      type: String,
      default: ''
    },
    examId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'RadiologyExam',
      required: true,
      index: true
    },
    examName: {
      type: String,
      default: ''
    },
    modalityId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'RadiologyModality',
      required: true,
      index: true
    },
    modalityName: {
      type: String,
      default: ''
    },
    room: {
      type: String,
      required: true
    },
    scheduledStart: {
      type: Date,
      required: true,
      index: true
    },
    scheduledEnd: {
      type: Date,
      required: true,
      index: true
    },
    status: {
      type: String,
      enum: [
        'AVAILABLE',
        'HELD',
        'BOOKED',
        'CONFIRMED',
        'CHECKED_IN',
        'IN_PROGRESS',
        'COMPLETED',
        'CANCELLED',
        'NO_SHOW',
        'BLOCKED'
      ],
      default: 'BOOKED',
      index: true
    },
    scheduledBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    },
    confirmedAt: {
      type: Date,
      default: null
    },
    cancellationReason: {
      type: String,
      default: ''
    },
    previousScheduleId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'RadiologySchedule',
      default: null
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

radiologyScheduleSchema.index({ modalityId: 1, scheduledStart: 1, scheduledEnd: 1 });
radiologyScheduleSchema.index({ patientId: 1, scheduledStart: -1 });

module.exports = mongoose.model('RadiologySchedule', radiologyScheduleSchema);
