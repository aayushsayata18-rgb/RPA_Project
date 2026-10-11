const InsuranceDocument = require('../models/InsuranceDocument');
const InsuranceVerification = require('../models/InsuranceVerification');
const InsurancePolicy = require('../models/InsurancePolicy');
const AuditService = require('./AuditService');
const { v4: uuidv4 } = require('uuid');

/**
 * InsuranceEvidenceService
 * Conforms to 09_INSURANCE_VERIFICATION.md Section 11, 26 & 72
 */
class InsuranceEvidenceService {
  /**
   * Record uploaded or captured evidence document
   */
  static async recordEvidence({
    patientId,
    policyId,
    verificationId = null,
    documentType,
    fileName,
    storageKey,
    fileUrl = '',
    mimeType = 'application/pdf',
    fileSize = 0,
    uploadedBy = 'SYSTEM',
    source = 'STAFF_UPLOAD',
    notes = ''
  }) {
    const documentId = `DOC-INS-${Date.now()}-${uuidv4().substring(0, 6).toUpperCase()}`;

    const doc = new InsuranceDocument({
      documentId,
      patientId,
      policyId,
      verificationId,
      documentType,
      fileName,
      storageKey: storageKey || `insurance/${patientId}/${documentId}_${fileName}`,
      fileUrl: fileUrl || `/uploads/insurance/${documentId}_${fileName}`,
      mimeType,
      fileSize,
      uploadedBy,
      source,
      notes
    });

    await doc.save();

    // Link document to Verification if provided
    if (verificationId) {
      await InsuranceVerification.findOneAndUpdate(
        { verificationId },
        {
          $addToSet: {
            evidenceDocumentIds: documentId,
            evidencePaths: doc.fileUrl
          }
        }
      );
    }

    // Link document to Policy
    if (policyId) {
      await InsurancePolicy.findOneAndUpdate(
        { policyId },
        {
          $push: {
            documents: {
              documentId,
              documentType,
              fileName,
              fileUrl: doc.fileUrl,
              uploadedAt: new Date()
            }
          }
        }
      );
    }

    await AuditService.logEvent({
      userId: uploadedBy,
      action: 'INSURANCE_DOCUMENT_UPLOADED',
      module: 'INSURANCE_VERIFICATION',
      entityType: 'InsuranceDocument',
      entityId: documentId,
      details: `Insurance document ${documentType} uploaded for policy ${policyId}`
    });

    return doc;
  }

  /**
   * Retrieve evidence documents for verification
   */
  static async getVerificationEvidence(verificationId) {
    return await InsuranceDocument.find({ verificationId }).sort({ createdAt: -1 }).lean();
  }

  /**
   * Retrieve all documents for policy
   */
  static async getPolicyDocuments(policyId) {
    return await InsuranceDocument.find({ policyId }).sort({ createdAt: -1 }).lean();
  }
}

module.exports = InsuranceEvidenceService;
