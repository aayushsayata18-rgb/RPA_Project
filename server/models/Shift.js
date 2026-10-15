const mongoose = require('mongoose');

const shiftSchema = new mongoose.Schema(
  {
    shiftId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true
    },
    shiftCode: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
      index: true
    },
    shiftName: {
      type: String,
      required: true,
      trim: true
    },
    shiftType: {
      type: String,
      enum: ['MORNING', 'GENERAL', 'EVENING', 'NIGHT', 'ROTATIONAL', 'CUSTOM'],
      default: 'GENERAL',
      index: true
    },
    startTime: {
      type: String,
      required: true,
      trim: true // HH:mm format, e.g. "09:00"
    },
    endTime: {
      type: String,
      required: true,
      trim: true // HH:mm format, e.g. "18:00"
    },
    crossesMidnight: {
      type: Boolean,
      default: false
    },
    breakMinutes: {
      type: Number,
      default: 60,
      min: 0
    },
    graceBeforeMinutes: {
      type: Number,
      default: 30,
      min: 0
    },
    graceAfterMinutes: {
      type: Number,
      default: 30,
      min: 0
    },
    departmentIds: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Department'
      }
    ],
    departmentCodes: [
      {
        type: String,
        trim: true
      }
    ],
    status: {
      type: String,
      enum: ['DRAFT', 'ACTIVE', 'INACTIVE', 'ARCHIVED'],
      default: 'ACTIVE',
      index: true
    },
    shiftCategory: {
      type: String,
      enum: ['STANDARD', 'NIGHT', 'WEEKEND', 'HOLIDAY', 'EMERGENCY'],
      default: 'STANDARD'
    },
    compensationCategory: {
      type: String,
      default: 'STANDARD'
    },
    description: {
      type: String,
      trim: true,
      default: ''
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  },
  {
    timestamps: true
  }
);

shiftSchema.index({ status: 1, shiftCode: 1 });

module.exports = mongoose.model('Shift', shiftSchema);
