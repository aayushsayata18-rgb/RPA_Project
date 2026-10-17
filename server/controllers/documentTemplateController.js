const TemplateService = require('../services/templateService');
const RenderingService = require('../services/renderingService');

/**
 * Module 27: DocumentTemplateController
 * Template lifecycle, versioning, approvals and previews
 * (27_DOCUMENT_GENERATION.md Section 74, 80-83)
 */

// @desc    List templates (GET /api/document-templates)
exports.listTemplates = async (req, res, next) => {
  try {
    const templates = await TemplateService.listTemplates(req.query);
    res.json({
      success: true,
      count: templates.length,
      data: templates
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get template by ID (GET /api/document-templates/:id)
exports.getTemplate = async (req, res, next) => {
  try {
    const template = await TemplateService.getTemplateById(req.params.id);
    res.json({
      success: true,
      data: template
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create template (POST /api/document-templates)
exports.createTemplate = async (req, res, next) => {
  try {
    const template = await TemplateService.createTemplate(req.body, req.user);
    res.status(201).json({
      success: true,
      message: 'Template created successfully',
      data: template
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update template (PATCH /api/document-templates/:id)
exports.updateTemplate = async (req, res, next) => {
  try {
    const template = await TemplateService.updateTemplate(req.params.id, req.body, req.user);
    res.json({
      success: true,
      message: 'Template updated successfully',
      data: template
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Approve template (POST /api/document-templates/:id/approve)
exports.approveTemplate = async (req, res, next) => {
  try {
    const template = await TemplateService.approveTemplate(req.params.id, req.user);
    res.json({
      success: true,
      message: 'Template approved',
      data: template
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Activate template (POST /api/document-templates/:id/activate)
exports.activateTemplate = async (req, res, next) => {
  try {
    const template = await TemplateService.activateTemplate(req.params.id, req.user);
    res.json({
      success: true,
      message: 'Template activated',
      data: template
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Deactivate template (POST /api/document-templates/:id/deactivate)
exports.deactivateTemplate = async (req, res, next) => {
  try {
    const template = await TemplateService.deactivateTemplate(req.params.id, req.user);
    res.json({
      success: true,
      message: 'Template deactivated',
      data: template
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Preview template with sample data (POST /api/document-templates/:id/preview)
exports.previewTemplate = async (req, res, next) => {
  try {
    const template = await TemplateService.getTemplateById(req.params.id);
    const sampleData = req.body.sampleData || template.sampleData || {};

    const mockDoc = {
      documentId: 'DOC-PREVIEW-000000',
      documentType: template.documentType,
      title: template.name,
      category: template.category,
      entityReference: { entityType: 'Preview', entityId: 'PREVIEW' },
      generatedAt: new Date(),
      version: template.version,
      status: 'DRAFT'
    };

    const rendered = await RenderingService.renderDocument({
      document: mockDoc,
      template,
      data: sampleData
    });

    if (req.query.format === 'pdf') {
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', 'inline; filename="template_preview.pdf"');
      return res.send(rendered.pdfBuffer);
    }

    res.json({
      success: true,
      htmlContent: rendered.htmlContent,
      sampleData
    });
  } catch (error) {
    next(error);
  }
};
