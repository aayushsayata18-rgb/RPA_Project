const mongoose = require('mongoose');

const leaveTypeSchema = new mongoose.Schema(
  {
    leaveTypeId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true
    },
    code: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
      index: true
    },
    name: {
      type: String,
      required: true,
      trim: true
    },
    description: {
      type: String,
      trim: true,
      default: ''
    },
    unit: {
      type: String,
      enum: ['DAYS', 'HOURS'],
      default: 'DAYS'
    },
    allowHalfDay: {
      type: Boolean,
      default: true
    },
    allowPartialDay: {
      type: Boolean,
      default: false
    },
    requiresDocument: {
      type: Boolean,
      default: false
    },
    documentRequiredAfterDays: {
      type: Number,
      default: 0
    },
    minimumNoticeHours: {
      type: Number,
      default: 0
    },
    maximumContinuousDays: {
      type: Number,
      default: null
    },
    balanceTracked: {
      type: Boolean,
      default: true
    },
    carryForwardAllowed: {
      type: Boolean,
      default: false
    },
    approvalRequired: {
      type: Boolean,
      default: true
    },
    status: {
      type: String,
      enum: ['DRAFT', 'ACTIVE', 'INACTIVE', 'ARCHIVED'],
      default: 'ACTIVE',
      index: true
    },
    isPaid: {
      type: Boolean,
      default: true
    },
    colorCode: {
      type: String,
      default: '#38bdf8'
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

module.exports = mongoose.model('LeaveType', leaveTypeSchema);
