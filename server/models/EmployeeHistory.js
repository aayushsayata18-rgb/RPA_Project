const mongoose = require('mongoose');

const employeeHistorySchema = new mongoose.Schema(
  {
    employeeId: {
      type: String,
      required: true,
      index: true
    },
    eventType: {
      type: String,
      enum: [
        'CREATED',
        'APPROVAL_SUBMITTED',
        'APPROVED',
        'REJECTED',
        'ACTIVATED',
        'DEPARTMENT_CHANGE',
        'ROLE_CHANGE',
        'DESIGNATION_CHANGE',
        'MANAGER_CHANGE',
        'EMPLOYMENT_TYPE_CHANGE',
        'STATUS_CHANGE',
        'ON_LEAVE',
        'RETURNED_FROM_LEAVE',
        'SUSPENSION',
        'REACTIVATION',
        'DOCUMENT_ADDED',
        'ACCESS_REQUESTED',
        'ACCESS_PROVISIONED',
        'ACCESS_REVOKED',
        'TERMINATION',
        'OFFBOARDING_UPDATE'
      ],
      required: true,
      index: true
    },
    fromState: {
      type: mongoose.Schema.Types.Mixed,
      default: null
    },
    toState: {
      type: mongoose.Schema.Types.Mixed,
      default: null
    },
    effectiveDate: {
      type: Date,
      default: Date.now
    },
    reason: {
      type: String,
      default: ''
    },
    actor: {
      type: String,
      default: 'SYSTEM'
    },
    correlationId: {
      type: String,
      default: null
    },
    source: {
      type: String,
      default: 'ADMIN_PORTAL'
    },
    notes: {
      type: String,
      default: ''
    }
  },
  {
    timestamps: true
  }
);

employeeHistorySchema.index({ employeeId: 1, createdAt: -1 });

module.exports = mongoose.model('EmployeeHistory', employeeHistorySchema);
