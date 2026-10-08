const mongoose = require('mongoose');

const VisitSchema = new mongoose.Schema(
  {
    visitId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true
    },
    patientId: {
      type: String, // String reference to permanent patientId e.g. P10001 or TEMP-XXXX
      required: true,
      index: true
    },
    patientRef: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Patient'
    },
    visitType: {
      type: String,
      required: true,
      enum: ['OPD', 'EMERGENCY', 'FOLLOW_UP', 'DIAGNOSTIC', 'OTHER'],
      default: 'OPD',
      index: true
    },
    registrationId: {
      type: String,
      index: true
    },
    appointmentId: {
      type: String,
      default: null,
      index: true
    },
    department: {
      type: String,
      trim: true,
      default: 'GENERAL_MEDICINE'
    },
    departmentId: {
      type: mongoose.Schema.Types.ObjectId,
      default: null
    },
    consultingDoctorId: {
      type: String,
      default: null
    },
    checkInStatus: {
      type: String,
      enum: ['PENDING', 'CHECKED_IN', 'IN_CONSULTATION', 'COMPLETED', 'NO_SHOW', 'CANCELLED'],
      default: 'PENDING'
    },
    status: {
      type: String,
      enum: ['SCHEDULED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'ADMITTED', 'DISCHARGED'],
      default: 'IN_PROGRESS',
      index: true
    },
    visitDate: {
      type: Date,
      default: Date.now,
      index: true
    },
    startTime: {
      type: Date,
      default: Date.now
    },
    endTime: {
      type: Date,
      default: null
    },
    registrationSource: {
      type: String,
      enum: ['ONLINE_SELF_REGISTRATION', 'FRONT_DESK', 'EMERGENCY', 'RPA_EXTERNAL'],
      default: 'FRONT_DESK'
    },
    priority: {
      type: String,
      enum: ['NORMAL', 'URGENT', 'EMERGENCY'],
      default: 'NORMAL'
    },
    chiefComplaint: {
      type: String,
      trim: true,
      default: ''
    },
    notes: {
      type: String,
      default: ''
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  },
  {
    timestamps: true
  }
);

VisitSchema.index({ patientId: 1, visitDate: -1 });
VisitSchema.index({ status: 1, visitDate: -1 });

module.exports = mongoose.model('Visit', VisitSchema);
