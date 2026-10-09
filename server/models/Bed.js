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
    bedCode: {
      type: String,
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
    roomId: {
      type: String,
      default: null,
      index: true
    },
    roomRef: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Room'
    },
    roomNumber: {
      type: String,
      default: ''
    },
    accommodationCategoryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'AccommodationCategory'
    },
    accommodationCategoryCode: {
      type: String,
      default: ''
    },
    bedType: {
      type: String,
      required: true,
      enum: ['GENERAL_WARD', 'SEMI_PRIVATE', 'PRIVATE_ROOM', 'ICU', 'HDU', 'ISOLATION', 'EMERGENCY_BED', 'OBSERVATION', 'OTHER'],
      default: 'GENERAL_WARD',
      index: true
    },
    status: {
      type: String,
      required: true,
      enum: [
        'AVAILABLE',
        'RESERVED',
        'OCCUPIED',
        'CLEANING_REQUIRED',
        'CLEANING',
        'MAINTENANCE',
        'OUT_OF_SERVICE',
        'BLOCKED'
      ],
      default: 'AVAILABLE',
      index: true
    },
    genderPolicy: {
      type: String,
      enum: ['ANY', 'MALE_ONLY', 'FEMALE_ONLY', 'SINGLE_OCCUPANCY'],
      default: 'ANY'
    },
    isolationCapability: {
      type: Boolean,
      default: false
    },
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
    equipmentCapabilities: [
      {
        type: String
      }
    ],
    equipment: [
      {
        type: String
      }
    ],
    clinicalCapabilities: [
      {
        type: String
      }
    ],
    accessibilityFeatures: [
      {
        type: String
      }
    ],
    currentAssignmentId: {
      type: String,
      default: null,
      index: true
    },
    currentAssignmentRef: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'BedAssignment',
      default: null
    },
    currentPatientId: {
      type: String,
      default: null,
      index: true
    },
    currentPatientRef: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Patient'
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
    reservationId: {
      type: String,
      default: null,
      index: true
    },
    reservationRef: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'BedReservation',
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
    maintenanceStatus: {
      type: String,
      enum: ['NONE', 'SCHEDULED', 'IN_PROGRESS', 'REPAIR_REQUIRED', 'COMPLETED'],
      default: 'NONE'
    },
    maintenanceReason: {
      type: String,
      default: ''
    },
    cleaningRequired: {
      type: Boolean,
      default: false
    },
    blockReason: {
      type: String,
      default: ''
    },
    dailyRate: {
      type: Number,
      default: 1500
    },
    baseRateReference: {
      type: Number,
      default: 1500
    },
    lastStatusChange: {
      type: Date,
      default: Date.now
    },
    active: {
      type: Boolean,
      default: true,
      index: true
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

BedSchema.pre('save', function (next) {
  if (this.bedId && !this.bedCode) this.bedCode = this.bedId;
  if (this.isIsolationCapable !== undefined) this.isolationCapability = this.isIsolationCapable;
  if (this.isolationCapability !== undefined) this.isIsolationCapable = this.isolationCapability;
  if (this.dailyRate && !this.baseRateReference) this.baseRateReference = this.dailyRate;
  if (this.equipment && (!this.equipmentCapabilities || this.equipmentCapabilities.length === 0)) {
    this.equipmentCapabilities = this.equipment;
  }
  next();
});

BedSchema.index({ wardId: 1, status: 1 });
BedSchema.index({ roomId: 1, status: 1 });
BedSchema.index({ bedType: 1, status: 1 });
BedSchema.index({ accommodationCategoryId: 1, status: 1 });

module.exports = mongoose.model('Bed', BedSchema);
