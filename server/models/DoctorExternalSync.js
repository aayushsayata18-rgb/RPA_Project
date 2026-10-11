const mongoose = require('mongoose');

const doctorExternalSyncSchema = new mongoose.Schema(
  {
    syncId: {
      type: String,
      unique: true,
      index: true
    },
    doctorId: {
      type: String,
      required: true,
      ref: 'Doctor',
      index: true
    },
    externalSystem: {
      type: String,
      required: true, // e.g. 'LEGACY_HIS', 'NATIONAL_REGISTRY', 'CLINICAL_PORTAL'
      default: 'LEGACY_HIS'
    },
    externalDoctorId: {
      type: String,
      default: ''
    },
    syncType: {
      type: String,
      enum: ['PROFILE_SYNC', 'SCHEDULE_SYNC', 'AVAILABILITY_SYNC', 'DEPARTMENT_SYNC'],
      default: 'PROFILE_SYNC'
    },
    status: {
      type: String,
      enum: ['NOT_SYNCED', 'PENDING', 'SYNCING', 'SYNCED', 'FAILED', 'MANUAL_REVIEW'],
      default: 'PENDING'
    },
    lastSyncedAt: {
      type: Date,
      default: null
    },
    lastAttemptAt: {
      type: Date,
      default: Date.now
    },
    errorCode: {
      type: String,
      default: null
    },
    errorMessage: {
      type: String,
      default: null
    },
    payloadSummary: {
      type: mongoose.Schema.Types.Mixed,
      default: {}
    },
    rpaJobId: {
      type: String,
      default: null
    },
    correlationId: {
      type: String,
      default: null
    },
    verifiedByReadBack: {
      type: Boolean,
      default: false
    }
  },
  {
    timestamps: true
  }
);

doctorExternalSyncSchema.pre('save', function (next) {
  if (!this.syncId) {
    this.syncId = `SYNC-DOC-${Date.now().toString(36).toUpperCase()}-${Math.floor(Math.random() * 1000)}`;
  }
  next();
});

doctorExternalSyncSchema.index({ doctorId: 1, externalSystem: 1 });
doctorExternalSyncSchema.index({ status: 1 });

module.exports = mongoose.model('DoctorExternalSync', doctorExternalSyncSchema);
