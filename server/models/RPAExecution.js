const mongoose = require('mongoose');

const rpaExecutionSchema = new mongoose.Schema(
  {
    executionId: {
      type: String,
      unique: true,
      required: true,
      index: true
    },
    jobId: {
      type: String,
      required: true,
      index: true
    },
    attemptNumber: {
      type: Number,
      required: true
    },
    status: {
      type: String,
      enum: ['RUNNING', 'SUCCESS', 'FAILED', 'TIMEOUT'],
      default: 'RUNNING'
    },
    logs: [
      {
        timestamp: { type: Date, default: Date.now },
        level: { type: String, enum: ['INFO', 'WARN', 'ERROR', 'DEBUG'], default: 'INFO' },
        message: String
      }
    ],
    errorMessage: String,
    screenshots: [String],
    startedAt: {
      type: Date,
      default: Date.now
    },
    finishedAt: Date,
    durationMs: Number
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model('RPAExecution', rpaExecutionSchema);
