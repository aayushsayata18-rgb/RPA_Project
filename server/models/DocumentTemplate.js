const mongoose = require('mongoose');

/**
 * Module 27: DocumentTemplate Schema
 * Configurable, Versioned Document Templates (27_DOCUMENT_GENERATION.md Section 13, 101)
 */
const documentTemplateSchema = new mongoose.Schema(
  {
    templateId: {
      type: String,
      unique: true,
      sparse: true,
      index: true
    },
    templateCode: {
      type: String,
      unique: true,
      sparse: true,
      uppercase: true,
      index: true
    },
    name: {
      type: String,
      required: true
    },
    description: {
      type: String,
      default: ''
    },
    documentType: {
      type: String,
      required: true,
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
      default: 'PATIENT'
    },
    language: {
      type: String,
      default: 'en-IN',
      index: true
    },
    version: {
      type: Number,
      default: 1
    },
    format: {
      type: String,
      default: 'PDF'
    },
    content: {
      type: String,
      default: ''
    },
    templateHtml: {
      type: String,
      default: ''
    },
    variables: [
      {
        name: { type: String, required: true },
        type: { type: String, default: 'String' },
        required: { type: Boolean, default: false },
        description: { type: String, default: '' },
        defaultValue: { type: String, default: '' }
      }
    ],
    enabled: {
      type: Boolean,
      default: true
    },
    isActive: {
      type: Boolean,
      default: true
    },
    approvalRequired: {
      type: Boolean,
      default: false
    },
    approvedBy: {
      type: String,
      default: null
    },
    approvedAt: {
      type: Date,
      default: null
    },
    effectiveFrom: {
      type: Date,
      default: Date.now
    },
    effectiveTo: {
      type: Date,
      default: null
    },
    headerText: {
      type: String,
      default: 'Hospital Administrative Automation Platform'
    },
    footerText: {
      type: String,
      default: 'Confidential & Proprietary Hospital Document'
    },
    sampleData: {
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

// Indexes
documentTemplateSchema.index({ documentType: 1, language: 1, version: -1 });

module.exports = mongoose.model('DocumentTemplate', documentTemplateSchema);
