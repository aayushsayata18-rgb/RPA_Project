const mongoose = require('mongoose');

const employeeAvailabilitySchema = new mongoose.Schema(
  {
    availabilityId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true
    },
    employeeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Employee',
      required: true,
      index: true
    },
    employeeIdCode: {
      type: String,
      required: true,
      trim: true,
      index: true
    },
    date: {
      type: Date,
      required: true,
      index: true
    },
    availableFrom: {
      type: String,
      default: '00:00'
    },
    availableTo: {
      type: String,
      default: '23:59'
    },
    availabilityStatus: {
      type: String,
      enum: ['AVAILABLE', 'UNAVAILABLE', 'PREFERRED', 'RESTRICTED'],
      default: 'AVAILABLE',
      index: true
    },
    preferredShiftId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Shift',
      default: null
    },
    avoidShiftId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Shift',
      default: null
    },
    reason: {
      type: String,
      default: ''
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  },
  {
    timestamps: true
  }
);

employeeAvailabilitySchema.index({ employeeId: 1, date: 1 }, { unique: true });

module.exports = mongoose.model('EmployeeAvailability', employeeAvailabilitySchema);
