const NotificationTemplate = require('../models/NotificationTemplate');

class TemplateService {
  /**
   * Find template by type or code, channel, and language with fallback
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
   * Create or update a template with version preservation (Section 23)
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
      // First version
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

    // Versioning: If existing template is being updated, bump version and archive previous version in history
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
   * Approve a template version
   */
  static async approveTemplate(templateId, approvedBy = 'ADMIN') {
    const tmpl = await NotificationTemplate.findById(templateId);
    if (!tmpl) {
      throw new Error('Template not found');
    }
    tmpl.approvedBy = approvedBy;
    tmpl.approvedAt = new Date();
    return await tmpl.save();
  }
}

module.exports = TemplateService;
