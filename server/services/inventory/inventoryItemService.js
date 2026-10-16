const InventoryItem = require('../../models/InventoryItem');
const Medicine = require('../../models/Medicine');
const InventoryBatch = require('../../models/InventoryBatch');
const IdGeneratorService = require('../IdGeneratorService');
const AuditService = require('../AuditService');

class InventoryItemService {
  /**
   * Create new inventory item master
   */
  static async createItem(data, user = { userId: 'SYSTEM' }) {
    if (!data.name || !data.category) {
      throw new Error('Item name and category are required.');
    }

    // Auto-generate inventoryItemId if not provided
    const inventoryItemId = data.inventoryItemId || (await IdGeneratorService.generateInventoryItemId());

    // If itemType is MEDICINE and medicineId is provided, link and copy details if available
    let medicineRef = null;
    if (data.itemType === 'MEDICINE' && data.medicineId) {
      medicineRef = await Medicine.findOne({ medicineId: data.medicineId }).lean();
    }

    const item = new InventoryItem({
      inventoryItemId,
      itemType: data.itemType || 'MEDICINE',
      medicineId: data.medicineId || (medicineRef ? medicineRef.medicineId : null),
      name: data.name || (medicineRef ? medicineRef.genericName : ''),
      genericName: data.genericName || (medicineRef ? medicineRef.genericName : ''),
      brandName: data.brandName || (medicineRef ? medicineRef.brandName : ''),
      description: data.description || '',
      category: data.category || (medicineRef ? medicineRef.category : 'MEDICINE'),
      subcategory: data.subcategory || '',
      unitOfMeasure: data.unitOfMeasure || (medicineRef ? medicineRef.unit?.toUpperCase() : 'UNIT'),
      packSize: data.packSize || 1,
      packUnit: data.packUnit || 'BOX',
      baseUnit: data.baseUnit || 'PIECE',
      conversionFactor: data.conversionFactor || 1,
      manufacturer: data.manufacturer || (medicineRef ? medicineRef.manufacturer : ''),
      supplierReferences: data.supplierReferences || [],
      barcode: data.barcode || (medicineRef ? medicineRef.barcode : undefined),
      sku: data.sku || (medicineRef ? medicineRef.sku : undefined),
      reorderLevel: data.reorderLevel !== undefined ? data.reorderLevel : 50,
      reorderQuantity: data.reorderQuantity !== undefined ? data.reorderQuantity : 100,
      minimumStock: data.minimumStock !== undefined ? data.minimumStock : 20,
      maximumStock: data.maximumStock !== undefined ? data.maximumStock : 1000,
      prescriptionRequired: data.prescriptionRequired ?? (medicineRef ? medicineRef.prescriptionRequired : false),
      controlledItem: data.controlledItem ?? (medicineRef ? medicineRef.controlledMedicine : false),
      storageRequirements: data.storageRequirements || 'Room Temperature (15-25°C)',
      temperatureRequirement: data.temperatureRequirement || 'Ambient',
      status: data.status || 'ACTIVE',
      createdBy: user.userId,
      updatedBy: user.userId
    });

    await item.save();

    await AuditService.logEvent({
      eventType: 'ITEM_CREATED',
      module: 'MEDICAL_INVENTORY',
      performedBy: user.userId,
      targetEntity: 'InventoryItem',
      targetId: inventoryItemId,
      details: { name: item.name, category: item.category, itemType: item.itemType }
    });

    return item;
  }

  /**
   * Get all items with optional search & pagination
   */
  static async getItems(query = {}) {
    const {
      page = 1,
      limit = 20,
      search,
      category,
      itemType,
      status,
      controlledItem,
      lowStockOnly
    } = query;

    const filter = {};

    if (category) filter.category = category;
    if (itemType) filter.itemType = itemType;
    if (status) filter.status = status;
    if (controlledItem !== undefined) filter.controlledItem = controlledItem === 'true' || controlledItem === true;

    if (search) {
      const searchRegex = new RegExp(search, 'i');
      filter.$or = [
        { inventoryItemId: searchRegex },
        { name: searchRegex },
        { genericName: searchRegex },
        { brandName: searchRegex },
        { barcode: searchRegex },
        { sku: searchRegex },
        { manufacturer: searchRegex }
      ];
    }

    const skip = (parseInt(page, 10) - 1) * parseInt(limit, 10);
    const total = await InventoryItem.countDocuments(filter);
    const items = await InventoryItem.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit, 10))
      .lean();

    // Augment items with live stock metrics
    const itemIds = items.map((i) => i.inventoryItemId);
    const batchMetrics = await InventoryBatch.aggregate([
      {
        $match: {
          inventoryItemId: { $in: itemIds },
          status: { $in: ['AVAILABLE', 'ACTIVE', 'RESERVED', 'PARTIALLY_RESERVED'] }
        }
      },
      {
        $group: {
          _id: '$inventoryItemId',
          totalOnHand: { $sum: '$availableQuantity' },
          totalAvailable: { $sum: '$availableQuantity' },
          totalReserved: { $sum: '$reservedQuantity' },
          batchCount: { $sum: 1 }
        }
      }
    ]);

    const metricsMap = {};
    batchMetrics.forEach((m) => {
      metricsMap[m._id] = m;
    });

    const enrichedItems = items.map((item) => {
      const m = metricsMap[item.inventoryItemId] || {
        totalOnHand: 0,
        totalAvailable: 0,
        totalReserved: 0,
        batchCount: 0
      };
      const available = m.totalAvailable;
      const isLowStock = available <= (item.reorderLevel || 50);

      return {
        ...item,
        currentStock: m.totalOnHand + m.totalReserved,
        availableStock: available,
        reservedStock: m.totalReserved,
        batchCount: m.batchCount,
        isLowStock
      };
    });

    let finalItems = enrichedItems;
    if (lowStockOnly === 'true' || lowStockOnly === true) {
      finalItems = enrichedItems.filter((i) => i.isLowStock);
    }

    return {
      items: finalItems,
      total: lowStockOnly ? finalItems.length : total,
      page: parseInt(page, 10),
      pages: Math.ceil(total / parseInt(limit, 10))
    };
  }

  /**
   * Get single item by ID
   */
  static async getItemById(id) {
    const item = await InventoryItem.findOne({
      $or: [{ inventoryItemId: id }, { barcode: id }, { sku: id }]
    }).lean();

    if (!item) {
      throw new Error(`Inventory item '${id}' not found.`);
    }

    // Retrieve active batches for this item
    const batchQuery = item.medicineId
      ? { $or: [{ inventoryItemId: item.inventoryItemId }, { medicineId: item.medicineId }] }
      : { inventoryItemId: item.inventoryItemId };
    const batches = await InventoryBatch.find(batchQuery)
      .sort({ expiryDate: 1 })
      .lean();

    const totalAvailable = batches.reduce((sum, b) => (b.status === 'AVAILABLE' || b.status === 'ACTIVE' ? sum + b.availableQuantity : sum), 0);
    const totalReserved = batches.reduce((sum, b) => sum + (b.reservedQuantity || 0), 0);
    const totalExpired = batches.reduce((sum, b) => (b.status === 'EXPIRED' ? sum + b.availableQuantity + (b.expiredQuantity || 0) : sum), 0);
    const totalQuarantined = batches.reduce((sum, b) => (b.status === 'QUARANTINED' ? sum + (b.quarantinedQuantity || b.availableQuantity) : sum), 0);

    return {
      ...item,
      currentStock: totalAvailable + totalReserved,
      availableStock: totalAvailable,
      reservedStock: totalReserved,
      expiredStock: totalExpired,
      quarantinedStock: totalQuarantined,
      batches
    };
  }

  /**
   * Update item
   */
  static async updateItem(id, updates, user = { userId: 'SYSTEM' }) {
    delete updates.inventoryItemId; // Protected ID
    updates.updatedBy = user.userId;

    const item = await InventoryItem.findOneAndUpdate(
      { inventoryItemId: id },
      { $set: updates },
      { new: true, runValidators: true }
    );

    if (!item) {
      throw new Error(`Inventory item '${id}' not found.`);
    }

    await AuditService.logEvent({
      eventType: 'ITEM_UPDATED',
      module: 'MEDICAL_INVENTORY',
      performedBy: user.userId,
      targetEntity: 'InventoryItem',
      targetId: id,
      details: updates
    });

    return item;
  }

  /**
   * Change item status
   */
  static async changeStatus(id, status, user = { userId: 'SYSTEM' }) {
    const validStatuses = ['DRAFT', 'ACTIVE', 'INACTIVE', 'DISCONTINUED', 'PENDING_REVIEW'];
    if (!validStatuses.includes(status)) {
      throw new Error(`Invalid status '${status}'. Must be one of: ${validStatuses.join(', ')}`);
    }

    const item = await InventoryItem.findOneAndUpdate(
      { inventoryItemId: id },
      { $set: { status, updatedBy: user.userId } },
      { new: true }
    );

    if (!item) {
      throw new Error(`Inventory item '${id}' not found.`);
    }

    await AuditService.logEvent({
      eventType: 'ITEM_STATUS_CHANGED',
      module: 'MEDICAL_INVENTORY',
      performedBy: user.userId,
      targetEntity: 'InventoryItem',
      targetId: id,
      details: { status }
    });

    return item;
  }
}

module.exports = InventoryItemService;
