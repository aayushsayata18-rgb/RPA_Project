const BatchService = require('../services/inventory/batchService');

class BatchController {
  static async getBatches(req, res, next) {
    try {
      const result = await BatchService.getBatches(req.query);
      res.json({ success: true, ...result });
    } catch (err) {
      next(err);
    }
  }

  static async getBatchById(req, res, next) {
    try {
      const batch = await BatchService.getBatchById(req.params.id);
      res.json({ success: true, batch });
    } catch (err) {
      next(err);
    }
  }

  static async createBatch(req, res, next) {
    try {
      const user = req.user || { userId: 'SYSTEM' };
      const batch = await BatchService.createBatch(req.body, user);
      res.status(201).json({ success: true, batch });
    } catch (err) {
      next(err);
    }
  }

  static async updateStatus(req, res, next) {
    try {
      const user = req.user || { userId: 'SYSTEM' };
      const { status, reason } = req.body;
      const batch = await BatchService.updateBatchStatus(req.params.id, status, reason, user);
      res.json({ success: true, batch });
    } catch (err) {
      next(err);
    }
  }
}

module.exports = BatchController;
