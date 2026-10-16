const InventoryBatch = require('../../models/InventoryBatch');
const InventoryItem = require('../../models/InventoryItem');
const StockLocation = require('../../models/StockLocation');
const IdGeneratorService = require('../IdGeneratorService');
const AuditService = require('../AuditService');
const ExceptionService = require('../ExceptionService');

class BatchService {
  /**
   * Register a new inventory batch/lot
   */
  static async createBatch(data, user = { userId: 'SYSTEM' }) {
    if (!data.batchNumber) {
      throw new Error('Batch number is required for batch tracking.');
    }
    if (!data.expiryDate) {
      throw new Error('Expiry date is mandatory for inventory batch.');
    }

    const expiry = new Date(data.expiryDate);
    const received = data.receivedDate ? new Date(data.receivedDate) : new Date();

    if (expiry <= received) {
      await ExceptionService.raiseException({
        module: 'MEDICAL_INVENTORY',
        entityType: 'InventoryBatch',
        entityId: data.batchNumber,
        exceptionType: 'INVALID_EXPIRY',
        description: `Batch ${data.batchNumber} has an expiry date (${expiry.toISOString().slice(0, 10)}) earlier than or equal to received date. Receipt blocked.`,
        severity: 'HIGH',
        source: 'SYSTEM',
        metadata: data
      });
      throw new Error(`Invalid expiry date: expiry (${expiry.toISOString().slice(0, 10)}) must be in the future of received date.`);
    }

    // Verify item
    let item = null;
    if (data.inventoryItemId) {
      item = await InventoryItem.findOne({ inventoryItemId: data.inventoryItemId }).lean();
    }
    if (!item && data.medicineId) {
      item = await InventoryItem.findOne({ medicineId: data.medicineId }).lean();
    }

    const batchId = data.batchId || (await IdGeneratorService.generateBatchId());
    const qty = Number(data.quantity || data.receivedQuantity || data.availableQuantity || 0);

    const batch = new InventoryBatch({
      batchId,
      inventoryItemId: item ? item.inventoryItemId : data.inventoryItemId,
      medicineId: item ? item.medicineId : data.medicineId,
      medicineName: item ? item.genericName : (data.medicineName || ''),
      itemName: item ? item.name : (data.itemName || ''),
      batchNumber: data.batchNumber,
      lotNumber: data.lotNumber || data.batchNumber,
      manufacturer: data.manufacturer || (item ? item.manufacturer : ''),
      manufacturingDate: data.manufacturingDate ? new Date(data.manufacturingDate) : null,
      expiryDate: expiry,
      receivedDate: received,
      purchaseOrderId: data.purchaseOrderId || null,
      goodsReceiptId: data.goodsReceiptId || null,
      supplierId: data.supplierId || null,
      supplier: data.supplier || '',
      locationId: data.locationId || 'LOC-MAIN-001',
      storageLocation: data.storageLocation || 'Main Store - Rack A1',
      unitCost: Number(data.unitCost || 0),
      sellingPrice: Number(data.sellingPrice || data.unitPrice || 0),
      unitPrice: Number(data.sellingPrice || data.unitPrice || 0),
      initialQuantity: qty,
      receivedQuantity: qty,
      onHandQuantity: qty,
      availableQuantity: qty,
      reservedQuantity: 0,
      quarantinedQuantity: 0,
      damagedQuantity: 0,
      expiredQuantity: 0,
      status: data.status || 'AVAILABLE'
    });

    await batch.save();

    await AuditService.logEvent({
      eventType: 'BATCH_CREATED',
      module: 'MEDICAL_INVENTORY',
      performedBy: user.userId,
      targetEntity: 'InventoryBatch',
      targetId: batchId,
      details: { batchNumber: batch.batchNumber, quantity: qty, expiryDate: batch.expiryDate }
    });

    return batch;
  }

  /**
   * Get batches with filtering
   */
  static async getBatches(query = {}) {
    const {
      page = 1,
      limit = 20,
      inventoryItemId,
      medicineId,
      locationId,
      status,
      search,
      expiringWithinDays
    } = query;

    const filter = {};

    if (inventoryItemId) filter.inventoryItemId = inventoryItemId;
    if (medicineId) filter.medicineId = medicineId;
    if (locationId) filter.locationId = locationId;
    if (status) filter.status = status;

    if (expiringWithinDays) {
      const now = new Date();
      const cutoff = new Date(Date.now() + parseInt(expiringWithinDays, 10) * 24 * 60 * 60 * 1000);
      filter.expiryDate = { $gte: now, $lte: cutoff };
      filter.status = { $in: ['AVAILABLE', 'ACTIVE', 'RESERVED', 'PARTIALLY_RESERVED'] };
    }

    if (search) {
      const searchRegex = new RegExp(search, 'i');
      filter.$or = [
        { batchId: searchRegex },
        { batchNumber: searchRegex },
        { lotNumber: searchRegex },
        { itemName: searchRegex },
        { medicineName: searchRegex }
      ];
    }

    const skip = (parseInt(page, 10) - 1) * parseInt(limit, 10);
    const total = await InventoryBatch.countDocuments(filter);
    const batches = await InventoryBatch.find(filter)
      .sort({ expiryDate: 1 }) // FEFO ordering
      .skip(skip)
      .limit(parseInt(limit, 10))
      .lean();

    return {
      batches,
      total,
      page: parseInt(page, 10),
      pages: Math.ceil(total / parseInt(limit, 10))
    };
  }

  /**
   * Get single batch by ID
   */
  static async getBatchById(id) {
    const batch = await InventoryBatch.findOne({
      $or: [{ batchId: id }, { batchNumber: id }]
    }).lean();

    if (!batch) {
      throw new Error(`Inventory batch '${id}' not found.`);
    }

    return batch;
  }

  /**
   * Update batch status (e.g. QUARANTINED, BLOCKED, AVAILABLE)
   */
  static async updateBatchStatus(id, newStatus, reason = '', user = { userId: 'SYSTEM' }) {
    const validStatuses = [
      'RECEIVED',
      'AVAILABLE',
      'ACTIVE',
      'RESERVED',
      'PARTIALLY_RESERVED',
      'QUARANTINED',
      'EXPIRED',
      'DAMAGED',
      'DEPLETED',
      'BLOCKED',
      'RECALLED'
    ];

    if (!validStatuses.includes(newStatus)) {
      throw new Error(`Invalid batch status: ${newStatus}`);
    }

    const batch = await InventoryBatch.findOne({
      $or: [{ batchId: id }, { batchNumber: id }]
    });

    if (!batch) {
      throw new Error(`Batch '${id}' not found.`);
    }

    const previousStatus = batch.status;
    batch.status = newStatus;

    if (newStatus === 'QUARANTINED') {
      batch.quarantinedQuantity = batch.availableQuantity;
      batch.availableQuantity = 0;
    } else if (newStatus === 'AVAILABLE' && previousStatus === 'QUARANTINED') {
      batch.availableQuantity = batch.quarantinedQuantity;
      batch.quarantinedQuantity = 0;
    }

    await batch.save();

    await AuditService.logEvent({
      eventType: 'BATCH_STATUS_UPDATED',
      module: 'MEDICAL_INVENTORY',
      performedBy: user.userId,
      targetEntity: 'InventoryBatch',
      targetId: batch.batchId,
      details: { previousStatus, newStatus, reason }
    });

    return batch;
  }
}

module.exports = BatchService;
