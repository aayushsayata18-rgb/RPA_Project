const mongoose = require('mongoose');

// Module 25: Patient Feedback, Complaints, Suggestions & Grievance Management
const feedbackSchema = new mongoose.Schema(
  {
    feedbackId: {
      type: String,
      required: true,
      unique: true
    },
    patientId: {
      type: String, // String ID e.g. P10045 or ObjectId
      ref: 'Patient',
      index: true,
      default: null
    },
    patientName: {
      type: String,
      trim: true,
      default: 'Anonymous'
    },
    patientEmail: {
      type: String,
      trim: true,
      default: null
    },
    patientPhone: {
      type: String,
      trim: true,
      default: null
    },
    visitId: {
      type: String,
      ref: 'Visit',
      default: null
    },
    appointmentId: {
      type: String,
      ref: 'Appointment',
      default: null
    },
    admissionId: {
      type: String,
      ref: 'Admission',
      default: null
    },
    invoiceId: {
      type: String,
      ref: 'Invoice',
      default: null
    },
    type: {
      type: String,
      enum: [
        'COMPLAINT',
        'SUGGESTION',
        'COMPLIMENT',
        'SERVICE_FEEDBACK',
        'STAFF_FEEDBACK',
        'FACILITY_FEEDBACK',
        'BILLING_FEEDBACK',
        'PHARMACY_FEEDBACK',
        'LAB_FEEDBACK',
        'RADIOLOGY_FEEDBACK',
        'HOUSEKEEPING_FEEDBACK',
        'MAINTENANCE_FEEDBACK',
        'OTHER'
      ],
      default: 'SERVICE_FEEDBACK',
      required: true,
      index: true
    },
    category: {
      type: String,
      required: true,
      trim: true,
      index: true
    },
    subcategory: {
      type: String,
      trim: true,
      default: null
    },
    source: {
      type: String,
      enum: [
        'PATIENT_PORTAL',
        'FRONT_DESK',
        'AUTHORIZED_STAFF_ENTRY',
        'POST_VISIT_FEEDBACK_LINK',
        'POST_DISCHARGE_FEEDBACK',
        'EMAIL_IMPORT',
        'LEGACY_HOSPITAL_SYSTEM',
        'KIOSK',
        'EXTERNAL_PORTAL'
      ],
      default: 'PATIENT_PORTAL',
      index: true
    },
    subject: {
      type: String,
      required: true,
      trim: true
    },
    description: {
      type: String,
      required: true,
      trim: true
    },
    rating: {
      type: Number,
      min: 1,
      max: 5,
      default: null
    },
    departmentId: {
      type: String,
      ref: 'Department',
      default: null
    },
    departmentName: {
      type: String,
      default: null
    },
    staffId: {
      type: String,
      ref: 'Employee',
      default: null
    },
    staffName: {
      type: String,
      default: null
    },
    locationId: {
      type: String,
      default: null
    },
    priority: {
      type: String,
      enum: ['LOW', 'MEDIUM', 'HIGH', 'URGENT', 'CRITICAL'],
      default: 'MEDIUM',
      index: true
    },
    status: {
      type: String,
      enum: [
        'DRAFT',
        'SUBMITTED',
        'ACKNOWLEDGED',
        'ASSIGNED',
        'UNDER_REVIEW',
        'INVESTIGATION',
        'WAITING_FOR_INFORMATION',
        'RESPONSE_DRAFT',
        'RESPONSE_PENDING_APPROVAL',
        'RESPONSE_SENT',
        'RESOLVED',
        'CLOSED',
        'REOPENED',
        'ESCALATED',
        'WITHDRAWN',
        'REJECTED'
      ],
      default: 'SUBMITTED',
      index: true
    },
    assignedTo: {
      type: String,
      ref: 'User',
      default: null,
      index: true
    },
    assignedToName: {
      type: String,
      default: null
    },
    assignedDepartmentId: {
      type: String,
      ref: 'Department',
      default: null,
      index: true
    },
    assignedDepartmentName: {
      type: String,
      default: null
    },
    dueAt: {
      type: Date,
      index: true,
      default: null
    },
    slaStatus: {
      type: String,
      enum: ['ON_TRACK', 'AT_RISK', 'BREACHED', 'PAUSED'],
      default: 'ON_TRACK',
      index: true
    },
    response: {
      text: { type: String, default: null },
      respondedBy: { type: String, default: null },
      respondedByName: { type: String, default: null },
      respondedAt: { type: Date, default: null },
      approvedBy: { type: String, default: null },
      approvedByName: { type: String, default: null },
      approvedAt: { type: Date, default: null },
      status: {
        type: String,
        enum: ['NONE', 'DRAFTED', 'PENDING_APPROVAL', 'APPROVED', 'SENT', 'REJECTED'],
        default: 'NONE'
      }
    },
    resolution: {
      summary: { type: String, default: null },
      actionTaken: { type: String, default: null },
      resolvedBy: { type: String, default: null },
      resolvedByName: { type: String, default: null },
      resolvedAt: { type: Date, default: null }
    },
    closure: {
      closedBy: { type: String, default: null },
      closedByName: { type: String, default: null },
      closedAt: { type: Date, default: null },
      notes: { type: String, default: null }
    },
    reopen: {
      reopenedBy: { type: String, default: null },
      reopenedByName: { type: String, default: null },
      reopenedAt: { type: Date, default: null },
      reason: { type: String, default: null },
      previousStatus: { type: String, default: null }
    },
    confidentiality: {
      level: {
        type: String,
        enum: ['NORMAL', 'RESTRICTED', 'HIGHLY_RESTRICTED'],
        default: 'NORMAL'
      },
      restricted: {
        type: Boolean,
        default: false
      }
    },
    anonymous: {
      type: Boolean,
      default: false
    },
    attachments: [
      {
        documentId: { type: String },
        name: { type: String },
        url: { type: String },
        fileType: { type: String },
        sizeBytes: { type: Number },
        uploadedBy: { type: String },
        uploadedAt: { type: Date, default: Date.now }
      }
    ],
    tags: [
      {
        type: String,
        trim: true
      }
    ],
    externalReference: {
      system: { type: String, default: null },
      referenceId: { type: String, default: null },
      externalStatus: { type: String, default: null },
      lastSyncAt: { type: Date, default: null }
    },
    version: {
      type: Number,
      default: 1
    },
    createdBy: {
      type: String,
      default: 'SYSTEM'
    },
    updatedBy: {
      type: String,
      default: 'SYSTEM'
    }
  },
  {
    timestamps: true
  }
);

// Indexes defined in 25_PATIENT_FEEDBACK.md Section 80
feedbackSchema.index({ patientId: 1, createdAt: -1 });
feedbackSchema.index({ status: 1, priority: 1, createdAt: -1 });
feedbackSchema.index({ assignedTo: 1, status: 1 });
feedbackSchema.index({ assignedDepartmentId: 1, status: 1 });
feedbackSchema.index({ category: 1, createdAt: -1 });
feedbackSchema.index({ source: 1, createdAt: -1 });
feedbackSchema.index({ dueAt: 1, status: 1 });
feedbackSchema.index({ 'externalReference.system': 1, 'externalReference.referenceId': 1 });

module.exports = mongoose.model('Feedback', feedbackSchema);
