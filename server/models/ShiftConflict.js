const mongoose = require('mongoose');

const shiftConflictSchema = new mongoose.Schema(
  {
    conflictId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true
    },
    conflictType: {
      type: String,
      enum: [
        'OVERLAPPING_SHIFT',
        'LEAVE_CONFLICT',
        'DEPARTMENT_CONFLICT',
        'INACTIVE_EMPLOYEE',
        'DUPLICATE_ASSIGNMENT',
        'INVALID_SHIFT',
        'MISSING_EMPLOYEE',
        'ROSTER_CONFLICT'
      ],
      required: true,
      index: true
    },
    severity: {
      type: String,
      enum: ['CRITICAL', 'WARNING'],
      default: 'CRITICAL',
      index: true
    },
    rosterId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Roster',
      default: null,
      index: true
    },
    assignmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ShiftAssignment',
      default: null
    },
    employeeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Employee',
      default: null,
      index: true
    },
    employeeIdCode: {
      type: String,
      trim: true
    },
    date: {
      type: Date,
      index: true
    },
    description: {
      type: String,
      required: true
    },
    status: {
      type: String,
      enum: ['OPEN', 'RESOLVED', 'DISMISSED'],
      default: 'OPEN',
      index: true
    },
    resolutionNotes: {
      type: String,
      default: ''
    },
    resolvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    },
    resolvedAt: {
      type: Date,
      default: null
    }
  },
  {
    timestamps: true
  }
);

shiftConflictSchema.index({ status: 1, conflictType: 1 });
shiftConflictSchema.index({ rosterId: 1, status: 1 });

module.exports = mongoose.model('ShiftConflict', shiftConflictSchema);
