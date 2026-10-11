const mongoose = require('mongoose');

const doctorAvailabilitySchema = new mongoose.Schema(
  {
    availabilityId: {
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
    date: {
      type: Date,
      required: true
    },
    dateStr: {
      type: String, // "YYYY-MM-DD"
      default: ''
    },
    startTime: {
      type: String, // "09:00"
      default: ''
    },
    endTime: {
      type: String, // "18:00"
      default: ''
    },
    status: {
      type: String,
      enum: ['AVAILABLE', 'UNAVAILABLE', 'LEAVE', 'SPECIAL_AVAILABILITY'],
      default: 'AVAILABLE',
      index: true
    },
    reason: {
      type: String,
      default: ''
    },
    source: {
      type: String,
      enum: ['MANUAL', 'LEAVE_MANAGEMENT', 'SHIFT_MANAGEMENT', 'SCHEDULE_EXCEPTION', 'SYSTEM'],
      default: 'MANUAL'
    },
    createdBy: {
      type: String,
      default: 'SYSTEM'
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

doctorAvailabilitySchema.pre('save', function (next) {
  if (!this.availabilityId) {
    this.availabilityId = `AVL-${Date.now().toString(36).toUpperCase()}-${Math.floor(Math.random() * 1000)}`;
  }
  if (this.date && !this.dateStr) {
    const d = new Date(this.date);
    this.dateStr = d.toISOString().split('T')[0];
  }
  next();
});

// Index per Section 62 of 11_DOCTOR_MANAGEMENT.md
doctorAvailabilitySchema.index({
  doctorId: 1,
  date: 1
});

module.exports = mongoose.model('DoctorAvailability', doctorAvailabilitySchema);
