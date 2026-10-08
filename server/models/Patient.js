const mongoose = require('mongoose');

const PatientSchema = new mongoose.Schema(
  {
    patientId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true
    },
    firstName: {
      type: String,
      required: true,
      trim: true
    },
    middleName: {
      type: String,
      trim: true,
      default: ''
    },
    lastName: {
      type: String,
      required: true,
      trim: true
    },
    fullName: {
      type: String,
      trim: true,
      index: true
    },
    dateOfBirth: {
      type: Date,
      required: true,
      index: true
    },
    gender: {
      type: String,
      required: true,
      enum: ['MALE', 'FEMALE', 'OTHER', 'UNDISCLOSED'],
      index: true
    },
    bloodGroup: {
      type: String,
      enum: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-', 'UNKNOWN', ''],
      default: 'UNKNOWN'
    },
    mobile: {
      type: String,
      required: true,
      trim: true,
      index: true
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
      index: true,
      default: ''
    },
    address: {
      line1: { type: String, trim: true, default: '' },
      line2: { type: String, trim: true, default: '' },
      city: { type: String, trim: true, default: '' },
      state: { type: String, trim: true, default: '' },
      country: { type: String, trim: true, default: 'India' },
      postalCode: { type: String, trim: true, default: '' }
    },
    emergencyContact: {
      name: { type: String, trim: true, default: '' },
      relationship: { type: String, trim: true, default: '' },
      mobile: { type: String, trim: true, default: '' }
    },
    identityDocuments: [
      {
        type: {
          type: String,
          enum: ['AADHAAR', 'PASSPORT', 'DRIVING_LICENSE', 'VOTER_ID', 'PAN_CARD', 'NATIONAL_ID', 'OTHER'],
          required: true
        },
        reference: {
          type: String,
          trim: true,
          required: true
        },
        verified: {
          type: Boolean,
          default: false
        },
        verifiedAt: {
          type: Date
        },
        verifiedBy: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User'
        }
      }
    ],
    communicationPreferences: {
      sms: { type: Boolean, default: true },
      email: { type: Boolean, default: true },
      whatsapp: { type: Boolean, default: false }
    },
    status: {
      type: String,
      enum: ['ACTIVE', 'INACTIVE', 'TEMPORARY_EMERGENCY', 'IDENTITY_PENDING', 'MERGED'],
      default: 'ACTIVE',
      index: true
    },
    registrationSource: {
      type: String,
      enum: ['ONLINE_SELF_REGISTRATION', 'FRONT_DESK', 'EMERGENCY', 'LEGACY_IMPORT', 'RPA_EXTERNAL'],
      default: 'FRONT_DESK'
    },
    identityVerificationStatus: {
      type: String,
      enum: ['VERIFIED', 'PENDING', 'REJECTED', 'NOT_REQUIRED'],
      default: 'VERIFIED'
    },
    mergedIntoPatientId: {
      type: String,
      default: null
    },
    notes: {
      type: String,
      default: ''
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  },
  {
    timestamps: true
  }
);

// Pre-save hook to ensure fullName is populated and normalized
PatientSchema.pre('save', function (next) {
  const parts = [this.firstName, this.middleName, this.lastName].filter(Boolean);
  this.fullName = parts.join(' ').trim();
  next();
});

// Indexes for high-frequency searching & duplicate checks
PatientSchema.index({ fullName: 'text' });
PatientSchema.index({ dateOfBirth: 1, gender: 1 });
PatientSchema.index({ 'identityDocuments.reference': 1 });

module.exports = mongoose.model('Patient', PatientSchema);
