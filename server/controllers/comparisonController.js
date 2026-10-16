const ComparisonService = require('../services/procurement/comparisonService');

class ComparisonController {
  static async createComparison(req, res, next) {
    try {
      const user = { userId: req.user?.id || 'SYSTEM', role: req.user?.role || 'PROCUREMENT_OFFICER', name: req.user?.name };
      const comparison = await ComparisonService.createComparison(req.body, user);
      res.status(201).json({ success: true, message: 'Quotation comparison generated', comparison });
    } catch (error) {
      next(error);
    }
  }

  static async selectVendor(req, res, next) {
    try {
      const user = { userId: req.user?.id || 'SYSTEM', role: req.user?.role || 'PROCUREMENT_MANAGER', name: req.user?.name };
      const comparison = await ComparisonService.selectVendor(req.params.id, req.body, user);
      res.json({ success: true, message: 'Vendor selected successfully with recorded justification', comparison });
    } catch (error) {
      next(error);
    }
  }

  static async getComparisons(req, res, next) {
    try {
      const result = await ComparisonService.getComparisons(req.query);
      res.json({ success: true, ...result });
    } catch (error) {
      next(error);
    }
  }

  static async getComparisonById(req, res, next) {
    try {
      const comparison = await ComparisonService.getComparisonById(req.params.id);
      res.json({ success: true, comparison });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = ComparisonController;
