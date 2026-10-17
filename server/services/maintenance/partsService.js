const MaintenancePartRequest = require('../../models/MaintenancePartRequest');
const MaintenanceWorkOrder = require('../../models/MaintenanceWorkOrder');
const InventoryItem = require('../../models/InventoryItem');
const IdGeneratorService = require('../IdGeneratorService');
const AuditService = require('../AuditService');

class PartsService {
  /**
   * Request Spare Part for Work Order
   */
  static async createPartRequest(data, userId) {
    if (!data.workOrderId) {
      const err = new Error('Work Order ID is required');
      err.statusCode = 400;
      throw err;
    }

    const wo = await MaintenanceWorkOrder.findById(data.workOrderId);
    if (!wo) {
      const err = new Error('Work order not found');
      err.statusCode = 404;
      throw err;
    }

    if (!data.requestId) {
      data.requestId = await IdGeneratorService.generateMaintenancePartRequestId();
    }

    // Check inventory item if provided
    if (data.inventoryItemId) {
      const item = await InventoryItem.findById(data.inventoryItemId);
      if (item) {
        data.partName = data.partName || item.itemName;
        data.partNumber = data.partNumber || item.itemCode;
        data.unitCost = data.unitCost || item.unitPrice || 0;
        data.totalCost = (data.unitCost || 0) * (data.quantityRequested || 1);
      }
    }

    data.requestedBy = userId;
    const partReq = new MaintenancePartRequest(data);
    await partReq.save();

    await AuditService.logEvent({
      action: 'MAINTENANCE_PART_REQUESTED',
      module: 'MAINTENANCE',
      entityId: partReq.requestId,
      performedBy: userId,
      details: {
        requestId: partReq.requestId,
        workOrderId: wo.workOrderId,
        partName: partReq.partName,
        quantity: partReq.quantityRequested
      }
    });

    return partReq;
  }

  /**
   * Get all part requests
   */
  static async getPartRequests(query = {}) {
    const { workOrderId, status, page = 1, limit = 20 } = query;
    const filter = {};
    if (workOrderId) filter.workOrderId = workOrderId;
    if (status) filter.status = status;

    const skip = (Math.max(1, parseInt(page, 10)) - 1) * parseInt(limit, 10);
    const take = parseInt(limit, 10);

    const [items, total] = await Promise.all([
      MaintenancePartRequest.find(filter)
        .populate('workOrderId', 'workOrderId title priority status')
        .populate('inventoryItemId', 'itemName itemCode currentStock')
        .populate('requestedBy', 'firstName lastName')
        .populate('approvedBy', 'firstName lastName')
        .populate('issuedBy', 'firstName lastName')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(take)
        .lean(),
      MaintenancePartRequest.countDocuments(filter)
    ]);

    return {
      items,
      total,
      page: parseInt(page, 10),
      totalPages: Math.ceil(total / take) || 1
    };
  }

  /**
   * Approve Part Request
   */
  static async approvePartRequest(id, userId) {
    const isMongoId = id.match(/^[0-9a-fA-F]{24}$/);
    const query = isMongoId ? { _id: id } : { requestId: id };

    const partReq = await MaintenancePartRequest.findOne(query);
    if (!partReq) {
      const err = new Error('Part request not found');
      err.statusCode = 404;
      throw err;
    }

    partReq.status = 'APPROVED';
    partReq.approvedBy = userId;
    partReq.approvedAt = new Date();
    await partReq.save();

    await AuditService.logEvent({
      action: 'MAINTENANCE_PART_APPROVED',
      module: 'MAINTENANCE',
      entityId: partReq.requestId,
      performedBy: userId,
      details: { requestId: partReq.requestId }
    });

    return partReq;
  }

  /**
   * Issue Part (Medical Inventory Integration with Idempotency)
   */
  static async issuePart(id, { quantityIssued, unitCost }, userId) {
    const isMongoId = id.match(/^[0-9a-fA-F]{24}$/);
    const query = isMongoId ? { _id: id } : { requestId: id };

    const partReq = await MaintenancePartRequest.findOne(query);
    if (!partReq) {
      const err = new Error('Part request not found');
      err.statusCode = 404;
      throw err;
    }

    if (partReq.status === 'ISSUED') {
      return partReq; // Idempotent: already issued
    }

    const qty = quantityIssued || partReq.quantityRequested;
    partReq.quantityIssued = qty;
    if (unitCost !== undefined) partReq.unitCost = unitCost;
    partReq.totalCost = (partReq.unitCost || 0) * qty;
    partReq.status = qty >= partReq.quantityRequested ? 'ISSUED' : 'PARTIALLY_ISSUED';
    partReq.issuedBy = userId;
    partReq.issuedAt = new Date();
    await partReq.save();

    // Update work order partsCost and actualCost
    const wo = await MaintenanceWorkOrder.findById(partReq.workOrderId);
    if (wo) {
      const currentParts = wo.costBreakdown?.partsCost || 0;
      const newParts = currentParts + partReq.totalCost;
      wo.costBreakdown = {
        ...wo.costBreakdown,
        partsCost: newParts
      };
      wo.actualCost = (wo.costBreakdown.laborCost || 0) +
        newParts +
        (wo.costBreakdown.vendorCost || 0) +
        (wo.costBreakdown.otherCost || 0);

      // If WO was WAITING_FOR_PARTS, resume to IN_PROGRESS
      if (wo.status === 'WAITING_FOR_PARTS') {
        wo.status = 'IN_PROGRESS';
      }
      await wo.save();
    }

    await AuditService.logEvent({
      action: 'MAINTENANCE_PART_ISSUED',
      module: 'MAINTENANCE',
      entityId: partReq.requestId,
      performedBy: userId,
      details: {
        requestId: partReq.requestId,
        quantityIssued: qty,
        totalCost: partReq.totalCost
      }
    });

    return partReq;
  }

  /**
   * Return unused part
   */
  static async returnPart(id, { quantityReturned = 1, notes }, userId) {
    const isMongoId = id.match(/^[0-9a-fA-F]{24}$/);
    const query = isMongoId ? { _id: id } : { requestId: id };

    const partReq = await MaintenancePartRequest.findOne(query);
    if (!partReq) {
      const err = new Error('Part request not found');
      err.statusCode = 404;
      throw err;
    }

    partReq.status = 'RETURNED';
    partReq.notes = notes || `Returned ${quantityReturned} units`;
    await partReq.save();

    await AuditService.logEvent({
      action: 'MAINTENANCE_PART_RETURNED',
      module: 'MAINTENANCE',
      entityId: partReq.requestId,
      performedBy: userId,
      details: { requestId: partReq.requestId, quantityReturned }
    });

    return partReq;
  }
}

module.exports = PartsService;
