const mongoose = require('mongoose');

const HousekeepingExceptionSchema = new mongoose.Schema(
  {
    exceptionId: {
      type: String,
      trim: true,
      index: true
    },
    type: {
      type: String,
      default: 'GENERAL_EXCEPTION'
    },
    exceptionType: {
      type: String,
      default: 'GENERAL_EXCEPTION',
      index: true
    },
    severity: {
      type: String,
      enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'],
      default: 'MEDIUM',
      index: true
    },
    taskId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'HousekeepingTask',
      index: true
    },
    taskNumber: {
      type: String,
      default: ''
    },
    areaId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'HousekeepingArea'
    },
    areaCode: {
      type: String,
      default: ''
    },
    source: {
      type: String,
      default: 'HOUSEKEEPING_MODULE'
    },
    description: {
      type: String,
      required: true
    },
    reportedBy: {
      type: String,
      default: ''
    },
    reportedById: {
      type: String,
      default: ''
    },
    status: {
      type: String,
      enum: [
        'OPEN',
        'UNDER_REVIEW',
        'WAITING_FOR_USER',
        'WAITING_FOR_EXTERNAL_SYSTEM',
        'RESOLVED',
        'CANCELLED'
      ],
      default: 'OPEN',
      index: true
    },
    assignedToUserId: {
      type: String,
      default: null
    },
    resolution: {
      type: String,
      default: ''
    },
    resolutionNotes: {
      type: String,
      default: ''
    },
    correctiveActionTaken: {
      type: String,
      default: ''
    },
    resolvedBy: {
      type: String,
      default: ''
    },
    resolvedById: {
      type: String,
      default: ''
    },
    resolvedByUserId: {
      type: String,
      default: null
    },
    resolvedAt: {
      type: Date,
      default: null
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

HousekeepingExceptionSchema.pre('save', function (next) {
  if (!this.exceptionType && this.type) {
    this.exceptionType = this.type;
  }
  if (!this.type && this.exceptionType) {
    this.type = this.exceptionType;
  }
  next();
});

module.exports = mongoose.models.HousekeepingException || mongoose.model('HousekeepingException', HousekeepingExceptionSchema);
