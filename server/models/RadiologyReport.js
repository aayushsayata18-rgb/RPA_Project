const mongoose = require('mongoose');

const radiologyReportSchema = new mongoose.Schema(
  {
    reportId: {
      type: String,
      required: true,
      unique: true,
      index: true
    },
    reportNumber: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true
    },
    studyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'RadiologyStudy',
      required: true,
      index: true
    },
    orderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'RadiologyOrder',
      required: true,
      index: true
    },
    patientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Patient',
      required: true,
      index: true
    },
    patientName: {
      type: String,
      default: ''
    },
    radiologistId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    radiologistName: {
      type: String,
      default: ''
    },
    clinicalHistory: {
      type: String,
      default: ''
    },
    technique: {
      type: String,
      default: ''
    },
    findings: {
      type: String,
      required: true
    },
    impression: {
      type: String,
      required: true
    },
    recommendations: {
      type: String,
      default: ''
    },
    reportText: {
      type: String,
      default: ''
    },
    status: {
      type: String,
      enum: [
        'DRAFT',
        'PENDING_VERIFICATION',
        'VERIFIED',
        'FINALIZED',
        'RELEASED',
        'AMENDED',
        'CANCELLED'
      ],
      default: 'DRAFT',
      index: true
    },
    reportVersion: {
      type: Number,
      default: 1
    },
    verifiedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    },
    verifiedByName: {
      type: String,
      default: ''
    },
    verifiedAt: {
      type: Date,
      default: null
    },
    releasedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    },
    releasedByName: {
      type: String,
      default: ''
    },
    releasedAt: {
      type: Date,
      default: null,
      index: true
    },
    previousReportId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'RadiologyReport',
      default: null
    },
    amendmentReason: {
      type: String,
      default: ''
    },
    isAmended: {
      type: Boolean,
      default: false
    },
    externalReportReference: {
      type: String,
      default: ''
    }
  },
  {
    timestamps: true
  }
);

radiologyReportSchema.index({ studyId: 1, reportVersion: -1 });
radiologyReportSchema.index({ patientId: 1, releasedAt: -1 });

module.exports = mongoose.model('RadiologyReport', radiologyReportSchema);
