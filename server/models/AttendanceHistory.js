const mongoose = require('mongoose');

const attendanceHistorySchema = new mongoose.Schema(
  {
    historyId: {
      type: String,
      default: () => `HIS-${Date.now()}-${require('uuid').v4().substring(0, 8).toUpperCase()}`,
      index: true
    },
    attendanceId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Attendance',
      required: true,
      index: true
    },
    action: {
      type: String,
      required: true,
      enum: [
        'CREATED',
        'PUNCH_IN',
        'PUNCH_OUT',
        'MANUAL_CREATE',
        'MANUAL_OVERRIDE',
        'CORRECTION_REQUESTED',
        'CORRECTION_APPROVED',
        'CORRECTION_REJECTED',
        'RECONCILED',
        'EXCEPTION_FLAGGED',
        'OVERTIME_APPROVED'
      ]
    },
    oldValues: {
      type: mongoose.Schema.Types.Mixed,
      default: {}
    },
    newValues: {
      type: mongoose.Schema.Types.Mixed,
      default: {}
    },
    performedBy: {
      type: String,
      default: 'SYSTEM'
    },
    performedByName: {
      type: String,
      default: 'System Automation'
    },
    reason: {
      type: String,
      default: null,
      trim: true
    },
    timestamp: {
      type: Date,
      default: Date.now,
      index: true
    }
  },
  {
    timestamps: false
  }
);

attendanceHistorySchema.index({ attendanceId: 1, timestamp: -1 });

module.exports = mongoose.model('AttendanceHistory', attendanceHistorySchema);
