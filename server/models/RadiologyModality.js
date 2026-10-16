const mongoose = require('mongoose');

const radiologyModalitySchema = new mongoose.Schema(
  {
    modalityId: {
      type: String,
      required: true,
      unique: true,
      index: true
    },
    name: {
      type: String,
      required: true,
      trim: true
    },
    type: {
      type: String,
      enum: ['X_RAY', 'CT', 'MRI', 'ULTRASOUND', 'MAMMOGRAPHY', 'PET_SCAN', 'FLUOROSCOPY', 'DEXA', 'OTHER'],
      required: true,
      index: true
    },
    departmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Department',
      default: null
    },
    location: {
      type: String,
      default: 'Radiology Wing, Ground Floor'
    },
    room: {
      type: String,
      required: true
    },
    manufacturer: {
      type: String,
      default: ''
    },
    model: {
      type: String,
      default: ''
    },
    serialReference: {
      type: String,
      default: ''
    },
    status: {
      type: String,
      enum: ['AVAILABLE', 'RESERVED', 'IN_USE', 'MAINTENANCE', 'OUT_OF_SERVICE', 'DECOMMISSIONED'],
      default: 'AVAILABLE',
      index: true
    },
    operatingHours: {
      start: { type: String, default: '08:00' },
      end: { type: String, default: '20:00' },
      slotDurationMinutes: { type: Number, default: 30 },
      bufferMinutes: { type: Number, default: 10 },
      workingDays: {
        type: [String],
        default: ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY']
      }
    },
    maintenanceSchedule: {
      nextMaintenanceDate: { type: Date, default: null },
      lastMaintenanceDate: { type: Date, default: null },
      maintenanceFrequencyDays: { type: Number, default: 90 },
      notes: { type: String, default: '' }
    },
    externalSystemId: {
      type: String,
      default: ''
    }
  },
  {
    timestamps: true
  }
);

radiologyModalitySchema.index({ type: 1, status: 1 });
radiologyModalitySchema.index({ room: 1 });

module.exports = mongoose.model('RadiologyModality', radiologyModalitySchema);
