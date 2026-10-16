const RFQ = require('../../models/RFQ');
const PurchaseRequest = require('../../models/PurchaseRequest');
const IdGeneratorService = require('../IdGeneratorService');
const AuditService = require('../AuditService');
const NotificationService = require('../NotificationService');

class RfqService {
  /**
   * Create an RFQ from one or more approved Purchase Requests
   */
  static async createRfq(data, user = { userId: 'SYSTEM', role: 'PROCUREMENT_OFFICER' }) {
    if (!data.title) throw new Error('RFQ title is required');
    if (!data.responseDeadline) throw new Error('Response deadline is required');
    if (!data.vendorIds || !Array.isArray(data.vendorIds) || data.vendorIds.length === 0) {
      throw new Error('At least one vendor must be selected for RFQ');
    }

    const rfqId = await IdGeneratorService.generateRfqId();

    let items = [];
    if (data.items && Array.isArray(data.items) && data.items.length > 0) {
      items = data.items.map((it, idx) => ({
        rfqItemId: `RFQ-ITEM-${idx + 1}`,
        inventoryItemId: it.inventoryItemId,
        description: it.description || it.itemNameSnapshot || 'Item',
        quantity: Math.max(1, Number(it.quantity) || 1),
        unit: it.unit || 'UNIT',
        specification: it.specification || it.preferredSpecification || '',
        requiredDeliveryDate: it.requiredDeliveryDate || data.responseDeadline
      }));
    } else if (data.purchaseRequestIds && data.purchaseRequestIds.length > 0) {
      const prs = await PurchaseRequest.find({ purchaseRequestId: { $in: data.purchaseRequestIds } }).lean();
      let itemCounter = 1;
      prs.forEach((pr) => {
        pr.items.forEach((it) => {
          items.push({
            rfqItemId: `RFQ-ITEM-${itemCounter++}`,
            inventoryItemId: it.inventoryItemId,
            description: it.description || it.itemNameSnapshot,
            quantity: it.quantity,
            unit: it.unit,
            specification: it.preferredSpecification || '',
            requiredDeliveryDate: it.requiredByDate || data.responseDeadline
          });
        });
      });
    }

    if (items.length === 0) {
      throw new Error('RFQ must contain at least one item');
    }

    const rfq = new RFQ({
      rfqId,
      title: data.title,
      purchaseRequestIds: data.purchaseRequestIds || [],
      vendorIds: data.vendorIds,
      items,
      responseDeadline: new Date(data.responseDeadline),
      status: data.issueImmediately ? 'ISSUED' : 'DRAFT',
      issueDate: data.issueImmediately ? new Date() : null,
      issuedBy: data.issueImmediately ? user.userId : null,
      termsAndConditions: data.termsAndConditions || 'Standard hospital procurement terms apply.',
      notes: data.notes || '',
      createdBy: user.userId
    });

    await rfq.save();

    // Link PRs
    if (data.purchaseRequestIds && data.purchaseRequestIds.length > 0) {
      await PurchaseRequest.updateMany(
        { purchaseRequestId: { $in: data.purchaseRequestIds } },
        {
          $set: { rfqId: rfq.rfqId, status: 'RFQ_IN_PROGRESS' },
          $push: {
            timeline: {
              status: 'RFQ_IN_PROGRESS',
              actorId: user.userId,
              actorName: user.name || user.userId,
              role: user.role,
              note: `Included in RFQ ${rfq.rfqId}`,
              timestamp: new Date()
            }
          }
        }
      );
    }

    await AuditService.logEvent({
      userId: user.userId,
      role: user.role,
      action: data.issueImmediately ? 'RFQ_ISSUED' : 'RFQ_CREATED',
      module: 'PROCUREMENT',
      entityType: 'RFQ',
      entityId: rfqId,
      newValue: { vendorCount: data.vendorIds.length, itemCount: items.length },
      details: `Created RFQ ${rfqId} for ${data.vendorIds.length} vendors.`
    });

    return rfq;
  }

  /**
   * Issue RFQ to vendors
   */
  static async issueRfq(id, user = { userId: 'SYSTEM', role: 'PROCUREMENT_OFFICER' }) {
    const rfq = await RFQ.findOne({ rfqId: id });
    if (!rfq) throw new Error(`RFQ ${id} not found`);

    if (rfq.status !== 'DRAFT') {
      throw new Error(`Cannot issue RFQ in status ${rfq.status}`);
    }

    rfq.status = 'ISSUED';
    rfq.issueDate = new Date();
    rfq.issuedBy = user.userId;
    await rfq.save();

    await AuditService.logEvent({
      userId: user.userId,
      role: user.role,
      action: 'RFQ_ISSUED',
      module: 'PROCUREMENT',
      entityType: 'RFQ',
      entityId: id,
      newValue: { status: 'ISSUED', issueDate: rfq.issueDate },
      details: `Issued RFQ ${id} to ${rfq.vendorIds.length} vendors.`
    });

    await NotificationService.sendNotification({
      channel: 'IN_APP',
      event: 'RFQ_ISSUED',
      title: `RFQ ${id} Issued`,
      message: `RFQ ${id} (${rfq.title}) has been dispatched to ${rfq.vendorIds.length} vendors. Deadline: ${rfq.responseDeadline.toLocaleDateString()}`,
      entityType: 'RFQ',
      entityId: id
    });

    return rfq;
  }

  /**
   * Close RFQ
   */
  static async closeRfq(id, user = { userId: 'SYSTEM', role: 'PROCUREMENT_OFFICER' }) {
    const rfq = await RFQ.findOne({ rfqId: id });
    if (!rfq) throw new Error(`RFQ ${id} not found`);

    rfq.status = 'CLOSED';
    rfq.closedBy = user.userId;
    rfq.closedAt = new Date();
    await rfq.save();

    await AuditService.logEvent({
      userId: user.userId,
      role: user.role,
      action: 'RFQ_CLOSED',
      module: 'PROCUREMENT',
      entityType: 'RFQ',
      entityId: id,
      newValue: { status: 'CLOSED' },
      details: `Closed RFQ ${id}.`
    });

    return rfq;
  }

  /**
   * Query RFQs
   */
  static async getRfqs(query = {}) {
    const filter = {};
    if (query.status) filter.status = query.status;
    if (query.vendorId) filter.vendorIds = query.vendorId;
    if (query.search) {
      filter.$or = [
        { rfqId: new RegExp(query.search, 'i') },
        { title: new RegExp(query.search, 'i') }
      ];
    }

    const page = Math.max(1, parseInt(query.page, 10) || 1);
    const limit = Math.max(1, Math.min(100, parseInt(query.limit, 10) || 20));
    const skip = (page - 1) * limit;

    const [rfqs, total] = await Promise.all([
      RFQ.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      RFQ.countDocuments(filter)
    ]);

    return {
      rfqs,
      total,
      page,
      totalPages: Math.ceil(total / limit)
    };
  }

  static async getRfqById(id) {
    const rfq = await RFQ.findOne({ rfqId: id }).lean();
    if (!rfq) throw new Error(`RFQ ${id} not found`);
    return rfq;
  }
}

module.exports = RfqService;
