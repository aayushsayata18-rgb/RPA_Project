const mongoose = require('mongoose');

const shiftSchema = new mongoose.Schema(
  {
    shiftName: {
      type: String,
      default: 'Regular'
    },
    startTime: {
      type: String, // e.g. "09:00"
      required: true
    },
    endTime: {
      type: String, // e.g. "12:00"
      required: true
    }
  },
  { _id: false }
);

const breakSchema = new mongoose.Schema(
  {
    startTime: {
      type: String, // e.g. "13:00"
      required: true
    },
    endTime: {
      type: String, // e.g. "14:00"
      required: true
    },
    reason: {
      type: String,
      default: 'Lunch Break'
    }
  },
  { _id: false }
);

const leaveSchema = new mongoose.Schema(
  {
    startDate: {
      type: Date,
      required: true
    },
    endDate: {
      type: Date,
      required: true
    },
    reason: {
      type: String,
      default: 'Leave'
    },
    status: {
      type: String,
      enum: ['REQUESTED', 'APPROVED', 'REJECTED'],
      default: 'APPROVED'
    }
  },
  { _id: false }
);

const blockedSlotSchema = new mongoose.Schema(
  {
    date: {
      type: String, // "YYYY-MM-DD"
      required: true
    },
    startTime: {
      type: String,
      required: true
    },
    endTime: {
      type: String,
      required: true
    },
    reason: {
      type: String,
      default: 'Blocked by Clinic'
    }
  },
  { _id: false }
);

const weeklyAvailabilitySchema = new mongoose.Schema(
  {
    dayOfWeek: {
      type: String,
      enum: ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY'],
      required: true
    },
    isAvailable: {
      type: Boolean,
      default: true
    },
    shifts: [shiftSchema],
    breaks: [breakSchema],
    maxCapacityPerSlot: {
      type: Number,
      default: 1
    }
  },
  { _id: false }
);

const doctorScheduleSchema = new mongoose.Schema(
  {
    doctorId: {
      type: String,
      required: true,
      unique: true,
      ref: 'Doctor'
    },
    weeklyAvailability: [weeklyAvailabilitySchema],
    slotDurationMinutes: {
      type: Number,
      default: 30
    },
    defaultMaxCapacityPerSlot: {
      type: Number,
      default: 1
    },
    leaves: [leaveSchema],
    blockedSlots: [blockedSlotSchema],
    isActive: {
      type: Boolean,
      default: true
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model('DoctorSchedule', doctorScheduleSchema);
