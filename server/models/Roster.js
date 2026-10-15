const mongoose = require('mongoose');

const rosterSchema = new mongoose.Schema(
  {
    rosterId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true
    },
    rosterName: {
      type: String,
      required: true,
      trim: true
    },
    departmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Department',
      required: true,
      index: true
    },
    departmentCode: {
      type: String,
      trim: true,
      index: true
    },
    periodStart: {
      type: Date,
      required: true,
      index: true
    },
    periodEnd: {
      type: Date,
      required: true,
      index: true
    },
    status: {
      type: String,
      enum: ['DRAFT', 'PENDING_APPROVAL', 'APPROVED', 'PUBLISHED', 'LOCKED', 'CANCELLED', 'COMPLETED'],
      default: 'DRAFT',
      index: true
    },
    assignmentCount: {
      type: Number,
      default: 0
    },
    currentVersion: {
      type: Number,
      default: 1
    },
    submittedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    submittedAt: {
      type: Date,
      default: null
    },
    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    approvedAt: {
      type: Date,
      default: null
    },
    publishedAt: {
      type: Date,
      default: null
    },
    lockedAt: {
      type: Date,
      default: null
    },
    notes: {
      type: String,
      default: ''
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  },
  {
    timestamps: true
  }
);

rosterSchema.index({ departmentId: 1, periodStart: 1, periodEnd: 1 });
rosterSchema.index({ status: 1, periodStart: 1 });

module.exports = mongoose.model('Roster', rosterSchema);
