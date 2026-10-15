const mongoose = require('mongoose');

const shiftCoverageSchema = new mongoose.Schema(
  {
    coverageId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true
    },
    departmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Department',
      required: true,
      index: true
    },
    departmentCode: {
      type: String,
      trim: true
    },
    shiftId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Shift',
      required: true,
      index: true
    },
    shiftCode: {
      type: String,
      trim: true
    },
    date: {
      type: Date,
      required: true,
      index: true
    },
    requiredCount: {
      type: Number,
      required: true,
      default: 1
    },
    scheduledCount: {
      type: Number,
      default: 0
    },
    status: {
      type: String,
      enum: ['ADEQUATE', 'UNDERSTAFFED', 'OVERSTAFFED', 'REVIEW_REQUIRED'],
      default: 'ADEQUATE',
      index: true
    }
  },
  {
    timestamps: true
  }
);

shiftCoverageSchema.index({ departmentId: 1, shiftId: 1, date: 1 });

module.exports = mongoose.model('ShiftCoverage', shiftCoverageSchema);
