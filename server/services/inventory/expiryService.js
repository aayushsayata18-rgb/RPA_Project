const InventoryBatch = require('../../models/InventoryBatch');
const InventoryItem = require('../../models/InventoryItem');
const InventoryAlert = require('../../models/InventoryAlert');
const StockService = require('./stockService');
const IdGeneratorService = require('../IdGeneratorService');
const AuditService = require('../AuditService');
const ExceptionService = require('../ExceptionService');

class ExpiryService {
  /**
   * Scan all active batches for expired and near-expiry stock
   */
  static async scanExpiringStock(nearExpiryDays = 30, user = { userId: 'SYSTEM' }) {
    const now = new Date();
    const nearCutoff = new Date(Date.now() + nearExpiryDays * 24 * 60 * 60 * 1000);

    // 1. Identify expired batches
    const expiredBatches = await InventoryBatch.find({
      expiryDate: { $lt: now },
      status: { $in: ['AVAILABLE', 'ACTIVE', 'PARTIALLY_RESERVED'] }
    });

    let expiredCount = 0;
    for (const b of expiredBatches) {
      const prevStatus = b.status;
      b.status = 'EXPIRED';
      b.expiredQuantity = (b.expiredQuantity || 0) + b.availableQuantity;
      b.availableQuantity = 0;
      await b.save();
      expiredCount++;

      // Log EXPIRY movement
      if (b.expiredQuantity > 0) {
        await StockService.recordMovement({
          inventoryItemId: b.inventoryItemId,
          itemName: b.itemName || b.medicineName,
          batchId: b.batchId,
          batchNumber: b.batchNumber,
          sourceLocationId: b.locationId,
          movementType: 'EXPIRY',
          quantity: -b.expiredQuantity,
          referenceType: 'MANUAL',
          referenceId: b.batchId,
          reason: `Automatic expiration on ${b.expiryDate.toISOString().slice(0, 10)}`,
          performedBy: user.userId
        });
      }

      // Check if alert already exists
      const existingAlert = await InventoryAlert.findOne({
        batchId: b.batchId,
        alertType: 'EXPIRED',
        status: { $in: ['OPEN', 'ACKNOWLEDGED'] }
      });

      if (!existingAlert) {
        const alertId = await IdGeneratorService.generateAlertId();
        await new InventoryAlert({
          alertId,
          inventoryItemId: b.inventoryItemId,
          itemName: b.itemName || b.medicineName,
          batchId: b.batchId,
          batchNumber: b.batchNumber,
          locationId: b.locationId,
          alertType: 'EXPIRED',
          severity: 'HIGH',
          message: `Batch ${b.batchNumber} of ${b.itemName || b.medicineName} expired on ${b.expiryDate.toISOString().slice(0, 10)}. Stock blocked from dispensing.`,
          currentValue: b.expiredQuantity,
          status: 'OPEN'
        }).save();
      }

      await ExceptionService.raiseException({
        module: 'MEDICAL_INVENTORY',
        entityType: 'InventoryBatch',
        entityId: b.batchId,
        exceptionType: 'EXPIRED_STOCK',
        description: `Batch ${b.batchNumber} of ${b.itemName || b.medicineName} has expired. Available stock moved to expired state.`,
        severity: 'HIGH',
        source: 'SYSTEM',
        metadata: { batchId: b.batchId, expiryDate: b.expiryDate, expiredQuantity: b.expiredQuantity }
      });
    }

    // 2. Identify near-expiry batches
    const nearExpiryBatches = await InventoryBatch.find({
      expiryDate: { $gte: now, $lte: nearCutoff },
      status: { $in: ['AVAILABLE', 'ACTIVE', 'PARTIALLY_RESERVED'] },
      availableQuantity: { $gt: 0 }
    });

    let nearExpiryCount = 0;
    for (const b of nearExpiryBatches) {
      const existingAlert = await InventoryAlert.findOne({
        batchId: b.batchId,
        alertType: 'NEAR_EXPIRY',
        status: { $in: ['OPEN', 'ACKNOWLEDGED'] }
      });

      if (!existingAlert) {
        const daysLeft = Math.ceil((new Date(b.expiryDate) - now) / (1000 * 60 * 60 * 24));
        const alertId = await IdGeneratorService.generateAlertId();
        await new InventoryAlert({
          alertId,
          inventoryItemId: b.inventoryItemId,
          itemName: b.itemName || b.medicineName,
          batchId: b.batchId,
          batchNumber: b.batchNumber,
          locationId: b.locationId,
          alertType: 'NEAR_EXPIRY',
          severity: daysLeft <= 7 ? 'CRITICAL' : 'MEDIUM',
          message: `Batch ${b.batchNumber} of ${b.itemName || b.medicineName} expires in ${daysLeft} days (${b.expiryDate.toISOString().slice(0, 10)}). Available: ${b.availableQuantity} units.`,
          thresholdValue: nearExpiryDays,
          currentValue: daysLeft,
          status: 'OPEN'
        }).save();
        nearExpiryCount++;
      }
    }

    return {
      expiredTransitions: expiredCount,
      nearExpiryAlertsCreated: nearExpiryCount
    };
  }
}

module.exports = ExpiryService;
