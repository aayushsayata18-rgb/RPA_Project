const mongoose = require('mongoose');

// Module 28: KPISnapshot Model (28_REPORTS_ANALYTICS.md Section 68)
const kpiSnapshotSchema = new mongoose.Schema(
  {
    kpiCode: {
      type: String,
      required: true,
      index: true
    },
    value: {
      type: Number,
      required: true
    },
    unit: {
      type: String,
      default: 'COUNT'
    },
    period: {
      type: String,
      enum: ['TODAY', 'YESTERDAY', 'THIS_WEEK', 'LAST_WEEK', 'THIS_MONTH', 'LAST_MONTH', 'THIS_QUARTER', 'THIS_YEAR', 'CUSTOM'],
      default: 'TODAY'
    },
    periodStart: {
      type: Date
    },
    periodEnd: {
      type: Date
    },
    filters: {
      type: mongoose.Schema.Types.Mixed,
      default: {}
    },
    version: {
      type: Number,
      default: 1
    },
    trend: {
      changePercent: Number,
      previousValue: Number,
      direction: {
        type: String,
        enum: ['UP', 'DOWN', 'FLAT']
      }
    },
    generatedAt: {
      type: Date,
      default: Date.now
    }
  },
  {
    timestamps: true
  }
);

kpiSnapshotSchema.index({ kpiCode: 1, generatedAt: -1 });

module.exports = mongoose.model('KPISnapshot', kpiSnapshotSchema);
