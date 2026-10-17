const mongoose = require('mongoose');
const HousekeepingSchedule = require('../../models/HousekeepingSchedule');
const HousekeepingArea = require('../../models/HousekeepingArea');
const IdGeneratorService = require('../IdGeneratorService');
const AuditService = require('../AuditService');

class ScheduleService {
  static async createSchedule(data, actorUser) {
    const scheduleId = data.scheduleId || data.scheduleCode || (await IdGeneratorService.generateHousekeepingScheduleId());
    const scheduleCode = data.scheduleCode || scheduleId;
    
    let areaName = data.areaName || '';
    if (data.areaId && !areaName) {
      const area = await HousekeepingArea.findById(data.areaId).lean();
      if (area) areaName = area.name;
    }

    const nextDueDate = data.nextDueDate || data.startDate || new Date();

    const schedule = new HousekeepingSchedule({
      ...data,
      scheduleId,
      scheduleCode,
      areaName,
      nextDueDate,
      status: data.status || 'ACTIVE'
    });
    await schedule.save();

    await AuditService.logEvent({
      action: 'HOUSEKEEPING_SCHEDULE_CREATED',
      category: 'HOUSEKEEPING',
      actorUserId: actorUser?.userId || actorUser?.id || 'SYSTEM',
      actorRole: actorUser?.role || 'SYSTEM',
      details: { scheduleId, scheduleCode, areaId: schedule.areaId, frequency: schedule.frequency }
    });

    return schedule;
  }

  static async listSchedules(query = {}) {
    const filter = {};
    if (query.areaId) filter.areaId = query.areaId;
    if (query.frequency) filter.frequency = query.frequency;
    if (query.status) filter.status = query.status;
    if (query.active !== undefined) filter.active = query.active === 'true' || query.active === true;

    return await HousekeepingSchedule.find(filter).sort({ nextDueDate: 1 }).lean();
  }

  static async getScheduleById(id) {
    const isObjectId = mongoose.Types.ObjectId.isValid(id);
    const schedule = await HousekeepingSchedule.findOne(
      isObjectId ? { $or: [{ _id: id }, { scheduleId: id }, { scheduleCode: id }] } : { $or: [{ scheduleId: id }, { scheduleCode: id }] }
    ).lean();

    if (!schedule) throw new Error(`Housekeeping schedule ${id} not found.`);
    return schedule;
  }

  static async updateSchedule(id, data, actorUser) {
    const isObjectId = mongoose.Types.ObjectId.isValid(id);
    const schedule = await HousekeepingSchedule.findOneAndUpdate(
      isObjectId ? { $or: [{ _id: id }, { scheduleId: id }, { scheduleCode: id }] } : { $or: [{ scheduleId: id }, { scheduleCode: id }] },
      { $set: data },
      { new: true }
    );
    if (!schedule) throw new Error(`Housekeeping schedule ${id} not found.`);

    await AuditService.logEvent({
      action: 'HOUSEKEEPING_SCHEDULE_UPDATED',
      category: 'HOUSEKEEPING',
      actorUserId: actorUser?.userId || actorUser?.id || 'SYSTEM',
      actorRole: actorUser?.role || 'SYSTEM',
      details: { scheduleId: schedule.scheduleId, updates: data }
    });

    return schedule;
  }

  static async updateScheduleStatus(id, activeOrStatus, actorUser) {
    const isObjectId = mongoose.Types.ObjectId.isValid(id);
    const updateObj = {};
    if (typeof activeOrStatus === 'boolean') {
      updateObj.active = activeOrStatus;
      updateObj.status = activeOrStatus ? 'ACTIVE' : 'INACTIVE';
    } else {
      updateObj.status = activeOrStatus;
      updateObj.active = activeOrStatus === 'ACTIVE';
    }

    const schedule = await HousekeepingSchedule.findOneAndUpdate(
      isObjectId ? { $or: [{ _id: id }, { scheduleId: id }, { scheduleCode: id }] } : { $or: [{ scheduleId: id }, { scheduleCode: id }] },
      { $set: updateObj },
      { new: true }
    );
    if (!schedule) throw new Error(`Housekeeping schedule ${id} not found.`);

    await AuditService.logEvent({
      action: 'HOUSEKEEPING_SCHEDULE_STATUS_UPDATED',
      category: 'HOUSEKEEPING',
      actorUserId: actorUser?.userId || actorUser?.id || 'SYSTEM',
      actorRole: actorUser?.role || 'SYSTEM',
      details: { scheduleId: schedule.scheduleId, status: schedule.status, active: schedule.active }
    });

    return schedule;
  }
}

module.exports = ScheduleService;
