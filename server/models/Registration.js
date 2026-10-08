const mongoose = require('mongoose');

const RegistrationSchema = new mongoose.Schema(
  {
    registrationId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true
    },
    patientId: {
      type: String, // e.g. P10001 or TEMP-XXXX
      required: true,
      index: true
    },
    patientRef: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Patient'
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
    source: {
      type: String,
      enum: ['ONLINE_SELF_REGISTRATION', 'FRONT_DESK', 'EMERGENCY', 'RPA_EXTERNAL'],
      required: true,
      default: 'FRONT_DESK'
    },
    status: {
      type: String,
      enum: [
        'DRAFT',
        'SUBMITTED',
        'VALIDATING',
        'IDENTITY_MATCH_PENDING',
        'IDENTITY_VERIFICATION_REQUIRED',
        'REGISTERED',
        'FAILED',
        'CANCELLED'
      ],
      default: 'REGISTERED',
      index: true
    },
    identityMatchStatus: {
      type: String,
      enum: ['NO_MATCH', 'HIGH_CONFIDENCE_MATCH', 'POSSIBLE_MATCH', 'VERIFIED_MANUAL'],
      default: 'NO_MATCH'
    },
    potentialMatches: [
      {
        patientId: String,
        fullName: String,
        mobile: String,
        dateOfBirth: Date,
        gender: String,
        matchScore: Number,
        matchReasons: [String]
      }
    ],
    submittedData: {
      type: mongoose.Schema.Types.Mixed,
      default: {}
    },
    submittedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    submittedByName: {
      type: String,
      default: ''
    },
    submittedAt: {
      type: Date,
      default: Date.now
    },
    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    },
    reviewedByName: {
      type: String,
      default: null
    },
    reviewedAt: {
      type: Date,
      default: null
    },
    reviewNotes: {
      type: String,
      default: ''
    },
    failureReason: {
      type: String,
      default: null
    },
    correlationId: {
      type: String,
      index: true
    },
    notificationStatus: {
      type: String,
      enum: ['PENDING', 'SENT', 'FAILED', 'NOT_APPLICABLE'],
      default: 'PENDING'
    },
    documentId: {
      type: String,
      default: null
    }
  },
  {
    timestamps: true
  }
);

RegistrationSchema.index({ createdAt: -1 });
RegistrationSchema.index({ status: 1, createdAt: -1 });

module.exports = mongoose.model('Registration', RegistrationSchema);
