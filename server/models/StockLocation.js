const mongoose = require('mongoose');

const stockLocationSchema = new mongoose.Schema(
  {
    locationId: {
      type: String,
      required: true,
      unique: true,
      index: true
    },
    locationCode: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      uppercase: true,
      index: true
    },
    locationName: {
      type: String,
      required: true,
      trim: true
    },
    locationType: {
      type: String,
      required: true,
      enum: [
        'MAIN_STORE',
        'PHARMACY_STORE',
        'EMERGENCY_STORE',
        'OT_STORE',
        'LAB_STORE',
        'RADIOLOGY_STORE',
        'WARD_STORE',
        'ICU_STORE',
        'QUARANTINE_AREA',
        'COLD_STORAGE',
        'OTHER'
      ],
      default: 'MAIN_STORE',
      index: true
    },
    departmentId: {
      type: String,
      default: ''
    },
    parentLocationId: {
      type: String,
      default: null,
      index: true
    },
    address: {
      building: { type: String, default: 'Main Hospital Building' },
      floor: { type: String, default: 'Ground Floor' },
      room: { type: String, default: '' },
      shelfRack: { type: String, default: '' }
    },
    temperatureControlled: {
      type: Boolean,
      default: false
    },
    temperatureRange: {
      type: String,
      default: '15°C - 25°C'
    },
    securityLevel: {
      type: String,
      enum: ['NORMAL', 'RESTRICTED', 'HIGH_SECURITY'],
      default: 'NORMAL'
    },
    capacity: {
      type: Number,
      default: 10000
    },
    status: {
      type: String,
      enum: ['ACTIVE', 'INACTIVE', 'MAINTENANCE'],
      default: 'ACTIVE',
      index: true
    },
    managerUserId: {
      type: String,
      default: ''
    }
  },
  {
    timestamps: true
  }
);

stockLocationSchema.index({ locationType: 1, status: 1 });

module.exports = mongoose.model('StockLocation', stockLocationSchema);
