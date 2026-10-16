const mongoose = require('mongoose');

const radiologyOrderSchema = new mongoose.Schema(
  {
    orderId: {
      type: String,
      required: true,
      unique: true,
      index: true
    },
    patientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Patient',
      required: true,
      index: true
    },
    patientCode: {
      type: String,
      index: true
    },
    patientName: {
      type: String,
      default: ''
    },
    visitId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Visit',
      default: null,
      index: true
    },
    admissionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Admission',
      default: null,
      index: true
    },
    orderingDoctorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Doctor',
      required: true,
      index: true
    },
    orderingDoctorName: {
      type: String,
      default: ''
    },
    examId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'RadiologyExam',
      required: true,
      index: true
    },
    examNameSnapshot: {
      type: String,
      required: true
    },
    examCodeSnapshot: {
      type: String,
      required: true
    },
    modalityTypeSnapshot: {
      type: String,
      required: true
    },
    bodyPartSnapshot: {
      type: String,
      default: ''
    },
    priority: {
      type: String,
      enum: ['NORMAL', 'URGENT', 'STAT'],
      default: 'NORMAL',
      index: true
    },
    clinicalNote: {
      type: String,
      default: ''
    },
    orderDateTime: {
      type: Date,
      default: Date.now,
      index: true
    },
    status: {
      type: String,
      enum: [
        'DRAFT',
        'ORDERED',
        'PENDING_SCHEDULING',
        'SCHEDULED',
        'PREPARATION_REQUIRED',
        'READY_FOR_CHECKIN',
        'CHECKED_IN',
        'IN_PROGRESS',
        'COMPLETED',
        'REPORT_PENDING',
        'REPORT_READY',
        'RELEASED',
        'CANCELLED',
        'ON_HOLD'
      ],
      default: 'ORDERED',
      index: true
    },
    billingReferenceId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'BillingCharge',
      default: null
    },
    externalRisOrderId: {
      type: String,
      default: '',
      index: true
    },
    externalPacsStudyId: {
      type: String,
      default: '',
      index: true
    },
    source: {
      type: String,
      enum: ['DOCTOR_PORTAL', 'EMERGENCY', 'INPATIENT', 'EXTERNAL_RIS', 'MANUAL'],
      default: 'DOCTOR_PORTAL'
    },
    cancellationReason: {
      type: String,
      default: ''
    },
    preparationStatus: {
      type: String,
      enum: ['NOT_REQUIRED', 'PENDING', 'INSTRUCTIONS_SENT', 'ACKNOWLEDGED', 'COMPLETED', 'NOT_COMPLETED', 'REQUIRES_REVIEW'],
      default: 'PENDING'
    },
    preparationInstructions: {
      type: String,
      default: ''
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    }
  },
  {
    timestamps: true
  }
);

radiologyOrderSchema.index({ patientId: 1, orderDateTime: -1 });
radiologyOrderSchema.index({ status: 1, priority: 1 });
radiologyOrderSchema.index({ examId: 1, status: 1 });

module.exports = mongoose.model('RadiologyOrder', radiologyOrderSchema);
