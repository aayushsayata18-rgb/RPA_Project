const Vendor = require('../../models/Vendor');
const PurchaseOrder = require('../../models/PurchaseOrder');
const Delivery = require('../../models/Delivery');
const VendorContract = require('../../models/VendorContract');
const AuditService = require('../AuditService');
const NotificationService = require('../NotificationService');

class VendorStatusService {
  /**
   * Submit vendor for verification
   */
  static async submitForVerification(vendorId, submittedBy) {
    const vendor = await Vendor.findOne({ vendorId });
    if (!vendor) throw new Error(`Vendor ${vendorId} not found`);

    if (!['DRAFT', 'REJECTED'].includes(vendor.status)) {
      throw new Error(`Cannot submit for verification from status: ${vendor.status}`);
    }

    vendor.status = 'PENDING_VERIFICATION';
    vendor.updatedBy = submittedBy;
    await vendor.save();

    await AuditService.logEvent({
      action: 'VENDOR_SUBMITTED',
      module: 'VENDOR_MANAGEMENT',
      entityId: vendorId,
      entityType: 'Vendor',
      userId: submittedBy || 'SYSTEM',
      details: `Vendor ${vendor.displayName} submitted for verification (DRAFT -> PENDING_VERIFICATION)`
    });

    return vendor;
  }

  /**
   * Submit vendor for approval
   */
  static async submitForApproval(vendorId, submittedBy) {
    const vendor = await Vendor.findOne({ vendorId });
    if (!vendor) throw new Error(`Vendor ${vendorId} not found`);

    if (vendor.status !== 'PENDING_VERIFICATION') {
      throw new Error(`Cannot submit for approval from status: ${vendor.status}`);
    }

    vendor.status = 'PENDING_APPROVAL';
    vendor.updatedBy = submittedBy;
    await vendor.save();

    await AuditService.logEvent({
      action: 'VENDOR_SUBMITTED',
      module: 'VENDOR_MANAGEMENT',
      entityId: vendorId,
      entityType: 'Vendor',
      userId: submittedBy || 'SYSTEM',
      details: `Vendor ${vendor.displayName} submitted for approval (PENDING_VERIFICATION -> PENDING_APPROVAL)`
    });

    return vendor;
  }

  /**
   * Approve vendor and activate
   */
  static async approveVendor(vendorId, approvalData, approvedBy) {
    const { decisionReason } = approvalData;
    const vendor = await Vendor.findOne({ vendorId });
    if (!vendor) throw new Error(`Vendor ${vendorId} not found`);

    if (!['PENDING_APPROVAL', 'PENDING_VERIFICATION'].includes(vendor.status)) {
      throw new Error(`Cannot approve vendor from status: ${vendor.status}`);
    }

    vendor.status = 'ACTIVE';
    vendor.approvalDecision = {
      decision: 'APPROVE',
      decisionReason: decisionReason || 'Authorized vendor management approval',
      approvedBy,
      approvedAt: new Date()
    };
    vendor.updatedBy = approvedBy;
    await vendor.save();

    await AuditService.logEvent({
      action: 'VENDOR_APPROVED',
      module: 'VENDOR_MANAGEMENT',
      entityId: vendorId,
      entityType: 'Vendor',
      userId: approvedBy || 'SYSTEM',
      details: `Vendor ${vendor.displayName} approved and activated: ${decisionReason || 'Approved'}`
    });

    try {
      await NotificationService.sendNotification({
        recipientId: vendor.vendorId,
        event: 'VENDOR_APPROVED',
        title: 'Vendor Master Approved',
        message: `Congratulations! Your vendor profile (${vendor.vendorId}) has been verified and activated.`,
        channel: 'IN_APP',
        entityType: 'Vendor',
        entityId: vendorId
      });
    } catch (e) {}

    return vendor;
  }

  /**
   * Reject vendor registration
   */
  static async rejectVendor(vendorId, rejectionReason, rejectedBy) {
    const vendor = await Vendor.findOne({ vendorId });
    if (!vendor) throw new Error(`Vendor ${vendorId} not found`);

    vendor.status = 'REJECTED';
    vendor.rejectionReason = rejectionReason || 'Vendor registration rejected';
    vendor.approvalDecision = {
      decision: 'REJECT',
      decisionReason: rejectionReason,
      approvedBy: rejectedBy,
      approvedAt: new Date()
    };
    vendor.updatedBy = rejectedBy;
    await vendor.save();

    await AuditService.logEvent({
      action: 'VENDOR_REJECTED',
      module: 'VENDOR_MANAGEMENT',
      entityId: vendorId,
      entityType: 'Vendor',
      userId: rejectedBy || 'SYSTEM',
      details: `Vendor ${vendor.displayName} rejected: ${rejectionReason}`
    });

    return vendor;
  }

  /**
   * Place vendor ON_HOLD (Section 42)
   */
  static async placeOnHold(vendorId, holdData, placedBy) {
    const { holdReason, expectedResolutionDate } = holdData;
    const vendor = await Vendor.findOne({ vendorId });
    if (!vendor) throw new Error(`Vendor ${vendorId} not found`);

    if (vendor.status !== 'ACTIVE') {
      throw new Error(`Only ACTIVE vendors can be placed ON_HOLD`);
    }

    vendor.status = 'ON_HOLD';
    vendor.holdReason = holdReason || 'Temporary administrative hold';
    vendor.holdStart = new Date();
    vendor.expectedResolutionDate = expectedResolutionDate ? new Date(expectedResolutionDate) : null;
    vendor.placedBy = placedBy;
    vendor.updatedBy = placedBy;
    await vendor.save();

    await AuditService.logEvent({
      action: 'VENDOR_HOLD',
      module: 'VENDOR_MANAGEMENT',
      entityId: vendorId,
      entityType: 'Vendor',
      userId: placedBy || 'SYSTEM',
      details: `Vendor ${vendor.displayName} placed ON_HOLD: ${holdReason}`
    });

    return vendor;
  }

  /**
   * Release hold and return to ACTIVE
   */
  static async releaseHold(vendorId, releasedBy) {
    const vendor = await Vendor.findOne({ vendorId });
    if (!vendor) throw new Error(`Vendor ${vendorId} not found`);

    if (vendor.status !== 'ON_HOLD') {
      throw new Error(`Vendor is not ON_HOLD`);
    }

    vendor.status = 'ACTIVE';
    vendor.holdReason = null;
    vendor.holdStart = null;
    vendor.expectedResolutionDate = null;
    vendor.placedBy = null;
    vendor.updatedBy = releasedBy;
    await vendor.save();

    await AuditService.logEvent({
      action: 'VENDOR_UPDATED',
      module: 'VENDOR_MANAGEMENT',
      entityId: vendorId,
      entityType: 'Vendor',
      userId: releasedBy || 'SYSTEM',
      details: `Vendor ${vendor.displayName} hold released; returned to ACTIVE`
    });

    return vendor;
  }

  /**
   * Suspend vendor (Section 43, 44, 45)
   */
  static async suspendVendor(vendorId, suspensionReason, suspendedBy) {
    const vendor = await Vendor.findOne({ vendorId });
    if (!vendor) throw new Error(`Vendor ${vendorId} not found`);

    vendor.status = 'SUSPENDED';
    vendor.suspensionReason = suspensionReason || 'Suspended by authorized vendor manager';
    vendor.suspendedAt = new Date();
    vendor.suspendedBy = suspendedBy;
    vendor.updatedBy = suspendedBy;
    await vendor.save();

    // Section 45: Existing open POs must be flagged for review (not deleted or cancelled)
    const openPOs = await PurchaseOrder.find({
      vendorId,
      status: { $in: ['ISSUED', 'SENT_TO_VENDOR', 'ACKNOWLEDGED', 'PARTIALLY_DELIVERED'] }
    });

    for (const po of openPOs) {
      po.notes = (po.notes ? po.notes + ' | ' : '') + `[VENDOR_SUSPENDED]: Vendor was suspended on ${new Date().toISOString()}. Review required.`;
      await po.save();
    }

    await AuditService.logEvent({
      action: 'VENDOR_SUSPENDED',
      module: 'VENDOR_MANAGEMENT',
      entityId: vendorId,
      entityType: 'Vendor',
      userId: suspendedBy || 'SYSTEM',
      details: `Vendor ${vendor.displayName} SUSPENDED: ${suspensionReason}. Flagged ${openPOs.length} open POs.`
    });

    try {
      await NotificationService.sendNotification({
        recipientId: 'PROCUREMENT_OFFICER',
        event: 'VENDOR_SUSPENDED',
        title: `Vendor Suspended: ${vendor.displayName}`,
        message: `Vendor ${vendor.displayName} (${vendor.vendorId}) has been suspended. ${openPOs.length} open PO(s) flagged for review.`,
        channel: 'IN_APP',
        entityType: 'Vendor',
        entityId: vendorId
      });
    } catch (e) {}

    return { vendor, flaggedPOCount: openPOs.length };
  }

  /**
   * Reactivate vendor (Section 46)
   */
  static async reactivateVendor(vendorId, reactivationData, reactivatedBy) {
    const vendor = await Vendor.findOne({ vendorId });
    if (!vendor) throw new Error(`Vendor ${vendorId} not found`);

    if (!['SUSPENDED', 'INACTIVE'].includes(vendor.status)) {
      throw new Error(`Only SUSPENDED or INACTIVE vendors can be reactivated`);
    }

    vendor.status = 'ACTIVE';
    vendor.suspensionReason = null;
    vendor.suspendedAt = null;
    vendor.suspendedBy = null;
    vendor.notes = (vendor.notes ? vendor.notes + ' | ' : '') + `Reactivated on ${new Date().toLocaleDateString()} by ${reactivatedBy}: ${reactivationData?.notes || 'Cleared'}`;
    vendor.updatedBy = reactivatedBy;
    await vendor.save();

    await AuditService.logEvent({
      action: 'VENDOR_REACTIVATED',
      module: 'VENDOR_MANAGEMENT',
      entityId: vendorId,
      entityType: 'Vendor',
      userId: reactivatedBy || 'SYSTEM',
      details: `Vendor ${vendor.displayName} reactivated to ACTIVE by ${reactivatedBy}`
    });

    return vendor;
  }

  /**
   * Deactivate vendor (Section 47 & 48: Soft delete, checks open transactions)
   */
  static async deactivateVendor(vendorId, deactivationReason, deactivatedBy) {
    const vendor = await Vendor.findOne({ vendorId });
    if (!vendor) throw new Error(`Vendor ${vendorId} not found`);

    // Check open dependencies
    const [openPOs, openDeliveries, activeContracts] = await Promise.all([
      PurchaseOrder.countDocuments({
        vendorId,
        status: { $in: ['DRAFT', 'PENDING_APPROVAL', 'APPROVED', 'ISSUED', 'SENT_TO_VENDOR', 'ACKNOWLEDGED', 'PARTIALLY_DELIVERED'] }
      }),
      Delivery.countDocuments({
        vendorId,
        status: { $in: ['SCHEDULED', 'IN_TRANSIT', 'OUT_FOR_DELIVERY', 'PENDING_INSPECTION'] }
      }),
      VendorContract.countDocuments({
        vendorId,
        status: { $in: ['ACTIVE', 'EXPIRING', 'RENEWAL_PENDING'] }
      })
    ]);

    if (openPOs > 0 || openDeliveries > 0 || activeContracts > 0) {
      throw new Error(
        `Cannot deactivate vendor: Found ${openPOs} open PO(s), ${openDeliveries} active delivery/deliveries, and ${activeContracts} active contract(s). Close or override dependencies first.`
      );
    }

    vendor.status = 'DEACTIVATED';
    vendor.deactivationReason = deactivationReason || 'Deactivated per hospital policy';
    vendor.deactivatedAt = new Date();
    vendor.deactivatedBy = deactivatedBy;
    vendor.updatedBy = deactivatedBy;
    await vendor.save();

    await AuditService.logEvent({
      action: 'VENDOR_DEACTIVATED',
      module: 'VENDOR_MANAGEMENT',
      entityId: vendorId,
      entityType: 'Vendor',
      userId: deactivatedBy || 'SYSTEM',
      details: `Vendor ${vendor.displayName} DEACTIVATED: ${deactivationReason}`
    });

    return vendor;
  }
}

module.exports = VendorStatusService;
