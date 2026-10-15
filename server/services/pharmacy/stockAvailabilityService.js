const InventoryBatch = require('../../models/InventoryBatch');
const Medicine = require('../../models/Medicine');
const PharmacyOrder = require('../../models/PharmacyOrder');
const AuditService = require('../AuditService');
const ExceptionService = require('../ExceptionService');

class StockAvailabilityService {
  /**
   * Get physical stock availability for a medicine across active batches
   */
  static async getStockAvailability(medicineId) {
    const medicine = await Medicine.findOne({ medicineId }).lean();
    if (!medicine) {
      throw new Error(`Medicine '${medicineId}' not found.`);
    }

    const now = new Date();

    // Find all batches for this medicine
    const batches = await InventoryBatch.find({
      medicineId,
      status: { $in: ['ACTIVE', 'EXPIRED'] }
    })
      .sort({ expiryDate: 1 }) // FEFO ordering by default
      .lean();

    // Check for expired batches and flag them
    const validBatches = [];
    let expiredQuantity = 0;
    let totalAvailableQuantity = 0;
    let totalReservedQuantity = 0;

    for (const b of batches) {
      const isExpired = new Date(b.expiryDate) < now;
      if (isExpired) {
        expiredQuantity += b.availableQuantity;
        // If batch status was not yet updated to EXPIRED, update it
        if (b.status !== 'EXPIRED') {
          await InventoryBatch.updateOne({ batchId: b.batchId }, { status: 'EXPIRED' });
          await ExceptionService.raiseException({
            module: 'INVENTORY',
            entityType: 'InventoryBatch',
            entityId: b.batchId,
            exceptionType: 'EXPIRED_BATCH_DETECTED',
            description: `Batch ${b.batchId} for medicine ${medicineId} has expired on ${b.expiryDate.toISOString().slice(0, 10)}. Dispensing blocked.`,
            severity: 'HIGH',
            source: 'SYSTEM',
            metadata: { batchId: b.batchId, medicineId, expiryDate: b.expiryDate }
          });
        }
      } else if (b.status === 'ACTIVE' && b.availableQuantity > 0) {
        validBatches.push(b);
        totalAvailableQuantity += b.availableQuantity;
        totalReservedQuantity += b.reservedQuantity || 0;
      }
    }

    // Check near-expiry (e.g. 30 days)
    const nearExpiryDays = 30;
    const nearExpiryCutoff = new Date(Date.now() + nearExpiryDays * 24 * 60 * 60 * 1000);
    const nearExpiryBatches = validBatches.filter((b) => new Date(b.expiryDate) <= nearExpiryCutoff);

    return {
      medicineId,
      medicineName: medicine.genericName,
      strength: medicine.strength,
      dosageForm: medicine.dosageForm,
      availableQuantity: totalAvailableQuantity,
      reservedQuantity: totalReservedQuantity,
      expiredQuantity,
      hasNearExpiry: nearExpiryBatches.length > 0,
      nearExpiryCount: nearExpiryBatches.length,
      batches: validBatches.map((b) => ({
        batchId: b.batchId,
        lotNumber: b.lotNumber,
        availableQuantity: b.availableQuantity,
        reservedQuantity: b.reservedQuantity || 0,
        expiryDate: b.expiryDate,
        isNearExpiry: new Date(b.expiryDate) <= nearExpiryCutoff,
        unitPrice: b.unitPrice || medicine.unitPrice
      }))
    };
  }

  /**
   * Concurrency-safe atomic stock reservation for a pharmacy order
   */
  static async reserveStockForOrder({
    pharmacyOrderId,
    medicineId,
    quantity,
    selectionMethod = 'FEFO',
    overrideBatchId = null,
    overrideReason = null,
    actorUser = null
  }) {
    const order = await PharmacyOrder.findOne({ pharmacyOrderId });
    if (!order) {
      throw new Error(`Pharmacy order '${pharmacyOrderId}' not found.`);
    }

    if (!medicineId && order.items && order.items.length > 0) {
      const itemToReserve = order.items.find((i) => i.reservedQuantity < i.prescribedQuantity) || order.items[0];
      medicineId = itemToReserve.medicineId;
      if (!quantity) {
        quantity = Math.max(1, itemToReserve.prescribedQuantity - (itemToReserve.reservedQuantity || 0));
      }
    }

    const qtyNeeded = Math.max(1, parseInt(quantity, 10));

    const orderItem = order.items.find((item) => item.medicineId === medicineId);
    if (!orderItem) {
      throw new Error(`Medicine '${medicineId}' is not part of pharmacy order '${pharmacyOrderId}'.`);
    }

    const now = new Date();

    // Query eligible batches
    let batchQuery = {
      medicineId,
      status: 'ACTIVE',
      expiryDate: { $gt: now },
      availableQuantity: { $gt: 0 }
    };

    if (overrideBatchId) {
      batchQuery.batchId = overrideBatchId;
    }

    const sortOption = selectionMethod === 'FIFO' ? { createdAt: 1 } : { expiryDate: 1 }; // Default FEFO
    const candidateBatches = await InventoryBatch.find(batchQuery).sort(sortOption);

    const totalAvailable = candidateBatches.reduce((acc, b) => acc + b.availableQuantity, 0);

    if (totalAvailable < qtyNeeded) {
      await ExceptionService.raiseException({
        module: 'PHARMACY',
        entityType: 'PharmacyOrder',
        entityId: pharmacyOrderId,
        exceptionType: 'INSUFFICIENT_STOCK',
        description: `Insufficient stock for medicine ${medicineId}. Requested: ${qtyNeeded}, Available: ${totalAvailable}.`,
        severity: 'MEDIUM',
        source: 'MANUAL',
        metadata: { pharmacyOrderId, medicineId, requested: qtyNeeded, available: totalAvailable }
      });

      order.status = 'ON_HOLD';
      order.holdReason = `Insufficient stock for medicine ${medicineId}`;
      await order.save();

      throw new Error(`Insufficient stock for medicine '${medicineId}'. Needed ${qtyNeeded}, only ${totalAvailable} available.`);
    }

    // Perform atomic reservations across candidate batches
    let remainingToReserve = qtyNeeded;
    const reservedFromBatches = [];

    for (const batch of candidateBatches) {
      if (remainingToReserve <= 0) break;

      const toDeduct = Math.min(batch.availableQuantity, remainingToReserve);

      // Atomic update with concurrency guard
      const updatedBatch = await InventoryBatch.findOneAndUpdate(
        {
          batchId: batch.batchId,
          availableQuantity: { $gte: toDeduct }
        },
        {
          $inc: {
            availableQuantity: -toDeduct,
            reservedQuantity: toDeduct
          }
        },
        { new: true }
      );

      if (!updatedBatch) {
        // Concurrency conflict occurred on this batch, skip and try remaining
        continue;
      }

      remainingToReserve -= toDeduct;
      reservedFromBatches.push({
        batchId: batch.batchId,
        quantity: toDeduct,
        expiryDate: batch.expiryDate,
        reservedAt: new Date()
      });
    }

    if (remainingToReserve > 0) {
      // Rollback any partial reservations made during this atomic attempt
      for (const res of reservedFromBatches) {
        await InventoryBatch.updateOne(
          { batchId: res.batchId },
          {
            $inc: {
              availableQuantity: res.quantity,
              reservedQuantity: -res.quantity
            }
          }
        );
      }
      throw new Error(`Concurrent reservation conflict: stock became unavailable during reservation. Please retry.`);
    }

    // Update PharmacyOrder item
    orderItem.reservedQuantity = (orderItem.reservedQuantity || 0) + qtyNeeded;
    orderItem.batchReservations = [...(orderItem.batchReservations || []), ...reservedFromBatches];
    orderItem.status = 'RESERVED';

    // If all items in order have reservations or are ready, transition status
    const allReserved = order.items.every((it) => it.reservedQuantity >= it.prescribedQuantity);
    if (allReserved) {
      order.status = 'READY_FOR_DISPENSING';
    }

    await order.save();

    await AuditService.logEvent({
      userId: actorUser?.userId || 'SYSTEM',
      role: actorUser?.role || 'PHARMACIST',
      action: 'STOCK_RESERVED',
      module: 'PHARMACY',
      entityType: 'PharmacyOrder',
      entityId: pharmacyOrderId,
      details: `Reserved ${qtyNeeded} units of medicine ${medicineId} for order ${pharmacyOrderId} via ${selectionMethod}. Override: ${overrideBatchId || 'NONE'}`
    });

    return {
      pharmacyOrderId,
      medicineId,
      reservedQuantity: qtyNeeded,
      batchReservations: reservedFromBatches,
      orderStatus: order.status
    };
  }

  /**
   * Release reserved stock back to available stock
   */
  static async releaseReservation({ pharmacyOrderId, actorUser = null }) {
    const order = await PharmacyOrder.findOne({ pharmacyOrderId });
    if (!order) {
      throw new Error(`Pharmacy order '${pharmacyOrderId}' not found.`);
    }

    let releasedCount = 0;

    for (const item of order.items) {
      if (item.batchReservations && item.batchReservations.length > 0) {
        for (const res of item.batchReservations) {
          if (res.quantity > 0) {
            await InventoryBatch.updateOne(
              { batchId: res.batchId },
              {
                $inc: {
                  availableQuantity: res.quantity,
                  reservedQuantity: -res.quantity
                }
              }
            );
            releasedCount += res.quantity;
          }
        }
        item.batchReservations = [];
        item.reservedQuantity = 0;
        if (item.status === 'RESERVED') {
          item.status = 'PENDING';
        }
      }
    }

    if (order.status === 'READY_FOR_DISPENSING') {
      order.status = 'RECEIVED';
    }

    await order.save();

    await AuditService.logEvent({
      userId: actorUser?.userId || 'SYSTEM',
      role: actorUser?.role || 'PHARMACIST',
      action: 'STOCK_RESERVATION_RELEASED',
      module: 'PHARMACY',
      entityType: 'PharmacyOrder',
      entityId: pharmacyOrderId,
      details: `Released ${releasedCount} reserved units for order ${pharmacyOrderId}.`
    });

    return { pharmacyOrderId, releasedCount, orderStatus: order.status };
  }

  /**
   * Get near-expiry medicines for alerts and reports
   */
  static async getNearExpiryBatches(days = 30) {
    const now = new Date();
    const cutoff = new Date(Date.now() + parseInt(days, 10) * 24 * 60 * 60 * 1000);

    const batches = await InventoryBatch.find({
      status: 'ACTIVE',
      availableQuantity: { $gt: 0 },
      expiryDate: { $gte: now, $lte: cutoff }
    })
      .sort({ expiryDate: 1 })
      .lean();

    return batches;
  }

  /**
   * Get out of stock medicines
   */
  static async getOutOfStockMedicines() {
    const medicines = await Medicine.find({ status: 'ACTIVE' }).lean();
    const outOfStock = [];

    for (const med of medicines) {
      const stock = await this.getStockAvailability(med.medicineId);
      if (stock.availableQuantity <= 0) {
        outOfStock.push({
          medicineId: med.medicineId,
          genericName: med.genericName,
          brandName: med.brandName,
          strength: med.strength,
          dosageForm: med.dosageForm,
          reorderLevel: med.reorderLevel,
          availableQuantity: 0
        });
      }
    }

    return outOfStock;
  }
}

module.exports = StockAvailabilityService;
