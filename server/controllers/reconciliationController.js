const ReconciliationService = require('../services/inventory/reconciliationService');

class ReconciliationController {
  static async runReconciliation(req, res, next) {
    try {
      const user = req.user || { userId: 'SYSTEM' };
      const reconciliation = await ReconciliationService.runReconciliation(req.body, user);
      res.status(201).json({ success: true, reconciliation });
    } catch (err) {
      next(err);
    }
  }

  static async resolveDiscrepancy(req, res, next) {
    try {
      const user = req.user || { userId: 'SYSTEM' };
      const result = await ReconciliationService.resolveDiscrepancy(req.params.id, req.body, user);
      res.json({ success: true, ...result });
    } catch (err) {
      next(err);
    }
  }

  static async getReconciliations(req, res, next) {
    try {
      const result = await ReconciliationService.getReconciliations(req.query);
      res.json({ success: true, ...result });
    } catch (err) {
      next(err);
    }
  }

  static async getReconciliationById(req, res, next) {
    try {
      const reconciliation = await ReconciliationService.getReconciliationById(req.params.id);
      res.json({ success: true, reconciliation });
    } catch (err) {
      next(err);
    }
  }
}

module.exports = ReconciliationController;
