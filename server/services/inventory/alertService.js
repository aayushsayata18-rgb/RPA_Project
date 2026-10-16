const InventoryAlert = require('../../models/InventoryAlert');
const InventoryItem = require('../../models/InventoryItem');
const InventoryBatch = require('../../models/InventoryBatch');
const InventoryTransfer = require('../../models/InventoryTransfer');
const InventoryAdjustment = require('../../models/InventoryAdjustment');
const InventoryReconciliation = require('../../models/InventoryReconciliation');
const StockCountSession = require('../../models/StockCountSession');
const StockLocation = require('../../models/StockLocation');
const IdGeneratorService = require('../IdGeneratorService');
const AuditService = require('../AuditService');

class AlertService {
  /**
   * Scan for low-stock items and generate LOW_STOCK alerts
   */
  static async scanLowStockItems(user = { userId: 'SYSTEM' }) {
    const items = await InventoryItem.find({ status: 'ACTIVE' }).lean();

    const itemIds = items.map((i) => i.inventoryItemId);
    const batchMetrics = await InventoryBatch.aggregate([
      {
        $match: {
          inventoryItemId: { $in: itemIds },
          status: { $in: ['AVAILABLE', 'ACTIVE', 'PARTIALLY_RESERVED'] }
        }
      },
      {
        $group: {
          _id: '$inventoryItemId',
          totalAvailable: { $sum: '$availableQuantity' }
        }
      }
    ]);

    const availabilityMap = {};
    batchMetrics.forEach((m) => {
      availabilityMap[m._id] = m.totalAvailable;
    });

    let alertsCreated = 0;

    for (const item of items) {
      const available = availabilityMap[item.inventoryItemId] || 0;
      const reorderLevel = item.reorderLevel || 50;

      if (available <= reorderLevel) {
        const existingAlert = await InventoryAlert.findOne({
          inventoryItemId: item.inventoryItemId,
          alertType: 'LOW_STOCK',
          status: { $in: ['OPEN', 'ACKNOWLEDGED'] }
        });

        if (!existingAlert) {
          const alertId = await IdGeneratorService.generateAlertId();
          await new InventoryAlert({
            alertId,
            inventoryItemId: item.inventoryItemId,
            itemName: item.name,
            locationId: null,
            alertType: 'LOW_STOCK',
            severity: available <= (item.minimumStock || 20) ? 'CRITICAL' : 'HIGH',
            message: `Low stock alert for ${item.name} (${item.inventoryItemId}): Available ${available} is at or below reorder level ${reorderLevel}. Recommended reorder: ${item.reorderQuantity || 100} units.`,
            thresholdValue: reorderLevel,
            currentValue: available,
            status: 'OPEN'
          }).save();
          alertsCreated++;
        }
      }
    }

    return { alertsCreated };
  }

  /**
   * Get inventory alerts with filtering
   */
  static async getAlerts(query = {}) {
    const {
      page = 1,
      limit = 20,
      alertType,
      severity,
      status,
      inventoryItemId
    } = query;

    const filter = {};
    if (alertType) filter.alertType = alertType;
    if (severity) filter.severity = severity;
    if (status) filter.status = status;
    if (inventoryItemId) filter.inventoryItemId = inventoryItemId;

    const skip = (parseInt(page, 10) - 1) * parseInt(limit, 10);
    const total = await InventoryAlert.countDocuments(filter);
    const alerts = await InventoryAlert.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit, 10))
      .lean();

    return {
      alerts,
      total,
      page: parseInt(page, 10),
      pages: Math.ceil(total / parseInt(limit, 10))
    };
  }

  /**
   * Update alert status (ACKNOWLEDGED, RESOLVED, DISMISSED)
   */
  static async updateAlertStatus(alertId, newStatus, user = { userId: 'SYSTEM' }) {
    const alert = await InventoryAlert.findOne({ alertId });
    if (!alert) {
      throw new Error(`Alert '${alertId}' not found.`);
    }

    alert.status = newStatus;
    if (newStatus === 'ACKNOWLEDGED') {
      alert.acknowledgedBy = user.userId;
    } else if (newStatus === 'RESOLVED' || newStatus === 'DISMISSED') {
      alert.resolvedBy = user.userId;
      alert.resolvedAt = new Date();
    }

    await alert.save();

    await AuditService.logEvent({
      eventType: 'ALERT_STATUS_UPDATED',
      module: 'MEDICAL_INVENTORY',
      performedBy: user.userId,
      targetEntity: 'InventoryAlert',
      targetId: alertId,
      details: { newStatus }
    });

    return alert;
  }

  /**
   * Get Dashboard KPIs and operational summary metrics
   */
  static async getDashboardKPIs() {
    const now = new Date();
    const nearCutoff = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

    const [
      totalItems,
      totalActiveBatches,
      totalLocations,
      openAlertsCount,
      lowStockAlertsCount,
      nearExpiryCount,
      expiredCount,
      quarantinedCount,
      pendingTransfersCount,
      pendingAdjustmentsCount,
      pendingCountsCount,
      openReconciliationsCount
    ] = await Promise.all([
      InventoryItem.countDocuments({ status: 'ACTIVE' }),
      InventoryBatch.countDocuments({ status: { $in: ['AVAILABLE', 'ACTIVE'] }, availableQuantity: { $gt: 0 } }),
      StockLocation.countDocuments({ status: 'ACTIVE' }),
      InventoryAlert.countDocuments({ status: 'OPEN' }),
      InventoryAlert.countDocuments({ alertType: 'LOW_STOCK', status: 'OPEN' }),
      InventoryBatch.countDocuments({
        expiryDate: { $gte: now, $lte: nearCutoff },
        status: { $in: ['AVAILABLE', 'ACTIVE'] },
        availableQuantity: { $gt: 0 }
      }),
      InventoryBatch.countDocuments({
        $or: [{ status: 'EXPIRED' }, { expiryDate: { $lt: now } }]
      }),
      InventoryBatch.countDocuments({ status: 'QUARANTINED' }),
      InventoryTransfer.countDocuments({ status: { $in: ['REQUESTED', 'APPROVED', 'DISPATCHED'] } }),
      InventoryAdjustment.countDocuments({ status: 'PENDING_APPROVAL' }),
      StockCountSession.countDocuments({ status: { $in: ['DRAFT', 'IN_PROGRESS', 'PENDING_REVIEW'] } }),
      InventoryReconciliation.countDocuments({ status: 'PENDING_REVIEW' })
    ]);

    // Categories breakdown
    const categoryDistribution = await InventoryItem.aggregate([
      { $match: { status: 'ACTIVE' } },
      { $group: { _id: '$category', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    // Recent movements
    const recentMovements = await require('../../models/InventoryMovement')
      .find()
      .sort({ timestamp: -1 })
      .limit(10)
      .lean();

    return {
      totalItems,
      totalActiveBatches,
      totalLocations,
      openAlertsCount,
      lowStockAlertsCount,
      nearExpiryCount,
      expiredCount,
      quarantinedCount,
      pendingTransfersCount,
      pendingAdjustmentsCount,
      pendingCountsCount,
      openReconciliationsCount,
      categoryDistribution,
      recentMovements
    };
  }
}

module.exports = AlertService;
