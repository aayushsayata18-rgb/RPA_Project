const GeneratedDocument = require('../models/GeneratedDocument');
const AuditService = require('./AuditService');

/**
 * Module 27: DocumentVersionService
 * Manages document version history and superseding
 * (27_DOCUMENT_GENERATION.md Section 11, 12, 23, 106, 107)
 */
class DocumentVersionService {
  /**
   * Supersede an existing document when a newer version is released
   */
  static async supersedeDocument(previousDocumentId, newDocumentId, user = {}) {
    const prevDoc = await GeneratedDocument.findOne({ documentId: previousDocumentId });
    if (!prevDoc) return null;

    prevDoc.status = 'SUPERSEDED';
    await prevDoc.save();

    await AuditService.logEvent({
      userId: user.username || user.userId || 'SYSTEM',
      action: 'DOCUMENT_SUPERSEDED',
      module: 'DOCUMENTS',
      entityType: 'GeneratedDocument',
      entityId: previousDocumentId,
      details: `Document ${previousDocumentId} marked as SUPERSEDED by ${newDocumentId}`
    });

    return prevDoc;
  }

  /**
   * Get complete version lineage / history for a document
   */
  static async getVersionHistory(documentId) {
    const currentDoc = await GeneratedDocument.findOne({ documentId }).lean();
    if (!currentDoc) {
      throw new Error(`Document ${documentId} not found`);
    }

    // Trace backwards and forwards by entityReference or supersedes chain
    const entityType = currentDoc.entityReference?.entityType || currentDoc.entityType;
    const entityId = currentDoc.entityReference?.entityId || currentDoc.entityId;

    const query = {
      $or: [
        { documentId },
        { supersedesDocumentId: documentId },
        { documentId: currentDoc.supersedesDocumentId }
      ]
    };

    if (entityType && entityId) {
      query.$or.push({
        $and: [
          { 'entityReference.entityType': entityType, 'entityReference.entityId': entityId },
          { documentType: currentDoc.documentType }
        ]
      });
    }

    const versions = await GeneratedDocument.find(query)
      .sort({ version: 1, createdAt: 1 })
      .select('documentId documentType title version status generatedAt releasedAt supersedesDocumentId storage.size createdBy')
      .lean();

    return versions;
  }
}

module.exports = DocumentVersionService;
