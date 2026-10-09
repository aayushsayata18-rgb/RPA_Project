const mongoose = require('mongoose');

const AdmissionChecklistItemSchema = new mongoose.Schema(
  {
    code: {
      type: String,
      required: true
    },
    title: {
      type: String,
      required: true
    },
    category: {
      type: String,
      enum: ['IDENTITY', 'CLINICAL', 'ACCOMMODATION', 'FINANCIAL', 'DOCUMENTATION', 'NOTIFICATION'],
      default: 'CLINICAL'
    },
    type: {
      type: String,
      enum: ['REQUIRED', 'OPTIONAL', 'CONDITIONAL'],
      default: 'REQUIRED'
    },
    status: {
      type: String,
      enum: ['PENDING', 'COMPLETED', 'NOT_APPLICABLE', 'BLOCKED', 'EXCEPTION'],
      default: 'PENDING'
    },
    completedBy: {
      type: String,
      default: null
    },
    completedAt: {
      type: Date,
      default: null
    },
    isOverridden: {
      type: Boolean,
      default: false
    },
    overrideReason: {
      type: String,
      default: null
    },
    overriddenBy: {
      type: String,
      default: null
    },
    overriddenAt: {
      type: Date,
      default: null
    },
    notes: {
      type: String,
      default: ''
    }
  },
  { _id: false }
);

const AdmissionChecklistSchema = new mongoose.Schema(
  {
    checklistId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true
    },
    admissionRequestId: {
      type: String,
      required: true,
      index: true
    },
    admissionId: {
      type: String,
      default: null,
      index: true
    },
    patientId: {
      type: String,
      required: true,
      index: true
    },
    items: [AdmissionChecklistItemSchema],
    allRequiredCompleted: {
      type: Boolean,
      default: false
    },
    overallStatus: {
      type: String,
      enum: ['PENDING', 'COMPLETED', 'OVERRIDDEN', 'BLOCKED'],
      default: 'PENDING'
    },
    correlationId: {
      type: String,
      required: true,
      index: true
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model('AdmissionChecklist', AdmissionChecklistSchema);
