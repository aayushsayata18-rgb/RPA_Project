const InventoryAdjustment = require('../../models/InventoryAdjustment');
const InventoryBatch = require('../../models/InventoryBatch');
const InventoryItem = require('../../models/InventoryItem');
const StockService = require('./stockService');
const IdGeneratorService = require('../IdGeneratorService');
const AuditService = require('../AuditService');

class AdjustmentService {
  /**
   * Create a new stock adjustment draft or request
   */
  static async createAdjustment(payload, user = { userId: 'SYSTEM' }) {
    const {
      inventoryItemId,
      batchId,
      locationId,
      physicalQuantity,
      reason,
      notes = '',
      supportingDocument = '',
      autoApprove = false
    } = payload;

    if (physicalQuantity === undefined || physicalQuantity === null) {
      throw new Error('Physical quantity is required.');
    }

    const item = await InventoryItem.findOne({
      $or: [{ inventoryItemId }, { medicineId: inventoryItemId }]
    }).lean();

    if (!item) {
      throw new Error(`Inventory item '${inventoryItemId}' not found.`);
    }

    const batch = await InventoryBatch.findOne({
      $or: [{ batchId }, { batchNumber: batchId }]
    });

    if (!batch) {
      throw new Error(`Batch '${batchId}' not found.`);
    }

    const systemQuantity = Number(batch.availableQuantity);
    const countedQuantity = Number(physicalQuantity);
    const difference = countedQuantity - systemQuantity;

    const adjustmentId = await IdGeneratorService.generateAdjustmentId();

    const adjustment = new InventoryAdjustment({
      adjustmentId,
      inventoryItemId: item.inventoryItemId,
      itemName: item.name,
      batchId: batch.batchId,
      batchNumber: batch.batchNumber,
      locationId: locationId || batch.locationId,
      systemQuantity,
      physicalQuantity: countedQuantity,
      difference,
      reason: reason || 'PHYSICAL_COUNT_DIFFERENCE',
      notes,
      supportingDocument,
      requestedBy: user.userId,
      status: autoApprove ? 'APPROVED' : 'PENDING_APPROVAL'
    });

    await adjustment.save();

    await AuditService.logEvent({
      eventType: 'ADJUSTMENT_CREATED',
      module: 'MEDICAL_INVENTORY',
      performedBy: user.userId,
      targetEntity: 'InventoryAdjustment',
      targetId: adjustmentId,
      details: {
        inventoryItemId: item.inventoryItemId,
        batchId: batch.batchId,
        systemQuantity,
        physicalQuantity: countedQuantity,
        difference,
        reason
      }
    });

    if (autoApprove) {
      return await AdjustmentService.processAdjustment(adjustmentId, user);
    }

    return adjustment;
  }

  /**
   * Approve stock adjustment
   */
  static async approveAdjustment(adjustmentId, user = { userId: 'SYSTEM' }) {
    const adjustment = await InventoryAdjustment.findOne({ adjustmentId });
    if (!adjustment) {
      throw new Error(`Adjustment '${adjustmentId}' not found.`);
    }

    if (adjustment.status !== 'PENDING_APPROVAL' && adjustment.status !== 'DRAFT') {
      throw new Error(`Adjustment cannot be approved in '${adjustment.status}' status.`);
    }

    adjustment.status = 'APPROVED';
    adjustment.approvedBy = user.userId;
    await adjustment.save();

    await AuditService.logEvent({
      eventType: 'ADJUSTMENT_APPROVED',
      module: 'MEDICAL_INVENTORY',
      performedBy: user.userId,
      targetEntity: 'InventoryAdjustment',
      targetId: adjustmentId,
      details: { approvedBy: user.userId }
    });

    return await AdjustmentService.processAdjustment(adjustmentId, user);
  }

  /**
   * Process and post adjustment to physical stock ledger
   */
  static async processAdjustment(adjustmentId, user = { userId: 'SYSTEM' }) {
    const adjustment = await InventoryAdjustment.findOne({ adjustmentId });
    if (!adjustment) {
      throw new Error(`Adjustment '${adjustmentId}' not found.`);
    }

    if (adjustment.status !== 'APPROVED') {
      throw new Error(`Adjustment must be approved prior to processing. Status: ${adjustment.status}`);
    }

    const batch = await InventoryBatch.findOne({ batchId: adjustment.batchId });
    if (!batch) {
      throw new Error(`Batch '${adjustment.batchId}' not found.`);
    }

    const previousQty = batch.availableQuantity;
    batch.availableQuantity = adjustment.physicalQuantity;
    batch.onHandQuantity = adjustment.physicalQuantity + (batch.reservedQuantity || 0);

    if (batch.availableQuantity === 0 && (batch.reservedQuantity || 0) === 0) {
      batch.status = 'DEPLETED';
    } else if (batch.status === 'DEPLETED' && batch.availableQuantity > 0) {
      batch.status = 'AVAILABLE';
    }
    await batch.save();

    // Record Movement (ADJUSTMENT_IN or ADJUSTMENT_OUT)
    const movementType = adjustment.difference >= 0 ? 'ADJUSTMENT_IN' : 'ADJUSTMENT_OUT';
    await StockService.recordMovement({
      inventoryItemId: adjustment.inventoryItemId,
      itemName: adjustment.itemName,
      batchId: batch.batchId,
      batchNumber: batch.batchNumber,
      sourceLocationId: adjustment.difference < 0 ? adjustment.locationId : null,
      destinationLocationId: adjustment.difference >= 0 ? adjustment.locationId : null,
      movementType,
      quantity: adjustment.difference,
      unit: 'UNIT',
      referenceType: 'ADJUSTMENT',
      referenceId: adjustmentId,
      reason: `Adjustment ${adjustment.reason}: ${previousQty} -> ${adjustment.physicalQuantity}`,
      performedBy: user.userId,
      approvedBy: adjustment.approvedBy || user.userId
    });

    adjustment.status = 'PROCESSED';
    adjustment.processedAt = new Date();
    await adjustment.save();

    await AuditService.logEvent({
      eventType: 'ADJUSTMENT_POSTED',
      module: 'MEDICAL_INVENTORY',
      performedBy: user.userId,
      targetEntity: 'InventoryAdjustment',
      targetId: adjustmentId,
      details: { previousQuantity: previousQty, newQuantity: adjustment.physicalQuantity, difference: adjustment.difference }
    });

    return adjustment;
  }

  /**
   * Get adjustments list
   */
  static async getAdjustments(query = {}) {
    const {
      page = 1,
      limit = 20,
      inventoryItemId,
      batchId,
      locationId,
      status,
      reason
    } = query;

    const filter = {};
    if (inventoryItemId) filter.inventoryItemId = inventoryItemId;
    if (batchId) filter.batchId = batchId;
    if (locationId) filter.locationId = locationId;
    if (status) filter.status = status;
    if (reason) filter.reason = reason;

    const skip = (parseInt(page, 10) - 1) * parseInt(limit, 10);
    const total = await InventoryAdjustment.countDocuments(filter);
    const adjustments = await InventoryAdjustment.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit, 10))
      .lean();

    return {
      adjustments,
      total,
      page: parseInt(page, 10),
      pages: Math.ceil(total / parseInt(limit, 10))
    };
  }
}

module.exports = AdjustmentService;
