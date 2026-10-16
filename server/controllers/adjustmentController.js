const AdjustmentService = require('../services/inventory/adjustmentService');

class AdjustmentController {
  static async createAdjustment(req, res, next) {
    try {
      const user = req.user || { userId: 'SYSTEM' };
      const adjustment = await AdjustmentService.createAdjustment(req.body, user);
      res.status(201).json({ success: true, adjustment });
    } catch (err) {
      next(err);
    }
  }

  static async approveAdjustment(req, res, next) {
    try {
      const user = req.user || { userId: 'SYSTEM' };
      const adjustment = await AdjustmentService.approveAdjustment(req.params.id, user);
      res.json({ success: true, adjustment });
    } catch (err) {
      next(err);
    }
  }

  static async processAdjustment(req, res, next) {
    try {
      const user = req.user || { userId: 'SYSTEM' };
      const adjustment = await AdjustmentService.processAdjustment(req.params.id, user);
      res.json({ success: true, adjustment });
    } catch (err) {
      next(err);
    }
  }

  static async getAdjustments(req, res, next) {
    try {
      const result = await AdjustmentService.getAdjustments(req.query);
      res.json({ success: true, ...result });
    } catch (err) {
      next(err);
    }
  }
}

module.exports = AdjustmentController;
