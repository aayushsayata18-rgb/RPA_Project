const ReportService = require('../services/reportService');

/**
 * Module 28: ReportScheduleController
 * Schedules and automated threshold alerts
 */
exports.listSchedules = async (req, res, next) => {
  try {
    const schedules = await ReportService.listSchedules();
    res.json({
      success: true,
      data: schedules
    });
  } catch (error) {
    next(error);
  }
};

exports.createSchedule = async (req, res, next) => {
  try {
    const schedule = await ReportService.createSchedule(req.body, req.user);
    res.status(201).json({
      success: true,
      message: 'Report schedule created successfully.',
      data: schedule
    });
  } catch (error) {
    next(error);
  }
};

exports.updateSchedule = async (req, res, next) => {
  try {
    const { id } = req.params;
    const updated = await ReportService.updateSchedule(id, req.body);
    res.json({
      success: true,
      message: 'Schedule updated successfully.',
      data: updated
    });
  } catch (error) {
    next(error);
  }
};

exports.listAlertRules = async (req, res, next) => {
  try {
    const rules = await ReportService.listAlertRules();
    res.json({
      success: true,
      data: rules
    });
  } catch (error) {
    next(error);
  }
};

exports.listAlerts = exports.listAlertRules;

exports.acknowledgeAlert = async (req, res, next) => {
  try {
    const { id } = req.params;
    const rule = await ReportService.acknowledgeAlert(id, req.user);
    res.json({
      success: true,
      message: 'Alert acknowledged.',
      data: rule
    });
  } catch (error) {
    next(error);
  }
};

exports.resolveAlert = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { note } = req.body;
    const rule = await ReportService.resolveAlert(id, note, req.user);
    res.json({
      success: true,
      message: 'Alert resolved.',
      data: rule
    });
  } catch (error) {
    next(error);
  }
};
