const StockCountService = require('../services/inventory/stockCountService');

class StockCountController {
  static async startCountSession(req, res, next) {
    try {
      const user = req.user || { userId: 'SYSTEM' };
      const session = await StockCountService.startCountSession(req.body, user);
      res.status(201).json({ success: true, session });
    } catch (err) {
      next(err);
    }
  }

  static async submitCounts(req, res, next) {
    try {
      const user = req.user || { userId: 'SYSTEM' };
      const { counts } = req.body;
      const session = await StockCountService.submitCounts(req.params.id, counts, user);
      res.json({ success: true, session });
    } catch (err) {
      next(err);
    }
  }

  static async approveAndPost(req, res, next) {
    try {
      const user = req.user || { userId: 'SYSTEM' };
      const result = await StockCountService.approveAndPostCount(req.params.id, user);
      res.json({ success: true, ...result });
    } catch (err) {
      next(err);
    }
  }

  static async getCountSessions(req, res, next) {
    try {
      const result = await StockCountService.getCountSessions(req.query);
      res.json({ success: true, ...result });
    } catch (err) {
      next(err);
    }
  }

  static async getCountSessionById(req, res, next) {
    try {
      const session = await StockCountService.getCountSessionById(req.params.id);
      res.json({ success: true, session });
    } catch (err) {
      next(err);
    }
  }
}

module.exports = StockCountController;
