const mongoose = require('mongoose');

const payrollQuerySchema = new mongoose.Schema(
  {
    queryId: {
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
    employeeName: {
      type: String,
      required: true
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
    category: {
      type: String,
      enum: [
        'MISSING_PAYSLIP',
        'ATTENDANCE_DISCREPANCY',
        'LEAVE_DISCREPANCY',
        'OVERTIME_DISCREPANCY',
        'SALARY_DISCREPANCY',
        'DEDUCTION_QUESTION',
        'REIMBURSEMENT_QUESTION',
        'OTHER'
      ],
      required: true
    },
    subject: {
      type: String,
      required: true,
      trim: true
    },
    description: {
      type: String,
      required: true
    },
    attachments: [
      {
        fileName: String,
        fileUrl: String,
        uploadedAt: { type: Date, default: Date.now }
      }
    ],
    status: {
      type: String,
      enum: [
        'OPEN',
        'ASSIGNED',
        'IN_REVIEW',
        'WAITING_FOR_INFORMATION',
        'RESOLVED',
        'REJECTED',
        'CLOSED'
      ],
      default: 'OPEN',
      index: true
    },
    priority: {
      type: String,
      enum: ['LOW', 'MEDIUM', 'HIGH', 'URGENT'],
      default: 'MEDIUM'
    },
    assignedTo: {
      type: String,
      default: null
    },
    resolution: {
      type: String,
      default: null
    },
    resolvedBy: {
      type: String,
      default: null
    },
    resolvedAt: {
      type: Date,
      default: null
    },
    activityLog: [
      {
        action: String,
        actor: String,
        comment: String,
        timestamp: { type: Date, default: Date.now }
      }
    ]
  },
  {
    timestamps: true
  }
);

payrollQuerySchema.index({ employeeId: 1, status: 1, createdAt: -1 });

module.exports = mongoose.model('PayrollQuery', payrollQuerySchema);
