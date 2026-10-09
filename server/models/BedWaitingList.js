const mongoose = require('mongoose');

const BedWaitingListSchema = new mongoose.Schema(
  {
    waitingListId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true
    },
    patientId: {
      type: String,
      required: true,
      index: true
    },
    patientRef: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Patient'
    },
    patientName: {
      type: String,
      default: ''
    },
    admissionId: {
      type: String,
      default: null,
      index: true
    },
    admissionRequestId: {
      type: String,
      default: null,
      index: true
    },
    requestedCategoryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'AccommodationCategory'
    },
    requestedCategoryCode: {
      type: String,
      required: true,
      index: true
    },
    clinicalRequirementReference: {
      type: String,
      default: ''
    },
    priorityReference: {
      type: String,
      enum: ['NORMAL', 'URGENT', 'EMERGENCY'],
      default: 'NORMAL'
    },
    status: {
      type: String,
      enum: ['WAITING', 'OFFERED', 'ACCEPTED', 'DECLINED', 'EXPIRED', 'CANCELLED', 'FULFILLED'],
      default: 'WAITING',
      index: true
    },
    offeredBedId: {
      type: String,
      default: null
    },
    offeredAt: {
      type: Date,
      default: null
    },
    expiresAt: {
      type: Date,
      default: null
    },
    correlationId: {
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

BedWaitingListSchema.index({ requestedCategoryCode: 1, status: 1 });

module.exports = mongoose.model('BedWaitingList', BedWaitingListSchema);
