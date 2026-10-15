const mongoose = require('mongoose');

const attendanceSchema = new mongoose.Schema(
  {
    attendanceId: {
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
      trim: true,
      index: true
    },
    attendanceDate: {
      type: Date,
      required: true,
      index: true
    },
    shiftAssignmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ShiftAssignment',
      default: null,
      index: true
    },
    shiftDetails: {
      shiftCode: { type: String, default: 'GENERAL' },
      shiftName: { type: String, default: 'General Shift' },
      expectedStartTime: { type: String, default: '09:00' },
      expectedEndTime: { type: String, default: '18:00' }
    },
    checkIn: {
      timestamp: { type: Date, default: null },
      source: {
        type: String,
        enum: ['BIOMETRIC', 'EXTERNAL_SYSTEM', 'API', 'CSV_IMPORT', 'EXCEL_IMPORT', 'MANUAL', 'RPA'],
        default: 'BIOMETRIC'
      },
      sourceEventId: { type: String, default: null },
      deviceId: { type: String, default: null }
    },
    checkOut: {
      timestamp: { type: Date, default: null },
      source: {
        type: String,
        enum: ['BIOMETRIC', 'EXTERNAL_SYSTEM', 'API', 'CSV_IMPORT', 'EXCEL_IMPORT', 'MANUAL', 'RPA'],
        default: 'BIOMETRIC'
      },
      sourceEventId: { type: String, default: null },
      deviceId: { type: String, default: null }
    },
    status: {
      type: String,
      enum: [
        'PRESENT',
        'ABSENT',
        'LATE',
        'HALF_DAY',
        'ON_LEAVE',
        'HOLIDAY',
        'WEEK_OFF',
        'MISSED_PUNCH',
        'PENDING_REVIEW',
        'PENDING_CORRECTION',
        'CORRECTION_APPROVED',
        'CORRECTION_REJECTED',
        'INVALID'
      ],
      default: 'PENDING_REVIEW',
      index: true
    },
    lateMinutes: {
      type: Number,
      default: 0
    },
    earlyDepartureMinutes: {
      type: Number,
      default: 0
    },
    workedMinutes: {
      type: Number,
      default: 0
    },
    overtimeMinutes: {
      type: Number,
      default: 0
    },
    isOvertimeApproved: {
      type: Boolean,
      default: false
    },
    source: {
      type: String,
      enum: ['BIOMETRIC', 'EXTERNAL_SYSTEM', 'API', 'CSV_IMPORT', 'EXCEL_IMPORT', 'MANUAL', 'RPA'],
      default: 'BIOMETRIC'
    },
    externalReference: {
      type: String,
      default: null
    },
    correctionStatus: {
      type: String,
      enum: ['NONE', 'PENDING', 'APPROVED', 'REJECTED', 'CANCELLED'],
      default: 'NONE'
    },
    correctionRequestId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'AttendanceCorrection',
      default: null
    },
    remarks: {
      type: String,
      default: null,
      trim: true
    },
    reconciliationStatus: {
      type: String,
      enum: [
        'MATCHED',
        'MATCHED_WITH_LATE',
        'SHIFT_MISMATCH',
        'LEAVE_CONFLICT',
        'MISSING_PUNCH',
        'EMPLOYEE_STATUS_CONFLICT',
        'DUPLICATE',
        'PENDING_REVIEW',
        'UNRECONCILED'
      ],
      default: 'UNRECONCILED'
    },
    reconciliationNotes: {
      type: String,
      default: null
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

// Compound indexes recommended by spec Section 52
attendanceSchema.index({ employeeId: 1, attendanceDate: -1 });
attendanceSchema.index({ attendanceDate: 1, status: 1 });
attendanceSchema.index({ shiftAssignmentId: 1, attendanceDate: 1 });
attendanceSchema.index({ employeeIdCode: 1, attendanceDate: -1 });

module.exports = mongoose.model('Attendance', attendanceSchema);
