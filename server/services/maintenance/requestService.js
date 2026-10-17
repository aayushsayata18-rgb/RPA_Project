const MaintenanceRequest = require('../../models/MaintenanceRequest');
const Asset = require('../../models/Asset');
const MaintenanceWorkOrder = require('../../models/MaintenanceWorkOrder');
const IdGeneratorService = require('../IdGeneratorService');
const AuditService = require('../AuditService');
const NotificationService = require('../NotificationService');

class RequestService {
  /**
   * Create new Maintenance Request
   */
  static async createRequest(data, userId) {
    if (!data.assetId) {
      const err = new Error('Asset ID is required for a maintenance request');
      err.statusCode = 400;
      throw err;
    }

    // Verify Asset exists
    const asset = await Asset.findById(data.assetId);
    if (!asset) {
      const err = new Error('Asset not found');
      err.statusCode = 404;
      throw err;
    }

    // Deduplication check: check if open request exists for same asset with similar title
    const existingOpen = await MaintenanceRequest.findOne({
      assetId: data.assetId,
      status: { $in: ['SUBMITTED', 'UNDER_REVIEW', 'APPROVED', 'WORK_ORDER_CREATED'] }
    });

    if (existingOpen && !data.forceSubmit) {
      const err = new Error(`An active maintenance request (${existingOpen.requestId}) is already open for this asset`);
      err.statusCode = 409;
      err.details = { existingRequest: existingOpen };
      throw err;
    }

    if (!data.requestId) {
      data.requestId = await IdGeneratorService.generateMaintenanceRequestId();
    }

    data.requesterId = userId;
    data.departmentId = data.departmentId || asset.departmentId;
    data.locationId = data.locationId || asset.locationId;
    data.createdBy = userId;
    data.updatedBy = userId;

    const request = new MaintenanceRequest(data);
    await request.save();

    // If critical asset breakdown reported, optionally flag asset as PENDING_INSPECTION or UNDER_MAINTENANCE
    if (data.issueType === 'BREAKDOWN' && (asset.criticality === 'HIGH' || asset.criticality === 'CRITICAL')) {
      asset.status = 'UNDER_MAINTENANCE';
      asset.maintenanceRequired = true;
      await asset.save();
    }

    await AuditService.logEvent({
      action: 'MAINTENANCE_REQUEST_CREATED',
      module: 'MAINTENANCE',
      entityId: request.requestId,
      performedBy: userId,
      details: {
        requestId: request.requestId,
        assetId: asset.assetId,
        priority: request.priority,
        issueType: request.issueType
      }
    });

    // Notify maintenance team
    try {
      await NotificationService.sendNotification({
        recipientRoles: ['MAINTENANCE', 'ADMIN_MANAGER'],
        title: `Maintenance Request Submitted: ${request.requestId}`,
        message: `${request.title} reported for asset ${asset.name} (${asset.assetTag}) [Priority: ${request.priority}]`,
        channel: 'IN_APP',
        data: { requestId: request.requestId, assetId: asset._id }
      });
    } catch (e) {
      console.warn('[RequestService] Notification send error:', e.message);
    }

    return request;
  }

  /**
   * Get filtered maintenance requests
   */
  static async getRequests(query = {}) {
    const {
      page = 1,
      limit = 20,
      search,
      status,
      priority,
      issueType,
      assetId,
      departmentId,
      requesterId
    } = query;

    const filter = {};
    if (status) filter.status = status;
    if (priority) filter.priority = priority;
    if (issueType) filter.issueType = issueType;
    if (assetId) filter.assetId = assetId;
    if (departmentId) filter.departmentId = departmentId;
    if (requesterId) filter.requesterId = requesterId;

    if (search) {
      const regex = new RegExp(search.trim(), 'i');
      filter.$or = [
        { requestId: regex },
        { title: regex },
        { description: regex },
        { category: regex }
      ];
    }

    const skip = (Math.max(1, parseInt(page, 10)) - 1) * parseInt(limit, 10);
    const take = parseInt(limit, 10);

    const [items, total] = await Promise.all([
      MaintenanceRequest.find(filter)
        .populate('assetId', 'name assetId assetTag status criticality manufacturer model')
        .populate('requesterId', 'firstName lastName email role')
        .populate('departmentId', 'name code')
        .populate('workOrderId', 'workOrderId status priority')
        .sort({ requestedAt: -1 })
        .skip(skip)
        .limit(take)
        .lean(),
      MaintenanceRequest.countDocuments(filter)
    ]);

    return {
      items,
      total,
      page: parseInt(page, 10),
      totalPages: Math.ceil(total / take) || 1
    };
  }

  /**
   * Get single request by ID
   */
  static async getRequestById(id) {
    const isMongoId = id.match(/^[0-9a-fA-F]{24}$/);
    const query = isMongoId ? { _id: id } : { requestId: id };

    const request = await MaintenanceRequest.findOne(query)
      .populate('assetId')
      .populate('requesterId', 'firstName lastName email role phone')
      .populate('departmentId')
      .populate('workOrderId')
      .populate('approvedBy', 'firstName lastName')
      .populate('reviewedBy', 'firstName lastName')
      .lean();

    if (!request) {
      const err = new Error('Maintenance request not found');
      err.statusCode = 404;
      throw err;
    }

    return request;
  }

  /**
   * Triage Maintenance Request (updates priority, status, triageNotes)
   */
  static async triageRequest(id, { status = 'APPROVED', priority, triageNotes = '' } = {}, userId) {
    const isMongoId = id.match(/^[0-9a-fA-F]{24}$/);
    const query = isMongoId ? { _id: id } : { requestId: id };

    const request = await MaintenanceRequest.findOne(query);
    if (!request) {
      const err = new Error('Maintenance request not found');
      err.statusCode = 404;
      throw err;
    }

    if (priority) request.priority = priority;
    if (status) request.status = status;
    if (triageNotes) request.triageNotes = triageNotes;
    request.reviewedBy = userId;
    request.reviewedAt = new Date();
    if (status === 'APPROVED') {
      request.approvedBy = userId;
      request.approvedAt = new Date();
    }
    request.updatedBy = userId;
    await request.save();

    await AuditService.logEvent({
      action: 'MAINTENANCE_REQUEST_TRIAGED',
      module: 'MAINTENANCE',
      entityId: request.requestId,
      performedBy: userId,
      details: { requestId: request.requestId, status: request.status, priority: request.priority, triageNotes }
    });

    return request;
  }

  /**
   * Approve Maintenance Request
   */
  static async approveRequest(id, userId, notes = '') {
    const isMongoId = id.match(/^[0-9a-fA-F]{24}$/);
    const query = isMongoId ? { _id: id } : { requestId: id };

    const request = await MaintenanceRequest.findOne(query);
    if (!request) {
      const err = new Error('Maintenance request not found');
      err.statusCode = 404;
      throw err;
    }

    if (request.status === 'APPROVED' || request.status === 'WORK_ORDER_CREATED') {
      const err = new Error('Request has already been approved');
      err.statusCode = 400;
      throw err;
    }

    request.status = 'APPROVED';
    request.approvedBy = userId;
    request.approvedAt = new Date();
    request.updatedBy = userId;
    await request.save();

    await AuditService.logEvent({
      action: 'MAINTENANCE_REQUEST_APPROVED',
      module: 'MAINTENANCE',
      entityId: request.requestId,
      performedBy: userId,
      details: { requestId: request.requestId, approvedAt: request.approvedAt, notes }
    });

    return request;
  }

  /**
   * Reject Maintenance Request
   */
  static async rejectRequest(id, reason, userId) {
    const isMongoId = id.match(/^[0-9a-fA-F]{24}$/);
    const query = isMongoId ? { _id: id } : { requestId: id };

    const request = await MaintenanceRequest.findOne(query);
    if (!request) {
      const err = new Error('Maintenance request not found');
      err.statusCode = 404;
      throw err;
    }

    request.status = 'REJECTED';
    request.rejectionReason = reason || 'Declined during supervisor review';
    request.updatedBy = userId;
    await request.save();

    await AuditService.logEvent({
      action: 'MAINTENANCE_REQUEST_REJECTED',
      module: 'MAINTENANCE',
      entityId: request.requestId,
      performedBy: userId,
      details: { requestId: request.requestId, reason }
    });

    return request;
  }

  /**
   * Convert Approved Request directly to Work Order
   */
  static async createWorkOrderFromRequest(id, woDetails = {}, userId) {
    const request = await this.getRequestById(id);

    if (request.workOrderId) {
      const err = new Error('A work order has already been created for this request');
      err.statusCode = 400;
      throw err;
    }

    const workOrderId = await IdGeneratorService.generateMaintenanceWorkOrderId(false);

    // Calculate default SLA based on priority
    let responseMins = 120;
    let resMins = 480;
    if (request.priority === 'CRITICAL' || request.priority === 'URGENT') {
      responseMins = 30;
      resMins = 240;
    } else if (request.priority === 'HIGH') {
      responseMins = 60;
      resMins = 360;
    } else if (request.priority === 'LOW') {
      responseMins = 240;
      resMins = 1440;
    }

    const now = new Date();
    const responseDue = new Date(now.getTime() + responseMins * 60000);
    const resolutionDue = new Date(now.getTime() + resMins * 60000);

    const workOrder = new MaintenanceWorkOrder({
      workOrderId,
      requestId: request._id,
      assetId: request.assetId._id,
      departmentId: request.departmentId?._id,
      locationId: request.locationId,
      title: woDetails.title || request.title,
      description: woDetails.description || request.description,
      maintenanceType: woDetails.maintenanceType || (request.issueType === 'BREAKDOWN' ? 'BREAKDOWN' : 'CORRECTIVE'),
      priority: woDetails.priority || request.priority,
      assignedTechnicianId: woDetails.assignedTechnicianId,
      assignedVendorId: woDetails.assignedVendorId,
      assignedBy: woDetails.assignedTechnicianId || woDetails.assignedVendorId ? userId : undefined,
      assignedAt: woDetails.assignedTechnicianId || woDetails.assignedVendorId ? new Date() : undefined,
      scheduledStart: woDetails.scheduledStart,
      scheduledEnd: woDetails.scheduledEnd,
      status: woDetails.assignedTechnicianId || woDetails.assignedVendorId ? 'ASSIGNED' : 'OPEN',
      estimatedCost: woDetails.estimatedCost || 0,
      slaStatus: 'NOT_STARTED',
      responseDue,
      resolutionDue,
      createdBy: userId,
      updatedBy: userId
    });

    await workOrder.save();

    // Update request
    await MaintenanceRequest.findByIdAndUpdate(request._id, {
      status: 'WORK_ORDER_CREATED',
      workOrderId: workOrder._id,
      updatedBy: userId
    });

    // Update Asset status to UNDER_MAINTENANCE
    await Asset.findByIdAndUpdate(request.assetId._id, {
      status: 'UNDER_MAINTENANCE',
      maintenanceRequired: true,
      updatedBy: userId
    });

    await AuditService.logEvent({
      action: 'WORK_ORDER_CREATED_FROM_REQUEST',
      module: 'MAINTENANCE',
      entityId: workOrder.workOrderId,
      performedBy: userId,
      details: {
        requestId: request.requestId,
        workOrderId: workOrder.workOrderId,
        assetId: request.assetId.assetId
      }
    });

    return workOrder;
  }
}

module.exports = RequestService;
