const mongoose = require('mongoose');

const shiftAssignmentSchema = new mongoose.Schema(
  {
    assignmentId: {
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
    shiftId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Shift',
      required: true,
      index: true
    },
    shiftCode: {
      type: String,
      required: true,
      trim: true,
      index: true
    },
    departmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Department',
      index: true
    },
    departmentCode: {
      type: String,
      trim: true,
      index: true
    },
    assignmentDate: {
      type: Date,
      required: true,
      index: true
    },
    effectiveFrom: {
      type: Date,
      default: null
    },
    effectiveTo: {
      type: Date,
      default: null
    },
    assignmentType: {
      type: String,
      enum: ['ROSTER', 'ADHOC', 'REPLACEMENT', 'SWAP'],
      default: 'ROSTER'
    },
    status: {
      type: String,
      enum: ['DRAFT', 'PENDING_APPROVAL', 'APPROVED', 'PUBLISHED', 'CANCELLED', 'COMPLETED'],
      default: 'DRAFT',
      index: true
    },
    rosterId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Roster',
      default: null,
      index: true
    },
    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    approvedAt: {
      type: Date,
      default: null
    },
    publishedAt: {
      type: Date,
      default: null
    },
    version: {
      type: Number,
      default: 1
    },
    previousAssignmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ShiftAssignment',
      default: null
    },
    notes: {
      type: String,
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

shiftAssignmentSchema.index({ employeeId: 1, assignmentDate: 1 });
shiftAssignmentSchema.index({ rosterId: 1, assignmentDate: 1 });
shiftAssignmentSchema.index({ departmentId: 1, assignmentDate: 1 });

module.exports = mongoose.model('ShiftAssignment', shiftAssignmentSchema);
