const mongoose = require('mongoose');
const HousekeepingSupplyRequest = require('../../models/HousekeepingSupplyRequest');
const InventoryMovement = require('../../models/InventoryMovement');
const IdGeneratorService = require('../IdGeneratorService');
const AuditService = require('../AuditService');

class SupplyService {
  static async requestSupplies(data, actorUser) {
    const requestId = data.requestId || (await IdGeneratorService.generateHousekeepingSupplyRequestId());
    const requestedBy = data.requestedBy || actorUser?.name || 'Staff';
    const requestedById = data.requestedById || actorUser?.userId || actorUser?.id || 'HK-STAFF';

    const supplyReq = new HousekeepingSupplyRequest({
      ...data,
      requestId,
      requestedBy,
      requestedById,
      requestedByUserId: requestedById,
      status: 'PENDING'
    });
    await supplyReq.save();

    await AuditService.logEvent({
      action: 'HOUSEKEEPING_SUPPLY_REQUESTED',
      category: 'HOUSEKEEPING',
      actorUserId: actorUser?.userId || actorUser?.id || 'SYSTEM',
      actorRole: actorUser?.role || 'SYSTEM',
      details: { requestId, itemsCount: supplyReq.items.length }
    });

    return supplyReq;
  }

  static async listSupplyRequests(query = {}) {
    const filter = {};
    if (query.status) filter.status = query.status;
    if (query.taskId) filter.taskId = query.taskId;

    return await HousekeepingSupplyRequest.find(filter)
      .populate('taskId')
      .sort({ createdAt: -1 })
      .lean();
  }

  static async getSupplyRequestById(id) {
    const isObjectId = mongoose.Types.ObjectId.isValid(id);
    const supplyReq = await HousekeepingSupplyRequest.findOne(
      isObjectId ? { $or: [{ _id: id }, { requestId: id }] } : { requestId: id }
    ).lean();

    if (!supplyReq) throw new Error(`Housekeeping supply request ${id} not found.`);
    return supplyReq;
  }

  static async approveSupplyRequest(id, detailsOrActor, maybeActor) {
    let details = {};
    let actorUser = null;

    if (detailsOrActor && (detailsOrActor.approvedBy || detailsOrActor.approvalNotes)) {
      details = detailsOrActor;
      actorUser = maybeActor;
    } else {
      actorUser = detailsOrActor;
    }

    const isObjectId = mongoose.Types.ObjectId.isValid(id);
    const supplyReq = await HousekeepingSupplyRequest.findOne(
      isObjectId ? { $or: [{ _id: id }, { requestId: id }] } : { requestId: id }
    );
    if (!supplyReq) throw new Error(`Housekeeping supply request ${id} not found.`);

    supplyReq.status = 'APPROVED';
    supplyReq.approvedBy = details.approvedBy || actorUser?.name || 'Supervisor';
    supplyReq.approvedById = details.approvedById || actorUser?.userId || actorUser?.id || 'SUPERVISOR';
    supplyReq.approvedByUserId = supplyReq.approvedById;
    supplyReq.approvalNotes = details.approvalNotes || '';
    await supplyReq.save();

    await AuditService.logEvent({
      action: 'HOUSEKEEPING_SUPPLY_APPROVED',
      category: 'HOUSEKEEPING',
      actorUserId: actorUser?.userId || actorUser?.id || 'SYSTEM',
      actorRole: actorUser?.role || 'SYSTEM',
      details: { requestId: supplyReq.requestId }
    });

    return supplyReq;
  }

  static async issueSupplyRequest(id, detailsOrActor, maybeActor) {
    let details = {};
    let actorUser = null;

    if (detailsOrActor && (detailsOrActor.issuedBy || detailsOrActor.items)) {
      details = detailsOrActor;
      actorUser = maybeActor;
    } else {
      actorUser = detailsOrActor;
    }

    const isObjectId = mongoose.Types.ObjectId.isValid(id);
    const supplyReq = await HousekeepingSupplyRequest.findOne(
      isObjectId ? { $or: [{ _id: id }, { requestId: id }] } : { requestId: id }
    );
    if (!supplyReq) throw new Error(`Housekeeping supply request ${id} not found.`);

    supplyReq.status = 'ISSUED';
    supplyReq.issuedBy = details.issuedBy || actorUser?.name || 'Storekeeper';
    supplyReq.issuedById = details.issuedById || actorUser?.userId || actorUser?.id || 'STORE';
    supplyReq.issuedByUserId = supplyReq.issuedById;
    supplyReq.issuedAt = new Date();

    if (Array.isArray(details.items) && details.items.length > 0) {
      details.items.forEach((item) => {
        const existing = supplyReq.items.find((i) => i.itemName === item.itemName);
        if (existing) {
          existing.quantityIssued = item.quantityIssued !== undefined ? item.quantityIssued : existing.quantityRequested;
        }
      });
    } else {
      supplyReq.items.forEach((i) => {
        if (!i.quantityIssued) i.quantityIssued = i.quantityRequested;
      });
    }

    await supplyReq.save();

    await AuditService.logEvent({
      action: 'HOUSEKEEPING_SUPPLY_ISSUED',
      category: 'HOUSEKEEPING',
      actorUserId: actorUser?.userId || actorUser?.id || 'SYSTEM',
      actorRole: actorUser?.role || 'SYSTEM',
      details: { requestId: supplyReq.requestId }
    });

    return supplyReq;
  }

  static async returnSupplyRequest(id, returnData, actorUser) {
    const isObjectId = mongoose.Types.ObjectId.isValid(id);
    const supplyReq = await HousekeepingSupplyRequest.findOne(
      isObjectId ? { $or: [{ _id: id }, { requestId: id }] } : { requestId: id }
    );
    if (!supplyReq) throw new Error(`Housekeeping supply request ${id} not found.`);

    supplyReq.status = 'RETURNED';
    supplyReq.notes = returnData?.notes ? `${supplyReq.notes || ''} [RETURNED: ${returnData.notes}]` : supplyReq.notes;
    await supplyReq.save();

    return supplyReq;
  }
}

module.exports = SupplyService;
