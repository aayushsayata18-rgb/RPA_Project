const mongoose = require('mongoose');
const HousekeepingArea = require('../../models/HousekeepingArea');
const IdGeneratorService = require('../IdGeneratorService');
const AuditService = require('../AuditService');

class AreaService {
  static async createArea(data, actorUser) {
    const areaId = data.areaId || (await IdGeneratorService.generateHousekeepingAreaId());
    const areaCode = data.areaCode || areaId;

    const area = new HousekeepingArea({
      ...data,
      areaId,
      areaCode
    });
    await area.save();

    await AuditService.logEvent({
      action: 'HOUSEKEEPING_AREA_CREATED',
      category: 'HOUSEKEEPING',
      actorUserId: actorUser?.userId || actorUser?.id || 'SYSTEM',
      actorRole: actorUser?.role || 'SYSTEM',
      details: { areaId, areaCode, name: area.name, areaType: area.areaType, status: area.status }
    });

    return area;
  }

  static async listAreas(query = {}) {
    const filter = {};
    if (query.status) filter.status = query.status;
    if (query.areaType) filter.areaType = query.areaType;
    if (query.active !== undefined) filter.active = query.active === 'true' || query.active === true;
    if (query.bedId) filter.bedId = query.bedId;

    return await HousekeepingArea.find(filter).sort({ name: 1 }).lean();
  }

  static async getAreaById(id) {
    const isObjectId = mongoose.Types.ObjectId.isValid(id);
    const area = await HousekeepingArea.findOne(
      isObjectId ? { $or: [{ _id: id }, { areaId: id }, { areaCode: id }] } : { $or: [{ areaId: id }, { areaCode: id }] }
    ).lean();

    if (!area) throw new Error(`Housekeeping area ${id} not found.`);
    return area;
  }

  static async updateArea(id, data, actorUser) {
    const isObjectId = mongoose.Types.ObjectId.isValid(id);
    const area = await HousekeepingArea.findOneAndUpdate(
      isObjectId ? { $or: [{ _id: id }, { areaId: id }, { areaCode: id }] } : { $or: [{ areaId: id }, { areaCode: id }] },
      { $set: data },
      { new: true }
    );
    if (!area) throw new Error(`Housekeeping area ${id} not found.`);

    await AuditService.logEvent({
      action: 'HOUSEKEEPING_AREA_UPDATED',
      category: 'HOUSEKEEPING',
      actorUserId: actorUser?.userId || actorUser?.id || 'SYSTEM',
      actorRole: actorUser?.role || 'SYSTEM',
      details: { areaId: area.areaId, updates: data }
    });

    return area;
  }

  static async updateAreaStatus(id, status, notesOrActor, maybeActor) {
    let reason = '';
    let actorUser = null;

    if (typeof notesOrActor === 'string') {
      reason = notesOrActor;
      actorUser = maybeActor;
    } else {
      actorUser = notesOrActor;
    }

    const validStatuses = [
      'AVAILABLE',
      'OCCUPIED',
      'CLEANING_REQUIRED',
      'CLEANING_IN_PROGRESS',
      'PENDING_INSPECTION',
      'RESTRICTED',
      'OUT_OF_SERVICE',
      'INACTIVE'
    ];
    if (!validStatuses.includes(status)) {
      throw new Error(`Invalid area status: ${status}`);
    }

    const isObjectId = mongoose.Types.ObjectId.isValid(id);
    const updateObj = { status };
    if (reason) updateObj.notes = reason;

    const area = await HousekeepingArea.findOneAndUpdate(
      isObjectId ? { $or: [{ _id: id }, { areaId: id }, { areaCode: id }] } : { $or: [{ areaId: id }, { areaCode: id }] },
      { $set: updateObj },
      { new: true }
    );
    if (!area) throw new Error(`Housekeeping area ${id} not found.`);

    await AuditService.logEvent({
      action: 'HOUSEKEEPING_AREA_STATUS_UPDATED',
      category: 'HOUSEKEEPING',
      actorUserId: actorUser?.userId || actorUser?.id || 'SYSTEM',
      actorRole: actorUser?.role || 'SYSTEM',
      details: { areaId: area.areaId, status, reason }
    });

    return area;
  }
}

module.exports = AreaService;
