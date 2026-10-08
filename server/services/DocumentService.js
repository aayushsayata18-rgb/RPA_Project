const GeneratedDocument = require('../models/GeneratedDocument');
const DocumentTemplate = require('../models/DocumentTemplate');
const AuditService = require('./AuditService');
const { v4: uuidv4 } = require('uuid');

class DocumentService {
  /**
   * Generate and persist a document (00_MASTER.md Section 42 & 43)
   */
  static async generateDocument({
    documentType,
    title,
    entityType,
    entityId,
    templateCode = null,
    data = {},
    htmlContent = null,
    accessRoles = ['SYSTEM_ADMIN', 'PATIENT', 'RECEPTIONIST'],
    createdBy = 'SYSTEM'
  }) {
    try {
      let finalHtml = htmlContent;

      if (templateCode) {
        const template = await DocumentTemplate.findOne({ templateCode, isActive: true });
        if (template) {
          finalHtml = template.templateHtml;
          for (const [key, val] of Object.entries(data)) {
            const regex = new RegExp(`{{${key}}}`, 'g');
            finalHtml = finalHtml.replace(regex, val !== undefined && val !== null ? val : '');
          }
        }
      }

      if (!finalHtml) {
        finalHtml = `
          <div style="font-family: sans-serif; padding: 24px; border: 1px solid #e2e8f0; border-radius: 8px;">
            <h2>${title}</h2>
            <p><strong>Document Type:</strong> ${documentType}</p>
            <p><strong>Entity:</strong> ${entityType} (${entityId})</p>
            <p><strong>Generated At:</strong> ${new Date().toLocaleString()}</p>
            <hr />
            <pre>${JSON.stringify(data, null, 2)}</pre>
          </div>
        `;
      }

      const documentId = `DOC-${Date.now()}-${uuidv4().substring(0, 6).toUpperCase()}`;

      const doc = new GeneratedDocument({
        documentId,
        documentType,
        title,
        entityType,
        entityId: String(entityId),
        htmlContent: finalHtml,
        metadata: data,
        createdBy,
        accessRoles
      });

      await doc.save();

      await AuditService.logEvent({
        userId: createdBy,
        action: 'DOCUMENT_GENERATED',
        module: 'DOCUMENTS',
        entityType,
        entityId: documentId,
        details: `Generated document ${title} for ${entityType}:${entityId}`
      });

      return doc;
    } catch (error) {
      console.error('[DocumentService Error]:', error.message);
      throw error;
    }
  }

  /**
   * Fetch document with access authorization check
   */
  static async getDocumentById(documentId, userRole) {
    const doc = await GeneratedDocument.findOne({ documentId });
    if (!doc) {
      throw new Error(`Document with ID ${documentId} not found.`);
    }

    if (userRole !== 'SYSTEM_ADMIN' && doc.accessRoles.length > 0 && !doc.accessRoles.includes(userRole)) {
      throw new Error('Access denied: You do not have permission to view this document.');
    }

    return doc;
  }
}

module.exports = DocumentService;
