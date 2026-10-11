const mongoose = require('mongoose');

const shiftSchema = new mongoose.Schema(
  {
    shiftName: {
      type: String,
      default: 'Regular'
    },
    startTime: {
      type: String,
      required: true
    },
    endTime: {
      type: String,
      required: true
    }
  },
  { _id: false }
);

const breakSchema = new mongoose.Schema(
  {
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
      type: String,
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
    scheduleId: {
      type: String,
      default: null,
      index: true
    },
    doctorId: {
      type: String,
      required: true,
      ref: 'Doctor',
      index: true
    },
    departmentId: {
      type: String,
      default: '',
      ref: 'Department'
    },
    departmentName: {
      type: String,
      default: ''
    },
    // 0 = Sunday, 1 = Monday, 2 = Tuesday, 3 = Wednesday, 4 = Thursday, 5 = Friday, 6 = Saturday
    dayOfWeek: {
      type: Number,
      min: 0,
      max: 6,
      default: null
    },
    dayOfWeekName: {
      type: String,
      enum: ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', ''],
      default: ''
    },
    startTime: {
      type: String, // "09:00"
      default: ''
    },
    endTime: {
      type: String, // "13:00"
      default: ''
    },
    slotDurationMinutes: {
      type: Number,
      default: 30
    },
    maxCapacityPerSlot: {
      type: Number,
      default: 1
    },
    locationId: {
      type: String,
      default: ''
    },
    roomNumber: {
      type: String,
      default: ''
    },
    effectiveFrom: {
      type: Date,
      default: Date.now
    },
    effectiveTo: {
      type: Date,
      default: null
    },
    status: {
      type: String,
      enum: ['DRAFT', 'PENDING_APPROVAL', 'ACTIVE', 'INACTIVE', 'CANCELLED'],
      default: 'ACTIVE',
      index: true
    },
    notes: {
      type: String,
      default: ''
    },

    // Backward compatibility for legacy appointment booking weekly availability:
    weeklyAvailability: [weeklyAvailabilitySchema],
    defaultMaxCapacityPerSlot: {
      type: Number,
      default: 1
    },
    leaves: [leaveSchema],
    blockedSlots: [blockedSlotSchema],
    isActive: {
      type: Boolean,
      default: true
    },

    createdBy: {
      type: String,
      default: 'SYSTEM'
    },
    updatedBy: {
      type: String,
      default: 'SYSTEM'
    }
  },
  {
    timestamps: true
  }
);

// Auto-fill dayOfWeekName if dayOfWeek number is provided
const dayNames = ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'];
doctorScheduleSchema.pre('save', function (next) {
  if (this.dayOfWeek !== null && this.dayOfWeek !== undefined && !this.dayOfWeekName) {
    this.dayOfWeekName = dayNames[this.dayOfWeek];
  }
  if (!this.scheduleId) {
    this.scheduleId = `SCH-${Date.now().toString(36).toUpperCase()}-${Math.floor(Math.random() * 1000)}`;
  }
  next();
});

// Indexes per Section 62 of 11_DOCTOR_MANAGEMENT.md
doctorScheduleSchema.index({
  doctorId: 1,
  effectiveFrom: 1,
  effectiveTo: 1
});

doctorScheduleSchema.index({
  departmentId: 1,
  dayOfWeek: 1
});

module.exports = mongoose.model('DoctorSchedule', doctorScheduleSchema);
