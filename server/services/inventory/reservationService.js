const InventoryReservation = require('../../models/InventoryReservation');
const InventoryBatch = require('../../models/InventoryBatch');
const InventoryItem = require('../../models/InventoryItem');
const StockService = require('./stockService');
const IdGeneratorService = require('../IdGeneratorService');
const AuditService = require('../AuditService');
const ExceptionService = require('../ExceptionService');

class ReservationService {
  /**
   * Create an atomic stock reservation
   */
  static async createReservation(payload, user = { userId: 'SYSTEM' }) {
    const {
      inventoryItemId,
      batchId,
      locationId,
      quantity,
      reservedForType,
      reservedForId,
      expiryHours = 24
    } = payload;

    const reserveQty = Number(quantity);
    if (!reserveQty || reserveQty <= 0) {
      throw new Error('Reservation quantity must be greater than 0.');
    }

    const item = await InventoryItem.findOne({
      $or: [{ inventoryItemId }, { medicineId: inventoryItemId }]
    }).lean();

    if (!item) {
      throw new Error(`Inventory item '${inventoryItemId}' not found.`);
    }

    const now = new Date();
    let batch = null;

    if (batchId) {
      batch = await InventoryBatch.findOne({
        $or: [{ batchId }, { batchNumber: batchId }]
      });
      if (!batch) {
        throw new Error(`Batch '${batchId}' not found.`);
      }
      if (new Date(batch.expiryDate) < now || batch.status === 'EXPIRED') {
        throw new Error(`Cannot reserve from expired batch ${batch.batchNumber}.`);
      }
      if (batch.availableQuantity < reserveQty) {
        await ExceptionService.raiseException({
          module: 'MEDICAL_INVENTORY',
          entityType: 'InventoryBatch',
          entityId: batch.batchId,
          exceptionType: 'INSUFFICIENT_STOCK',
          description: `Cannot reserve ${reserveQty} units from batch ${batch.batchNumber}. Available: ${batch.availableQuantity}.`,
          severity: 'MEDIUM',
          source: 'API',
          metadata: { batchId: batch.batchId, requested: reserveQty, available: batch.availableQuantity }
        });
        throw new Error(`Insufficient available stock in batch ${batch.batchNumber}. Available: ${batch.availableQuantity}, Requested: ${reserveQty}`);
      }
    } else {
      // FEFO candidate selection
      const batchItemFilter = item.medicineId
        ? { $or: [{ inventoryItemId: item.inventoryItemId }, { medicineId: item.medicineId }] }
        : { inventoryItemId: item.inventoryItemId };

      const query = {
        ...batchItemFilter,
        status: { $in: ['AVAILABLE', 'ACTIVE', 'PARTIALLY_RESERVED'] },
        expiryDate: { $gt: now },
        availableQuantity: { $gte: reserveQty }
      };
      if (locationId) query.locationId = locationId;

      batch = await InventoryBatch.findOne(query).sort({ expiryDate: 1 });

      if (!batch) {
        // Check total available across all batches
        const totalAvailQuery = {
          ...batchItemFilter,
          status: { $in: ['AVAILABLE', 'ACTIVE', 'PARTIALLY_RESERVED'] },
          expiryDate: { $gt: now },
          availableQuantity: { $gt: 0 }
        };
        const allBatches = await InventoryBatch.find(totalAvailQuery);
        const total = allBatches.reduce((sum, b) => sum + b.availableQuantity, 0);

        await ExceptionService.raiseException({
          module: 'MEDICAL_INVENTORY',
          entityType: 'InventoryItem',
          entityId: item.inventoryItemId,
          exceptionType: 'INSUFFICIENT_STOCK',
          description: `No single batch has ${reserveQty} available units for ${item.name}. Total across all batches: ${total}.`,
          severity: 'MEDIUM',
          source: 'API',
          metadata: { inventoryItemId: item.inventoryItemId, requested: reserveQty, totalAvailable: total }
        });

        throw new Error(`Insufficient stock for reservation: requested ${reserveQty}, but total single-batch available is less. Total: ${total}`);
      }
    }

    // Atomic update on the batch
    batch.availableQuantity -= reserveQty;
    batch.reservedQuantity = (batch.reservedQuantity || 0) + reserveQty;
    batch.status = batch.availableQuantity === 0 ? 'RESERVED' : 'PARTIALLY_RESERVED';
    await batch.save();

    const reservationId = await IdGeneratorService.generateReservationId();
    const expiresAt = new Date(Date.now() + Number(expiryHours) * 60 * 60 * 1000);

    const reservation = new InventoryReservation({
      reservationId,
      inventoryItemId: item.inventoryItemId,
      itemName: item.name,
      batchId: batch.batchId,
      locationId: batch.locationId,
      quantity: reserveQty,
      consumedQuantity: 0,
      reservedForType: reservedForType || 'PHARMACY_ORDER',
      reservedForId: reservedForId || 'SYSTEM_RES',
      status: 'ACTIVE',
      reservedAt: now,
      expiresAt,
      createdBy: user.userId
    });

    await reservation.save();

    // Record movement
    await StockService.recordMovement({
      inventoryItemId: item.inventoryItemId,
      itemName: item.name,
      batchId: batch.batchId,
      batchNumber: batch.batchNumber,
      sourceLocationId: batch.locationId,
      movementType: 'RESERVATION',
      quantity: reserveQty,
      unit: item.unitOfMeasure,
      referenceType: reservedForType || 'MANUAL',
      referenceId: reservedForId || reservationId,
      reason: `Stock Reservation ${reservationId}`,
      performedBy: user.userId
    });

    await AuditService.logEvent({
      eventType: 'STOCK_RESERVED',
      module: 'MEDICAL_INVENTORY',
      performedBy: user.userId,
      targetEntity: 'InventoryReservation',
      targetId: reservationId,
      details: {
        inventoryItemId: item.inventoryItemId,
        batchId: batch.batchId,
        quantity: reserveQty,
        reservedForType,
        reservedForId
      }
    });

    return reservation;
  }

  /**
   * Release an active reservation
   */
  static async releaseReservation(reservationId, reason = 'Cancelled/Expired', user = { userId: 'SYSTEM' }) {
    const reservation = await InventoryReservation.findOne({ reservationId });
    if (!reservation) {
      throw new Error(`Reservation '${reservationId}' not found.`);
    }

    if (reservation.status !== 'ACTIVE' && reservation.status !== 'PARTIALLY_CONSUMED') {
      throw new Error(`Cannot release reservation with status '${reservation.status}'.`);
    }

    const unconsumedQty = reservation.quantity - (reservation.consumedQuantity || 0);

    if (unconsumedQty > 0) {
      const batch = await InventoryBatch.findOne({ batchId: reservation.batchId });
      if (batch) {
        batch.reservedQuantity = Math.max(0, (batch.reservedQuantity || 0) - unconsumedQty);
        batch.availableQuantity += unconsumedQty;
        if (batch.status === 'RESERVED' || batch.status === 'PARTIALLY_RESERVED') {
          batch.status = 'AVAILABLE';
        }
        await batch.save();

        await StockService.recordMovement({
          inventoryItemId: reservation.inventoryItemId,
          itemName: reservation.itemName,
          batchId: batch.batchId,
          batchNumber: batch.batchNumber,
          sourceLocationId: batch.locationId,
          movementType: 'RELEASE_RESERVATION',
          quantity: unconsumedQty,
          referenceType: 'MANUAL',
          referenceId: reservationId,
          reason,
          performedBy: user.userId
        });
      }
    }

    reservation.status = 'RELEASED';
    reservation.releasedAt = new Date();
    await reservation.save();

    await AuditService.logEvent({
      eventType: 'RESERVATION_RELEASED',
      module: 'MEDICAL_INVENTORY',
      performedBy: user.userId,
      targetEntity: 'InventoryReservation',
      targetId: reservationId,
      details: { unconsumedReleased: unconsumedQty, reason }
    });

    return reservation;
  }

  /**
   * Get reservations list
   */
  static async getReservations(query = {}) {
    const {
      page = 1,
      limit = 20,
      inventoryItemId,
      batchId,
      status,
      reservedForType,
      reservedForId
    } = query;

    const filter = {};
    if (inventoryItemId) filter.inventoryItemId = inventoryItemId;
    if (batchId) filter.batchId = batchId;
    if (status) filter.status = status;
    if (reservedForType) filter.reservedForType = reservedForType;
    if (reservedForId) filter.reservedForId = reservedForId;

    const skip = (parseInt(page, 10) - 1) * parseInt(limit, 10);
    const total = await InventoryReservation.countDocuments(filter);
    const reservations = await InventoryReservation.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit, 10))
      .lean();

    return {
      reservations,
      total,
      page: parseInt(page, 10),
      pages: Math.ceil(total / parseInt(limit, 10))
    };
  }
}

module.exports = ReservationService;
