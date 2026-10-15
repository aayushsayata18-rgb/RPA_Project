const mongoose = require('mongoose');

const overtimeRecordSchema = new mongoose.Schema(
  {
    overtimeId: {
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
      index: true
    },
    payrollPeriodId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'PayrollPeriod',
      default: null,
      index: true
    },
    periodCode: {
      type: String,
      default: null
    },
    attendanceId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Attendance',
      default: null
    },
    date: {
      type: Date,
      required: true,
      index: true
    },
    candidateMinutes: {
      type: Number,
      required: true,
      min: 0
    },
    requestedMinutes: {
      type: Number,
      required: true,
      min: 0
    },
    approvedMinutes: {
      type: Number,
      default: 0,
      min: 0
    },
    reason: {
      type: String,
      required: true
    },
    status: {
      type: String,
      enum: ['PENDING', 'APPROVED', 'REJECTED', 'CANCELLED'],
      default: 'PENDING',
      index: true
    },
    requestedBy: {
      type: String,
      required: true
    },
    reviewedBy: {
      type: String,
      default: null
    },
    approvedBy: {
      type: String,
      default: null
    },
    approvedAt: {
      type: Date,
      default: null
    },
    rejectionReason: {
      type: String,
      default: null
    }
  },
  {
    timestamps: true
  }
);

overtimeRecordSchema.index({ employeeId: 1, date: 1 });
overtimeRecordSchema.index({ payrollPeriodId: 1, status: 1 });

module.exports = mongoose.model('OvertimeRecord', overtimeRecordSchema);
