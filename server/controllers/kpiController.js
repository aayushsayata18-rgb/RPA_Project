const KPIService = require('../services/kpiService');

/**
 * Module 28: KPIController
 * Executive KPIs, real-time snapshot recalculation, and trends
 */
exports.listKPIs = async (req, res, next) => {
  try {
    const kpis = await KPIService.listKPIs();
    res.json({
      success: true,
      data: kpis
    });
  } catch (error) {
    next(error);
  }
};

exports.calculateKPIs = async (req, res, next) => {
  try {
    const snapshots = await KPIService.calculateAllKPIs();
    res.json({
      success: true,
      message: 'KPI snapshots recalculated successfully.',
      data: snapshots
    });
  } catch (error) {
    next(error);
  }
};

exports.getKPITrend = async (req, res, next) => {
  try {
    const { code } = req.params;
    const trend = await KPIService.getKPITrend(code.toUpperCase());
    res.json({
      success: true,
      data: trend
    });
  } catch (error) {
    next(error);
  }
};
