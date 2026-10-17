const MaintenanceAnalyticsService = require('../../services/maintenance/maintenanceAnalyticsService');

exports.getDashboardMetrics = async (req, res, next) => {
  try {
    const metrics = await MaintenanceAnalyticsService.getDashboardMetrics();
    res.json({
      success: true,
      data: metrics
    });
  } catch (err) {
    next(err);
  }
};

exports.getCostAnalytics = async (req, res, next) => {
  try {
    const costs = await MaintenanceAnalyticsService.getCostAnalytics();
    res.json({
      success: true,
      data: costs
    });
  } catch (err) {
    next(err);
  }
};

exports.getDowntimeAnalytics = async (req, res, next) => {
  try {
    const downtime = await MaintenanceAnalyticsService.getDowntimeAnalytics();
    res.json({
      success: true,
      data: downtime
    });
  } catch (err) {
    next(err);
  }
};

exports.getMttrMtbfAnalytics = async (req, res, next) => {
  try {
    const data = await MaintenanceAnalyticsService.getMttrMtbfAnalytics();
    res.json({
      success: true,
      data
    });
  } catch (err) {
    next(err);
  }
};

