const mongoose = require('mongoose');

const EmergencyTemporaryRecordSchema = new mongoose.Schema(
  {
    temporaryId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true
    },
    temporaryEmergencyId: {
      type: String, // e.g. TEMP-2026-00452
      required: true,
      unique: true,
      trim: true,
      index: true
    },
    provisionalName: {
      type: String,
      required: true,
      trim: true,
      default: 'Unknown Patient'
    },
    estimatedAge: {
      type: Number,
      default: null
    },
    gender: {
      type: String,
      enum: ['MALE', 'FEMALE', 'OTHER', 'UNDISCLOSED'],
      default: 'UNDISCLOSED'
    },
    apparentCondition: {
      type: String,
      default: ''
    },
    broughtBy: {
      name: { type: String, default: '' },
      relationship: { type: String, default: '' },
      contact: { type: String, default: '' }
    },
    emergencyVisitId: {
      type: String,
      required: true,
      index: true
    },
    discoveredPatientId: {
      type: String,
      default: null,
      index: true
    },
    linkedPatientId: {
      type: String,
      default: null,
      index: true
    },
    linkedPatientRef: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Patient',
      default: null
    },
    identityVerificationStatus: {
      type: String,
      enum: ['PENDING', 'VERIFIED', 'UNIDENTIFIED'],
      default: 'PENDING',
      index: true
    },
    status: {
      type: String,
      enum: ['ACTIVE', 'LINKED', 'CLOSED'],
      default: 'ACTIVE',
      index: true
    },
    linkedAt: {
      type: Date,
      default: null
    },
    linkedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    },
    correlationId: {
      type: String,
      index: true
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

module.exports = mongoose.model('EmergencyTemporaryRecord', EmergencyTemporaryRecordSchema);
