const PurchaseRequest = require('../../models/PurchaseRequest');
const InventoryItem = require('../../models/InventoryItem');
const IdGeneratorService = require('../IdGeneratorService');
const AuditService = require('../AuditService');
const NotificationService = require('../NotificationService');
const ExceptionService = require('../ExceptionService');

class PurchaseRequestService {
  /**
   * Check for potential duplicate requests (Section 18 & 39)
   * Same department, same item, within 30 days
   */
  static async checkDuplicateRequest(departmentId, itemIds) {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const existing = await PurchaseRequest.find({
      departmentId,
      status: { $in: ['SUBMITTED', 'UNDER_REVIEW', 'PENDING_APPROVAL', 'APPROVED', 'RFQ_IN_PROGRESS', 'PO_CREATED', 'ORDERED'] },
      requestDate: { $gte: thirtyDaysAgo },
      'items.inventoryItemId': { $in: itemIds }
    }).lean();

    return existing;
  }

  /**
   * Create a new purchase request
   */
  static async createRequest(data, user = { userId: 'SYSTEM', role: 'DEPARTMENT_REQUESTER' }) {
    if (!data.departmentId) throw new Error('Department ID is required');
    if (!data.requiredByDate) throw new Error('Required By Date is required');
    if (!data.items || !Array.isArray(data.items) || data.items.length === 0) {
      throw new Error('Purchase request must contain at least one item');
    }

    const purchaseRequestId = await IdGeneratorService.generatePurchaseRequestId();
    const itemIds = data.items.map((i) => i.inventoryItemId);

    // Snapshot inventory item data
    const inventoryItems = await InventoryItem.find({ inventoryItemId: { $in: itemIds } }).lean();
    const itemMap = new Map();
    inventoryItems.forEach((item) => itemMap.set(item.inventoryItemId, item));

    let estimatedTotal = 0;
    const processedItems = data.items.map((it, idx) => {
      const invItem = itemMap.get(it.inventoryItemId);
      const itemNameSnapshot = it.itemNameSnapshot || (invItem ? invItem.name : it.description || `Item ${idx + 1}`);
      const unit = it.unit || (invItem ? invItem.dispenseUnit || invItem.unit : 'UNIT');
      const quantity = Math.max(1, Number(it.quantity) || 1);
      const estimatedUnitPrice = Number(it.estimatedUnitPrice) || (invItem ? invItem.costPrice || 0 : 0);
      const lineTotal = quantity * estimatedUnitPrice;
      estimatedTotal += lineTotal;

      return {
        requestItemId: `PR-ITEM-${idx + 1}`,
        inventoryItemId: it.inventoryItemId,
        itemNameSnapshot,
        description: it.description || itemNameSnapshot,
        quantity,
        unit,
        estimatedUnitPrice,
        estimatedTotal: lineTotal,
        preferredSpecification: it.preferredSpecification || '',
        requiredByDate: it.requiredByDate || data.requiredByDate
      };
    });

    const isUrgent = data.priority === 'URGENT';
    const status = data.isDraft ? 'DRAFT' : 'SUBMITTED';

    const pr = new PurchaseRequest({
      purchaseRequestId,
      requesterId: user.userId,
      requesterName: data.requesterName || user.name || user.userId,
      departmentId: data.departmentId,
      departmentName: data.departmentName || data.departmentId,
      requestDate: new Date(),
      requiredByDate: new Date(data.requiredByDate),
      priority: data.priority || 'NORMAL',
      category: data.category || 'GENERAL_SUPPLIES',
      items: processedItems,
      reason: data.reason || 'Hospital operational requirement',
      justification: data.justification || '',
      status,
      estimatedTotal,
      attachments: data.attachments || [],
      timeline: [
        {
          status,
          actorId: user.userId,
          actorName: data.requesterName || user.name || user.userId,
          role: user.role || 'REQUESTER',
          note: data.isDraft ? 'Request created as Draft' : 'Request created and submitted',
          timestamp: new Date()
        }
      ]
    });

    await pr.save();

    // Check potential duplicate and flag for human review
    const duplicates = await this.checkDuplicateRequest(data.departmentId, itemIds);
    if (duplicates && duplicates.length > 0) {
      await ExceptionService.raiseException({
        module: 'PROCUREMENT',
        entityType: 'PurchaseRequest',
        entityId: purchaseRequestId,
        exceptionType: 'DUPLICATE_REQUEST',
        description: `Potential duplicate request detected: ${duplicates.length} recent requests in ${data.departmentId} for the same items.`,
        severity: 'LOW',
        source: 'SYSTEM',
        assignedRole: 'PROCUREMENT_OFFICER',
        metadata: { duplicateRequestIds: duplicates.map((d) => d.purchaseRequestId) }
      });
    }

    // Log audit event
    await AuditService.logEvent({
      userId: user.userId,
      role: user.role,
      action: data.isDraft ? 'PURCHASE_REQUEST_DRAFT_CREATED' : 'PURCHASE_REQUEST_SUBMITTED',
      module: 'PROCUREMENT',
      entityType: 'PurchaseRequest',
      entityId: purchaseRequestId,
      newValue: { estimatedTotal, priority: pr.priority, status },
      details: `Created Purchase Request ${purchaseRequestId} with ${processedItems.length} items.`
    });

    // Notify approvers if submitted
    if (status === 'SUBMITTED') {
      await NotificationService.sendNotification({
        channel: 'IN_APP',
        event: 'PURCHASE_REQUEST_SUBMITTED',
        title: `Purchase Request ${purchaseRequestId} Submitted`,
        message: `Department ${data.departmentName || data.departmentId} submitted PR ${purchaseRequestId} (${pr.priority}) totaling ₹${estimatedTotal.toLocaleString()}.`,
        entityType: 'PurchaseRequest',
        entityId: purchaseRequestId
      });
    }

    return pr;
  }

  /**
   * Update request (Draft or Returned for correction)
   */
  static async updateRequest(id, data, user) {
    const pr = await PurchaseRequest.findOne({ purchaseRequestId: id });
    if (!pr) throw new Error(`Purchase Request ${id} not found`);

    if (!['DRAFT', 'RETURNED_FOR_CORRECTION'].includes(pr.status)) {
      throw new Error(`Cannot edit request in status ${pr.status}`);
    }

    if (data.items && Array.isArray(data.items)) {
      let estimatedTotal = 0;
      pr.items = data.items.map((it, idx) => {
        const quantity = Math.max(1, Number(it.quantity) || 1);
        const estimatedUnitPrice = Number(it.estimatedUnitPrice) || 0;
        const lineTotal = quantity * estimatedUnitPrice;
        estimatedTotal += lineTotal;
        return {
          requestItemId: it.requestItemId || `PR-ITEM-${idx + 1}`,
          inventoryItemId: it.inventoryItemId,
          itemNameSnapshot: it.itemNameSnapshot || it.description,
          description: it.description,
          quantity,
          unit: it.unit || 'UNIT',
          estimatedUnitPrice,
          estimatedTotal: lineTotal,
          preferredSpecification: it.preferredSpecification || '',
          requiredByDate: it.requiredByDate || pr.requiredByDate
        };
      });
      pr.estimatedTotal = estimatedTotal;
    }

    if (data.priority) pr.priority = data.priority;
    if (data.category) pr.category = data.category;
    if (data.reason) pr.reason = data.reason;
    if (data.justification !== undefined) pr.justification = data.justification;
    if (data.requiredByDate) pr.requiredByDate = new Date(data.requiredByDate);

    pr.timeline.push({
      status: pr.status,
      actorId: user.userId,
      actorName: user.name || user.userId,
      role: user.role,
      note: 'Purchase request details updated',
      timestamp: new Date()
    });

    await pr.save();

    await AuditService.logEvent({
      userId: user.userId,
      role: user.role,
      action: 'PURCHASE_REQUEST_UPDATED',
      module: 'PROCUREMENT',
      entityType: 'PurchaseRequest',
      entityId: id,
      newValue: { estimatedTotal: pr.estimatedTotal, priority: pr.priority },
      details: `Updated Purchase Request ${id}`
    });

    return pr;
  }

  /**
   * Submit draft or resubmit corrected request
   */
  static async submitRequest(id, user) {
    const pr = await PurchaseRequest.findOne({ purchaseRequestId: id });
    if (!pr) throw new Error(`Purchase Request ${id} not found`);

    if (!['DRAFT', 'RETURNED_FOR_CORRECTION'].includes(pr.status)) {
      throw new Error(`Cannot submit request in status ${pr.status}`);
    }

    pr.status = 'PENDING_APPROVAL';
    pr.timeline.push({
      status: 'PENDING_APPROVAL',
      actorId: user.userId,
      actorName: user.name || user.userId,
      role: user.role,
      note: 'Submitted for managerial and procurement approval',
      timestamp: new Date()
    });

    await pr.save();

    await AuditService.logEvent({
      userId: user.userId,
      role: user.role,
      action: 'PURCHASE_REQUEST_SUBMITTED',
      module: 'PROCUREMENT',
      entityType: 'PurchaseRequest',
      entityId: id,
      newValue: { status: 'PENDING_APPROVAL' },
      details: `Purchase Request ${id} submitted for approval.`
    });

    await NotificationService.sendNotification({
      channel: 'IN_APP',
      event: 'APPROVAL_REQUIRED',
      title: `Approval Required: PR ${id}`,
      message: `Purchase request ${id} requires managerial review and authorization.`,
      entityType: 'PurchaseRequest',
      entityId: id
    });

    return pr;
  }

  /**
   * Cancel request
   */
  static async cancelRequest(id, reason, user) {
    const pr = await PurchaseRequest.findOne({ purchaseRequestId: id });
    if (!pr) throw new Error(`Purchase Request ${id} not found`);

    if (['FULFILLED', 'CLOSED', 'CANCELLED'].includes(pr.status)) {
      throw new Error(`Cannot cancel request in status ${pr.status}`);
    }

    pr.status = 'CANCELLED';
    pr.timeline.push({
      status: 'CANCELLED',
      actorId: user.userId,
      actorName: user.name || user.userId,
      role: user.role,
      note: reason || 'Request cancelled by user',
      timestamp: new Date()
    });

    await pr.save();

    await AuditService.logEvent({
      userId: user.userId,
      role: user.role,
      action: 'PURCHASE_REQUEST_CANCELLED',
      module: 'PROCUREMENT',
      entityType: 'PurchaseRequest',
      entityId: id,
      newValue: { status: 'CANCELLED', reason },
      details: `Purchase Request ${id} was cancelled.`
    });

    return pr;
  }

  /**
   * Get filtered purchase requests with pagination
   */
  static async getRequests(query = {}) {
    const filter = {};
    if (query.status) filter.status = query.status;
    if (query.priority) filter.priority = query.priority;
    if (query.departmentId) filter.departmentId = query.departmentId;
    if (query.category) filter.category = query.category;
    if (query.requesterId) filter.requesterId = query.requesterId;
    if (query.search) {
      filter.$or = [
        { purchaseRequestId: new RegExp(query.search, 'i') },
        { departmentName: new RegExp(query.search, 'i') },
        { reason: new RegExp(query.search, 'i') },
        { 'items.itemNameSnapshot': new RegExp(query.search, 'i') }
      ];
    }

    const page = Math.max(1, parseInt(query.page, 10) || 1);
    const limit = Math.max(1, Math.min(100, parseInt(query.limit, 10) || 20));
    const skip = (page - 1) * limit;

    const [requests, total] = await Promise.all([
      PurchaseRequest.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      PurchaseRequest.countDocuments(filter)
    ]);

    return {
      requests,
      total,
      page,
      totalPages: Math.ceil(total / limit)
    };
  }

  /**
   * Get single request details
   */
  static async getRequestById(id) {
    const pr = await PurchaseRequest.findOne({ purchaseRequestId: id }).lean();
    if (!pr) throw new Error(`Purchase Request ${id} not found`);
    return pr;
  }
}

module.exports = PurchaseRequestService;
