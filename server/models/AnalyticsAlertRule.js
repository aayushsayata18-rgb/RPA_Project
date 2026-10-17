const mongoose = require('mongoose');

// Module 28: AnalyticsAlertRule Model (28_REPORTS_ANALYTICS.md Section 102 & 103)
const analyticsAlertRuleSchema = new mongoose.Schema(
  {
    ruleId: {
      type: String,
      required: true,
      unique: true,
      index: true
    },
    name: {
      type: String,
      required: true,
      trim: true
    },
    metricCode: {
      type: String,
      required: true,
      index: true
    },
    operator: {
      type: String,
      enum: ['GT', 'LT', 'GTE', 'LTE', 'EQ', 'NEQ'],
      required: true
    },
    threshold: {
      type: Number,
      required: true
    },
    period: {
      type: String,
      default: 'TODAY'
    },
    severity: {
      type: String,
      enum: ['INFO', 'WARNING', 'CRITICAL'],
      default: 'WARNING'
    },
    status: {
      type: String,
      enum: ['ACTIVE', 'TRIGGERED', 'ACKNOWLEDGED', 'RESOLVED', 'DISABLED'],
      default: 'ACTIVE',
      index: true
    },
    recipients: [
      {
        type: String
      }
    ],
    lastTriggeredValue: {
      type: Number
    },
    lastTriggeredAt: {
      type: Date
    },
    acknowledgedBy: {
      type: String
    },
    acknowledgedAt: {
      type: Date
    },
    resolvedBy: {
      type: String
    },
    resolvedAt: {
      type: Date
    },
    resolutionNote: {
      type: String
    },
    enabled: {
      type: Boolean,
      default: true,
      index: true
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model('AnalyticsAlertRule', analyticsAlertRuleSchema);
