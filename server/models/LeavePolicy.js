const mongoose = require('mongoose');

const leavePolicySchema = new mongoose.Schema(
  {
    policyId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true
    },
    policyCode: {
      type: String,
      required: true,
      trim: true,
      index: true
    },
    version: {
      type: Number,
      required: true,
      default: 1,
      index: true
    },
    name: {
      type: String,
      required: true,
      trim: true
    },
    description: {
      type: String,
      default: ''
    },
    leaveTypeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'LeaveType',
      required: true,
      index: true
    },
    leaveTypeCode: {
      type: String,
      required: true,
      uppercase: true,
      trim: true
    },
    employeeType: {
      type: String,
      default: 'ALL', // 'ALL', 'DOCTOR', 'NURSE', 'STAFF', 'ADMIN', 'FULL_TIME'
      index: true
    },
    departmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Department',
      default: null,
      index: true
    },
    annualEntitlement: {
      type: Number,
      required: true,
      min: 0,
      default: 12
    },
    accrualMethod: {
      type: String,
      enum: ['MONTHLY', 'QUARTERLY', 'YEARLY', 'MANUAL', 'NONE'],
      default: 'MONTHLY'
    },
    accrualFrequency: {
      type: String,
      default: 'FIRST_OF_MONTH'
    },
    accrualRate: {
      type: Number,
      default: 1.0 // e.g. 1.5 days/month for 18 days/yr
    },
    carryForwardAllowed: {
      type: Boolean,
      default: false
    },
    carryForwardLimit: {
      type: Number,
      default: 0
    },
    maximumBalance: {
      type: Number,
      default: 30
    },
    minimumNoticeHours: {
      type: Number,
      default: 24
    },
    maximumContinuousDays: {
      type: Number,
      default: 14
    },
    negativeBalanceAllowed: {
      type: Boolean,
      default: false
    },
    halfDayAllowed: {
      type: Boolean,
      default: true
    },
    partialDayAllowed: {
      type: Boolean,
      default: false
    },
    documentationRequiredAfterDays: {
      type: Number,
      default: 2
    },
    approvalLevels: [
      {
        level: { type: Number, default: 1 },
        role: { type: String, default: 'SUPERVISOR' },
        thresholdDays: { type: Number, default: 0 }
      }
    ],
    effectiveFrom: {
      type: Date,
      default: Date.now,
      index: true
    },
    effectiveTo: {
      type: Date,
      default: null
    },
    status: {
      type: String,
      enum: ['ACTIVE', 'INACTIVE', 'SUPERSEDED'],
      default: 'ACTIVE',
      index: true
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

leavePolicySchema.index({ policyCode: 1, version: 1 }, { unique: true });
leavePolicySchema.index({ leaveTypeId: 1, employeeType: 1, status: 1 });

module.exports = mongoose.model('LeavePolicy', leavePolicySchema);
