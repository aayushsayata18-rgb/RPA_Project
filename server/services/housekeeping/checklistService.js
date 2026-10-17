const mongoose = require('mongoose');
const HousekeepingChecklist = require('../../models/HousekeepingChecklist');
const IdGeneratorService = require('../IdGeneratorService');
const AuditService = require('../AuditService');

class ChecklistService {
  static async createChecklist(data, actorUser) {
    const checklistId = data.checklistId || data.checklistCode || (await IdGeneratorService.generateHousekeepingChecklistId());
    const checklistCode = data.checklistCode || checklistId;

    const formattedItems = (data.items || []).map((it) => ({
      ...it,
      itemCode: it.itemCode || it.itemId || '',
      itemId: it.itemId || it.itemCode || `ITEM-${Math.floor(1000 + Math.random() * 9000)}`,
      mandatory: it.mandatory === true || String(it.mandatory).toLowerCase() === 'true' || it.required === true || String(it.required).toLowerCase() === 'true',
      required: it.required === true || String(it.required).toLowerCase() === 'true' || it.mandatory === true || String(it.mandatory).toLowerCase() === 'true'
    }));

    const checklist = new HousekeepingChecklist({
      ...data,
      checklistId,
      checklistCode,
      applicableAreaType: data.applicableAreaType || data.areaType || 'ALL',
      areaType: data.areaType || data.applicableAreaType || 'ALL',
      items: formattedItems
    });
    await checklist.save();

    await AuditService.logEvent({
      action: 'HOUSEKEEPING_CHECKLIST_CREATED',
      category: 'HOUSEKEEPING',
      actorUserId: actorUser?.userId || actorUser?.id || 'SYSTEM',
      actorRole: actorUser?.role || 'SYSTEM',
      details: { checklistId, checklistCode, title: checklist.title }
    });

    return checklist;
  }

  static async listChecklists(query = {}) {
    const filter = {};
    if (query.areaType) filter.areaType = query.areaType;
    if (query.applicableAreaType) filter.applicableAreaType = query.applicableAreaType;
    if (query.taskType) filter.taskType = query.taskType;
    if (query.active !== undefined) filter.active = query.active === 'true' || query.active === true;

    return await HousekeepingChecklist.find(filter).sort({ title: 1 }).lean();
  }

  static async getChecklistById(id) {
    const isObjectId = mongoose.Types.ObjectId.isValid(id);
    const checklist = await HousekeepingChecklist.findOne(
      isObjectId ? { $or: [{ _id: id }, { checklistId: id }, { checklistCode: id }] } : { $or: [{ checklistId: id }, { checklistCode: id }] }
    ).lean();

    if (!checklist) throw new Error(`Housekeeping checklist ${id} not found.`);
    return checklist;
  }

  static async updateChecklist(id, data, actorUser) {
    const isObjectId = mongoose.Types.ObjectId.isValid(id);
    const checklist = await HousekeepingChecklist.findOneAndUpdate(
      isObjectId ? { $or: [{ _id: id }, { checklistId: id }, { checklistCode: id }] } : { $or: [{ checklistId: id }, { checklistCode: id }] },
      { $set: data },
      { new: true }
    );
    if (!checklist) throw new Error(`Housekeeping checklist ${id} not found.`);

    await AuditService.logEvent({
      action: 'HOUSEKEEPING_CHECKLIST_UPDATED',
      category: 'HOUSEKEEPING',
      actorUserId: actorUser?.userId || actorUser?.id || 'SYSTEM',
      actorRole: actorUser?.role || 'SYSTEM',
      details: { checklistId: checklist.checklistId, updates: data }
    });

    return checklist;
  }
}

module.exports = ChecklistService;
