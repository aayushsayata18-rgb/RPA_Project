const PurchaseRequest = require('../../models/PurchaseRequest');
const PurchaseOrder = require('../../models/PurchaseOrder');
const AuditService = require('../AuditService');
const NotificationService = require('../NotificationService');

class ApprovalService {
  /**
   * Determine authorization level and required roles based on threshold
   */
  static getRequiredApprovalTier(amount) {
    if (amount <= 50000) {
      return {
        tier: 'TIER_1',
        description: 'Department Manager or Procurement Officer Approval',
        allowedRoles: ['ADMIN_MANAGER', 'PROCUREMENT_OFFICER', 'HOSPITAL_MANAGEMENT', 'SYSTEM_ADMIN']
      };
    } else if (amount <= 200000) {
      return {
        tier: 'TIER_2',
        description: 'Procurement Manager or Admin Manager Approval',
        allowedRoles: ['ADMIN_MANAGER', 'HOSPITAL_MANAGEMENT', 'SYSTEM_ADMIN']
      };
    } else {
      return {
        tier: 'TIER_3',
        description: 'Executive Hospital Management Approval',
        allowedRoles: ['HOSPITAL_MANAGEMENT', 'SYSTEM_ADMIN']
      };
    }
  }

  /**
   * Validate Segregation of Duties (Section 20)
   * The requester cannot be the approver
   */
  static validateSegregationOfDuties(requesterId, approverId) {
    if (requesterId && approverId && String(requesterId) === String(approverId)) {
      throw new Error('Segregation of duties violation: Requester cannot approve their own purchase request or purchase order.');
    }
  }

  /**
   * Approve a Purchase Request
   */
  static async approvePurchaseRequest(id, notes = '', user = { userId: 'SYSTEM', role: 'ADMIN_MANAGER' }) {
    const pr = await PurchaseRequest.findOne({ purchaseRequestId: id });
    if (!pr) throw new Error(`Purchase Request ${id} not found`);

    if (!['SUBMITTED', 'UNDER_REVIEW', 'PENDING_APPROVAL'].includes(pr.status)) {
      throw new Error(`Invalid status transition: Cannot approve request in status ${pr.status}`);
    }

    // Segregation of duties check (unless SYSTEM or SYSTEM_ADMIN override)
    if (user.role !== 'SYSTEM_ADMIN') {
      this.validateSegregationOfDuties(pr.requesterId, user.userId);
    }

    const tierInfo = this.getRequiredApprovalTier(pr.estimatedTotal);
    // Role verification
    if (!tierInfo.allowedRoles.includes(user.role) && user.role !== 'SYSTEM_ADMIN') {
      throw new Error(`Insufficient approval authority: Amount ₹${pr.estimatedTotal.toLocaleString()} requires ${tierInfo.description}`);
    }

    pr.status = 'APPROVED';
    pr.approverId = user.userId;
    pr.approverName = user.name || user.userId;
    pr.approvedAt = new Date();
    pr.approvalNotes = notes || 'Approved per procurement policy';

    pr.timeline.push({
      status: 'APPROVED',
      actorId: user.userId,
      actorName: user.name || user.userId,
      role: user.role,
      note: notes || 'Purchase Request approved',
      timestamp: new Date()
    });

    await pr.save();

    await AuditService.logEvent({
      userId: user.userId,
      role: user.role,
      action: 'PURCHASE_REQUEST_APPROVED',
      module: 'PROCUREMENT',
      entityType: 'PurchaseRequest',
      entityId: id,
      newValue: { status: 'APPROVED', approverId: user.userId, tier: tierInfo.tier },
      details: `Purchase Request ${id} approved by ${user.userId}.`
    });

    await NotificationService.sendNotification({
      recipientId: pr.requesterId,
      channel: 'IN_APP',
      event: 'PURCHASE_REQUEST_APPROVED',
      title: `PR ${id} Approved`,
      message: `Your Purchase Request ${id} for ₹${pr.estimatedTotal.toLocaleString()} has been approved. Proceeding to RFQ / PO.`,
      entityType: 'PurchaseRequest',
      entityId: id
    });

    return pr;
  }

  /**
   * Reject a Purchase Request
   */
  static async rejectPurchaseRequest(id, reason, user = { userId: 'SYSTEM', role: 'ADMIN_MANAGER' }) {
    if (!reason || reason.trim() === '') {
      throw new Error('Rejection reason is mandatory when rejecting a purchase request');
    }

    const pr = await PurchaseRequest.findOne({ purchaseRequestId: id });
    if (!pr) throw new Error(`Purchase Request ${id} not found`);

    if (!['SUBMITTED', 'UNDER_REVIEW', 'PENDING_APPROVAL'].includes(pr.status)) {
      throw new Error(`Cannot reject request in status ${pr.status}`);
    }

    pr.status = 'REJECTED';
    pr.rejectionReason = reason;
    pr.rejectedBy = user.userId;
    pr.rejectedAt = new Date();

    pr.timeline.push({
      status: 'REJECTED',
      actorId: user.userId,
      actorName: user.name || user.userId,
      role: user.role,
      note: `Rejected: ${reason}`,
      timestamp: new Date()
    });

    await pr.save();

    await AuditService.logEvent({
      userId: user.userId,
      role: user.role,
      action: 'PURCHASE_REQUEST_REJECTED',
      module: 'PROCUREMENT',
      entityType: 'PurchaseRequest',
      entityId: id,
      newValue: { status: 'REJECTED', rejectionReason: reason },
      details: `Purchase Request ${id} rejected by ${user.userId}. Reason: ${reason}`
    });

    await NotificationService.sendNotification({
      recipientId: pr.requesterId,
      channel: 'IN_APP',
      event: 'PURCHASE_REQUEST_REJECTED',
      title: `PR ${id} Rejected`,
      message: `Your Purchase Request ${id} was rejected. Reason: ${reason}`,
      entityType: 'PurchaseRequest',
      entityId: id
    });

    return pr;
  }

  /**
   * Return Purchase Request for correction
   */
  static async returnPurchaseRequestForCorrection(id, reason, user = { userId: 'SYSTEM', role: 'ADMIN_MANAGER' }) {
    if (!reason || reason.trim() === '') {
      throw new Error('Correction reason is mandatory when returning a purchase request');
    }

    const pr = await PurchaseRequest.findOne({ purchaseRequestId: id });
    if (!pr) throw new Error(`Purchase Request ${id} not found`);

    if (!['SUBMITTED', 'UNDER_REVIEW', 'PENDING_APPROVAL'].includes(pr.status)) {
      throw new Error(`Cannot return request in status ${pr.status}`);
    }

    pr.status = 'RETURNED_FOR_CORRECTION';
    pr.correctionReason = reason;
    pr.returnedBy = user.userId;
    pr.returnedAt = new Date();

    pr.timeline.push({
      status: 'RETURNED_FOR_CORRECTION',
      actorId: user.userId,
      actorName: user.name || user.userId,
      role: user.role,
      note: `Returned for correction: ${reason}`,
      timestamp: new Date()
    });

    await pr.save();

    await AuditService.logEvent({
      userId: user.userId,
      role: user.role,
      action: 'PURCHASE_REQUEST_RETURNED',
      module: 'PROCUREMENT',
      entityType: 'PurchaseRequest',
      entityId: id,
      newValue: { status: 'RETURNED_FOR_CORRECTION', correctionReason: reason },
      details: `Purchase Request ${id} returned for correction. Reason: ${reason}`
    });

    await NotificationService.sendNotification({
      recipientId: pr.requesterId,
      channel: 'IN_APP',
      event: 'PURCHASE_REQUEST_RETURNED',
      title: `PR ${id} Needs Correction`,
      message: `Your Purchase Request ${id} was returned for correction: ${reason}`,
      entityType: 'PurchaseRequest',
      entityId: id
    });

    return pr;
  }

  /**
   * Approve Purchase Order
   */
  static async approvePurchaseOrder(id, notes = '', user = { userId: 'SYSTEM', role: 'ADMIN_MANAGER' }) {
    const po = await PurchaseOrder.findOne({ purchaseOrderId: id });
    if (!po) throw new Error(`Purchase Order ${id} not found`);

    if (po.status !== 'PENDING_APPROVAL') {
      throw new Error(`Invalid status transition: Cannot approve PO in status ${po.status}`);
    }

    if (user.role !== 'SYSTEM_ADMIN') {
      this.validateSegregationOfDuties(po.createdBy, user.userId);
    }

    const tierInfo = this.getRequiredApprovalTier(po.grandTotal);
    if (!tierInfo.allowedRoles.includes(user.role) && user.role !== 'SYSTEM_ADMIN') {
      throw new Error(`Insufficient approval authority: PO Grand Total ₹${po.grandTotal.toLocaleString()} requires ${tierInfo.description}`);
    }

    po.status = 'APPROVED';
    po.approvalStatus = 'APPROVED';
    po.approvedBy = user.userId;
    po.approvedByName = user.name || user.userId;
    po.approvedAt = new Date();
    po.approvalNotes = notes || 'PO Approved';

    await po.save();

    // Also update linked purchase requests to PO_CREATED / APPROVED
    if (po.purchaseRequestIds && po.purchaseRequestIds.length > 0) {
      await PurchaseRequest.updateMany(
        { purchaseRequestId: { $in: po.purchaseRequestIds } },
        {
          $set: { status: 'PO_CREATED', purchaseOrderId: po.purchaseOrderId },
          $push: {
            timeline: {
              status: 'PO_CREATED',
              actorId: user.userId,
              actorName: user.name || user.userId,
              role: user.role,
              note: `Purchase Order ${po.purchaseOrderId} approved`,
              timestamp: new Date()
            }
          }
        }
      );
    }

    await AuditService.logEvent({
      userId: user.userId,
      role: user.role,
      action: 'PURCHASE_ORDER_APPROVED',
      module: 'PROCUREMENT',
      entityType: 'PurchaseOrder',
      entityId: id,
      newValue: { status: 'APPROVED', grandTotal: po.grandTotal },
      details: `Purchase Order ${id} approved by ${user.userId}.`
    });

    await NotificationService.sendNotification({
      channel: 'IN_APP',
      event: 'PURCHASE_ORDER_APPROVED',
      title: `PO ${id} Approved`,
      message: `Purchase Order ${id} for vendor ${po.vendorName} (₹${po.grandTotal.toLocaleString()}) has been approved and is ready to send.`,
      entityType: 'PurchaseOrder',
      entityId: id
    });

    return po;
  }

  /**
   * Reject Purchase Order
   */
  static async rejectPurchaseOrder(id, reason, user = { userId: 'SYSTEM', role: 'ADMIN_MANAGER' }) {
    if (!reason || reason.trim() === '') {
      throw new Error('Rejection reason is mandatory when rejecting a purchase order');
    }

    const po = await PurchaseOrder.findOne({ purchaseOrderId: id });
    if (!po) throw new Error(`Purchase Order ${id} not found`);

    if (po.status !== 'PENDING_APPROVAL') {
      throw new Error(`Cannot reject PO in status ${po.status}`);
    }

    po.status = 'REJECTED';
    po.approvalStatus = 'REJECTED';
    po.rejectionReason = reason;
    po.rejectedBy = user.userId;
    po.rejectedAt = new Date();

    await po.save();

    await AuditService.logEvent({
      userId: user.userId,
      role: user.role,
      action: 'PURCHASE_ORDER_REJECTED',
      module: 'PROCUREMENT',
      entityType: 'PurchaseOrder',
      entityId: id,
      newValue: { status: 'REJECTED', reason },
      details: `Purchase Order ${id} was rejected by ${user.userId}.`
    });

    return po;
  }
}

module.exports = ApprovalService;
