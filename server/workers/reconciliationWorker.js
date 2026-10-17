const ReconciliationService = require('../services/reconciliationService');

class ReconciliationWorker {
  /**
   * Run status reconciliation sweep for pending or unknown provider delivery attempts
   */
  static async runReconciliation(limit = 50) {
    console.log('[ReconciliationWorker] Running periodic delivery status reconciliation...');
    return await ReconciliationService.reconcileDeliveries(limit);
  }
}

module.exports = ReconciliationWorker;
