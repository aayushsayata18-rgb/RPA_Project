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
    taskType: {
      type: String,
      enum: ['BED_CLEANING', 'ROOM_DISINFECTION', 'SPILL_CLEANUP', 'DEEP_CLEAN', 'LINEN_CHANGE'],
      default: 'BED_CLEANING',
      index: true
    },
    bedId: {
      type: String,
      required: true,
      index: true
    },
    bedRef: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Bed'
    },
    bedNumber: {
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
    wardId: {
      type: String,
      required: true,
      index: true
    },
    wardRef: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Ward'
    },
    wardName: {
      type: String,
      default: ''
    },
    trigger: {
      type: String,
      enum: ['DISCHARGE', 'TRANSFER', 'PERIODIC', 'MANUAL_REQUEST', 'CONTAMINATION'],
      default: 'DISCHARGE'
    },
    status: {
      type: String,
      enum: ['PENDING', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'],
      default: 'PENDING',
      index: true
    },
    priority: {
      type: String,
      enum: ['ROUTINE', 'URGENT', 'STAT'],
      default: 'ROUTINE'
    },
    assignedTo: {
      type: String,
      default: ''
    },
    assignedToUserId: {
      type: String,
      default: null
    },
    requestedByUserId: {
      type: String,
      default: 'SYSTEM'
    },
    startedAt: {
      type: Date,
      default: null
    },
    completedAt: {
      type: Date,
      default: null
    },
    durationMinutes: {
      type: Number,
      default: null
    },
    checklistCompleted: {
      type: Boolean,
      default: false
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

HousekeepingTaskSchema.index({ wardId: 1, status: 1 });
HousekeepingTaskSchema.index({ bedId: 1, status: 1 });

module.exports = mongoose.model('HousekeepingTask', HousekeepingTaskSchema);
