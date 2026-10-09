const mongoose = require('mongoose');

const AdmissionRequestSchema = new mongoose.Schema(
  {
    admissionRequestId: {
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
    visitId: {
      type: String,
      required: true,
      index: true
    },
    visitRef: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Visit'
    },
    source: {
      type: String,
      required: true,
      enum: ['OPD', 'EMERGENCY'],
      default: 'OPD',
      index: true
    },
    requestedBy: {
      type: String, // Doctor ID or authorized user
      required: true,
      index: true
    },
    requestingDoctorId: {
      type: String,
      default: null,
      index: true
    },
    requestingDoctorName: {
      type: String,
      default: ''
    },
    requestingDepartmentId: {
      type: String,
      default: 'DEP-GMED'
    },
    requestingDepartmentName: {
      type: String,
      default: 'General Medicine'
    },
    clinicalRequirementReference: {
      type: String,
      required: true,
      trim: true
    },
    clinicalRequiredCategory: {
      type: String,
      enum: ['GENERAL_WARD', 'SEMI_PRIVATE', 'PRIVATE_ROOM', 'ICU', 'EMERGENCY_BED', 'OBSERVATION'],
      default: 'GENERAL_WARD'
    },
    accommodationPreference: {
      type: String,
      enum: ['GENERAL_WARD', 'SEMI_PRIVATE', 'PRIVATE_ROOM', 'ICU', 'EMERGENCY_BED', 'OBSERVATION'],
      default: 'GENERAL_WARD'
    },
    requestedAt: {
      type: Date,
      default: Date.now,
      index: true
    },
    status: {
      type: String,
      required: true,
      enum: [
        'DRAFT',
        'SUBMITTED',
        'VALIDATING',
        'PENDING_APPROVAL',
        'APPROVED',
        'BED_SEARCH',
        'BED_PENDING',
        'BED_ASSIGNED',
        'ADMITTED',
        'REJECTED',
        'CANCELLED',
        'EXCEPTION'
      ],
      default: 'SUBMITTED',
      index: true
    },
    priority: {
      type: String,
      enum: ['NORMAL', 'URGENT', 'EMERGENCY'],
      default: 'NORMAL',
      index: true
    },
    approvalStatus: {
      type: String,
      enum: ['PENDING', 'APPROVED', 'REJECTED', 'NOT_REQUIRED'],
      default: 'PENDING',
      index: true
    },
    approvedBy: {
      type: String,
      default: null
    },
    approvedAt: {
      type: Date,
      default: null
    },
    approvalNotes: {
      type: String,
      default: ''
    },
    rejectionReason: {
      type: String,
      default: ''
    },
    cancellationReason: {
      type: String,
      default: ''
    },
    exceptionStatus: {
      type: String,
      default: null
    },
    exceptionCaseId: {
      type: String,
      default: null
    },
    assignedWardId: {
      type: String,
      default: null
    },
    assignedBedId: {
      type: String,
      default: null
    },
    assignedBedNumber: {
      type: String,
      default: null
    },
    admissionId: {
      type: String,
      default: null,
      index: true
    },
    correlationId: {
      type: String,
      required: true,
      index: true
    },
    notes: {
      type: String,
      default: ''
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  },
  {
    timestamps: true
  }
);

AdmissionRequestSchema.index({ patientId: 1, status: 1 });
AdmissionRequestSchema.index({ source: 1, status: 1 });

module.exports = mongoose.model('AdmissionRequest', AdmissionRequestSchema);
