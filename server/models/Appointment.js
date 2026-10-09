const mongoose = require('mongoose');

const appointmentSchema = new mongoose.Schema(
  {
    appointmentId: {
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
    patientRef: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Patient',
      default: null
    },
    patientName: {
      type: String,
      default: ''
    },
    patientPhone: {
      type: String,
      default: ''
    },
    patientEmail: {
      type: String,
      default: ''
    },
    visitId: {
      type: String,
      default: null
    },
    doctorId: {
      type: String,
      required: true,
      index: true
    },
    doctorRef: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Doctor',
      default: null
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
      default: ''
    },
    specialty: {
      type: String,
      required: true
    },
    referringDoctorId: {
      type: String,
      default: null
    },
    referringDoctorName: {
      type: String,
      default: null
    },
    referralReason: {
      type: String,
      default: null
    },
    referralReference: {
      type: String,
      default: null
    },
    appointmentDate: {
      type: Date,
      required: true,
      index: true
    },
    appointmentDateStr: {
      type: String, // "YYYY-MM-DD"
      required: true,
      index: true
    },
    startTime: {
      type: String, // "10:30"
      required: true
    },
    endTime: {
      type: String, // "11:00"
      required: true
    },
    slotDurationMinutes: {
      type: Number,
      default: 30
    },
    appointmentType: {
      type: String,
      enum: ['NEW_CONSULTATION', 'FOLLOW_UP', 'REFERRED_CONSULTATION', 'DIAGNOSTIC', 'PROCEDURE', 'OTHER'],
      default: 'NEW_CONSULTATION'
    },
    source: {
      type: String,
      enum: ['PATIENT_PORTAL', 'FRONT_DESK', 'DOCTOR_REFERRAL', 'ADMINISTRATIVE_BOOKING', 'RPA'],
      default: 'PATIENT_PORTAL'
    },
    status: {
      type: String,
      enum: [
        'REQUESTED',
        'PENDING_REVIEW',
        'SCHEDULED',
        'CONFIRMED',
        'CHECKED_IN',
        'IN_PROGRESS',
        'COMPLETED',
        'CANCELLED',
        'RESCHEDULED',
        'NO_SHOW',
        'EXPIRED'
      ],
      default: 'CONFIRMED',
      index: true
    },
    bookingReference: {
      type: String,
      default: ''
    },
    reason: {
      type: String,
      default: ''
    },
    notes: {
      type: String,
      default: ''
    },
    cancellationReason: {
      type: String,
      enum: ['PATIENT_REQUEST', 'DOCTOR_UNAVAILABLE', 'HOSPITAL_CANCELLATION', 'DUPLICATE_BOOKING', 'OTHER', null],
      default: null
    },
    cancellationNotes: {
      type: String,
      default: ''
    },
    cancelledAt: {
      type: Date,
      default: null
    },
    cancelledBy: {
      type: String,
      default: null
    },
    rescheduledFromAppointmentId: {
      type: String,
      default: null
    },
    rescheduledToAppointmentId: {
      type: String,
      default: null
    },
    rescheduledAt: {
      type: Date,
      default: null
    },
    checkInStatus: {
      type: String,
      enum: ['NOT_CHECKED_IN', 'CHECKED_IN', 'LATE', 'NO_SHOW'],
      default: 'NOT_CHECKED_IN'
    },
    checkedInAt: {
      type: Date,
      default: null
    },
    reminderStatus: {
      type: String,
      enum: ['PENDING', 'SCHEDULED', 'SENT', 'DELIVERED', 'FAILED', 'CANCELLED'],
      default: 'SCHEDULED'
    },
    confirmationStatus: {
      type: String,
      enum: ['CONFIRMED', 'FAILED', 'PENDING'],
      default: 'CONFIRMED'
    },
    consultationFee: {
      type: Number,
      default: 500
    },
    roomNumber: {
      type: String,
      default: 'OPD-101'
    },
    correlationId: {
      type: String,
      required: true
    },
    idempotencyKey: {
      type: String,
      default: null,
      index: true
    },
    externalSystemReference: {
      type: String,
      default: null
    },
    externalSyncStatus: {
      type: String,
      enum: ['NOT_REQUIRED', 'PENDING', 'SYNCED', 'FAILED'],
      default: 'NOT_REQUIRED'
    },
    createdBy: {
      type: String,
      default: 'SYSTEM'
    },
    updatedBy: {
      type: String,
      default: 'SYSTEM'
    }
  },
  {
    timestamps: true
  }
);

// Compound Indexes for high performance and integrity
appointmentSchema.index({ patientId: 1, appointmentDateStr: 1 });
appointmentSchema.index({ doctorId: 1, appointmentDateStr: 1, startTime: 1 });
appointmentSchema.index({ status: 1, appointmentDateStr: 1 });
appointmentSchema.index({ departmentId: 1, appointmentDateStr: 1 });

module.exports = mongoose.model('Appointment', appointmentSchema);
