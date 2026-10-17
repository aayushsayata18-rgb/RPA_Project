const DocumentTemplate = require('../models/DocumentTemplate');
const NotificationTemplate = require('../models/NotificationTemplate');
const IdGeneratorService = require('./IdGeneratorService');
const AuditService = require('./AuditService');
const DocumentValidator = require('../validators/documentValidator');

/**
 * Module 27: TemplateService
 * Configurable, Versioned Document Templates Engine
 * (27_DOCUMENT_GENERATION.md Section 13, 14, 15, 16, 74, 80-83)
 */
class TemplateService {
  /**
   * Find matching template by documentType, version and language with fallback to en-IN
   */
  static async getTemplateByType({ documentType, version = null, language = 'en-IN' }) {
    const query = {
      documentType,
      isActive: true,
      enabled: true
    };

    if (version) {
      query.version = version;
    }

    // Try requested language first
    let template = await DocumentTemplate.findOne({ ...query, language })
      .sort({ version: -1 })
      .lean();

    // Fallback to default 'en-IN' if not found (Section 113)
    if (!template && language !== 'en-IN') {
      template = await DocumentTemplate.findOne({ ...query, language: 'en-IN' })
        .sort({ version: -1 })
        .lean();
    }

    // Fallback to any active template of that documentType
    if (!template) {
      template = await DocumentTemplate.findOne({ documentType, isActive: true })
        .sort({ version: -1 })
        .lean();
    }

    return template;
  }

  /**
   * List document templates with filtering and pagination
   */
  static async listTemplates(query = {}) {
    const filter = {};
    if (query.documentType) filter.documentType = query.documentType;
    if (query.category) filter.category = query.category;
    if (query.language) filter.language = query.language;
    if (query.enabled !== undefined) filter.enabled = query.enabled === 'true' || query.enabled === true;
    if (query.search) {
      filter.$or = [
        { name: { $regex: query.search, $options: 'i' } },
        { templateCode: { $regex: query.search, $options: 'i' } },
        { documentType: { $regex: query.search, $options: 'i' } }
      ];
    }

    return DocumentTemplate.find(filter).sort({ documentType: 1, version: -1 }).lean();
  }

  /**
   * Get template by ID or code
   */
  static async getTemplateById(id) {
    let template = await DocumentTemplate.findOne({
      $or: [{ templateId: id }, { templateCode: id }]
    }).lean();

    if (!template && id.match(/^[0-9a-fA-F]{24}$/)) {
      template = await DocumentTemplate.findById(id).lean();
    }

    if (!template) {
      throw new Error(`Document template '${id}' not found`);
    }

    return template;
  }

  /**
   * Create new document template (Section 13, 80)
   */
  static async createTemplate(data, user = {}) {
    const templateId = await IdGeneratorService.generateTemplateId();
    const templateCode = data.templateCode || `${data.documentType}_V1`;

    const template = new DocumentTemplate({
      templateId,
      templateCode,
      name: data.name,
      description: data.description || '',
      documentType: data.documentType,
      category: data.category || 'PATIENT',
      language: data.language || 'en-IN',
      version: data.version || 1,
      format: data.format || 'PDF',
      content: data.content || data.templateHtml || '',
      templateHtml: data.content || data.templateHtml || '',
      variables: data.variables || [],
      enabled: data.enabled !== undefined ? data.enabled : true,
      isActive: data.isActive !== undefined ? data.isActive : true,
      approvalRequired: !!data.approvalRequired,
      headerText: data.headerText || 'Hospital Administrative Automation Platform',
      footerText: data.footerText || 'Confidential & Proprietary Hospital Document',
      sampleData: data.sampleData || {},
      createdBy: user.username || user.userId || 'SYSTEM'
    });

    await template.save();

    await AuditService.logEvent({
      userId: user.username || 'SYSTEM',
      action: 'TEMPLATE_CREATED',
      module: 'DOCUMENTS',
      entityType: 'DocumentTemplate',
      entityId: template.templateId,
      details: `Created template ${template.name} (${template.templateId}) for ${template.documentType}`
    });

    return template;
  }

  /**
   * Update template. If template is active, creates a new version instead of overwriting (Section 14, 83)
   */
  static async updateTemplate(id, updates, user = {}) {
    let template = await DocumentTemplate.findOne({
      $or: [{ templateId: id }, { templateCode: id }]
    });

    if (!template && id.match(/^[0-9a-fA-F]{24}$/)) {
      template = await DocumentTemplate.findById(id);
    }

    if (!template) {
      throw new Error(`Template '${id}' not found`);
    }

    // If template has already been used/approved, bump version (Section 14)
    if (template.isActive && updates.content && updates.content !== template.content) {
      const nextVersion = template.version + 1;
      const newTemplateId = await IdGeneratorService.generateTemplateId();

      const newTemplate = new DocumentTemplate({
        templateId: newTemplateId,
        templateCode: `${template.documentType}_V${nextVersion}`,
        name: updates.name || template.name,
        description: updates.description !== undefined ? updates.description : template.description,
        documentType: template.documentType,
        category: updates.category || template.category,
        language: updates.language || template.language,
        version: nextVersion,
        format: updates.format || template.format,
        content: updates.content || template.content,
        templateHtml: updates.content || template.content,
        variables: updates.variables || template.variables,
        enabled: updates.enabled !== undefined ? updates.enabled : true,
        isActive: true,
        approvalRequired: updates.approvalRequired !== undefined ? updates.approvalRequired : template.approvalRequired,
        headerText: updates.headerText || template.headerText,
        footerText: updates.footerText || template.footerText,
        sampleData: updates.sampleData || template.sampleData,
        createdBy: user.username || user.userId || 'SYSTEM'
      });

      await newTemplate.save();

      await AuditService.logEvent({
        userId: user.username || 'SYSTEM',
        action: 'TEMPLATE_VERSION_BUMPED',
        module: 'DOCUMENTS',
        entityType: 'DocumentTemplate',
        entityId: newTemplate.templateId,
        details: `Created version ${nextVersion} for template ${newTemplate.name} superseding v${template.version}`
      });

      return newTemplate;
    }

    // Direct update for draft or metadata-only changes
    Object.assign(template, updates);
    if (updates.content) {
      template.templateHtml = updates.content;
    }
    await template.save();

    await AuditService.logEvent({
      userId: user.username || 'SYSTEM',
      action: 'TEMPLATE_UPDATED',
      module: 'DOCUMENTS',
      entityType: 'DocumentTemplate',
      entityId: template.templateId,
      details: `Updated template ${template.name} (${template.templateId})`
    });

    return template;
  }

  /**
   * Approve a template (Section 82)
   */
  static async approveTemplate(id, user = {}) {
    const userIdentifier = typeof user === 'string' ? user : (user.username || user.userId || user.email || 'ADMIN');

    // Check if it's a NotificationTemplate
    const notifTmpl = await NotificationTemplate.findById(id).catch(() => null);
    if (notifTmpl) {
      notifTmpl.approvedBy = userIdentifier;
      notifTmpl.approvedAt = new Date();
      notifTmpl.enabled = true;
      notifTmpl.isActive = true;
      return await notifTmpl.save();
    }

    const template = await this.getTemplateById(id);
    const doc = await DocumentTemplate.findById(template._id);

    doc.approvedBy = userIdentifier;
    doc.approvedAt = new Date();
    doc.enabled = true;
    doc.isActive = true;
    await doc.save();

    await AuditService.logEvent({
      userId: userIdentifier,
      action: 'TEMPLATE_APPROVED',
      module: 'DOCUMENTS',
      entityType: 'DocumentTemplate',
      entityId: doc.templateId,
      details: `Approved template ${doc.name} (${doc.templateId})`
    });

    return doc;
  }

  /**
   * Activate template
   */
  static async activateTemplate(id, user = {}) {
    const template = await this.getTemplateById(id);
    const doc = await DocumentTemplate.findById(template._id);
    doc.isActive = true;
    doc.enabled = true;
    await doc.save();
    return doc;
  }

  /**
   * Deactivate template
   */
  static async deactivateTemplate(id, user = {}) {
    const template = await this.getTemplateById(id);
    const doc = await DocumentTemplate.findById(template._id);
    doc.isActive = false;
    doc.enabled = false;
    await doc.save();
    return doc;
  }

  // =========================================================================
  // Module 26: Notification Template Methods
  // =========================================================================

  /**
   * Find notification template by type or code, channel, and language with fallback
   */
  static async resolveTemplate({ type, templateCode, channel = 'ALL', language = 'en-IN' }) {
    let query = { enabled: true, isActive: true };

    if (templateCode) {
      const byCode = await NotificationTemplate.findOne({ templateCode: templateCode.toUpperCase(), enabled: true });
      if (byCode) return byCode;
    }

    if (!type) {
      return null;
    }

    // Try exact type, channel, language
    let template = await NotificationTemplate.findOne({
      type,
      channel: { $in: [channel, 'ALL'] },
      language
    }).sort({ version: -1 });

    // Fallback 1: English default language ('en-IN')
    if (!template && language !== 'en-IN') {
      template = await NotificationTemplate.findOne({
        type,
        channel: { $in: [channel, 'ALL'] },
        language: 'en-IN'
      }).sort({ version: -1 });
    }

    // Fallback 2: Any active template with matching type
    if (!template) {
      template = await NotificationTemplate.findOne({ type }).sort({ version: -1 });
    }

    return template;
  }

  /**
   * Extract placeholder variables from a template string (e.g. {{patientName}})
   */
  static extractVariables(content = '') {
    if (!content) return [];
    const matches = content.match(/\{\{([a-zA-Z0-9_]+)\}\}/g) || [];
    return [...new Set(matches.map((m) => m.replace(/[\{\}]/g, '').trim()))];
  }

  /**
   * Validate that all required template variables are present in provided data
   * Throws Error if any variable is missing (Section 25: Missing Template Variables)
   */
  static validateVariables(template, data = {}) {
    const requiredVars = template.variables && template.variables.length > 0
      ? template.variables
      : [...this.extractVariables(template.subject || template.subjectTemplate || ''), ...this.extractVariables(template.body || template.bodyTemplate || '')];

    const missing = [];
    for (const v of requiredVars) {
      if (data[v] === undefined || data[v] === null || data[v] === '') {
        missing.push(v);
      }
    }

    if (missing.length > 0) {
      const err = new Error(`MISSING_TEMPLATE_VARIABLE: Required template variables missing: ${missing.join(', ')}`);
      err.code = 'MISSING_TEMPLATE_VARIABLE';
      err.missingVariables = missing;
      throw err;
    }

    return true;
  }

  /**
   * Render template body and subject safely without code execution (Section 26)
   */
  static render(template, data = {}) {
    this.validateVariables(template, data);

    let subject = template.subject || template.subjectTemplate || '';
    let body = template.body || template.bodyTemplate || '';

    // Data-only regex replacement
    for (const [key, value] of Object.entries(data)) {
      const safeVal = String(value ?? '');
      const regex = new RegExp(`\\{\\{${key}\\}\\}`, 'g');
      subject = subject.replace(regex, safeVal);
      body = body.replace(regex, safeVal);
    }

    return {
      subject,
      body,
      templateId: template._id,
      templateCode: template.templateCode,
      templateVersion: template.version || 1
    };
  }

  /**
   * Create or update a notification template with version preservation (Section 23)
   */
  static async saveTemplate({
    templateCode,
    name,
    type,
    channel = 'ALL',
    language = 'en-IN',
    subject,
    body,
    variables = [],
    approvalRequired = false,
    modifiedBy = 'ADMIN',
    changeReason = 'Updated template'
  }) {
    let existing = await NotificationTemplate.findOne({ templateCode: templateCode.toUpperCase() });

    if (!existing) {
      const autoVars = variables && variables.length > 0
        ? variables
        : [...this.extractVariables(subject), ...this.extractVariables(body)];

      const newTmpl = new NotificationTemplate({
        templateCode: templateCode.toUpperCase(),
        name,
        type: type || templateCode,
        channel,
        language,
        version: 1,
        subject,
        subjectTemplate: subject,
        body,
        bodyTemplate: body,
        variables: autoVars,
        approvalRequired,
        approvedBy: approvalRequired ? null : modifiedBy,
        approvedAt: approvalRequired ? null : new Date(),
        versionHistory: [
          {
            version: 1,
            subject,
            body,
            variables: autoVars,
            modifiedBy,
            modifiedAt: new Date(),
            changeReason: 'Initial creation'
          }
        ]
      });

      return await newTmpl.save();
    }

    const newVersion = (existing.version || 1) + 1;
    const autoVars = variables && variables.length > 0
      ? variables
      : [...this.extractVariables(subject), ...this.extractVariables(body)];

    existing.versionHistory.push({
      version: existing.version,
      subject: existing.subject,
      body: existing.body,
      variables: existing.variables,
      modifiedBy,
      modifiedAt: new Date(),
      changeReason
    });

    existing.version = newVersion;
    existing.name = name || existing.name;
    existing.type = type || existing.type;
    existing.channel = channel || existing.channel;
    existing.language = language || existing.language;
    existing.subject = subject;
    existing.subjectTemplate = subject;
    existing.body = body;
    existing.bodyTemplate = body;
    existing.variables = autoVars;
    existing.approvalRequired = approvalRequired;

    if (approvalRequired) {
      existing.approvedBy = null;
      existing.approvedAt = null;
    } else {
      existing.approvedBy = modifiedBy;
      existing.approvedAt = new Date();
    }

    return await existing.save();
  }

  /**
   * Approve a notification template version
   */
  static async approveNotificationTemplate(templateId, approvedBy = 'ADMIN') {
    const tmpl = await NotificationTemplate.findById(templateId);
    if (!tmpl) {
      throw new Error('Notification template not found');
    }
    tmpl.approvedBy = approvedBy;
    tmpl.approvedAt = new Date();
    return await tmpl.save();
  }

  /**
   * Resolve an active NotificationTemplate by code, type, or event
   */
  static async resolveTemplate(params) {
    const NotificationTemplateService = require('./notificationTemplateService');
    return await NotificationTemplateService.resolveTemplate(params);
  }

  /**
   * Validate required variables and render subject & body templates
   */
  static render(template, data = {}) {
    const NotificationTemplateService = require('./notificationTemplateService');
    return NotificationTemplateService.render(template, data);
  }

  /**
   * Save notification template
   */
  static async saveTemplate(payload) {
    const NotificationTemplateService = require('./notificationTemplateService');
    return await NotificationTemplateService.saveTemplate(payload);
  }

  /**
   * Approve notification template
   */
  static async approveTemplate(id, user = 'ADMIN') {
    const NotificationTemplateService = require('./notificationTemplateService');
    return await NotificationTemplateService.approveTemplate(id, user);
  }
}

module.exports = TemplateService;
