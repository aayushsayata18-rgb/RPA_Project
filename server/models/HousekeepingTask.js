const mongoose = require('mongoose');

const HousekeepingTaskSchema = new mongoose.Schema(
  {
    taskId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true
    },
    taskNumber: {
      type: String,
      trim: true,
      index: true
    },
    areaId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'HousekeepingArea',
      index: true
    },
    areaCode: {
      type: String,
      default: ''
    },
    areaName: {
      type: String,
      default: ''
    },
    roomId: {
      type: String,
      default: ''
    },
    roomNumber: {
      type: String,
      default: ''
    },
    bedId: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
      index: true
    },
    bedNumber: {
      type: String,
      default: ''
    },
    sourceModule: {
      type: String,
      default: 'MANUAL',
      index: true
    },
    sourceEntityId: {
      type: String,
      default: '',
      index: true
    },
    taskType: {
      type: String,
      default: 'ROUTINE_CLEANING',
      index: true
    },
    priority: {
      type: String,
      default: 'ROUTINE',
      index: true
    },
    description: {
      type: String,
      default: ''
    },
    requestedByUserId: {
      type: String,
      default: 'SYSTEM'
    },
    assignedTo: {
      type: mongoose.Schema.Types.Mixed,
      default: null
    },
    assignedToId: {
      type: String,
      default: null
    },
    assignedToUserId: {
      type: String,
      default: null,
      index: true
    },
    assignedToName: {
      type: String,
      default: ''
    },
    assignedVendorId: {
      type: String,
      default: null
    },
    scheduledStart: {
      type: Date,
      default: null
    },
    scheduledEnd: {
      type: Date,
      default: null
    },
    actualStart: {
      type: Date,
      default: null
    },
    actualEnd: {
      type: Date,
      default: null
    },
    status: {
      type: String,
      default: 'PENDING',
      index: true
    },
    slaStatus: {
      type: String,
      default: 'WITHIN_SLA'
    },
    slaDueAt: {
      type: Date,
      default: null
    },
    checklistId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'HousekeepingChecklist'
    },
    checklistCompleted: {
      type: Boolean,
      default: false
    },
    checklistResponses: [
      {
        itemCode: String,
        itemId: String,
        label: String,
        completed: Boolean,
        value: mongoose.Schema.Types.Mixed,
        passed: Boolean
      }
    ],
    inspectionRequired: {
      type: Boolean,
      default: true
    },
    inspectionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'HousekeepingInspection'
    },
    inspectionStatus: {
      type: String,
      default: 'PENDING'
    },
    reopenCount: {
      type: Number,
      default: 0
    },
    reopenReason: {
      type: String,
      default: ''
    },
    completionNotes: {
      type: String,
      default: ''
    },
    closingNotes: {
      type: String,
      default: ''
    },
    notes: {
      type: String,
      default: ''
    },
    correlationId: {
      type: String,
      default: ''
    }
  },
  {
    timestamps: true
  }
);

HousekeepingTaskSchema.index({ sourceModule: 1, sourceEntityId: 1, taskType: 1, status: 1 });

module.exports = mongoose.models.HousekeepingTask || mongoose.model('HousekeepingTask', HousekeepingTaskSchema);
