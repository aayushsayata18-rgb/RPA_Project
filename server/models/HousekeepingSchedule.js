const mongoose = require('mongoose');

const HousekeepingScheduleSchema = new mongoose.Schema(
  {
    scheduleId: {
      type: String,
      trim: true,
      index: true
    },
    scheduleCode: {
      type: String,
      trim: true,
      index: true
    },
    title: {
      type: String,
      default: ''
    },
    areaId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'HousekeepingArea',
      required: true,
      index: true
    },
    areaName: {
      type: String,
      default: ''
    },
    taskType: {
      type: String,
      default: 'ROUTINE_CLEANING'
    },
    frequency: {
      type: String,
      enum: ['HOURLY', 'SHIFT', 'DAILY', 'WEEKLY', 'MONTHLY', 'PERIODIC'],
      default: 'DAILY'
    },
    shiftType: {
      type: String,
      enum: ['MORNING', 'AFTERNOON', 'EVENING', 'NIGHT', 'ALL'],
      default: 'MORNING'
    },
    priority: {
      type: String,
      enum: ['LOW', 'ROUTINE', 'MEDIUM', 'HIGH', 'URGENT', 'CRITICAL', 'STAT'],
      default: 'ROUTINE'
    },
    defaultChecklistId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'HousekeepingChecklist'
    },
    assignedToUserId: {
      type: String,
      default: null
    },
    assignedToName: {
      type: String,
      default: ''
    },
    startDate: {
      type: Date,
      default: Date.now
    },
    endDate: {
      type: Date,
      default: null
    },
    nextDueDate: {
      type: Date,
      index: true
    },
    status: {
      type: String,
      enum: ['ACTIVE', 'INACTIVE', 'PAUSED'],
      default: 'ACTIVE',
      index: true
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

HousekeepingScheduleSchema.pre('save', function (next) {
  if (!this.scheduleCode && this.scheduleId) {
    this.scheduleCode = this.scheduleId;
  }
  if (!this.scheduleId && this.scheduleCode) {
    this.scheduleId = this.scheduleCode;
  }
  next();
});

module.exports = mongoose.models.HousekeepingSchedule || mongoose.model('HousekeepingSchedule', HousekeepingScheduleSchema);
