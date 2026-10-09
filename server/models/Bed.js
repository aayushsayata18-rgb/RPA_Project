const mongoose = require('mongoose');

const BedSchema = new mongoose.Schema(
  {
    bedId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true
    },
    bedNumber: {
      type: String,
      required: true,
      trim: true,
      index: true
    },
    wardId: {
      type: String,
      required: true,
      index: true
    },
    wardRef: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Ward'
    },
    wardName: {
      type: String,
      default: ''
    },
    bedType: {
      type: String,
      required: true,
      enum: ['GENERAL_WARD', 'SEMI_PRIVATE', 'PRIVATE_ROOM', 'ICU', 'EMERGENCY_BED', 'OBSERVATION'],
      default: 'GENERAL_WARD',
      index: true
    },
    status: {
      type: String,
      required: true,
      enum: ['AVAILABLE', 'RESERVED', 'OCCUPIED', 'CLEANING', 'MAINTENANCE', 'BLOCKED'],
      default: 'AVAILABLE',
      index: true
    },
    currentPatientId: {
      type: String,
      default: null,
      index: true
    },
    currentPatientName: {
      type: String,
      default: ''
    },
    currentAdmissionId: {
      type: String,
      default: null,
      index: true
    },
    currentAdmissionRef: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Admission',
      default: null
    },
    reservedForPatientId: {
      type: String,
      default: null,
      index: true
    },
    reservedForAdmissionRequestId: {
      type: String,
      default: null,
      index: true
    },
    reservationExpiresAt: {
      type: Date,
      default: null
    },
    dailyRate: {
      type: Number,
      default: 1500
    },
    equipment: [
      {
        type: String
      }
    ],
    isIsolationCapable: {
      type: Boolean,
      default: false
    },
    isOxygenSupported: {
      type: Boolean,
      default: true
    },
    isVentilatorSupported: {
      type: Boolean,
      default: false
    },
    lastStatusChange: {
      type: Date,
      default: Date.now
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

BedSchema.index({ wardId: 1, status: 1 });
BedSchema.index({ bedType: 1, status: 1 });

module.exports = mongoose.model('Bed', BedSchema);
