const mongoose = require('mongoose');
const ReportDefinition = require('../models/ReportDefinition');
const ReportExecution = require('../models/ReportExecution');
const ReportSchedule = require('../models/ReportSchedule');
const ReportAccessLog = require('../models/ReportAccessLog');
const AnalyticsAlertRule = require('../models/AnalyticsAlertRule');
const IdGeneratorService = require('./IdGeneratorService');
const ReportQueryService = require('./reportQueryService');
const ReportExportService = require('./reportExportService');
const AuditService = require('./AuditService');

/**
 * Module 28: ReportService
 * Master Orchestrator for Report Catalog, Executions, Scheduling, Exports & Auditing
 * (28_REPORTS_ANALYTICS.md Section 7-11, 82-84, 91-92, 105-110)
 */
class ReportService {
  /**
   * Get Report Catalog filtered by user role and optional category
   */
  static async getCatalog(query = {}, userRole = 'SYSTEM_ADMIN') {
    const filter = { enabled: true };
    if (query.category) {
      filter.category = query.category.toUpperCase();
    }
    if (query.search) {
      filter.$or = [
        { name: { $regex: query.search, $options: 'i' } },
        { code: { $regex: query.search, $options: 'i' } },
        { description: { $regex: query.search, $options: 'i' } }
      ];
    }

    const reports = await ReportDefinition.find(filter).sort({ category: 1, name: 1 }).lean();
    const mapped = reports.map((r) => ({
      ...r,
      reportCode: r.reportCode || r.code
    }));

    // Filter by permissions if not SYSTEM_ADMIN
    if (userRole !== 'SYSTEM_ADMIN') {
      return mapped.filter((r) => !r.permissions || r.permissions.length === 0 || r.permissions.includes(userRole));
    }

    return mapped;
  }

  /**
   * Get single report definition by reportId or code
   */
  static async getReportDefinition(idOrCode) {
    const report = await ReportDefinition.findOne({
      $or: [{ reportId: idOrCode }, { code: idOrCode.toUpperCase() }]
    }).lean();

    if (!report) {
      throw new Error(`Report definition not found: ${idOrCode}`);
    }
    return report;
  }

  /**
   * Execute Report
   */
  static async executeReport({
    reportId = null,
    reportCode = null,
    filters = {},
    format = 'JSON',
    user = {},
    ipAddress = null,
    userAgent = null
  }) {
    const identifier = reportCode || reportId;
    if (!identifier) {
      throw new Error('reportCode or reportId is required');
    }

    const definition = await this.getReportDefinition(identifier);
    const userRole = user.role || 'SYSTEM_ADMIN';
    const userId = user.userId || user._id || 'ADMIN';

    // Verify role permissions (Section 89-90)
    if (definition.permissions && definition.permissions.length > 0 && userRole !== 'SYSTEM_ADMIN') {
      if (!definition.permissions.includes(userRole)) {
        const err = new Error(`Unauthorized: Role ${userRole} cannot access report ${definition.code}`);
        err.statusCode = 403;
        throw err;
      }
    }

    const executionId = await IdGeneratorService.generateReportExecutionId();
    const startTime = Date.now();

    // 1. Query source data
    const queryResult = await ReportQueryService.executeQuery(definition.code, filters, userRole);
    const rows = queryResult.rows || [];
    const summary = queryResult.summary || {};

    let exportResult = null;
    let outputFile = null;
    let fileChecksum = null;
    let fileSizeBytes = 0;

    // 2. Export file if requested format is not JSON
    if (['CSV', 'PDF', 'XLSX'].includes(format.toUpperCase())) {
      exportResult = await ReportExportService.exportData({
        executionId,
        reportName: definition.name,
        format: format.toUpperCase(),
        data: rows,
        columns: definition.columns,
        summary
      });
      outputFile = exportResult.filePath;
      fileChecksum = exportResult.fileChecksum;
      fileSizeBytes = exportResult.fileSizeBytes;
    }

    const durationMs = Date.now() - startTime;

    // 3. Save Execution Record (Section 8)
    const execution = new ReportExecution({
      executionId,
      reportId: definition._id,
      reportCode: definition.code,
      reportName: definition.name,
      category: definition.category,
      version: definition.version || 1,
      requestedBy: String(userId),
      requestedByRole: userRole,
      filters,
      period: queryResult.period || {},
      status: 'COMPLETED',
      startedAt: new Date(startTime),
      completedAt: new Date(),
      durationMs,
      rowCount: rows.length,
      summary,
      data: format.toUpperCase() === 'JSON' ? rows : rows.slice(0, 100), // inline data preview
      outputFormat: format.toUpperCase(),
      outputFile,
      fileChecksum,
      fileSizeBytes,
      isMasked: userRole !== 'SYSTEM_ADMIN'
    });

    await execution.save();

    // 4. Log Access (Section 91-92)
    const accessLog = new ReportAccessLog({
      logId: `LOG-${Date.now()}`,
      userId: String(userId),
      userEmail: user.email || null,
      userRole,
      reportCode: definition.code,
      executionId,
      action: format.toUpperCase() === 'JSON' ? 'VIEW' : 'EXPORT',
      filters,
      outputFormat: format.toUpperCase(),
      ipAddress,
      userAgent
    });
    await accessLog.save();

    return execution;
  }

  /**
   * Get Report Execution Details
   */
  static async getExecution(executionId) {
    const execution = await ReportExecution.findOne({ executionId }).lean();
    if (!execution) {
      throw new Error(`Report execution not found: ${executionId}`);
    }
    return execution;
  }

  /**
   * List recent report executions
   */
  static async listExecutions(query = {}, user = {}) {
    const filter = {};
    if (query.reportCode) filter.reportCode = query.reportCode.toUpperCase();
    if (query.status) filter.status = query.status.toUpperCase();
    if (query.requestedBy) filter.requestedBy = String(query.requestedBy);

    const limit = parseInt(query.limit, 10) || 50;
    return await ReportExecution.find(filter).sort({ createdAt: -1 }).limit(limit).lean();
  }

  /**
   * List Report Schedules
   */
  static async listSchedules() {
    return await ReportSchedule.find().sort({ createdAt: -1 }).lean();
  }

  /**
   * Create Report Schedule
   */
  static async createSchedule(payload, user = {}) {
    const scheduleId = await IdGeneratorService.generateReportScheduleId();
    const definition = await this.getReportDefinition(payload.reportCode);

    const schedule = new ReportSchedule({
      scheduleId,
      reportCode: definition.code,
      reportName: definition.name,
      name: payload.name || `${definition.name} (${payload.frequency || 'DAILY'})`,
      frequency: payload.frequency || 'DAILY',
      cronExpression: payload.cronExpression,
      filters: payload.filters || {},
      exportFormat: payload.exportFormat || 'CSV',
      recipients: payload.recipients || [],
      enabled: payload.enabled !== undefined ? payload.enabled : true,
      nextRunAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      createdBy: user.userId || user._id || 'ADMIN'
    });

    await schedule.save();
    return schedule;
  }

  /**
   * Update or Toggle Schedule
   */
  static async updateSchedule(scheduleId, updates = {}) {
    const schedule = await ReportSchedule.findOne({ scheduleId });
    if (!schedule) {
      throw new Error(`Schedule not found: ${scheduleId}`);
    }

    if (updates.enabled !== undefined) schedule.enabled = updates.enabled;
    if (updates.frequency) schedule.frequency = updates.frequency;
    if (updates.cronExpression) schedule.cronExpression = updates.cronExpression;
    if (updates.recipients) schedule.recipients = updates.recipients;
    if (updates.filters) schedule.filters = updates.filters;

    await schedule.save();
    return schedule;
  }

  /**
   * List Analytics Alert Rules
   */
  static async listAlertRules() {
    return await AnalyticsAlertRule.find().sort({ severity: 1, name: 1 }).lean();
  }

  /**
   * Acknowledge Triggered Alert
   */
  static async acknowledgeAlert(idOrRuleId, user = {}) {
    const isObjectId = mongoose.isValidObjectId(idOrRuleId);
    const rule = await AnalyticsAlertRule.findOne({
      $or: isObjectId ? [{ _id: idOrRuleId }, { ruleId: idOrRuleId }] : [{ ruleId: idOrRuleId }]
    });
    if (!rule) {
      throw new Error(`Alert rule not found: ${idOrRuleId}`);
    }
    rule.status = 'ACKNOWLEDGED';
    rule.acknowledgedBy = user.userId || user.email || 'ADMIN';
    rule.acknowledgedAt = new Date();
    await rule.save();
    return rule;
  }

  /**
   * Resolve Triggered Alert
   */
  static async resolveAlert(idOrRuleId, resolutionNote = 'Resolved', user = {}) {
    const isObjectId = mongoose.isValidObjectId(idOrRuleId);
    const rule = await AnalyticsAlertRule.findOne({
      $or: isObjectId ? [{ _id: idOrRuleId }, { ruleId: idOrRuleId }] : [{ ruleId: idOrRuleId }]
    });
    if (!rule) {
      throw new Error(`Alert rule not found: ${idOrRuleId}`);
    }
    rule.status = 'RESOLVED';
    rule.resolvedBy = user.userId || user.email || 'ADMIN';
    rule.resolvedAt = new Date();
    rule.resolutionNote = resolutionNote;
    await rule.save();
    return rule;
  }
}

module.exports = ReportService;
