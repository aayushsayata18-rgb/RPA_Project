const DashboardService = require('../services/dashboardService');

/**
 * Module 28: DashboardController
 * Executive and departmental cross-module metric hubs
 */
exports.getManagementDashboard = async (req, res, next) => {
  try {
    const data = await DashboardService.getManagementDashboard();
    res.json({
      success: true,
      data
    });
  } catch (error) {
    next(error);
  }
};

exports.getOperationsDashboard = async (req, res, next) => {
  try {
    const data = await DashboardService.getOperationsDashboard();
    res.json({
      success: true,
      data
    });
  } catch (error) {
    next(error);
  }
};

exports.getFinanceDashboard = async (req, res, next) => {
  try {
    const data = await DashboardService.getFinanceDashboard();
    res.json({
      success: true,
      data
    });
  } catch (error) {
    next(error);
  }
};

exports.getHRDashboard = async (req, res, next) => {
  try {
    const data = await DashboardService.getHRDashboard();
    res.json({
      success: true,
      data
    });
  } catch (error) {
    next(error);
  }
};

exports.getRPADashboard = async (req, res, next) => {
  try {
    const data = await DashboardService.getRPADashboard();
    res.json({
      success: true,
      data
    });
  } catch (error) {
    next(error);
  }
};
