const mongoose = require('mongoose');

const radiologyStudySchema = new mongoose.Schema(
  {
    studyId: {
      type: String,
      required: true,
      unique: true,
      index: true
    },
    accessionNumber: {
      type: String,
      required: true,
      unique: true,
      trim: true,
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
    examId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'RadiologyExam',
      required: true,
      index: true
    },
    examName: {
      type: String,
      default: ''
    },
    modalityId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'RadiologyModality',
      required: true,
      index: true
    },
    modalityType: {
      type: String,
      default: ''
    },
    performedDateTime: {
      type: Date,
      default: null,
      index: true
    },
    completedDateTime: {
      type: Date,
      default: null
    },
    performedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    },
    performedByName: {
      type: String,
      default: ''
    },
    room: {
      type: String,
      default: ''
    },
    externalPacsStudyId: {
      type: String,
      default: '',
      index: true
    },
    externalStudyUID: {
      type: String,
      default: '',
      index: true
    },
    studyStatus: {
      type: String,
      enum: [
        'REGISTERED',
        'SCHEDULED',
        'IN_PROGRESS',
        'COMPLETED',
        'TRANSFERRED',
        'REPORT_PENDING',
        'REPORTED',
        'CANCELLED'
      ],
      default: 'REGISTERED',
      index: true
    },
    imageReference: {
      type: String,
      default: ''
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {}
    },
    contrastAdministered: {
      type: Boolean,
      default: false
    },
    contrastDetails: {
      agent: { type: String, default: '' },
      volumeMl: { type: Number, default: 0 },
      batchLot: { type: String, default: '' }
    },
    technicianNotes: {
      type: String,
      default: ''
    }
  },
  {
    timestamps: true
  }
);

radiologyStudySchema.index({ orderId: 1, studyStatus: 1 });
radiologyStudySchema.index({ patientId: 1, performedDateTime: -1 });

module.exports = mongoose.model('RadiologyStudy', radiologyStudySchema);
