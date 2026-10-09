const mongoose = require('mongoose');

const WardSchema = new mongoose.Schema(
  {
    wardId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true
    },
    wardCode: {
      type: String,
      trim: true,
      index: true
    },
    wardName: {
      type: String,
      required: true,
      trim: true
    },
    name: {
      type: String,
      trim: true
    },
    floor: {
      type: String,
      default: '1st Floor'
    },
    wing: {
      type: String,
      default: 'East Wing'
    },
    departmentId: {
      type: String,
      default: 'DEP-GMED',
      index: true
    },
    departmentRef: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Department'
    },
    departmentName: {
      type: String,
      default: 'General Medicine'
    },
    wardType: {
      type: String,
      required: true,
      enum: ['GENERAL_WARD', 'SEMI_PRIVATE', 'PRIVATE_ROOM', 'ICU', 'HDU', 'ISOLATION', 'EMERGENCY_WARD', 'OBSERVATION', 'OTHER'],
      default: 'GENERAL_WARD',
      index: true
    },
    accommodationCategoryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'AccommodationCategory'
    },
    accommodationCategoryCode: {
      type: String,
      default: ''
    },
    genderPolicy: {
      type: String,
      enum: ['ANY', 'MALE_ONLY', 'FEMALE_ONLY', 'SINGLE_OCCUPANCY'],
      default: 'ANY'
    },
    isolationSupported: {
      type: Boolean,
      default: false
    },
    totalBeds: {
      type: Number,
      default: 0
    },
    availableBeds: {
      type: Number,
      default: 0
    },
    occupiedBeds: {
      type: Number,
      default: 0
    },
    reservedBeds: {
      type: Number,
      default: 0
    },
    cleaningBeds: {
      type: Number,
      default: 0
    },
    maintenanceBeds: {
      type: Number,
      default: 0
    },
    blockedBeds: {
      type: Number,
      default: 0
    },
    baseRatePerDay: {
      type: Number,
      default: 1000
    },
    nurseInCharge: {
      type: String,
      default: ''
    },
    active: {
      type: Boolean,
      default: true,
      index: true
    },
    isActive: {
      type: Boolean,
      default: true
    },
    description: {
      type: String,
      default: ''
    }
  },
  {
    timestamps: true
  }
);

WardSchema.pre('save', function (next) {
  if (this.wardName && !this.name) this.name = this.wardName;
  if (this.name && !this.wardName) this.wardName = this.name;
  if (this.wardId && !this.wardCode) this.wardCode = this.wardId;
  if (this.isActive !== undefined && this.active === undefined) this.active = this.isActive;
  if (this.active !== undefined && this.isActive === undefined) this.isActive = this.active;
  next();
});

module.exports = mongoose.model('Ward', WardSchema);
