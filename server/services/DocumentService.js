const GeneratedDocument = require('../models/GeneratedDocument');
const DocumentTemplate = require('../models/DocumentTemplate');
const DocumentAccessLog = require('../models/DocumentAccessLog');
const TemplateService = require('./templateService');
const RenderingService = require('./renderingService');
const DocumentVersionService = require('./documentVersionService');
const DocumentAccessService = require('./documentAccessService');
const DocumentValidator = require('../validators/documentValidator');
const IdGeneratorService = require('./IdGeneratorService');
const storage = require('../storage/storageImplementation');
const AuditService = require('./AuditService');
const NotificationService = require('./NotificationService');

/**
 * Module 27: DocumentService
 * Central Document Generation & Management Engine
 * (27_DOCUMENT_GENERATION.md Section 1, 2, 8, 19, 76, 135)
 */
class DocumentService {
  /**
   * Generate and persist a standardized hospital document (Section 8, 19, 47, 48)
   */
  static async generateDocument({
    documentType,
    title = null,
    category = null,
    entityReference = {},
    entityType = null,
    entityId = null,
    patientId = null,
    patientName = null,
    visitId = null,
    admissionId = null,
    templateCode = null,
    templateId = null,
    data = {},
    htmlContent = null,
    accessRoles = ['SYSTEM_ADMIN', 'PATIENT', 'RECEPTIONIST'],
    confidentiality = 'NORMAL',
    department = 'GENERAL',
    expiresAt = null,
    retentionDays = 365,
    correlationId = null,
    idempotencyKey = null,
    autoRelease = true,
    user = {}
  }) {
    try {
      // 1. Idempotency Check (Section 135 rule 29)
      if (idempotencyKey) {
        const existing = await GeneratedDocument.findOne({ idempotencyKey });
        if (existing) {
          return existing;
        }
      }

      // 2. Validate request
      const reqVal = DocumentValidator.validateGenerationRequest({ documentType });
      if (!reqVal.isValid) {
        throw new Error(reqVal.errors.join(', '));
      }

      // 3. Resolve Template (Section 13, 14, 113)
      let template = null;
      if (templateId || templateCode) {
        template = await TemplateService.getTemplateById(templateId || templateCode).catch(() => null);
      }
      if (!template) {
        template = await TemplateService.getTemplateByType({ documentType });
      }

      // 4. Validate Template Variables Gate (Section 16, 123)
      if (template) {
        const varCheck = DocumentValidator.validateTemplateVariables(template, data);
        if (!varCheck.isValid) {
          throw new Error(`Generation failed: Missing required template variables: ${varCheck.missingVariables.join(', ')}`);
        }
      }

      // 5. Generate Server-Side Unique Document ID (Section 9)
      const documentId = await IdGeneratorService.generateDocumentId();
      const resolvedTitle = title || (template ? template.name : documentType.replace(/_/g, ' '));
      const resolvedCategory = category || (template ? template.category : 'PATIENT');

      const resolvedEntityRef = {
        entityType: entityReference.entityType || entityType || 'General',
        entityId: entityReference.entityId || (entityId ? String(entityId) : documentId),
        module: entityReference.module || 'GENERAL'
      };

      // 6. Render Document PDF & markup (Section 48-50)
      const tempDocObj = {
        documentId,
        documentType,
        title: resolvedTitle,
        category: resolvedCategory,
        entityReference: resolvedEntityRef,
        patientId,
        patientName,
        generatedAt: new Date(),
        version: 1,
        status: 'GENERATING'
      };

      const renderResult = await RenderingService.renderDocument({
        document: tempDocObj,
        template: template || {},
        data
      });

      // 7. Store PDF in Secure Storage with Checksum (Section 36-40)
      const fileName = `${documentId}-v1.pdf`;
      const stored = await storage.upload({
        fileName,
        buffer: renderResult.pdfBuffer,
        mimeType: 'application/pdf',
        subDir: resolvedCategory.toLowerCase()
      });

      // 8. Determine initial document status based on approval requirements (Section 8, 52)
      let initialStatus = 'GENERATED';
      let releasedAt = null;
      let releasedBy = null;

      if (template && template.approvalRequired) {
        initialStatus = 'PENDING_REVIEW';
      } else if (autoRelease) {
        initialStatus = 'RELEASED';
        releasedAt = new Date();
        releasedBy = user.username || 'SYSTEM';
      }

      // 9. Persist Document Metadata
      const doc = new GeneratedDocument({
        documentId,
        documentType,
        category: resolvedCategory,
        title: resolvedTitle,
        entityReference: resolvedEntityRef,
        entityType: resolvedEntityRef.entityType,
        entityId: resolvedEntityRef.entityId,
        patientId: patientId || data.patientId || null,
        patientName: patientName || data.patientName || null,
        visitId: visitId || data.visitId || null,
        admissionId: admissionId || data.admissionId || null,
        templateId: template?.templateId || templateCode || null,
        templateVersion: template?.version || 1,
        version: 1,
        status: initialStatus,
        confidentiality,
        department,
        storage: {
          provider: stored.provider,
          path: stored.path,
          fileName: stored.fileName,
          mimeType: stored.mimeType,
          size: stored.size,
          checksum: stored.checksum
        },
        fileUrl: `/api/documents/${documentId}/download`,
        htmlContent: renderResult.htmlContent || htmlContent,
        generatedBy: user.username || user.userId || 'SYSTEM',
        generatedAt: new Date(),
        releasedAt,
        releasedBy,
        expiresAt: expiresAt || null,
        retentionDays,
        correlationId,
        idempotencyKey,
        accessRoles,
        metadata: data,
        createdBy: user.username || 'SYSTEM'
      });

      await doc.save();

      // 10. Audit Logging (Section 67, 105)
      await AuditService.logEvent({
        userId: user.username || 'SYSTEM',
        action: 'DOCUMENT_GENERATED',
        module: 'DOCUMENTS',
        entityType: 'GeneratedDocument',
        entityId: documentId,
        details: `Generated document ${resolvedTitle} (${documentId}) for ${resolvedEntityRef.entityType}:${resolvedEntityRef.entityId}`
      });

      // 11. Notify if released immediately (Section 92)
      if (initialStatus === 'RELEASED') {
        await this._dispatchReleaseNotification(doc);
      }

      return doc;
    } catch (error) {
      console.error('[DocumentService Generation Error]:', error.message);
      throw error;
    }
  }

  /**
   * Upload an external / supporting file (Section 42-45)
   */
  static async uploadDocument({
    file,
    buffer,
    fileName,
    mimeType,
    documentType,
    category = 'OPERATIONS',
    title = null,
    description = '',
    entityReference = {},
    patientId = null,
    confidentiality = 'NORMAL',
    department = 'GENERAL',
    expiresAt = null,
    user = {}
  }) {
    const fileBuffer = buffer || (file && file.buffer) || null;
    const resolvedName = fileName || (file && file.originalname) || `Upload-${Date.now()}`;
    const resolvedMime = mimeType || (file && file.mimetype) || 'application/pdf';

    // Validation (Section 44, 45)
    const val = DocumentValidator.validateUpload({
      fileName: resolvedName,
      mimeType: resolvedMime,
      buffer: fileBuffer,
      size: fileBuffer ? fileBuffer.length : 0,
      documentType,
      entityReference
    });

    if (!val.isValid) {
      throw new Error(`Upload validation failed: ${val.errors.join('; ')}`);
    }

    const documentId = await IdGeneratorService.generateDocumentId();
    const safeStorageName = `${documentId}-${resolvedName}`;

    const stored = await storage.upload({
      fileName: safeStorageName,
      buffer: fileBuffer,
      mimeType: resolvedMime,
      subDir: 'uploads'
    });

    const doc = new GeneratedDocument({
      documentId,
      documentType,
      category,
      title: title || resolvedName,
      description,
      entityReference: {
        entityType: entityReference.entityType || 'General',
        entityId: entityReference.entityId || documentId,
        module: entityReference.module || 'GENERAL'
      },
      patientId,
      version: 1,
      status: 'RELEASED',
      confidentiality,
      department,
      storage: {
        provider: stored.provider,
        path: stored.path,
        fileName: stored.fileName,
        mimeType: stored.mimeType,
        size: stored.size,
        checksum: stored.checksum
      },
      fileUrl: `/api/documents/${documentId}/download`,
      generatedBy: user.username || user.userId || 'STAFF',
      generatedAt: new Date(),
      releasedAt: new Date(),
      releasedBy: user.username || 'STAFF',
      expiresAt: expiresAt ? new Date(expiresAt) : null,
      createdBy: user.username || 'STAFF'
    });

    await doc.save();

    await AuditService.logEvent({
      userId: user.username || 'SYSTEM',
      action: 'DOCUMENT_UPLOADED',
      module: 'DOCUMENTS',
      entityType: 'GeneratedDocument',
      entityId: documentId,
      details: `Uploaded document ${doc.title} (${documentId})`
    });

    return doc;
  }

  /**
   * Approve a pending document (Section 25, 52)
   */
  static async approveDocument(documentId, user = {}) {
    const doc = await GeneratedDocument.findOne({ documentId });
    if (!doc) {
      throw new Error(`Document ${documentId} not found`);
    }

    if (doc.status !== 'PENDING_REVIEW' && doc.status !== 'GENERATED') {
      throw new Error(`Cannot approve document with status ${doc.status}`);
    }

    doc.status = 'APPROVED';
    doc.approvedBy = user.username || user.userId || 'APPROVER';
    doc.approvedAt = new Date();
    await doc.save();

    await AuditService.logEvent({
      userId: user.username || 'SYSTEM',
      action: 'DOCUMENT_APPROVED',
      module: 'DOCUMENTS',
      entityType: 'GeneratedDocument',
      entityId: documentId,
      details: `Approved document ${doc.title} (${documentId})`
    });

    return doc;
  }

  /**
   * Release document to patients/recipients (Section 24, 92)
   */
  static async releaseDocument(documentId, user = {}) {
    const doc = await GeneratedDocument.findOne({ documentId });
    if (!doc) {
      throw new Error(`Document ${documentId} not found`);
    }

    doc.status = 'RELEASED';
    doc.releasedBy = user.username || user.userId || 'ADMIN';
    doc.releasedAt = new Date();
    await doc.save();

    await AuditService.logEvent({
      userId: user.username || 'SYSTEM',
      action: 'DOCUMENT_RELEASED',
      module: 'DOCUMENTS',
      entityType: 'GeneratedDocument',
      entityId: documentId,
      details: `Released document ${doc.title} (${documentId})`
    });

    // Notify patient / recipients via Notification Service
    await this._dispatchReleaseNotification(doc);

    return doc;
  }

  /**
   * Regenerate document (Creates new version, marks previous SUPERSEDED) (Section 11, 23, 107)
   */
  static async regenerateDocument(documentId, updatedData = {}, user = {}) {
    const previousDoc = await GeneratedDocument.findOne({ documentId });
    if (!previousDoc) {
      throw new Error(`Document ${documentId} not found`);
    }

    const mergedData = { ...(previousDoc.metadata || {}), ...updatedData };
    const nextVersion = (previousDoc.version || 1) + 1;
    const newDocId = await IdGeneratorService.generateDocumentId();

    const template = await TemplateService.getTemplateByType({
      documentType: previousDoc.documentType
    });

    const tempDoc = {
      documentId: newDocId,
      documentType: previousDoc.documentType,
      title: previousDoc.title,
      category: previousDoc.category,
      entityReference: previousDoc.entityReference,
      patientId: previousDoc.patientId,
      patientName: previousDoc.patientName,
      generatedAt: new Date(),
      version: nextVersion,
      status: 'GENERATING'
    };

    const renderResult = await RenderingService.renderDocument({
      document: tempDoc,
      template: template || {},
      data: mergedData
    });

    const fileName = `${newDocId}-v${nextVersion}.pdf`;
    const stored = await storage.upload({
      fileName,
      buffer: renderResult.pdfBuffer,
      mimeType: 'application/pdf',
      subDir: previousDoc.category.toLowerCase()
    });

    const newDoc = new GeneratedDocument({
      documentId: newDocId,
      documentType: previousDoc.documentType,
      category: previousDoc.category,
      title: previousDoc.title,
      entityReference: previousDoc.entityReference,
      entityType: previousDoc.entityReference?.entityType,
      entityId: previousDoc.entityReference?.entityId,
      patientId: previousDoc.patientId,
      patientName: previousDoc.patientName,
      visitId: previousDoc.visitId,
      admissionId: previousDoc.admissionId,
      templateId: template?.templateId || previousDoc.templateId,
      templateVersion: template?.version || previousDoc.templateVersion,
      version: nextVersion,
      status: 'RELEASED',
      confidentiality: previousDoc.confidentiality,
      department: previousDoc.department,
      storage: {
        provider: stored.provider,
        path: stored.path,
        fileName: stored.fileName,
        mimeType: stored.mimeType,
        size: stored.size,
        checksum: stored.checksum
      },
      fileUrl: `/api/documents/${newDocId}/download`,
      htmlContent: renderResult.htmlContent,
      generatedBy: user.username || user.userId || 'SYSTEM',
      generatedAt: new Date(),
      releasedAt: new Date(),
      releasedBy: user.username || 'SYSTEM',
      supersedesDocumentId: previousDoc.documentId,
      retentionDays: previousDoc.retentionDays,
      metadata: mergedData,
      createdBy: user.username || 'SYSTEM'
    });

    await newDoc.save();

    // Mark previous document SUPERSEDED
    await DocumentVersionService.supersedeDocument(previousDoc.documentId, newDocId, user);

    await AuditService.logEvent({
      userId: user.username || 'SYSTEM',
      action: 'DOCUMENT_REGENERATED',
      module: 'DOCUMENTS',
      entityType: 'GeneratedDocument',
      entityId: newDocId,
      details: `Regenerated document ${newDocId} (v${nextVersion}) superseding ${previousDoc.documentId}`
    });

    return newDoc;
  }

  /**
   * Cancel document (Section 26)
   */
  static async cancelDocument(documentId, reason = 'Cancelled by administrator', user = {}) {
    const doc = await GeneratedDocument.findOne({ documentId });
    if (!doc) {
      throw new Error(`Document ${documentId} not found`);
    }

    doc.status = 'CANCELLED';
    doc.failureReason = reason;
    await doc.save();

    await AuditService.logEvent({
      userId: user.username || 'SYSTEM',
      action: 'DOCUMENT_CANCELLED',
      module: 'DOCUMENTS',
      entityType: 'GeneratedDocument',
      entityId: documentId,
      details: `Document ${documentId} cancelled: ${reason}`
    });

    return doc;
  }

  /**
   * Retrieve document metadata with access control (Section 20, 33)
   */
  static async getDocumentById(documentId, user = {}, reqMeta = {}) {
    const doc = await GeneratedDocument.findOne({ documentId }).lean();
    if (!doc) {
      throw new Error(`Document with ID ${documentId} not found.`);
    }

    // Authorization check
    const authCheck = DocumentAccessService.verifyAccess(doc, user, 'VIEW');
    if (!authCheck.allowed) {
      await DocumentAccessService.logAccess({
        documentId,
        documentType: doc.documentType,
        title: doc.title,
        user,
        action: 'ACCESS_DENIED',
        status: 'DENIED',
        ipAddress: reqMeta.ip,
        userAgent: reqMeta.userAgent,
        details: authCheck.reason
      });
      throw new Error(authCheck.reason);
    }

    // Audit view
    await DocumentAccessService.logAccess({
      documentId,
      documentType: doc.documentType,
      title: doc.title,
      user,
      action: 'VIEWED',
      status: 'SUCCESS',
      ipAddress: reqMeta.ip,
      userAgent: reqMeta.userAgent
    });

    return doc;
  }

  /**
   * Download document file buffer with integrity check (Section 21, 40, 69)
   */
  static async downloadDocument(documentId, user = {}, reqMeta = {}) {
    const doc = await GeneratedDocument.findOne({ documentId });
    if (!doc) {
      throw new Error(`Document with ID ${documentId} not found.`);
    }

    // Access check
    const authCheck = DocumentAccessService.verifyAccess(doc, user, 'DOWNLOAD');
    if (!authCheck.allowed) {
      await DocumentAccessService.logAccess({
        documentId,
        documentType: doc.documentType,
        title: doc.title,
        user,
        action: 'ACCESS_DENIED',
        status: 'DENIED',
        ipAddress: reqMeta.ip,
        userAgent: reqMeta.userAgent,
        details: authCheck.reason
      });
      throw new Error(authCheck.reason);
    }

    if (!doc.storage?.path) {
      throw new Error(`File is not stored on storage system for document ${documentId}`);
    }

    // Download from storage
    const downloaded = await storage.download(doc.storage.path);

    // Integrity Checksum Verification (Section 40)
    if (doc.storage.checksum && downloaded.checksum !== doc.storage.checksum) {
      console.error(`[Document Integrity Failure] Document ${documentId} checksum mismatch!`);
      throw new Error('Document integrity verification failed: File checksum mismatch.');
    }

    // Log download
    await DocumentAccessService.logAccess({
      documentId,
      documentType: doc.documentType,
      title: doc.title,
      user,
      action: 'DOWNLOADED',
      status: 'SUCCESS',
      ipAddress: reqMeta.ip,
      userAgent: reqMeta.userAgent
    });

    return {
      buffer: downloaded.buffer,
      fileName: doc.storage.fileName || `${documentId}.pdf`,
      mimeType: doc.storage.mimeType || 'application/pdf',
      size: downloaded.size
    };
  }

  /**
   * List documents with filters (Section 27)
   */
  static async listDocuments(query = {}, user = {}) {
    const filter = {};

    if (query.documentType) filter.documentType = query.documentType;
    if (query.category) filter.category = query.category;
    if (query.status) filter.status = query.status;
    if (query.patientId) filter.patientId = query.patientId;
    if (query.visitId) filter.visitId = query.visitId;
    if (query.admissionId) filter.admissionId = query.admissionId;
    if (query.department) filter.department = query.department;
    if (query.confidentiality) filter.confidentiality = query.confidentiality;

    if (query.entityType) {
      filter.$or = [
        { 'entityReference.entityType': query.entityType },
        { entityType: query.entityType }
      ];
    }
    if (query.entityId) {
      filter.$or = [
        { 'entityReference.entityId': query.entityId },
        { entityId: query.entityId }
      ];
    }

    if (query.dateFrom || query.dateTo) {
      filter.createdAt = {};
      if (query.dateFrom) filter.createdAt.$gte = new Date(query.dateFrom);
      if (query.dateTo) filter.createdAt.$lte = new Date(query.dateTo);
    }

    if (query.search) {
      filter.$or = [
        { documentId: { $regex: query.search, $options: 'i' } },
        { title: { $regex: query.search, $options: 'i' } },
        { patientName: { $regex: query.search, $options: 'i' } },
        { patientId: { $regex: query.search, $options: 'i' } }
      ];
    }

    // If patient is querying, strictly enforce patient ownership & release status
    if (user.role === 'PATIENT') {
      const userPatientId = user.patientId || user.nationalId || user.userId || user.id;
      filter.patientId = userPatientId;
      filter.status = 'RELEASED';
      filter.confidentiality = 'NORMAL';
      filter.category = { $nin: ['HR', 'RPA', 'OPERATIONS', 'PROCUREMENT', 'VENDOR', 'ADMINISTRATION'] };
    }

    return GeneratedDocument.find(filter)
      .sort({ createdAt: -1 })
      .lean();
  }

  /**
   * Helper: Dispatch notification on document release (Section 92)
   */
  static async _dispatchReleaseNotification(doc) {
    try {
      if (!doc.patientId && !doc.metadata?.recipientEmail && !doc.metadata?.recipientPhone) {
        return;
      }

      await NotificationService.sendNotification({
        type: 'DOCUMENT_RELEASED_ALERT',
        recipient: {
          patientId: doc.patientId,
          email: doc.metadata?.recipientEmail || null,
          phone: doc.metadata?.recipientPhone || null,
          name: doc.patientName || 'Patient'
        },
        channels: ['IN_APP', 'SMS'],
        title: `Your ${doc.title} is Ready`,
        body: `Your document (${doc.title}) has been officially released. You can view and download it from the patient portal: /portal/patient/documents`,
        priority: 'NORMAL',
        entityType: 'GeneratedDocument',
        entityId: doc.documentId,
        module: 'DOCUMENTS'
      });
    } catch (e) {
      // Do not block document release if notification delivery fails
      console.warn('[DocumentService] Notification dispatch notice:', e.message);
    }
  }

  /**
   * Get Document System Statistics / Analytics (Section 79, 96, 98)
   */
  static async getStats() {
    const totalGenerated = await GeneratedDocument.countDocuments({});
    const released = await GeneratedDocument.countDocuments({ status: 'RELEASED' });
    const pendingReview = await GeneratedDocument.countDocuments({ status: 'PENDING_REVIEW' });
    const failed = await GeneratedDocument.countDocuments({ status: 'FAILED' });
    const superseded = await GeneratedDocument.countDocuments({ status: 'SUPERSEDED' });
    const archived = await GeneratedDocument.countDocuments({ status: 'ARCHIVED' });

    // Count today's documents
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    const generatedToday = await GeneratedDocument.countDocuments({
      createdAt: { $gte: startOfToday }
    });

    const byCategory = await GeneratedDocument.aggregate([
      { $group: { _id: '$category', count: { $sum: 1 } } }
    ]);

    const byType = await GeneratedDocument.aggregate([
      { $group: { _id: '$documentType', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 }
    ]);

    return {
      totalGenerated,
      released,
      pendingReview,
      failed,
      superseded,
      archived,
      generatedToday,
      byCategory,
      byType
    };
  }
}

module.exports = DocumentService;
