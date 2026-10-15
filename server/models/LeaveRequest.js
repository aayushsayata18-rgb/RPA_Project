const mongoose = require('mongoose');

const leaveRequestSchema = new mongoose.Schema(
  {
    requestNumber: {
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
    employeeCode: {
      type: String,
      required: true,
      trim: true,
      index: true
    },
    employeeName: {
      type: String,
      default: ''
    },
    departmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Department',
      default: null,
      index: true
    },
    departmentName: {
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
      trim: true,
      index: true
    },
    leaveTypeName: {
      type: String,
      default: ''
    },
    startDate: {
      type: Date,
      required: true,
      index: true
    },
    endDate: {
      type: Date,
      required: true,
      index: true
    },
    duration: {
      type: Number,
      required: true,
      min: 0.1
    },
    unit: {
      type: String,
      enum: ['DAYS', 'HOURS'],
      default: 'DAYS'
    },
    dayType: {
      type: String,
      enum: ['FULL_DAY', 'FIRST_HALF', 'SECOND_HALF', 'PARTIAL_DAY'],
      default: 'FULL_DAY'
    },
    partialStartTime: {
      type: String,
      default: null // e.g. "14:00"
    },
    partialEndTime: {
      type: String,
      default: null // e.g. "17:00"
    },
    reason: {
      type: String,
      required: true,
      trim: true
    },
    documents: [
      {
        documentId: { type: String },
        documentName: { type: String },
        documentType: { type: String, default: 'MEDICAL_CERTIFICATE' },
        fileUrl: { type: String },
        uploadedBy: { type: String },
        uploadedAt: { type: Date, default: Date.now }
      }
    ],
    status: {
      type: String,
      enum: [
        'DRAFT',
        'PENDING',
        'UNDER_REVIEW',
        'APPROVED',
        'REJECTED',
        'CANCEL_REQUESTED',
        'CANCELLED',
        'WITHDRAWN',
        'EXPIRED'
      ],
      default: 'PENDING',
      index: true
    },
    submittedAt: {
      type: Date,
      default: Date.now,
      index: true
    },
    currentApproverRole: {
      type: String,
      default: 'SUPERVISOR'
    },
    currentApproverId: {
      type: String,
      default: null
    },
    approvedBy: {
      type: String,
      default: null
    },
    approvedByEmployeeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Employee',
      default: null
    },
    approvedAt: {
      type: Date,
      default: null
    },
    approvalNotes: {
      type: String,
      default: null
    },
    rejectedBy: {
      type: String,
      default: null
    },
    rejectedAt: {
      type: Date,
      default: null
    },
    rejectionReason: {
      type: String,
      default: null
    },
    cancelledAt: {
      type: Date,
      default: null
    },
    cancellationReason: {
      type: String,
      default: null
    },
    withdrawnAt: {
      type: Date,
      default: null
    },
    correlationId: {
      type: String,
      default: null
    },
    shiftReconciled: {
      type: Boolean,
      default: false
    },
    attendanceReconciled: {
      type: Boolean,
      default: false
    }
  },
  {
    timestamps: true
  }
);

leaveRequestSchema.index({ employeeId: 1, startDate: 1, endDate: 1 });
leaveRequestSchema.index({ status: 1, submittedAt: -1 });
leaveRequestSchema.index({ employeeId: 1, status: 1 });
leaveRequestSchema.index({ departmentId: 1, startDate: 1, endDate: 1 });

module.exports = mongoose.model('LeaveRequest', leaveRequestSchema);
