const mongoose = require('mongoose');

// Central Document Metadata (00_MASTER.md Section 42)
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
      required: true, // e.g., 'REGISTRATION_RECEIPT', 'INVOICE', 'PAYMENT_RECEIPT', 'DISCHARGE_SUMMARY'
      index: true
    },
    title: {
      type: String,
      required: true
    },
    entityType: {
      type: String,
      required: true // e.g., 'Patient', 'Visit', 'Invoice', 'Admission'
    },
    entityId: {
      type: String,
      required: true,
      index: true
    },
    version: {
      type: Number,
      default: 1
    },
    fileUrl: {
      type: String
    },
    htmlContent: {
      type: String
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed
    },
    createdBy: {
      type: String,
      default: 'SYSTEM'
    },
    accessRoles: [
      {
        type: String
      }
    ]
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model('GeneratedDocument', generatedDocumentSchema);
