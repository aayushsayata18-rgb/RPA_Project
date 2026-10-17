const mongoose = require('mongoose');

/**
 * Module 27: GeneratedDocument Schema
 * Central Document Model (27_DOCUMENT_GENERATION.md Section 10, 101)
 */
const generatedDocumentSchema = new mongoose.Schema(
  {
    documentId: {
      type: String,
      unique: true,
      required: true,
      index: true
    },
    documentType: {
      type: String,
      required: true, // e.g. FINAL_INVOICE, LAB_REPORT, DISCHARGE_SUMMARY, etc.
      index: true
    },
    category: {
      type: String,
      enum: [
        'PATIENT',
        'CLINICAL',
        'FINANCIAL',
        'INSURANCE',
        'PHARMACY',
        'LABORATORY',
        'RADIOLOGY',
        'OPERATIONS',
        'PROCUREMENT',
        'VENDOR',
        'HR',
        'ADMINISTRATION',
        'RPA',
        'REPORTING'
      ],
      default: 'PATIENT',
      index: true
    },
    title: {
      type: String,
      required: true
    },
    description: {
      type: String
    },
    entityReference: {
      entityType: { type: String, default: 'General' },
      entityId: { type: String, default: null },
      module: { type: String, default: 'GENERAL' }
    },
    // Backwards compatibility legacy fields
    entityType: {
      type: String
    },
    entityId: {
      type: String
    },

    patientId: {
      type: String,
      default: null,
      index: true
    },
    patientName: {
      type: String,
      default: null
    },
    visitId: {
      type: String,
      default: null
    },
    admissionId: {
      type: String,
      default: null
    },

    templateId: {
      type: String,
      default: null
    },
    templateVersion: {
      type: Number,
      default: 1
    },

    version: {
      type: Number,
      default: 1
    },

    status: {
      type: String,
      enum: [
        'DRAFT',
        'GENERATING',
        'GENERATED',
        'PENDING_REVIEW',
        'APPROVED',
        'REJECTED',
        'RELEASED',
        'SUPERSEDED',
        'CANCELLED',
        'FAILED',
        'ARCHIVED'
      ],
      default: 'GENERATED',
      index: true
    },

    confidentiality: {
      type: String,
      enum: ['NORMAL', 'RESTRICTED', 'HIGHLY_RESTRICTED'],
      default: 'NORMAL',
      index: true
    },

    department: {
      type: String,
      default: 'GENERAL'
    },

    storage: {
      provider: { type: String, default: 'LOCAL' }, // LOCAL, OBJECT_STORAGE, etc.
      path: { type: String, default: '' },
      fileName: { type: String, default: '' },
      mimeType: { type: String, default: 'application/pdf' },
      size: { type: Number, default: 0 },
      checksum: { type: String, default: '' } // SHA-256
    },

    fileUrl: {
      type: String
    },
    htmlContent: {
      type: String
    },

    generatedBy: {
      type: String,
      default: 'SYSTEM'
    },
    approvedBy: {
      type: String,
      default: null
    },
    releasedBy: {
      type: String,
      default: null
    },

    generatedAt: {
      type: Date,
      default: Date.now
    },
    approvedAt: {
      type: Date,
      default: null
    },
    releasedAt: {
      type: Date,
      default: null
    },
    expiresAt: {
      type: Date,
      default: null,
      index: true
    },

    supersedesDocumentId: {
      type: String,
      default: null
    },

    isArchived: {
      type: Boolean,
      default: false
    },
    archivedAt: {
      type: Date,
      default: null
    },
    retentionDays: {
      type: Number,
      default: 365
    },

    correlationId: {
      type: String,
      default: null
    },
    idempotencyKey: {
      type: String,
      default: null,
      index: true
    },
    failureReason: {
      type: String,
      default: null
    },

    accessRoles: [
      {
        type: String
      }
    ],

    // Source template data or extracted metadata
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {}
    },

    createdBy: {
      type: String,
      default: 'SYSTEM'
    }
  },
  {
    timestamps: true
  }
);

// Indexes matching Module 27 Section 101
generatedDocumentSchema.index({ 'entityReference.entityType': 1, 'entityReference.entityId': 1 });
generatedDocumentSchema.index({ patientId: 1, createdAt: -1 });
generatedDocumentSchema.index({ documentType: 1, status: 1, createdAt: -1 });
generatedDocumentSchema.index({ status: 1, createdAt: -1 });
generatedDocumentSchema.index({ expiresAt: 1, status: 1 });

module.exports = mongoose.model('GeneratedDocument', generatedDocumentSchema);
