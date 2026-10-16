const PurchaseOrder = require('../../models/PurchaseOrder');
const PurchaseOrderRevision = require('../../models/PurchaseOrderRevision');
const PurchaseRequest = require('../../models/PurchaseRequest');
const Quotation = require('../../models/Quotation');
const VendorChangeRequest = require('../../models/VendorChangeRequest');
const IdGeneratorService = require('../IdGeneratorService');
const AuditService = require('../AuditService');
const NotificationService = require('../NotificationService');
const ExceptionService = require('../ExceptionService');

class PurchaseOrderService {
  /**
   * Duplicate PO check (Section 39)
   */
  static async checkDuplicatePO(vendorId, itemIds) {
    const openPOs = await PurchaseOrder.find({
      vendorId,
      status: { $in: ['DRAFT', 'PENDING_APPROVAL', 'APPROVED', 'SENT_TO_VENDOR', 'ACKNOWLEDGED'] },
      'items.inventoryItemId': { $in: itemIds }
    }).lean();

    return openPOs;
  }

  /**
   * Create Purchase Order
   */
  static async createPurchaseOrder(data, user = { userId: 'SYSTEM', role: 'PROCUREMENT_OFFICER' }) {
    if (!data.vendorId) throw new Error('Vendor ID is required');
    if (!data.expectedDeliveryDate) throw new Error('Expected Delivery Date is required');
    if (!data.items || !Array.isArray(data.items) || data.items.length === 0) {
      throw new Error('Purchase Order must contain at least one line item');
    }

    // Verify vendor status from Vendor Master (Module 20 integration)
    try {
      const Vendor = require('../../models/Vendor');
      const vendor = await Vendor.findOne({ vendorId: data.vendorId });
      if (vendor && ['SUSPENDED', 'DEACTIVATED', 'REJECTED'].includes(vendor.status)) {
        throw new Error(`Cannot issue Purchase Order to vendor ${data.vendorId}: Vendor status is currently ${vendor.status}`);
      }
    } catch (ve) {
      if (ve.message.includes('Cannot issue Purchase Order')) throw ve;
    }

    const purchaseOrderId = await IdGeneratorService.generatePurchaseOrderId();
    const itemIds = data.items.map((i) => i.inventoryItemId);

    // Duplicate check
    const existingPOs = await this.checkDuplicatePO(data.vendorId, itemIds);
    if (existingPOs && existingPOs.length > 0) {
      await ExceptionService.raiseException({
        module: 'PROCUREMENT',
        entityType: 'PurchaseOrder',
        entityId: purchaseOrderId,
        exceptionType: 'PO_MISMATCH',
        description: `Potential duplicate PO detected: Vendor ${data.vendorId} already has ${existingPOs.length} open PO(s) containing matching items.`,
        severity: 'LOW',
        source: 'SYSTEM',
        assignedRole: 'PROCUREMENT_MANAGER',
        metadata: { existingPoIds: existingPOs.map((p) => p.purchaseOrderId) }
      });
    }

    // Always compute totals on server-side
    let subtotal = 0;
    let totalTax = 0;
    let totalDiscount = 0;

    const items = data.items.map((it, idx) => {
      const quantity = Math.max(1, Number(it.quantity) || 1);
      const unitPrice = Math.max(0, Number(it.unitPrice) || 0);
      const taxPercent = Math.max(0, Number(it.taxPercent) || 0);
      const discount = Math.max(0, Number(it.discount) || 0);

      const baseAmount = quantity * unitPrice;
      const tax = (baseAmount - discount) * (taxPercent / 100);
      const lineTotal = baseAmount - discount + tax;

      subtotal += baseAmount;
      totalTax += tax;
      totalDiscount += discount;

      return {
        poItemId: `PO-ITEM-${idx + 1}`,
        inventoryItemId: it.inventoryItemId,
        description: it.description || 'PO Item',
        quantity,
        unit: it.unit || 'UNIT',
        unitPrice,
        taxPercent,
        tax,
        discount,
        lineTotal,
        requiredByDate: it.requiredByDate || data.expectedDeliveryDate,
        specification: it.specification || '',
        deliveredQuantity: 0,
        receivedQuantity: 0
      };
    });

    const shipping = Number(data.shipping) || 0;
    const grandTotal = subtotal - totalDiscount + totalTax + shipping;

    const status = data.isDraft ? 'DRAFT' : 'PENDING_APPROVAL';

    const po = new PurchaseOrder({
      purchaseOrderId,
      purchaseRequestIds: data.purchaseRequestIds || [],
      vendorId: data.vendorId,
      vendorName: data.vendorName || data.vendorId,
      quotationId: data.quotationId || null,
      orderDate: data.orderDate ? new Date(data.orderDate) : new Date(),
      expectedDeliveryDate: new Date(data.expectedDeliveryDate),
      currency: data.currency || 'INR',
      items,
      subtotal,
      tax: totalTax,
      discount: totalDiscount,
      shipping,
      grandTotal,
      paymentTerms: data.paymentTerms || 'Net 30',
      deliveryTerms: data.deliveryTerms || 'FOB Destination',
      billingAddress: data.billingAddress || 'Apex Care Hospital, Main Campus, Finance Wing, Medical Enclave',
      shippingAddress: data.shippingAddress || 'Apex Care Hospital, Central Stores / Receiving Bay 2, Ground Floor',
      status,
      approvalStatus: 'PENDING',
      revisionsCount: 0,
      createdBy: user.userId,
      notes: data.notes || ''
    });

    await po.save();

    // Link PRs
    if (data.purchaseRequestIds && data.purchaseRequestIds.length > 0) {
      await PurchaseRequest.updateMany(
        { purchaseRequestId: { $in: data.purchaseRequestIds } },
        {
          $set: { purchaseOrderId: po.purchaseOrderId, status: 'PO_CREATED' },
          $push: {
            timeline: {
              status: 'PO_CREATED',
              actorId: user.userId,
              actorName: user.name || user.userId,
              role: user.role,
              note: `Purchase Order ${po.purchaseOrderId} created`,
              timestamp: new Date()
            }
          }
        }
      );
    }

    await AuditService.logEvent({
      userId: user.userId,
      role: user.role,
      action: data.isDraft ? 'PURCHASE_ORDER_DRAFT_CREATED' : 'PURCHASE_ORDER_CREATED',
      module: 'PROCUREMENT',
      entityType: 'PurchaseOrder',
      entityId: purchaseOrderId,
      newValue: { grandTotal, vendorId: data.vendorId, status },
      details: `Created Purchase Order ${purchaseOrderId} for ₹${grandTotal.toLocaleString()}.`
    });

    if (status === 'PENDING_APPROVAL') {
      await NotificationService.sendNotification({
        channel: 'IN_APP',
        event: 'PO_APPROVAL_REQUIRED',
        title: `PO ${purchaseOrderId} Awaiting Approval`,
        message: `Purchase Order ${purchaseOrderId} for ${data.vendorName || data.vendorId} (₹${grandTotal.toLocaleString()}) requires approval.`,
        entityType: 'PurchaseOrder',
        entityId: purchaseOrderId
      });
    }

    return po;
  }

  /**
   * Submit draft PO for approval
   */
  static async submitPoForApproval(id, user) {
    const po = await PurchaseOrder.findOne({ purchaseOrderId: id });
    if (!po) throw new Error(`Purchase Order ${id} not found`);

    if (po.status !== 'DRAFT') {
      throw new Error(`Cannot submit PO in status ${po.status}`);
    }

    po.status = 'PENDING_APPROVAL';
    po.approvalStatus = 'PENDING';
    await po.save();

    await AuditService.logEvent({
      userId: user.userId,
      role: user.role,
      action: 'PURCHASE_ORDER_SUBMITTED_FOR_APPROVAL',
      module: 'PROCUREMENT',
      entityType: 'PurchaseOrder',
      entityId: id,
      newValue: { status: 'PENDING_APPROVAL' },
      details: `PO ${id} submitted for managerial approval.`
    });

    return po;
  }

  /**
   * Send approved PO to vendor
   */
  static async sendPoToVendor(id, user = { userId: 'SYSTEM', role: 'PROCUREMENT_OFFICER' }) {
    const po = await PurchaseOrder.findOne({ purchaseOrderId: id });
    if (!po) throw new Error(`Purchase Order ${id} not found`);

    if (po.status !== 'APPROVED') {
      throw new Error(`Cannot send PO in status ${po.status}. PO must be APPROVED first.`);
    }

    po.status = 'SENT_TO_VENDOR';
    po.sentAt = new Date();
    await po.save();

    await AuditService.logEvent({
      userId: user.userId,
      role: user.role,
      action: 'PURCHASE_ORDER_SENT_TO_VENDOR',
      module: 'PROCUREMENT',
      entityType: 'PurchaseOrder',
      entityId: id,
      newValue: { status: 'SENT_TO_VENDOR', sentAt: po.sentAt },
      details: `Purchase Order ${id} sent to vendor ${po.vendorName}.`
    });

    await NotificationService.sendNotification({
      channel: 'IN_APP',
      event: 'PURCHASE_ORDER_SENT',
      title: `PO ${id} Issued to Vendor`,
      message: `Purchase Order ${id} has been transmitted to ${po.vendorName}. Awaiting vendor acknowledgement.`,
      entityType: 'PurchaseOrder',
      entityId: id
    });

    return po;
  }

  /**
   * Record Vendor Acknowledgement
   */
  static async recordVendorAcknowledgement(id, ackData, user = { userId: 'VENDOR' }) {
    const { status, comments, externalPoRef } = ackData;
    const po = await PurchaseOrder.findOne({ purchaseOrderId: id });
    if (!po) throw new Error(`Purchase Order ${id} not found`);

    if (!['SENT_TO_VENDOR', 'ACKNOWLEDGED'].includes(po.status)) {
      throw new Error(`Cannot acknowledge PO in status ${po.status}`);
    }

    if (status === 'ACCEPT_WITH_CHANGES') {
      // Create VendorChangeRequest for human review (Section 42 & 104)
      const changeRequestId = await IdGeneratorService.generateVendorChangeRequestId();
      const changeRequest = new VendorChangeRequest({
        changeRequestId,
        purchaseOrderId: id,
        vendorId: po.vendorId,
        vendorName: po.vendorName,
        proposedChanges: ackData.proposedChanges || [],
        reason: comments || 'Vendor proposed delivery or price adjustments',
        status: 'PENDING'
      });
      await changeRequest.save();

      await ExceptionService.raiseException({
        module: 'PROCUREMENT',
        entityType: 'PurchaseOrder',
        entityId: id,
        exceptionType: 'VENDOR_CHANGE_REQUEST',
        description: `Vendor ${po.vendorName} accepted PO with changes: ${comments}`,
        severity: 'MEDIUM',
        source: 'USER',
        assignedRole: 'PROCUREMENT_OFFICER',
        metadata: { changeRequestId }
      });

      po.vendorAcknowledgement = {
        status: 'ACCEPT_WITH_CHANGES',
        acknowledgedAt: new Date(),
        comments: comments || 'Changes requested',
        externalPoRef: externalPoRef || ''
      };
      await po.save();

      return { po, changeRequest };
    }

    po.vendorAcknowledgement = {
      status,
      acknowledgedAt: new Date(),
      comments: comments || '',
      externalPoRef: externalPoRef || ''
    };

    if (status === 'ACCEPTED') {
      po.status = 'ACKNOWLEDGED';
    } else if (status === 'REJECTED') {
      po.status = 'REJECTED';
      await ExceptionService.raiseException({
        module: 'PROCUREMENT',
        entityType: 'PurchaseOrder',
        entityId: id,
        exceptionType: 'PO_MISMATCH',
        description: `Vendor ${po.vendorName} rejected PO ${id}: ${comments}`,
        severity: 'HIGH',
        source: 'USER',
        assignedRole: 'PROCUREMENT_MANAGER'
      });
    }

    await po.save();

    await AuditService.logEvent({
      userId: user.userId,
      role: user.role || 'VENDOR',
      action: 'VENDOR_PO_ACKNOWLEDGEMENT',
      module: 'PROCUREMENT',
      entityType: 'PurchaseOrder',
      entityId: id,
      newValue: { ackStatus: status, externalPoRef },
      details: `Vendor ${po.vendorName} acknowledged PO ${id} with status ${status}.`
    });

    return { po };
  }

  /**
   * Create PO Revision (Section 40 & 41)
   * Controlled changes to an approved PO
   */
  static async createPoRevision(id, revisionData, user = { userId: 'SYSTEM', role: 'PROCUREMENT_MANAGER' }) {
    const po = await PurchaseOrder.findOne({ purchaseOrderId: id });
    if (!po) throw new Error(`Purchase Order ${id} not found`);

    if (!['APPROVED', 'SENT_TO_VENDOR', 'ACKNOWLEDGED'].includes(po.status)) {
      throw new Error(`Cannot revise PO in status ${po.status}. PO must be approved or active.`);
    }

    if (!revisionData.reason || revisionData.reason.trim() === '') {
      throw new Error('Revision reason is mandatory for auditing and regulatory control.');
    }

    const revisionId = await IdGeneratorService.generatePoRevisionId();
    const revisionNumber = (po.revisionsCount || 0) + 1;

    // Snapshot existing PO
    const snapshot = po.toObject();

    const changedFields = [];
    if (revisionData.items && Array.isArray(revisionData.items)) {
      changedFields.push({ field: 'items', oldValue: po.items, newValue: revisionData.items });

      let subtotal = 0;
      let totalTax = 0;
      let totalDiscount = 0;

      po.items = revisionData.items.map((it, idx) => {
        const quantity = Math.max(1, Number(it.quantity) || 1);
        const unitPrice = Math.max(0, Number(it.unitPrice) || 0);
        const taxPercent = Math.max(0, Number(it.taxPercent) || 0);
        const discount = Math.max(0, Number(it.discount) || 0);

        const baseAmount = quantity * unitPrice;
        const tax = (baseAmount - discount) * (taxPercent / 100);
        const lineTotal = baseAmount - discount + tax;

        subtotal += baseAmount;
        totalTax += tax;
        totalDiscount += discount;

        return {
          poItemId: it.poItemId || `PO-ITEM-${idx + 1}`,
          inventoryItemId: it.inventoryItemId,
          description: it.description,
          quantity,
          unit: it.unit || 'UNIT',
          unitPrice,
          taxPercent,
          tax,
          discount,
          lineTotal,
          requiredByDate: it.requiredByDate || po.expectedDeliveryDate,
          specification: it.specification || '',
          deliveredQuantity: it.deliveredQuantity || 0,
          receivedQuantity: it.receivedQuantity || 0
        };
      });

      po.subtotal = subtotal;
      po.tax = totalTax;
      po.discount = totalDiscount;
      po.grandTotal = subtotal - totalDiscount + totalTax + po.shipping;
    }

    if (revisionData.expectedDeliveryDate) {
      changedFields.push({
        field: 'expectedDeliveryDate',
        oldValue: po.expectedDeliveryDate,
        newValue: revisionData.expectedDeliveryDate
      });
      po.expectedDeliveryDate = new Date(revisionData.expectedDeliveryDate);
    }

    const revision = new PurchaseOrderRevision({
      revisionId,
      purchaseOrderId: id,
      revisionNumber,
      snapshot,
      changedFields,
      reason: revisionData.reason,
      createdBy: user.userId,
      approvedBy: user.userId
    });

    await revision.save();

    po.revisionsCount = revisionNumber;
    po.currentRevisionId = revisionId;
    await po.save();

    await AuditService.logEvent({
      userId: user.userId,
      role: user.role,
      action: 'PURCHASE_ORDER_REVISED',
      module: 'PROCUREMENT',
      entityType: 'PurchaseOrder',
      entityId: id,
      newValue: { revisionNumber, revisionId, reason: revisionData.reason },
      details: `Created Revision ${revisionNumber} for PO ${id}. Reason: ${revisionData.reason}`
    });

    return { po, revision };
  }

  /**
   * Cancel PO
   */
  static async cancelPurchaseOrder(id, reason, user = { userId: 'SYSTEM', role: 'PROCUREMENT_MANAGER' }) {
    const po = await PurchaseOrder.findOne({ purchaseOrderId: id });
    if (!po) throw new Error(`Purchase Order ${id} not found`);

    if (['DELIVERED', 'RECEIVED', 'CLOSED', 'CANCELLED'].includes(po.status)) {
      throw new Error(`Cannot cancel PO in status ${po.status}`);
    }

    po.status = 'CANCELLED';
    po.cancellationReason = reason || 'Cancelled by manager';
    po.closedAt = new Date();
    await po.save();

    await AuditService.logEvent({
      userId: user.userId,
      role: user.role,
      action: 'PURCHASE_ORDER_CANCELLED',
      module: 'PROCUREMENT',
      entityType: 'PurchaseOrder',
      entityId: id,
      newValue: { status: 'CANCELLED', cancellationReason: reason },
      details: `Purchase Order ${id} was cancelled.`
    });

    return po;
  }

  /**
   * Get filtered purchase orders with pagination
   */
  static async getPurchaseOrders(query = {}) {
    const filter = {};
    if (query.status) filter.status = query.status;
    if (query.vendorId) filter.vendorId = query.vendorId;
    if (query.approvalStatus) filter.approvalStatus = query.approvalStatus;
    if (query.search) {
      filter.$or = [
        { purchaseOrderId: new RegExp(query.search, 'i') },
        { vendorName: new RegExp(query.search, 'i') },
        { externalReference: new RegExp(query.search, 'i') },
        { 'items.description': new RegExp(query.search, 'i') }
      ];
    }

    const page = Math.max(1, parseInt(query.page, 10) || 1);
    const limit = Math.max(1, Math.min(100, parseInt(query.limit, 10) || 20));
    const skip = (page - 1) * limit;

    const [orders, total] = await Promise.all([
      PurchaseOrder.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      PurchaseOrder.countDocuments(filter)
    ]);

    return {
      orders,
      total,
      page,
      totalPages: Math.ceil(total / limit)
    };
  }

  static async getPurchaseOrderById(id) {
    const po = await PurchaseOrder.findOne({ purchaseOrderId: id }).lean();
    if (!po) throw new Error(`Purchase Order ${id} not found`);
    return po;
  }
}

module.exports = PurchaseOrderService;
