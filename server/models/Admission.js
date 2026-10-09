const mongoose = require('mongoose');

const AdmissionSchema = new mongoose.Schema(
  {
    admissionId: {
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
    admissionRequestId: {
      type: String,
      required: true,
      index: true
    },
    admissionRequestRef: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'AdmissionRequest'
    },
    admissionType: {
      type: String,
      required: true,
      enum: ['INPATIENT', 'EMERGENCY', 'OBSERVATION', 'DAY_CARE', 'OTHER_CONFIGURED'],
      default: 'INPATIENT',
      index: true
    },
    source: {
      type: String,
      required: true,
      enum: ['OPD', 'EMERGENCY'],
      default: 'OPD',
      index: true
    },
    admissionDate: {
      type: Date,
      required: true,
      default: Date.now,
      index: true
    },
    admissionDateStr: {
      type: String,
      default: ''
    },
    admissionTime: {
      type: String,
      default: ''
    },
    status: {
      type: String,
      required: true,
      enum: [
        'REQUESTED',
        'APPROVED',
        'BED_PENDING',
        'BED_ASSIGNED',
        'ADMITTED',
        'TRANSFER_PENDING',
        'TRANSFERRED',
        'DISCHARGE_REQUESTED',
        'DISCHARGED',
        'CANCELLED'
      ],
      default: 'ADMITTED',
      index: true
    },
    admittingDoctorId: {
      type: String,
      required: true,
      index: true
    },
    admittingDoctorName: {
      type: String,
      default: ''
    },
    admittingDepartmentId: {
      type: String,
      default: 'DEP-GMED'
    },
    admittingDepartmentName: {
      type: String,
      default: 'General Medicine'
    },
    clinicalRequirementReference: {
      type: String,
      required: true
    },
    accommodationPreference: {
      type: String,
      default: 'GENERAL_WARD'
    },
    assignedWardId: {
      type: String,
      required: true,
      index: true
    },
    assignedWardName: {
      type: String,
      default: ''
    },
    assignedBedId: {
      type: String,
      required: true,
      index: true
    },
    assignedBedNumber: {
      type: String,
      default: ''
    },
    identityStatus: {
      type: String,
      enum: ['VERIFIED', 'PENDING', 'TEMPORARY', 'FAILED'],
      default: 'VERIFIED',
      index: true
    },
    temporaryEmergencyId: {
      type: String,
      default: null,
      index: true
    },
    insuranceStatus: {
      type: String,
      enum: ['NOT_APPLICABLE', 'PENDING', 'VERIFIED', 'REJECTED'],
      default: 'NOT_APPLICABLE'
    },
    insuranceDetails: {
      provider: { type: String, default: '' },
      policyNumber: { type: String, default: '' },
      preAuthStatus: { type: String, default: 'NOT_SUBMITTED' },
      approvedAmount: { type: Number, default: 0 }
    },
    billingStatus: {
      type: String,
      enum: ['PENDING_SETUP', 'ACTIVE', 'SETTLED'],
      default: 'ACTIVE'
    },
    billingAccountId: {
      type: String,
      default: ''
    },
    dischargeStatus: {
      type: String,
      enum: ['NOT_DISCHARGED', 'DISCHARGE_REQUESTED', 'DISCHARGED'],
      default: 'NOT_DISCHARGED',
      index: true
    },
    dischargedAt: {
      type: Date,
      default: null
    },
    checklistStatus: {
      type: String,
      enum: ['PENDING', 'COMPLETED', 'OVERRIDDEN'],
      default: 'COMPLETED'
    },
    checklistId: {
      type: String,
      default: null
    },
    externalSyncStatus: {
      type: String,
      enum: ['NOT_REQUIRED', 'PENDING', 'SYNCED', 'FAILED'],
      default: 'NOT_REQUIRED',
      index: true
    },
    externalAdmissionId: {
      type: String,
      default: null
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

AdmissionSchema.index({ patientId: 1, status: 1 });
AdmissionSchema.index({ admissionDate: -1 });

module.exports = mongoose.model('Admission', AdmissionSchema);
