const mongoose = require('mongoose');

const HousekeepingAreaSchema = new mongoose.Schema(
  {
    areaId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true
    },
    areaCode: {
      type: String,
      trim: true,
      default: ''
    },
    name: {
      type: String,
      required: true,
      trim: true
    },
    areaType: {
      type: String,
      enum: [
        'PATIENT_ROOM',
        'WARD',
        'ICU',
        'OPD',
        'WAITING_AREA',
        'CORRIDOR',
        'RECEPTION',
        'LABORATORY',
        'RADIOLOGY',
        'PHARMACY',
        'OFFICE',
        'RESTROOM',
        'CAFETERIA',
        'STORAGE',
        'OTHER'
      ],
      default: 'PATIENT_ROOM',
      index: true
    },
    buildingId: {
      type: String,
      default: ''
    },
    floorId: {
      type: String,
      default: ''
    },
    departmentId: {
      type: String,
      default: ''
    },
    roomId: {
      type: String,
      default: ''
    },
    bedId: {
      type: String,
      default: '',
      index: true
    },
    status: {
      type: String,
      enum: [
        'AVAILABLE',
        'OCCUPIED',
        'CLEANING_REQUIRED',
        'CLEANING_IN_PROGRESS',
        'PENDING_INSPECTION',
        'RESTRICTED',
        'OUT_OF_SERVICE',
        'INACTIVE'
      ],
      default: 'AVAILABLE',
      index: true
    },
    cleaningFrequency: {
      type: String,
      default: 'DAILY'
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

module.exports = mongoose.models.HousekeepingArea || mongoose.model('HousekeepingArea', HousekeepingAreaSchema);
