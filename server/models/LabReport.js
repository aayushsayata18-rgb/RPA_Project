const mongoose = require('mongoose');

const downloadAuditSchema = new mongoose.Schema(
  {
    userId: {
      type: String,
      required: true
    },
    userName: {
      type: String,
      default: ''
    },
    role: {
      type: String,
      default: ''
    },
    ipAddress: {
      type: String,
      default: ''
    },
    downloadedAt: {
      type: Date,
      default: Date.now
    }
  },
  { _id: true }
);

const labReportSchema = new mongoose.Schema(
  {
    reportId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true
    },
    reportNumber: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true
    },
    orderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'LabOrder',
      required: true,
      index: true
    },
    orderIdString: {
      type: String,
      required: true,
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
    reportVersion: {
      type: Number,
      default: 1
    },
    status: {
      type: String,
      enum: [
        'DRAFT',
        'PENDING_VERIFICATION',
        'FINALIZED',
        'RELEASED',
        'AMENDED',
        'CANCELLED'
      ],
      default: 'DRAFT',
      index: true
    },
    generatedDocumentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'GeneratedDocument',
      default: null
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
    amendmentReason: {
      type: String,
      default: ''
    },
    previousReportId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'LabReport',
      default: null
    },
    resultsSnapshot: [mongoose.Schema.Types.Mixed],
    clinicalComments: {
      type: String,
      default: ''
    },
    downloadAuditLog: [downloadAuditSchema]
  },
  {
    timestamps: true
  }
);

labReportSchema.index({ orderId: 1, reportVersion: -1 });
labReportSchema.index({ patientId: 1, releasedAt: -1 });

module.exports = mongoose.model('LabReport', labReportSchema);
