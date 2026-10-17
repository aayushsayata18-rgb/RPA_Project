const mongoose = require('mongoose');

// Module 28: ReportSchedule Model (28_REPORTS_ANALYTICS.md Section 82-84, 110)
const reportScheduleSchema = new mongoose.Schema(
  {
    scheduleId: {
      type: String,
      required: true,
      unique: true,
      index: true
    },
    reportCode: {
      type: String,
      required: true,
      index: true
    },
    reportName: {
      type: String
    },
    name: {
      type: String,
      required: true
    },
    cronExpression: {
      type: String
    },
    frequency: {
      type: String,
      enum: ['DAILY', 'WEEKLY', 'MONTHLY', 'QUARTERLY', 'CRON'],
      default: 'DAILY'
    },
    filters: {
      type: mongoose.Schema.Types.Mixed,
      default: {}
    },
    exportFormat: {
      type: String,
      enum: ['CSV', 'JSON', 'PDF', 'XLSX'],
      default: 'CSV'
    },
    recipients: [
      {
        userId: String,
        email: String,
        channel: { type: String, default: 'EMAIL' },
        role: String
      }
    ],
    enabled: {
      type: Boolean,
      default: true,
      index: true
    },
    lastRunAt: {
      type: Date
    },
    lastExecutionId: {
      type: String
    },
    lastStatus: {
      type: String
    },
    nextRunAt: {
      type: Date
    },
    createdBy: {
      type: String,
      default: 'SYSTEM'
    }
  },
  {
    timestamps: true
  }
);

reportScheduleSchema.index({ enabled: 1, nextRunAt: 1 });

module.exports = mongoose.model('ReportSchedule', reportScheduleSchema);
