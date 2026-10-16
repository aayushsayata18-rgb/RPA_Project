const InventoryBatch = require('../../models/InventoryBatch');
const InventoryItem = require('../../models/InventoryItem');
const InventoryMovement = require('../../models/InventoryMovement');
const GoodsReceipt = require('../../models/GoodsReceipt');
const IdGeneratorService = require('../IdGeneratorService');
const AuditService = require('../AuditService');
const ExceptionService = require('../ExceptionService');

class StockService {
  /**
   * Get calculated stock availability for an inventory item
   */
  static async getAvailability(inventoryItemId, locationId = null) {
    const item = await InventoryItem.findOne({
      $or: [{ inventoryItemId }, { medicineId: inventoryItemId }]
    }).lean();

    if (!item) {
      throw new Error(`Inventory item '${inventoryItemId}' not found.`);
    }

    const query = item.medicineId
      ? { $or: [{ inventoryItemId: item.inventoryItemId }, { medicineId: item.medicineId }] }
      : { inventoryItemId: item.inventoryItemId };

    if (locationId) {
      query.locationId = locationId;
    }

    const batches = await InventoryBatch.find(query)
      .sort({ expiryDate: 1 }) // FEFO
      .lean();

    const now = new Date();
    let onHandQuantity = 0;
    let availableQuantity = 0;
    let reservedQuantity = 0;
    let quarantinedQuantity = 0;
    let damagedQuantity = 0;
    let expiredQuantity = 0;

    const activeBatches = [];

    for (const b of batches) {
      const isExpired = new Date(b.expiryDate) < now;

      const onHand = Number(b.availableQuantity || 0) + Number(b.reservedQuantity || 0);
      onHandQuantity += onHand;
      reservedQuantity += Number(b.reservedQuantity || 0);
      quarantinedQuantity += Number(b.quarantinedQuantity || 0);
      damagedQuantity += Number(b.damagedQuantity || 0);

      if (isExpired || b.status === 'EXPIRED') {
        expiredQuantity += Number(b.availableQuantity || 0) + Number(b.expiredQuantity || 0);
      } else if (
        (b.status === 'AVAILABLE' || b.status === 'ACTIVE' || b.status === 'PARTIALLY_RESERVED') &&
        b.availableQuantity > 0
      ) {
        availableQuantity += Number(b.availableQuantity);
        activeBatches.push(b);
      }
    }

    return {
      inventoryItemId: item.inventoryItemId,
      medicineId: item.medicineId,
      name: item.name,
      genericName: item.genericName,
      unitOfMeasure: item.unitOfMeasure,
      reorderLevel: item.reorderLevel,
      locationId: locationId || 'ALL_LOCATIONS',
      onHandQuantity,
      availableQuantity,
      reservedQuantity,
      quarantinedQuantity,
      damagedQuantity,
      expiredQuantity,
      isLowStock: availableQuantity <= (item.reorderLevel || 50),
      batches: activeBatches.map((b) => ({
        batchId: b.batchId,
        batchNumber: b.batchNumber,
        locationId: b.locationId,
        availableQuantity: b.availableQuantity,
        reservedQuantity: b.reservedQuantity,
        expiryDate: b.expiryDate,
        sellingPrice: b.sellingPrice || b.unitPrice
      }))
    };
  }

  /**
   * Log an append-only stock movement
   */
  static async recordMovement(data, session = null) {
    const movementId = await IdGeneratorService.generateMovementId();

    const movement = new InventoryMovement({
      movementId,
      inventoryItemId: data.inventoryItemId,
      itemName: data.itemName || '',
      batchId: data.batchId || null,
      batchNumber: data.batchNumber || '',
      sourceLocationId: data.sourceLocationId || null,
      destinationLocationId: data.destinationLocationId || null,
      movementType: data.movementType,
      quantity: Number(data.quantity),
      unit: data.unit || 'UNIT',
      referenceType: data.referenceType || 'MANUAL',
      referenceId: data.referenceId || '',
      reason: data.reason || '',
      performedBy: data.performedBy || 'SYSTEM',
      approvedBy: data.approvedBy || null,
      correlationId: data.correlationId || '',
      timestamp: new Date()
    });

    if (session) {
      await movement.save({ session });
    } else {
      await movement.save();
    }

    return movement;
  }

  /**
   * Execute atomic stock issue (e.g. to Pharmacy, Ward, OT, Lab)
   */
  static async issueStock(payload, user = { userId: 'SYSTEM' }) {
    const {
      inventoryItemId,
      batchId,
      locationId,
      quantity,
      referenceType = 'DEPARTMENT_ISSUE',
      referenceId = '',
      reason = 'Clinical Issue',
      correlationId = ''
    } = payload;

    const issueQty = Number(quantity);
    if (!issueQty || issueQty <= 0) {
      throw new Error('Issue quantity must be greater than 0.');
    }

    const item = await InventoryItem.findOne({
      $or: [{ inventoryItemId }, { medicineId: inventoryItemId }]
    }).lean();

    if (!item) {
      throw new Error(`Inventory item '${inventoryItemId}' not found.`);
    }

    // Find candidate batch: specific batchId or FEFO eligible
    let batch = null;
    const now = new Date();

    if (batchId) {
      batch = await InventoryBatch.findOne({
        $or: [{ batchId }, { batchNumber: batchId }]
      });
      if (!batch) {
        throw new Error(`Batch '${batchId}' not found.`);
      }
      if (new Date(batch.expiryDate) < now || batch.status === 'EXPIRED') {
        throw new Error(`Cannot issue from expired batch ${batch.batchNumber} (Expired: ${batch.expiryDate.toISOString().slice(0, 10)}).`);
      }
      if (batch.availableQuantity < issueQty) {
        throw new Error(`Insufficient available stock in batch ${batch.batchNumber}. Available: ${batch.availableQuantity}, Requested: ${issueQty}`);
      }
    } else {
      const candidateBatches = await InventoryBatch.find({
        ...(item.medicineId
          ? { $or: [{ inventoryItemId: item.inventoryItemId }, { medicineId: item.medicineId }] }
          : { inventoryItemId: item.inventoryItemId }),
        status: { $in: ['AVAILABLE', 'ACTIVE', 'PARTIALLY_RESERVED'] },
        expiryDate: { $gt: now },
        availableQuantity: { $gt: 0 },
        ...(locationId ? { locationId } : {})
      }).sort({ expiryDate: 1 });

      const totalAvail = candidateBatches.reduce((sum, b) => sum + b.availableQuantity, 0);
      if (totalAvail < issueQty) {
        await ExceptionService.raiseException({
          module: 'MEDICAL_INVENTORY',
          entityType: 'InventoryItem',
          entityId: item.inventoryItemId,
          exceptionType: 'INSUFFICIENT_STOCK',
          description: `Cannot issue ${issueQty} units of ${item.name}. Total available is only ${totalAvail}.`,
          severity: 'HIGH',
          source: 'API',
          metadata: { inventoryItemId, requested: issueQty, available: totalAvail }
        });
        throw new Error(`Insufficient stock for item '${item.name}'. Available: ${totalAvail}, Requested: ${issueQty}`);
      }

      batch = candidateBatches[0];
    }

    // Atomic update on the batch
    batch.availableQuantity -= issueQty;
    batch.onHandQuantity = Math.max(0, (batch.onHandQuantity || 0) - issueQty);
    if (batch.availableQuantity === 0 && (batch.reservedQuantity || 0) === 0) {
      batch.status = 'DEPLETED';
    }
    await batch.save();

    // Append-only movement ledger
    const movement = await StockService.recordMovement({
      inventoryItemId: item.inventoryItemId,
      itemName: item.name,
      batchId: batch.batchId,
      batchNumber: batch.batchNumber,
      sourceLocationId: batch.locationId,
      destinationLocationId: null,
      movementType: 'ISSUE',
      quantity: -issueQty,
      unit: item.unitOfMeasure,
      referenceType,
      referenceId,
      reason,
      performedBy: user.userId,
      correlationId
    });

    await AuditService.logEvent({
      eventType: 'STOCK_ISSUED',
      module: 'MEDICAL_INVENTORY',
      performedBy: user.userId,
      targetEntity: 'InventoryBatch',
      targetId: batch.batchId,
      details: {
        inventoryItemId: item.inventoryItemId,
        quantity: issueQty,
        referenceType,
        referenceId,
        movementId: movement.movementId
      }
    });

    return {
      success: true,
      inventoryItemId: item.inventoryItemId,
      batchId: batch.batchId,
      batchNumber: batch.batchNumber,
      issuedQuantity: issueQty,
      remainingBatchAvailable: batch.availableQuantity,
      movementId: movement.movementId
    };
  }

  /**
   * Process Goods Receipt (GRN) and register batches
   */
  static async processGoodsReceipt(payload, user = { userId: 'SYSTEM' }) {
    const {
      purchaseOrderId,
      vendorId,
      vendorName = '',
      items = [],
      notes = '',
      documents = []
    } = payload;

    if (!items || items.length === 0) {
      throw new Error('At least one item is required to receive goods.');
    }

    const goodsReceiptId = await IdGeneratorService.generateGoodsReceiptId();
    const createdBatches = [];
    const grnItems = [];

    const now = new Date();

    for (const rawItem of items) {
      const query = rawItem.inventoryItemId
        ? { inventoryItemId: rawItem.inventoryItemId }
        : { barcode: rawItem.barcode };
      const item = await InventoryItem.findOne(query).lean();

      if (!item) {
        throw new Error(`Inventory item '${rawItem.inventoryItemId}' not found.`);
      }

      const receivedQty = Number(rawItem.receivedQuantity);
      const orderedQty = Number(rawItem.orderedQuantity || receivedQty);
      const acceptedQty = Number(rawItem.acceptedQuantity !== undefined ? rawItem.acceptedQuantity : receivedQty);
      const rejectedQty = Number(rawItem.rejectedQuantity || (receivedQty - acceptedQty));

      const expiry = new Date(rawItem.expiryDate);
      if (expiry <= now) {
        throw new Error(`Cannot receive item ${item.name} with past expiry date: ${expiry.toISOString().slice(0, 10)}`);
      }

      const batchNumber = rawItem.batchNumber || `BAT-${Date.now()}`;
      const locationId = rawItem.locationId || 'LOC-MAIN-001';

      // Register batch if acceptedQty > 0
      let batch = null;
      if (acceptedQty > 0) {
        const batchId = await IdGeneratorService.generateBatchId();
        batch = new InventoryBatch({
          batchId,
          inventoryItemId: item.inventoryItemId,
          medicineId: item.medicineId,
          medicineName: item.genericName,
          itemName: item.name,
          batchNumber,
          lotNumber: rawItem.lotNumber || batchNumber,
          manufacturer: item.manufacturer || '',
          manufacturingDate: rawItem.manufacturingDate ? new Date(rawItem.manufacturingDate) : null,
          expiryDate: expiry,
          receivedDate: now,
          purchaseOrderId,
          goodsReceiptId,
          supplierId: vendorId,
          supplier: vendorName,
          locationId,
          storageLocation: rawItem.storageLocation || 'Main Store',
          unitCost: Number(rawItem.unitCost || 0),
          sellingPrice: Number(item.supplierReferences?.[0]?.unitPrice || 0),
          initialQuantity: acceptedQty,
          receivedQuantity: receivedQty,
          onHandQuantity: acceptedQty,
          availableQuantity: acceptedQty,
          reservedQuantity: 0,
          quarantinedQuantity: 0,
          damagedQuantity: 0,
          expiredQuantity: 0,
          status: 'AVAILABLE'
        });
        await batch.save();
        createdBatches.push(batch);

        // Record RECEIPT Movement
        await StockService.recordMovement({
          inventoryItemId: item.inventoryItemId,
          itemName: item.name,
          batchId: batch.batchId,
          batchNumber: batch.batchNumber,
          sourceLocationId: null,
          destinationLocationId: locationId,
          movementType: 'RECEIPT',
          quantity: acceptedQty,
          unit: item.unitOfMeasure,
          referenceType: 'GOODS_RECEIPT',
          referenceId: goodsReceiptId,
          reason: `GRN from PO ${purchaseOrderId}`,
          performedBy: user.userId
        });
      }

      grnItems.push({
        inventoryItemId: item.inventoryItemId,
        itemName: item.name,
        orderedQuantity: orderedQty,
        receivedQuantity: receivedQty,
        acceptedQuantity: acceptedQty,
        rejectedQuantity: rejectedQty,
        batchNumber,
        lotNumber: rawItem.lotNumber || batchNumber,
        manufacturingDate: rawItem.manufacturingDate ? new Date(rawItem.manufacturingDate) : null,
        expiryDate: expiry,
        unitCost: Number(rawItem.unitCost || 0),
        locationId,
        inspectionStatus: rejectedQty > 0 ? (acceptedQty > 0 ? 'PARTIAL' : 'REJECTED') : 'ACCEPTED',
        rejectionReason: rawItem.rejectionReason || ''
      });
    }

    const grn = new GoodsReceipt({
      goodsReceiptId,
      purchaseOrderId,
      vendorId,
      vendorName,
      receivedDate: now,
      receivedBy: user.userId,
      status: 'POSTED',
      items: grnItems,
      documents,
      notes
    });

    await grn.save();

    await AuditService.logEvent({
      eventType: 'GOODS_RECEIVED',
      module: 'MEDICAL_INVENTORY',
      performedBy: user.userId,
      targetEntity: 'GoodsReceipt',
      targetId: goodsReceiptId,
      details: { purchaseOrderId, vendorId, itemCount: grnItems.length }
    });

    return {
      goodsReceipt: grn,
      batches: createdBatches
    };
  }

  /**
   * Get stock movement ledger history with filtering
   */
  static async getMovements(query = {}) {
    const {
      page = 1,
      limit = 30,
      inventoryItemId,
      batchId,
      movementType,
      referenceType,
      referenceId,
      startDate,
      endDate
    } = query;

    const filter = {};
    if (inventoryItemId) filter.inventoryItemId = inventoryItemId;
    if (batchId) filter.batchId = batchId;
    if (movementType) filter.movementType = movementType;
    if (referenceType) filter.referenceType = referenceType;
    if (referenceId) filter.referenceId = referenceId;

    if (startDate || endDate) {
      filter.timestamp = {};
      if (startDate) filter.timestamp.$gte = new Date(startDate);
      if (endDate) filter.timestamp.$lte = new Date(endDate);
    }

    const skip = (parseInt(page, 10) - 1) * parseInt(limit, 10);
    const total = await InventoryMovement.countDocuments(filter);
    const movements = await InventoryMovement.find(filter)
      .sort({ timestamp: -1 })
      .skip(skip)
      .limit(parseInt(limit, 10))
      .lean();

    return {
      movements,
      total,
      page: parseInt(page, 10),
      pages: Math.ceil(total / parseInt(limit, 10))
    };
  }
}

module.exports = StockService;
