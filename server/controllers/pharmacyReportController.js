const PharmacyReportService = require('../services/pharmacy/pharmacyReportService');
const StockAvailabilityService = require('../services/pharmacy/stockAvailabilityService');

class PharmacyReportController {
  static async getDashboardKPIs(req, res, next) {
    try {
      const kpis = await PharmacyReportService.getDashboardKPIs();
      return res.json({ success: true, kpis });
    } catch (err) {
      next(err);
    }
  }

  static async getDispensingReport(req, res, next) {
    try {
      const report = await PharmacyReportService.getDispensingReport(req.query);
      return res.json({ success: true, report });
    } catch (err) {
      next(err);
    }
  }

  static async getOrdersReport(req, res, next) {
    try {
      const report = await PharmacyReportService.getOrdersReport(req.query);
      return res.json({ success: true, report });
    } catch (err) {
      next(err);
    }
  }

  static async getOutOfStockReport(req, res, next) {
    try {
      const items = await StockAvailabilityService.getOutOfStockMedicines();
      return res.json({ success: true, count: items.length, items });
    } catch (err) {
      next(err);
    }
  }

  static async getNearExpiryReport(req, res, next) {
    try {
      const days = req.query.days || 30;
      const batches = await StockAvailabilityService.getNearExpiryBatches(days);
      return res.json({ success: true, count: batches.length, batches });
    } catch (err) {
      next(err);
    }
  }
}

module.exports = PharmacyReportController;
