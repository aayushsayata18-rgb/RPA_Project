const MaintenanceWorkOrder = require('../../models/MaintenanceWorkOrder');
const Asset = require('../../models/Asset');
const MaintenanceRequest = require('../../models/MaintenanceRequest');
const MaintenanceChecklist = require('../../models/MaintenanceChecklist');
const MaintenancePartRequest = require('../../models/MaintenancePartRequest');
const IdGeneratorService = require('../IdGeneratorService');
const AuditService = require('../AuditService');
const NotificationService = require('../NotificationService');

class WorkOrderService {
  /**
   * Create Work Order directly
   */
  static async createWorkOrder(data, userId) {
    if (!data.assetId) {
      const err = new Error('Asset ID is required for a work order');
      err.statusCode = 400;
      throw err;
    }

    const asset = await Asset.findById(data.assetId);
    if (!asset) {
      const err = new Error('Asset not found');
      err.statusCode = 404;
      throw err;
    }

    if (!data.workOrderId) {
      const isPM = data.maintenanceType === 'PREVENTIVE';
      data.workOrderId = await IdGeneratorService.generateMaintenanceWorkOrderId(isPM);
    }

    data.departmentId = data.departmentId || asset.departmentId;
    data.locationId = data.locationId || asset.locationId;
    data.createdBy = userId;
    data.updatedBy = userId;

    if (data.assignedTechnicianId || data.assignedVendorId) {
      data.status = data.scheduledStart ? 'SCHEDULED' : 'ASSIGNED';
      data.assignedBy = userId;
      data.assignedAt = new Date();
    }

    // Default SLA calculation
    const now = new Date();
    let resMins = 480;
    if (data.priority === 'CRITICAL' || data.priority === 'URGENT') resMins = 240;
    else if (data.priority === 'HIGH') resMins = 360;
    else if (data.priority === 'LOW') resMins = 1440;
    data.resolutionDue = new Date(now.getTime() + resMins * 60000);

    const workOrder = new MaintenanceWorkOrder(data);
    await workOrder.save();

    // Mark asset as UNDER_MAINTENANCE
    if (asset.status !== 'UNDER_MAINTENANCE') {
      asset.status = 'UNDER_MAINTENANCE';
      asset.maintenanceRequired = true;
      await asset.save();
    }

    await AuditService.logEvent({
      action: 'WORK_ORDER_CREATED',
      module: 'MAINTENANCE',
      entityId: workOrder.workOrderId,
      performedBy: userId,
      details: {
        workOrderId: workOrder.workOrderId,
        assetId: asset.assetId,
        type: workOrder.maintenanceType,
        priority: workOrder.priority
      }
    });

    return workOrder;
  }

  /**
   * Get filtered & paginated work orders
   */
  static async getWorkOrders(query = {}) {
    const {
      page = 1,
      limit = 20,
      search,
      status,
      priority,
      maintenanceType,
      assetId,
      assignedTechnicianId,
      assignedVendorId,
      slaStatus,
      dateFrom,
      dateTo
    } = query;

    const filter = {};
    if (status) filter.status = status;
    if (priority) filter.priority = priority;
    if (maintenanceType) filter.maintenanceType = maintenanceType;
    if (assetId) filter.assetId = assetId;
    if (assignedTechnicianId) filter.assignedTechnicianId = assignedTechnicianId;
    if (assignedVendorId) filter.assignedVendorId = assignedVendorId;
    if (slaStatus) filter.slaStatus = slaStatus;

    if (dateFrom || dateTo) {
      filter.createdAt = {};
      if (dateFrom) filter.createdAt.$gte = new Date(dateFrom);
      if (dateTo) filter.createdAt.$lte = new Date(dateTo);
    }

    if (search) {
      const regex = new RegExp(search.trim(), 'i');
      filter.$or = [
        { workOrderId: regex },
        { title: regex },
        { description: regex },
        { externalWorkOrderId: regex }
      ];
    }

    const skip = (Math.max(1, parseInt(page, 10)) - 1) * parseInt(limit, 10);
    const take = parseInt(limit, 10);

    const [items, total] = await Promise.all([
      MaintenanceWorkOrder.find(filter)
        .populate('assetId', 'name assetId assetTag status criticality model manufacturer')
        .populate('assignedTechnicianId', 'firstName lastName email role')
        .populate('assignedVendorId', 'name vendorCode phone')
        .populate('departmentId', 'name code')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(take)
        .lean(),
      MaintenanceWorkOrder.countDocuments(filter)
    ]);

    return {
      items,
      total,
      page: parseInt(page, 10),
      totalPages: Math.ceil(total / take) || 1
    };
  }

  /**
   * Get work order by ID
   */
  static async getWorkOrderById(id) {
    const isMongoId = id.match(/^[0-9a-fA-F]{24}$/);
    const query = isMongoId ? { _id: id } : { workOrderId: id };

    const wo = await MaintenanceWorkOrder.findOne(query)
      .populate('assetId')
      .populate('requestId')
      .populate('departmentId')
      .populate('assignedTechnicianId', 'firstName lastName email role phone')
      .populate('assignedVendorId', 'name vendorCode email phone contactPerson')
      .populate('checklistId')
      .populate('verifiedBy', 'firstName lastName')
      .populate('assignedBy', 'firstName lastName')
      .lean();

    if (!wo) {
      const err = new Error('Work order not found');
      err.statusCode = 404;
      throw err;
    }

    // Include parts requested
    const parts = await MaintenancePartRequest.find({ workOrderId: wo._id }).lean();
    wo.parts = parts;

    return wo;
  }

  /**
   * Assign Technician or Vendor
   */
  static async assignWorkOrder(id, { technicianId, vendorId, reason }, userId) {
    const isMongoId = id.match(/^[0-9a-fA-F]{24}$/);
    const query = isMongoId ? { _id: id } : { workOrderId: id };

    const wo = await MaintenanceWorkOrder.findOne(query);
    if (!wo) {
      const err = new Error('Work order not found');
      err.statusCode = 404;
      throw err;
    }

    if (technicianId) wo.assignedTechnicianId = technicianId;
    if (vendorId) wo.assignedVendorId = vendorId;
    wo.assignedBy = userId;
    wo.assignedAt = new Date();
    wo.assignmentReason = reason || '';
    if (wo.status === 'OPEN' || wo.status === 'DRAFT') {
      wo.status = 'ASSIGNED';
    }
    wo.updatedBy = userId;
    await wo.save();

    await AuditService.logEvent({
      action: 'WORK_ORDER_ASSIGNED',
      module: 'MAINTENANCE',
      entityId: wo.workOrderId,
      performedBy: userId,
      details: {
        workOrderId: wo.workOrderId,
        technicianId,
        vendorId,
        reason
      }
    });

    // Notify assignee
    try {
      if (technicianId) {
        await NotificationService.sendNotification({
          userId: technicianId,
          title: `New Work Order Assigned: ${wo.workOrderId}`,
          message: `You have been assigned to maintenance work order ${wo.workOrderId} [${wo.priority}]`,
          channel: 'IN_APP',
          data: { workOrderId: wo.workOrderId }
        });
      }
    } catch (e) {}

    return wo;
  }

  /**
   * Schedule Work Order
   */
  static async scheduleWorkOrder(id, { scheduledStart, scheduledEnd }, userId) {
    const isMongoId = id.match(/^[0-9a-fA-F]{24}$/);
    const query = isMongoId ? { _id: id } : { workOrderId: id };

    const wo = await MaintenanceWorkOrder.findOne(query);
    if (!wo) {
      const err = new Error('Work order not found');
      err.statusCode = 404;
      throw err;
    }

    wo.scheduledStart = new Date(scheduledStart);
    if (scheduledEnd) wo.scheduledEnd = new Date(scheduledEnd);
    if (wo.status === 'OPEN' || wo.status === 'ASSIGNED') {
      wo.status = 'SCHEDULED';
    }
    wo.updatedBy = userId;
    await wo.save();

    await AuditService.logEvent({
      action: 'WORK_ORDER_SCHEDULED',
      module: 'MAINTENANCE',
      entityId: wo.workOrderId,
      performedBy: userId,
      details: { scheduledStart: wo.scheduledStart, scheduledEnd: wo.scheduledEnd }
    });

    return wo;
  }

  /**
   * Start Work Order
   */
  static async startWorkOrder(id, userId) {
    const isMongoId = id.match(/^[0-9a-fA-F]{24}$/);
    const query = isMongoId ? { _id: id } : { workOrderId: id };

    const wo = await MaintenanceWorkOrder.findOne(query);
    if (!wo) {
      const err = new Error('Work order not found');
      err.statusCode = 404;
      throw err;
    }

    const now = new Date();
    wo.status = 'IN_PROGRESS';
    if (!wo.actualStart) wo.actualStart = now;
    if (!wo.downtimeStart) wo.downtimeStart = now;
    wo.actualResponse = now;
    wo.slaStatus = 'WITHIN_SLA';
    wo.updatedBy = userId;
    await wo.save();

    // Ensure asset is UNDER_MAINTENANCE
    await Asset.findByIdAndUpdate(wo.assetId, {
      status: 'UNDER_MAINTENANCE',
      maintenanceRequired: true,
      updatedBy: userId
    });

    await AuditService.logEvent({
      action: 'WORK_ORDER_STARTED',
      module: 'MAINTENANCE',
      entityId: wo.workOrderId,
      performedBy: userId,
      details: { actualStart: wo.actualStart }
    });

    return wo;
  }

  /**
   * Put Work Order on Hold (e.g. WAITING_FOR_PARTS or WAITING_FOR_VENDOR)
   */
  static async holdWorkOrder(id, { status = 'ON_HOLD', holdReason }, userId) {
    const isMongoId = id.match(/^[0-9a-fA-F]{24}$/);
    const query = isMongoId ? { _id: id } : { workOrderId: id };

    const wo = await MaintenanceWorkOrder.findOne(query);
    if (!wo) {
      const err = new Error('Work order not found');
      err.statusCode = 404;
      throw err;
    }

    const validHoldStatuses = ['ON_HOLD', 'WAITING_FOR_PARTS', 'WAITING_FOR_VENDOR'];
    wo.status = validHoldStatuses.includes(status) ? status : 'ON_HOLD';
    wo.holdReason = holdReason || '';
    wo.updatedBy = userId;
    await wo.save();

    await AuditService.logEvent({
      action: 'WORK_ORDER_HOLD',
      module: 'MAINTENANCE',
      entityId: wo.workOrderId,
      performedBy: userId,
      details: { status: wo.status, holdReason }
    });

    return wo;
  }

  /**
   * Resume Work Order from Hold
   */
  static async resumeWorkOrder(id, userId) {
    const isMongoId = id.match(/^[0-9a-fA-F]{24}$/);
    const query = isMongoId ? { _id: id } : { workOrderId: id };

    const wo = await MaintenanceWorkOrder.findOne(query);
    if (!wo) {
      const err = new Error('Work order not found');
      err.statusCode = 404;
      throw err;
    }

    wo.status = 'IN_PROGRESS';
    wo.updatedBy = userId;
    await wo.save();

    await AuditService.logEvent({
      action: 'WORK_ORDER_RESUMED',
      module: 'MAINTENANCE',
      entityId: wo.workOrderId,
      performedBy: userId,
      details: { status: wo.status }
    });

    return wo;
  }

  /**
   * Complete Work Order
   */
  static async completeWorkOrder(id, details = {}, userId) {
    const isMongoId = id.match(/^[0-9a-fA-F]{24}$/);
    const query = isMongoId ? { _id: id } : { workOrderId: id };

    const wo = await MaintenanceWorkOrder.findOne(query);
    if (!wo) {
      const err = new Error('Work order not found');
      err.statusCode = 404;
      throw err;
    }

    const now = new Date();
    wo.status = 'COMPLETED';
    wo.actualEnd = now;
    if (!wo.downtimeEnd) wo.downtimeEnd = now;

    if (wo.downtimeStart && wo.downtimeEnd) {
      const diffMs = new Date(wo.downtimeEnd) - new Date(wo.downtimeStart);
      wo.downtimeDurationMinutes = Math.max(1, Math.round(diffMs / 60000));
    }

    wo.actualResolution = now;
    if (wo.resolutionDue && now <= new Date(wo.resolutionDue)) {
      wo.slaStatus = 'COMPLETED';
    } else if (wo.resolutionDue && now > new Date(wo.resolutionDue)) {
      wo.slaStatus = 'BREACHED';
    }

    if (details.completionNotes) wo.completionNotes = details.completionNotes;
    if (details.actualCost !== undefined) wo.actualCost = details.actualCost;
    if (details.costBreakdown) wo.costBreakdown = { ...wo.costBreakdown, ...details.costBreakdown };
    if (details.checklistResponses) wo.checklistResponses = details.checklistResponses;

    wo.verificationStatus = 'PENDING';
    wo.updatedBy = userId;
    await wo.save();

    // Critical Safety Boundary: Asset moves to PENDING_INSPECTION, NOT automatically ACTIVE!
    await Asset.findByIdAndUpdate(wo.assetId, {
      status: 'PENDING_INSPECTION',
      updatedBy: userId
    });

    await AuditService.logEvent({
      action: 'WORK_ORDER_COMPLETED',
      module: 'MAINTENANCE',
      entityId: wo.workOrderId,
      performedBy: userId,
      details: {
        actualEnd: wo.actualEnd,
        downtimeDurationMinutes: wo.downtimeDurationMinutes,
        actualCost: wo.actualCost
      }
    });

    return wo;
  }

  /**
   * Verify Work Order (Authorized supervisor / clinical engineering verification)
   */
  static async verifyWorkOrder(id, { verified = true, verificationNotes = '' }, userId) {
    const isMongoId = id.match(/^[0-9a-fA-F]{24}$/);
    const query = isMongoId ? { _id: id } : { workOrderId: id };

    const wo = await MaintenanceWorkOrder.findOne(query);
    if (!wo) {
      const err = new Error('Work order not found');
      err.statusCode = 404;
      throw err;
    }

    wo.verificationStatus = verified ? 'VERIFIED' : 'REJECTED';
    wo.verifiedBy = userId;
    wo.verifiedAt = new Date();
    wo.verificationNotes = verificationNotes;
    if (!verified) {
      wo.status = 'IN_PROGRESS'; // return for additional work
    } else {
      wo.status = 'VERIFIED';
    }
    wo.updatedBy = userId;
    await wo.save();

    await AuditService.logEvent({
      action: verified ? 'WORK_ORDER_VERIFIED' : 'WORK_ORDER_VERIFICATION_REJECTED',
      module: 'MAINTENANCE',
      entityId: wo.workOrderId,
      performedBy: userId,
      details: { verified, verificationNotes }
    });

    return wo;
  }

  /**
   * Close Work Order & return asset to service
   */
  static async closeWorkOrder(id, { returnAssetToStatus = 'ACTIVE', notes }, userId) {
    const isMongoId = id.match(/^[0-9a-fA-F]{24}$/);
    const query = isMongoId ? { _id: id } : { workOrderId: id };

    const wo = await MaintenanceWorkOrder.findOne(query);
    if (!wo) {
      const err = new Error('Work order not found');
      err.statusCode = 404;
      throw err;
    }

    wo.status = 'CLOSED';
    wo.updatedBy = userId;
    await wo.save();

    // If linked to a request, mark request as RESOLVED
    if (wo.requestId) {
      await MaintenanceRequest.findByIdAndUpdate(wo.requestId, {
        status: 'RESOLVED',
        updatedBy: userId
      });
    }

    // Return Asset status as authorized
    const validStatuses = ['ACTIVE', 'AVAILABLE', 'OUT_OF_SERVICE', 'QUARANTINED', 'PENDING_INSPECTION'];
    const targetStatus = validStatuses.includes(returnAssetToStatus) ? returnAssetToStatus : 'ACTIVE';

    await Asset.findByIdAndUpdate(wo.assetId, {
      status: targetStatus,
      maintenanceRequired: targetStatus === 'OUT_OF_SERVICE',
      updatedBy: userId
    });

    await AuditService.logEvent({
      action: 'WORK_ORDER_CLOSED',
      module: 'MAINTENANCE',
      entityId: wo.workOrderId,
      performedBy: userId,
      details: { targetAssetStatus: targetStatus, notes }
    });

    return wo;
  }

  /**
   * Reopen Work Order
   */
  static async reopenWorkOrder(id, reason, userId) {
    const isMongoId = id.match(/^[0-9a-fA-F]{24}$/);
    const query = isMongoId ? { _id: id } : { workOrderId: id };

    const wo = await MaintenanceWorkOrder.findOne(query);
    if (!wo) {
      const err = new Error('Work order not found');
      err.statusCode = 404;
      throw err;
    }

    wo.status = 'REOPENED';
    wo.reopenReason = reason || 'Issue reported as unresolved';
    wo.reopenedAt = new Date();
    wo.reopenedBy = userId;
    wo.updatedBy = userId;
    await wo.save();

    await Asset.findByIdAndUpdate(wo.assetId, {
      status: 'UNDER_MAINTENANCE',
      maintenanceRequired: true,
      updatedBy: userId
    });

    await AuditService.logEvent({
      action: 'WORK_ORDER_REOPENED',
      module: 'MAINTENANCE',
      entityId: wo.workOrderId,
      performedBy: userId,
      details: { reopenReason: reason }
    });

    return wo;
  }

  /**
   * Maintenance Calendar (scheduled work orders)
   */
  static async getCalendar(query = {}) {
    const { start, end, technicianId, vendorId } = query;
    const filter = {
      $or: [
        { scheduledStart: { $exists: true, $ne: null } },
        { createdAt: { $exists: true } }
      ]
    };

    if (start && end) {
      filter.$and = [
        {
          $or: [
            { scheduledStart: { $gte: new Date(start), $lte: new Date(end) } },
            { createdAt: { $gte: new Date(start), $lte: new Date(end) } }
          ]
        }
      ];
    }

    if (technicianId) filter.assignedTechnicianId = technicianId;
    if (vendorId) filter.assignedVendorId = vendorId;

    const items = await MaintenanceWorkOrder.find(filter)
      .populate('assetId', 'name assetTag criticality status')
      .populate('assignedTechnicianId', 'firstName lastName')
      .populate('assignedVendorId', 'name')
      .lean();

    return items.map(item => ({
      id: item._id,
      workOrderId: item.workOrderId,
      title: `${item.workOrderId} - ${item.assetId?.name || 'Asset'} (${item.priority})`,
      start: item.scheduledStart || item.createdAt,
      end: item.scheduledEnd || new Date(new Date(item.scheduledStart || item.createdAt).getTime() + 3600000),
      priority: item.priority,
      status: item.status,
      technician: item.assignedTechnicianId ? `${item.assignedTechnicianId.firstName} ${item.assignedTechnicianId.lastName}` : null,
      vendor: item.assignedVendorId?.name || null,
      criticality: item.assetId?.criticality
    }));
  }
}

module.exports = WorkOrderService;
