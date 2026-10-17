const NotificationTemplate = require('../models/NotificationTemplate');

/**
 * Module 26: Notification Template Service
 * Dynamic variable interpolation, missing variable gating, and versioning.
 * (26_NOTIFICATION_SERVICE.md Section 22-26, 80)
 */
class NotificationTemplateService {
  /**
   * Resolve an active NotificationTemplate by code, type, or event
   */
  static async resolveTemplate({ templateCode, type, event, channel = 'ALL', language = 'en-IN' }) {
    const query = {
      isActive: true,
      enabled: true
    };

    if (templateCode) {
      query.templateCode = templateCode.toUpperCase();
    } else if (type || event) {
      const matchType = type || event;
      query.$or = [{ templateCode: matchType.toUpperCase() }, { type: matchType }, { event: matchType }];
    }

    let template = await NotificationTemplate.findOne(query).sort({ version: -1 });

    // Fallback if specific channel/lang not matched or if not found
    if (!template && (type || event)) {
      const matchType = (type || event).toUpperCase();
      template = await NotificationTemplate.findOne({
        $or: [{ templateCode: matchType }, { type: matchType }, { event: matchType }]
      }).sort({ version: -1 });
    }

    return template;
  }

  /**
   * Validate required variables and render subject & body templates
   */
  static render(template, data = {}) {
    if (!template) {
      throw new Error('Template is required for rendering');
    }

    const variables = Array.isArray(template.variables) ? template.variables : [];

    // Check for missing required variables
    for (const v of variables) {
      if (data[v] === undefined || data[v] === null || data[v] === '') {
        const error = new Error(`Missing required template variable: ${v}`);
        error.code = 'MISSING_TEMPLATE_VARIABLE';
        error.variable = v;
        throw error;
      }
    }

    const subjectSource = template.subject || template.subjectTemplate || '';
    const bodySource = template.body || template.bodyTemplate || '';

    const replaceVars = (text) => {
      return text.replace(/\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g, (match, key) => {
        return data[key] !== undefined && data[key] !== null ? String(data[key]) : match;
      });
    };

    return {
      subject: replaceVars(subjectSource),
      body: replaceVars(bodySource)
    };
  }

  /**
   * Save or update template with audit version history
   */
  static async saveTemplate(payload) {
    const code = (payload.templateCode || payload.type || '').toUpperCase();
    if (!code) {
      throw new Error('templateCode or type is required');
    }

    let template = await NotificationTemplate.findOne({ templateCode: code });

    if (template) {
      // Archive current version
      const oldVer = {
        version: template.version || 1,
        subject: template.subject,
        body: template.body,
        variables: template.variables,
        modifiedBy: payload.modifiedBy || 'ADMIN',
        modifiedAt: new Date(),
        changeReason: payload.changeReason || 'Template updated'
      };

      template.versionHistory = template.versionHistory || [];
      template.versionHistory.push(oldVer);
      template.version = (template.version || 1) + 1;

      if (payload.name) template.name = payload.name;
      if (payload.subject) {
        template.subject = payload.subject;
        template.subjectTemplate = payload.subject;
      }
      if (payload.body) {
        template.body = payload.body;
        template.bodyTemplate = payload.body;
      }
      if (payload.variables) template.variables = payload.variables;
      if (payload.channel) template.channel = payload.channel;
      if (payload.approvalRequired !== undefined) template.approvalRequired = payload.approvalRequired;

      await template.save();
      return template;
    }

    // Create new template
    const newTmpl = new NotificationTemplate({
      templateCode: code,
      name: payload.name || code,
      type: payload.type || code,
      event: payload.event || payload.type || code,
      channel: payload.channel || 'ALL',
      subject: payload.subject || null,
      subjectTemplate: payload.subject || null,
      body: payload.body || payload.bodyTemplate,
      bodyTemplate: payload.body || payload.bodyTemplate,
      variables: payload.variables || [],
      approvalRequired: Boolean(payload.approvalRequired),
      version: 1,
      enabled: true,
      isActive: true
    });

    await newTmpl.save();
    return newTmpl;
  }

  /**
   * Approve a template version
   */
  static async approveTemplate(idOrCode, approvedBy = 'ADMIN') {
    let template = await NotificationTemplate.findOne({
      $or: [{ _id: idOrCode.match(/^[0-9a-fA-F]{24}$/) ? idOrCode : null }, { templateCode: idOrCode.toUpperCase() }]
    });

    if (!template) {
      throw new Error(`Notification template not found: ${idOrCode}`);
    }

    template.approvedBy = approvedBy;
    template.approvedAt = new Date();
    template.approvalRequired = false;
    await template.save();
    return template;
  }
}

module.exports = NotificationTemplateService;
