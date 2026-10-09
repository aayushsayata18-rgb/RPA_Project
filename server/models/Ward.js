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
    name: {
      type: String,
      required: true,
      trim: true
    },
    departmentId: {
      type: String,
      default: 'DEP-GMED',
      index: true
    },
    departmentName: {
      type: String,
      default: 'General Medicine'
    },
    wardType: {
      type: String,
      required: true,
      enum: ['GENERAL_WARD', 'SEMI_PRIVATE', 'PRIVATE_ROOM', 'ICU', 'EMERGENCY_WARD', 'OBSERVATION'],
      default: 'GENERAL_WARD',
      index: true
    },
    floor: {
      type: String,
      default: '1st Floor'
    },
    wing: {
      type: String,
      default: 'East Wing'
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
    baseRatePerDay: {
      type: Number,
      default: 1000
    },
    nurseInCharge: {
      type: String,
      default: ''
    },
    isActive: {
      type: Boolean,
      default: true
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model('Ward', WardSchema);
