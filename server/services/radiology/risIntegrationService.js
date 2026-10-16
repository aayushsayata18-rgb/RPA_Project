const RadiologyOrder = require('../../models/RadiologyOrder');
const RadiologyException = require('../../models/RadiologyException');
const IdGeneratorService = require('../IdGeneratorService');
const AuditService = require('../AuditService');

class RisIntegrationService {
  /**
   * Sync Order to External RIS (Mock API)
   */
  static async syncOrderToRis(orderId, user = null) {
    const order = await RadiologyOrder.findById(orderId);
    if (!order) {
      throw new Error('Order not found.');
    }

    if (order.externalRisOrderId) {
      return {
        success: true,
        alreadySynced: true,
        externalRisOrderId: order.externalRisOrderId
      };
    }

    // Generate mock RIS Order ID
    const externalRisOrderId = `RIS-${new Date().getFullYear()}-${Math.floor(100000 + Math.random() * 900000)}`;
    order.externalRisOrderId = externalRisOrderId;
    await order.save();

    await AuditService.logAction({
      user,
      action: 'SYNC_ORDER_TO_RIS',
      entity: 'RadiologyOrder',
      entityId: order._id,
      description: `Synchronized order ${order.orderId} with External RIS. Assigned RIS ID: ${externalRisOrderId}`
    });

    return {
      success: true,
      alreadySynced: false,
      externalRisOrderId,
      orderId: order.orderId
    };
  }

  /**
   * Reconcile unknown external RIS order state
   */
  static async reconcileRisOrder(orderId, user = null) {
    const order = await RadiologyOrder.findById(orderId);
    if (!order) {
      throw new Error('Order not found.');
    }

    // In a real system, query RIS API by correlation/patient/accession
    // If not found, simulate discovery or exception
    if (!order.externalRisOrderId) {
      order.externalRisOrderId = `RIS-REC-${Date.now()}`;
      await order.save();
    }

    return {
      orderId: order.orderId,
      externalRisOrderId: order.externalRisOrderId,
      reconciliationStatus: 'RECONCILED'
    };
  }
}

module.exports = RisIntegrationService;
