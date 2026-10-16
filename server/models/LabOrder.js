const mongoose = require('mongoose');

const labOrderSchema = new mongoose.Schema(
  {
    orderId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
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
      required: true,
      index: true
    },
    patientName: {
      type: String,
      default: ''
    },
    patientGender: {
      type: String,
      default: ''
    },
    patientAge: {
      type: Number,
      default: null
    },
    visitId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Visit',
      default: null,
      index: true
    },
    visitIdString: {
      type: String,
      default: ''
    },
    admissionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Admission',
      default: null,
      index: true
    },
    admissionIdString: {
      type: String,
      default: ''
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
    orderDateTime: {
      type: Date,
      default: Date.now,
      index: true
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
    status: {
      type: String,
      enum: [
        'DRAFT',
        'ORDERED',
        'SCHEDULED',
        'AWAITING_COLLECTION',
        'PARTIALLY_COLLECTED',
        'COLLECTED',
        'IN_PROCESS',
        'PARTIALLY_COMPLETED',
        'COMPLETED',
        'REPORT_READY',
        'RELEASED',
        'CANCELLED',
        'ON_HOLD'
      ],
      default: 'ORDERED',
      index: true
    },
    collectionLocation: {
      type: String,
      default: 'CENTRAL_PHLEBOTOMY'
    },
    billingReferenceId: {
      type: String,
      default: null,
      index: true
    },
    billingStatus: {
      type: String,
      enum: ['PENDING', 'BILLED', 'EXEMPT', 'CANCELLED'],
      default: 'PENDING',
      index: true
    },
    externalLisOrderId: {
      type: String,
      default: null,
      index: true
    },
    externalLisSyncStatus: {
      type: String,
      enum: ['NOT_SYNCED', 'PENDING', 'SYNCED', 'FAILED', 'RECONCILED'],
      default: 'NOT_SYNCED',
      index: true
    },
    externalLisSyncAt: {
      type: Date,
      default: null
    },
    source: {
      type: String,
      enum: ['EMR', 'DOCTOR_PORTAL', 'RECEPTION', 'EXTERNAL_LIS', 'RPA'],
      default: 'DOCTOR_PORTAL'
    },
    cancellationReason: {
      type: String,
      default: ''
    },
    cancelledBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    },
    cancelledAt: {
      type: Date,
      default: null
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

labOrderSchema.index({ patientId: 1, orderDateTime: -1 });
labOrderSchema.index({ patientCode: 1, status: 1 });
labOrderSchema.index({ status: 1, priority: 1 });

module.exports = mongoose.model('LabOrder', labOrderSchema);
