const mongoose = require('mongoose');

const attendanceCorrectionSchema = new mongoose.Schema(
  {
    requestId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true
    },
    correctionId: {
      type: String,
      trim: true,
      index: true
    },
    attendanceId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Attendance',
      required: true,
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
    requestedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    },
    requestedByName: {
      type: String,
      default: 'Employee'
    },
    requestedAt: {
      type: Date,
      default: Date.now,
      index: true
    },
    originalValues: {
      checkIn: { type: Date, default: null },
      checkOut: { type: Date, default: null },
      status: { type: String, default: 'MISSED_PUNCH' }
    },
    requestedValues: {
      checkIn: { type: Date, default: null },
      checkOut: { type: Date, default: null },
      status: { type: String, default: 'PRESENT' }
    },
    reason: {
      type: String,
      required: true,
      trim: true
    },
    evidenceDocuments: [
      {
        documentId: { type: String, trim: true },
        name: { type: String, trim: true },
        url: { type: String, trim: true }
      }
    ],
    status: {
      type: String,
      enum: ['PENDING', 'APPROVED', 'REJECTED', 'CANCELLED'],
      default: 'PENDING',
      index: true
    },
    reviewedBy: {
      type: String,
      default: null
    },
    reviewedByName: {
      type: String,
      default: null
    },
    reviewedAt: {
      type: Date,
      default: null
    },
    reviewerComments: {
      type: String,
      default: null,
      trim: true
    }
  },
  {
    timestamps: true
  }
);

attendanceCorrectionSchema.pre('save', function (next) {
  if (!this.correctionId && this.requestId) {
    this.correctionId = this.requestId;
  }
  next();
});

attendanceCorrectionSchema.index({ employeeId: 1, status: 1, requestedAt: -1 });

module.exports = mongoose.model('AttendanceCorrection', attendanceCorrectionSchema);
