const mongoose = require('mongoose');

const rosterVersionSchema = new mongoose.Schema(
  {
    versionId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true
    },
    rosterId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Roster',
      required: true,
      index: true
    },
    versionNumber: {
      type: Number,
      required: true
    },
    snapshot: {
      type: mongoose.Schema.Types.Mixed,
      required: true
    },
    changeReason: {
      type: String,
      default: 'Roster publication / update'
    },
    changedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    changedAt: {
      type: Date,
      default: Date.now
    },
    previousVersionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'RosterVersion',
      default: null
    }
  },
  {
    timestamps: true
  }
);

rosterVersionSchema.index({ rosterId: 1, versionNumber: -1 });

module.exports = mongoose.model('RosterVersion', rosterVersionSchema);
