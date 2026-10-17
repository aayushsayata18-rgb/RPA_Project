const DocumentService = require('../services/DocumentService');
const DocumentVersionService = require('../services/documentVersionService');
const DocumentRetentionService = require('../services/documentRetentionService');
const DocumentAccessLog = require('../models/DocumentAccessLog');

/**
 * Module 27: DocumentController
 * (27_DOCUMENT_GENERATION.md Section 19-27, 73, 76)
 */

// @desc    Generate a document (POST /api/documents/generate)
exports.generateDocument = async (req, res, next) => {
  try {
    const doc = await DocumentService.generateDocument({
      ...req.body,
      user: req.user
    });

    res.status(201).json({
      success: true,
      message: 'Document generated successfully',
      data: doc
    });
  } catch (error) {
    next(error);
  }
};

// @desc    List documents with search & filtering (GET /api/documents)
exports.listDocuments = async (req, res, next) => {
  try {
    const docs = await DocumentService.listDocuments(req.query, req.user);
    res.json({
      success: true,
      count: docs.length,
      data: docs
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get document metadata with RBAC (GET /api/documents/:documentId)
exports.getDocument = async (req, res, next) => {
  try {
    const { documentId } = req.params;
    const reqMeta = {
      ip: req.ip || req.connection.remoteAddress,
      userAgent: req.get('User-Agent')
    };

    const doc = await DocumentService.getDocumentById(documentId, req.user, reqMeta);
    res.json({
      success: true,
      data: doc
    });
  } catch (error) {
    if (error.message.includes('Access denied')) {
      return res.status(403).json({
        success: false,
        message: error.message,
        errorCode: 'ACCESS_DENIED'
      });
    }
    next(error);
  }
};

// @desc    Download document PDF (GET /api/documents/:documentId/download)
exports.downloadDocument = async (req, res, next) => {
  try {
    const { documentId } = req.params;
    const reqMeta = {
      ip: req.ip || req.connection.remoteAddress,
      userAgent: req.get('User-Agent')
    };

    const fileResult = await DocumentService.downloadDocument(documentId, req.user, reqMeta);

    res.setHeader('Content-Type', fileResult.mimeType || 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${fileResult.fileName}"`);
    res.setHeader('Content-Length', fileResult.size);

    return res.send(fileResult.buffer);
  } catch (error) {
    if (error.message.includes('Access denied')) {
      return res.status(403).json({
        success: false,
        message: error.message,
        errorCode: 'ACCESS_DENIED'
      });
    }
    next(error);
  }
};

// @desc    Preview document inline (GET /api/documents/:documentId/preview)
exports.previewDocument = async (req, res, next) => {
  try {
    const { documentId } = req.params;
    const reqMeta = {
      ip: req.ip || req.connection.remoteAddress,
      userAgent: req.get('User-Agent')
    };

    const fileResult = await DocumentService.downloadDocument(documentId, req.user, reqMeta);

    res.setHeader('Content-Type', fileResult.mimeType || 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="${fileResult.fileName}"`);

    return res.send(fileResult.buffer);
  } catch (error) {
    if (error.message.includes('Access denied')) {
      return res.status(403).json({
        success: false,
        message: error.message,
        errorCode: 'ACCESS_DENIED'
      });
    }
    next(error);
  }
};

// @desc    Approve document (POST /api/documents/:documentId/approve)
exports.approveDocument = async (req, res, next) => {
  try {
    const { documentId } = req.params;
    const doc = await DocumentService.approveDocument(documentId, req.user);
    res.json({
      success: true,
      message: 'Document approved successfully',
      data: doc
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Release document (POST /api/documents/:documentId/release)
exports.releaseDocument = async (req, res, next) => {
  try {
    const { documentId } = req.params;
    const doc = await DocumentService.releaseDocument(documentId, req.user);
    res.json({
      success: true,
      message: 'Document released successfully',
      data: doc
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Regenerate document / create new version (POST /api/documents/:documentId/regenerate)
exports.regenerateDocument = async (req, res, next) => {
  try {
    const { documentId } = req.params;
    const newDoc = await DocumentService.regenerateDocument(documentId, req.body.updatedData || req.body, req.user);
    res.status(201).json({
      success: true,
      message: 'Document regenerated as new version',
      data: newDoc
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Cancel document (POST /api/documents/:documentId/cancel)
exports.cancelDocument = async (req, res, next) => {
  try {
    const { documentId } = req.params;
    const doc = await DocumentService.cancelDocument(documentId, req.body.reason, req.user);
    res.json({
      success: true,
      message: 'Document cancelled',
      data: doc
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Upload supporting document or attachment (POST /api/documents/upload)
exports.uploadDocument = async (req, res, next) => {
  try {
    // Accepts file buffer from base64 body or multipart file
    let buffer = null;
    if (req.body.fileBase64) {
      buffer = Buffer.from(req.body.fileBase64.replace(/^data:([A-Za-z-+\/]+);base64,/, ''), 'base64');
    } else if (req.file) {
      buffer = req.file.buffer;
    } else if (req.body.fileContent) {
      buffer = Buffer.from(req.body.fileContent, 'utf-8');
    }

    const doc = await DocumentService.uploadDocument({
      ...req.body,
      buffer,
      user: req.user
    });

    res.status(201).json({
      success: true,
      message: 'Document uploaded successfully',
      data: doc
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get patient documents for Patient Portal (GET /api/documents/patient/my-documents)
exports.getPatientDocuments = async (req, res, next) => {
  try {
    const userPatientId = req.user.patientId || req.user.nationalId || req.user.userId || req.user.id;
    const docs = await DocumentService.listDocuments({ patientId: userPatientId }, req.user);
    res.json({
      success: true,
      count: docs.length,
      data: docs
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get document version lineage (GET /api/documents/:documentId/versions)
exports.getVersionHistory = async (req, res, next) => {
  try {
    const { documentId } = req.params;
    const history = await DocumentVersionService.getVersionHistory(documentId);
    res.json({
      success: true,
      count: history.length,
      data: history
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get Document Management Statistics (GET /api/documents/reports/stats)
exports.getStats = async (req, res, next) => {
  try {
    const stats = await DocumentService.getStats();
    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get Document Access Logs (GET /api/documents/reports/access-logs)
exports.getAccessLogs = async (req, res, next) => {
  try {
    const { documentId, userId, action, limit = 50 } = req.query;
    const filter = {};
    if (documentId) filter.documentId = documentId;
    if (userId) filter.userId = userId;
    if (action) filter.action = action;

    const logs = await DocumentAccessLog.find(filter)
      .sort({ timestamp: -1 })
      .limit(parseInt(limit, 10))
      .lean();

    res.json({
      success: true,
      count: logs.length,
      data: logs
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Trigger document storage integrity check (POST /api/documents/maintenance/integrity-check)
exports.runIntegrityCheck = async (req, res, next) => {
  try {
    const result = await DocumentRetentionService.runIntegrityCheck();
    res.json({
      success: true,
      message: 'Integrity check completed',
      data: result
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Trigger document archival retention job (POST /api/documents/maintenance/retention-job)
exports.runRetentionJob = async (req, res, next) => {
  try {
    const days = req.body.archiveAfterDays ? parseInt(req.body.archiveAfterDays, 10) : 365;
    const result = await DocumentRetentionService.runRetentionJob(days);
    res.json({
      success: true,
      message: `Archival retention job completed for threshold ${days} days`,
      data: result
    });
  } catch (error) {
    next(error);
  }
};
