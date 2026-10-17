const mongoose = require('mongoose');

// Module 28: ReportAccessLog Model (28_REPORTS_ANALYTICS.md Section 92, 127)
const reportAccessLogSchema = new mongoose.Schema(
  {
    logId: {
      type: String,
      index: true
    },
    userId: {
      type: String,
      required: true,
      index: true
    },
    userEmail: {
      type: String
    },
    userRole: {
      type: String,
      required: true,
      index: true
    },
    reportCode: {
      type: String,
      index: true
    },
    executionId: {
      type: String,
      index: true
    },
    action: {
      type: String,
      enum: ['VIEW', 'EXECUTE', 'EXPORT', 'DOWNLOAD', 'SCHEDULE_CREATE', 'SCHEDULE_UPDATE', 'ALERT_TRIGGER'],
      required: true,
      index: true
    },
    filters: {
      type: mongoose.Schema.Types.Mixed,
      default: {}
    },
    outputFormat: {
      type: String
    },
    ipAddress: {
      type: String
    },
    userAgent: {
      type: String
    }
  },
  {
    timestamps: true
  }
);

reportAccessLogSchema.index({ reportCode: 1, action: 1, createdAt: -1 });
reportAccessLogSchema.index({ userId: 1, createdAt: -1 });

module.exports = mongoose.model('ReportAccessLog', reportAccessLogSchema);
