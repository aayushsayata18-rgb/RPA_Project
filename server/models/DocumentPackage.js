const mongoose = require('mongoose');

/**
 * Module 27: DocumentPackage Schema
 * Bundling multiple hospital documents (e.g., Insurance Claim Package, Discharge Package)
 * (27_DOCUMENT_GENERATION.md Section 59, 60, 61)
 */
const documentPackageSchema = new mongoose.Schema(
  {
    packageId: {
      type: String,
      unique: true,
      required: true,
      index: true
    },
    packageType: {
      type: String,
      required: true // e.g. INSURANCE_CLAIM_PACKAGE, DISCHARGE_PACKAGE, AUDIT_DOSSIER
    },
    title: {
      type: String,
      required: true
    },
    description: {
      type: String,
      default: ''
    },
    entityReference: {
      entityType: { type: String, default: 'General' },
      entityId: { type: String, default: null },
      module: { type: String, default: 'GENERAL' }
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
    documents: [
      {
        documentId: { type: String, required: true },
        title: { type: String, default: '' },
        documentType: { type: String, default: '' },
        order: { type: Number, default: 1 },
        status: { type: String, default: 'RELEASED' }
      }
    ],
    status: {
      type: String,
      enum: ['DRAFT', 'GENERATING', 'GENERATED', 'RELEASED', 'FAILED'],
      default: 'GENERATED',
      index: true
    },
    storage: {
      provider: { type: String, default: 'LOCAL' },
      path: { type: String, default: '' },
      fileName: { type: String, default: '' },
      mimeType: { type: String, default: 'application/pdf' },
      size: { type: Number, default: 0 },
      checksum: { type: String, default: '' }
    },
    manifest: {
      totalDocuments: { type: Number, default: 0 },
      includedTypes: [{ type: String }],
      generatedAt: { type: Date, default: Date.now }
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

documentPackageSchema.index({ 'entityReference.entityType': 1, 'entityReference.entityId': 1 });
documentPackageSchema.index({ patientId: 1, createdAt: -1 });

module.exports = mongoose.model('DocumentPackage', documentPackageSchema);
