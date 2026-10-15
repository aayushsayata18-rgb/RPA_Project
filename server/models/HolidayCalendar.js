const mongoose = require('mongoose');

const holidayCalendarSchema = new mongoose.Schema(
  {
    holidayId: {
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
    date: {
      type: Date,
      required: true,
      index: true
    },
    holidayName: {
      type: String,
      required: true,
      trim: true
    },
    holidayType: {
      type: String,
      enum: ['PUBLIC', 'HOSPITAL_MANDATORY', 'RESTRICTED', 'OPTIONAL'],
      default: 'PUBLIC'
    },
    year: {
      type: Number,
      required: true,
      index: true
    },
    applicableDepartments: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Department'
      }
    ],
    applicableEmployeeTypes: [
      {
        type: String // e.g. ['DOCTOR', 'NURSE', 'ADMINISTRATIVE']
      }
    ],
    isAllDepartments: {
      type: Boolean,
      default: true
    },
    status: {
      type: String,
      enum: ['ACTIVE', 'INACTIVE'],
      default: 'ACTIVE',
      index: true
    },
    description: {
      type: String,
      default: ''
    },
    createdBy: {
      type: String,
      default: 'SYSTEM'
    }
  },
  {
    timestamps: true
  }
);

holidayCalendarSchema.index({ date: 1, status: 1 });
holidayCalendarSchema.index({ year: 1, status: 1 });

module.exports = mongoose.model('HolidayCalendar', holidayCalendarSchema);
