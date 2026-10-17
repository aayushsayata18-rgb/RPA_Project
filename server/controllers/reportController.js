const fs = require('fs');
const ReportService = require('../services/reportService');
const AnalyticsService = require('../services/analyticsService');
const DataQualityService = require('../services/dataQualityService');

/**
 * Module 28: ReportController
 * Handles catalog discovery, execution, history, downloads, analytics trends, and data quality
 */
exports.getCatalog = async (req, res, next) => {
  try {
    const userRole = req.user?.role || 'SYSTEM_ADMIN';
    const catalog = await ReportService.getCatalog(req.query, userRole);
    res.json({
      success: true,
      data: catalog
    });
  } catch (error) {
    next(error);
  }
};

exports.getReportDefinition = async (req, res, next) => {
  try {
    const { reportId } = req.params;
    const report = await ReportService.getReportDefinition(reportId);
    res.json({
      success: true,
      data: report
    });
  } catch (error) {
    next(error);
  }
};

exports.executeReport = async (req, res, next) => {
  try {
    const { reportId } = req.params;
    const { filters, format } = req.body;

    const execution = await ReportService.executeReport({
      reportId,
      filters: filters || {},
      format: format || 'JSON',
      user: req.user || {},
      ipAddress: req.ip,
      userAgent: req.headers['user-agent']
    });

    res.status(201).json({
      success: true,
      message: 'Report execution completed.',
      data: execution
    });
  } catch (error) {
    next(error);
  }
};

exports.getExecutionStatus = async (req, res, next) => {
  try {
    const { executionId } = req.params;
    const execution = await ReportService.getExecution(executionId);
    res.json({
      success: true,
      data: execution
    });
  } catch (error) {
    next(error);
  }
};

exports.downloadReportFile = async (req, res, next) => {
  try {
    const { executionId } = req.params;
    const execution = await ReportService.getExecution(executionId);

    if (!execution.outputFile || !fs.existsSync(execution.outputFile)) {
      return res.status(404).json({
        success: false,
        message: 'Report output file not found on storage.'
      });
    }

    const filename = `${execution.reportCode}_${execution.executionId}.${(execution.outputFormat || 'csv').toLowerCase()}`;
    res.download(execution.outputFile, filename);
  } catch (error) {
    next(error);
  }
};

exports.listExecutions = async (req, res, next) => {
  try {
    const executions = await ReportService.listExecutions(req.query, req.user);
    res.json({
      success: true,
      data: executions
    });
  } catch (error) {
    next(error);
  }
};

exports.getMetricTrend = async (req, res, next) => {
  try {
    const { metric, interval, periods } = req.query;
    const trend = await AnalyticsService.getMetricTrend({
      metric: metric || 'APPOINTMENTS',
      interval: interval || 'MONTHLY',
      periods: periods ? parseInt(periods, 10) : 6
    });
    res.json({ success: true, data: trend });
  } catch (error) {
    next(error);
  }
};

exports.getPeriodComparison = async (req, res, next) => {
  try {
    const { metric } = req.query;
    const comparison = await AnalyticsService.getPeriodComparison(metric || 'REVENUE');
    res.json({ success: true, data: comparison });
  } catch (error) {
    next(error);
  }
};

exports.getBedDrillDown = async (req, res, next) => {
  try {
    const drilldown = await AnalyticsService.getBedDrillDown();
    res.json({ success: true, data: drilldown });
  } catch (error) {
    next(error);
  }
};

exports.getManagementInsights = async (req, res, next) => {
  try {
    const insights = await AnalyticsService.getManagementInsights();
    res.json({ success: true, data: insights });
  } catch (error) {
    next(error);
  }
};

exports.getDataQualityAudit = async (req, res, next) => {
  try {
    const audit = await DataQualityService.runQualityAudit();
    res.json({ success: true, data: audit });
  } catch (error) {
    next(error);
  }
};

