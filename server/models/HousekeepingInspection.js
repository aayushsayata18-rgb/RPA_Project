const mongoose = require('mongoose');

const HousekeepingInspectionSchema = new mongoose.Schema(
  {
    inspectionId: {
      type: String,
      trim: true,
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
    areaName: {
      type: String,
      default: ''
    },
    inspectorUserId: {
      type: String,
      default: 'SUPERVISOR'
    },
    inspectorName: {
      type: String,
      default: 'Supervisor'
    },
    inspectionDate: {
      type: Date,
      default: Date.now
    },
    status: {
      type: String,
      enum: ['PASSED', 'FAILED'],
      default: 'PASSED',
      index: true
    },
    passed: {
      type: Boolean,
      default: true
    },
    score: {
      type: Number,
      default: 100
    },
    rating: {
      type: Number,
      default: 5
    },
    findings: {
      type: String,
      default: ''
    },
    rectificationRequired: {
      type: Boolean,
      default: false
    },
    reworkTaskId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'HousekeepingTask',
      default: null
    },
    checklistResults: [
      {
        itemId: String,
        label: String,
        passed: Boolean,
        notes: String
      }
    ],
    deficiencies: [
      {
        type: String
      }
    ],
    reworkInstructions: {
      type: String,
      default: ''
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

module.exports = mongoose.models.HousekeepingInspection || mongoose.model('HousekeepingInspection', HousekeepingInspectionSchema);
