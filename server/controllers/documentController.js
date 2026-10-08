const GeneratedDocument = require('../models/GeneratedDocument');
const DocumentService = require('../services/DocumentService');

// @desc    Get document by ID with access verification (00_MASTER.md Section 43)
// @route   GET /api/documents/:documentId
// @access  Private
exports.getDocument = async (req, res, next) => {
  try {
    const { documentId } = req.params;
    const doc = await DocumentService.getDocumentById(documentId, req.user.role);

    res.json({
      success: true,
      data: doc
    });
  } catch (error) {
    next(error);
  }
};

// @desc    List documents for an entity
// @route   GET /api/documents
// @access  Private
exports.listDocuments = async (req, res, next) => {
  try {
    const { entityType, entityId, documentType } = req.query;
    const query = {};

    if (entityType) query.entityType = entityType;
    if (entityId) query.entityId = entityId;
    if (documentType) query.documentType = documentType;

    const docs = await GeneratedDocument.find(query).sort({ createdAt: -1 }).lean();

    res.json({
      success: true,
      data: docs
    });
  } catch (error) {
    next(error);
  }
};
