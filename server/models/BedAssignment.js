const mongoose = require('mongoose');

const BedAssignmentSchema = new mongoose.Schema(
  {
    assignmentId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
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
    wardId: {
      type: String,
      default: ''
    },
    roomId: {
      type: String,
      default: ''
    },
    accommodationCategoryCode: {
      type: String,
      default: ''
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
      required: true,
      index: true
    },
    admissionRef: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Admission'
    },
    visitId: {
      type: String,
      default: null,
      index: true
    },
    assignedAt: {
      type: Date,
      default: Date.now,
      required: true,
      index: true
    },
    releasedAt: {
      type: Date,
      default: null,
      index: true
    },
    assignmentType: {
      type: String,
      enum: ['INITIAL_ADMISSION', 'TRANSFER', 'TEMPORARY', 'EMERGENCY', 'OTHER'],
      default: 'INITIAL_ADMISSION',
      index: true
    },
    status: {
      type: String,
      enum: ['ACTIVE', 'RELEASED', 'TRANSFERRED', 'CANCELLED'],
      default: 'ACTIVE',
      index: true
    },
    assignedByUserId: {
      type: String,
      default: 'SYSTEM'
    },
    assignedByUserName: {
      type: String,
      default: ''
    },
    releasedByUserId: {
      type: String,
      default: null
    },
    releaseReason: {
      type: String,
      default: ''
    },
    previousBedId: {
      type: String,
      default: null
    },
    source: {
      type: String,
      default: 'MERN_PORTAL'
    },
    idempotencyKey: {
      type: String,
      default: null,
      index: true
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

BedAssignmentSchema.index({ bedId: 1, status: 1 });
BedAssignmentSchema.index({ patientId: 1, admissionId: 1, status: 1 });

module.exports = mongoose.model('BedAssignment', BedAssignmentSchema);
