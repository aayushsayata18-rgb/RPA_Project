const mongoose = require('mongoose');
const HousekeepingTask = require('../../models/HousekeepingTask');
const HousekeepingArea = require('../../models/HousekeepingArea');
const NotificationService = require('../NotificationService');
const AuditService = require('../AuditService');

class TaskService {
  static calculateSlaDue(priority) {
    const now = Date.now();
    switch (priority) {
      case 'STAT':
      case 'CRITICAL':
        return new Date(now + 30 * 60 * 1000);
      case 'URGENT':
      case 'HIGH':
        return new Date(now + 60 * 60 * 1000);
      case 'LOW':
        return new Date(now + 360 * 60 * 1000);
      case 'ROUTINE':
      case 'MEDIUM':
      default:
        return new Date(now + 180 * 60 * 1000);
    }
  }

  static async generateTaskId() {
    const ymd = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const rand = Math.floor(10000 + Math.random() * 90000);
    return `HK-${ymd}-${rand}`;
  }

  static async createTask(data, actorUser) {
    // Idempotency check:
    if (data.sourceModule && data.sourceEntityId && data.taskType) {
      const existing = await HousekeepingTask.findOne({
        sourceModule: data.sourceModule,
        sourceEntityId: String(data.sourceEntityId),
        taskType: data.taskType,
        status: { $nin: ['COMPLETED', 'CANCELLED', 'CLOSED'] }
      });
      if (existing) {
        return { task: existing, isExisting: true };
      }
    }

    const taskId = data.taskId || (await TaskService.generateTaskId());
    const taskNumber = data.taskNumber || taskId;
    const priority = data.priority || 'ROUTINE';
    const slaDueAt = data.slaDueAt || TaskService.calculateSlaDue(priority);

    let areaCode = data.areaCode || '';
    let areaName = data.areaName || '';
    let areaObjId = data.areaId || null;

    if (areaObjId && (!areaCode || !areaName)) {
      const area = await HousekeepingArea.findById(areaObjId).lean();
      if (area) {
        areaCode = area.areaCode || '';
        areaName = area.name || '';
      }
    }

    const task = new HousekeepingTask({
      ...data,
      taskId,
      taskNumber,
      areaId: areaObjId,
      areaCode,
      areaName,
      priority,
      slaDueAt,
      requestedByUserId: actorUser?.userId || actorUser?.id || data.requestedByUserId || 'SYSTEM',
      status: data.assignedToUserId || data.assignedToId ? 'ASSIGNED' : data.status || 'PENDING'
    });
    await task.save();

    if (areaObjId) {
      await HousekeepingArea.findByIdAndUpdate(areaObjId, {
        status: 'CLEANING_REQUIRED'
      });
    }

    await AuditService.logEvent({
      action: 'HOUSEKEEPING_TASK_CREATED',
      category: 'HOUSEKEEPING',
      actorUserId: actorUser?.userId || actorUser?.id || 'SYSTEM',
      actorRole: actorUser?.role || 'SYSTEM',
      details: { taskId, taskType: task.taskType, priority, areaId: areaObjId }
    });

    return { task, isExisting: false };
  }

  static async listTasks(query = {}) {
    const filter = {};
    if (query.status) {
      if (Array.isArray(query.status)) {
        filter.status = { $in: query.status };
      } else if (query.status.includes(',')) {
        filter.status = { $in: query.status.split(',').map((s) => s.trim()) };
      } else {
        filter.status = query.status;
      }
    }
    if (query.taskType) filter.taskType = query.taskType;
    if (query.priority) filter.priority = query.priority;
    if (query.assignedToUserId) filter.assignedToUserId = query.assignedToUserId;
    if (query.assignedToId) filter.assignedToId = query.assignedToId;
    if (query.areaId) filter.areaId = query.areaId;
    if (query.bedId) filter.bedId = query.bedId;
    if (query.sourceModule) filter.sourceModule = query.sourceModule;
    if (query.slaStatus) filter.slaStatus = query.slaStatus;

    return await HousekeepingTask.find(filter)
      .populate('areaId')
      .populate('checklistId')
      .sort({ createdAt: -1 })
      .lean();
  }

  static async getTaskById(id) {
    const isObjectId = mongoose.Types.ObjectId.isValid(id);
    const task = await HousekeepingTask.findOne(
      isObjectId ? { $or: [{ _id: id }, { taskId: id }, { taskNumber: id }] } : { $or: [{ taskId: id }, { taskNumber: id }] }
    )
      .populate('areaId')
      .populate('checklistId')
      .populate('inspectionId')
      .lean();

    if (!task) throw new Error(`Housekeeping task ${id} not found.`);
    return task;
  }

  static async updateTask(id, data, actorUser) {
    const isObjectId = mongoose.Types.ObjectId.isValid(id);
    const task = await HousekeepingTask.findOneAndUpdate(
      isObjectId ? { $or: [{ _id: id }, { taskId: id }] } : { taskId: id },
      { $set: data },
      { new: true }
    );
    if (!task) throw new Error(`Housekeeping task ${id} not found.`);

    await AuditService.logEvent({
      action: 'HOUSEKEEPING_TASK_UPDATED',
      category: 'HOUSEKEEPING',
      actorUserId: actorUser?.userId || actorUser?.id || 'SYSTEM',
      actorRole: actorUser?.role || 'SYSTEM',
      details: { taskId: task.taskId, updates: data }
    });

    return task;
  }

  static async assignTask(id, assignmentData, actorUser) {
    const { assignedTo, assignedToId, assignedToUserId, assignedToName, assignedVendorId } = assignmentData;
    const isObjectId = mongoose.Types.ObjectId.isValid(id);
    const task = await HousekeepingTask.findOne(
      isObjectId ? { $or: [{ _id: id }, { taskId: id }] } : { taskId: id }
    );
    if (!task) throw new Error(`Housekeeping task ${id} not found.`);

    if (assignedTo !== undefined) task.assignedTo = assignedTo;
    task.assignedToId = assignedToId || assignedToUserId || task.assignedToId;
    task.assignedToUserId = assignedToUserId || assignedToId || task.assignedToUserId;
    task.assignedToName = assignedToName || task.assignedToName;
    if (assignedVendorId !== undefined) task.assignedVendorId = assignedVendorId;
    task.status = 'ASSIGNED';
    await task.save();

    await AuditService.logEvent({
      action: 'HOUSEKEEPING_TASK_ASSIGNED',
      category: 'HOUSEKEEPING',
      actorUserId: actorUser?.userId || actorUser?.id || 'SYSTEM',
      actorRole: actorUser?.role || 'SYSTEM',
      details: { taskId: task.taskId, assignedToId: task.assignedToId, assignedToName: task.assignedToName }
    });

    return task;
  }

  static async scheduleTask(id, scheduleData, actorUser) {
    const { scheduledStart, scheduledEnd } = scheduleData;
    const isObjectId = mongoose.Types.ObjectId.isValid(id);
    const task = await HousekeepingTask.findOne(
      isObjectId ? { $or: [{ _id: id }, { taskId: id }] } : { taskId: id }
    );
    if (!task) throw new Error(`Housekeeping task ${id} not found.`);

    task.scheduledStart = scheduledStart ? new Date(scheduledStart) : task.scheduledStart;
    task.scheduledEnd = scheduledEnd ? new Date(scheduledEnd) : task.scheduledEnd;
    task.status = 'SCHEDULED';
    await task.save();

    await AuditService.logEvent({
      action: 'HOUSEKEEPING_TASK_SCHEDULED',
      category: 'HOUSEKEEPING',
      actorUserId: actorUser?.userId || actorUser?.id || 'SYSTEM',
      actorRole: actorUser?.role || 'SYSTEM',
      details: { taskId: task.taskId, scheduledStart, scheduledEnd }
    });

    return task;
  }

  static async startTask(id, optionsOrData, actorUser) {
    const isObjectId = mongoose.Types.ObjectId.isValid(id);
    const task = await HousekeepingTask.findOne(
      isObjectId ? { $or: [{ _id: id }, { taskId: id }] } : { taskId: id }
    );
    if (!task) throw new Error(`Housekeeping task ${id} not found.`);

    task.status = 'IN_PROGRESS';
    task.actualStart = new Date();
    await task.save();

    if (task.areaId) {
      await HousekeepingArea.findByIdAndUpdate(task.areaId, {
        status: 'CLEANING_IN_PROGRESS'
      });
    }

    await AuditService.logEvent({
      action: 'HOUSEKEEPING_TASK_STARTED',
      category: 'HOUSEKEEPING',
      actorUserId: actorUser?.userId || actorUser?.id || 'SYSTEM',
      actorRole: actorUser?.role || 'SYSTEM',
      details: { taskId: task.taskId, actualStart: task.actualStart }
    });

    return task;
  }

  static async holdTask(id, holdData, actorUser) {
    const isObjectId = mongoose.Types.ObjectId.isValid(id);
    const task = await HousekeepingTask.findOne(
      isObjectId ? { $or: [{ _id: id }, { taskId: id }] } : { taskId: id }
    );
    if (!task) throw new Error(`Housekeeping task ${id} not found.`);

    task.status = 'ON_HOLD';
    task.notes = holdData?.reason ? `${task.notes || ''} [ON HOLD: ${holdData.reason}]` : task.notes;
    await task.save();

    await AuditService.logEvent({
      action: 'HOUSEKEEPING_TASK_HOLD',
      category: 'HOUSEKEEPING',
      actorUserId: actorUser?.userId || actorUser?.id || 'SYSTEM',
      actorRole: actorUser?.role || 'SYSTEM',
      details: { taskId: task.taskId, reason: holdData?.reason }
    });

    return task;
  }

  static async completeTask(id, completionData, actorUser) {
    const { completionNotes, checklistResponses = [] } = completionData || {};
    const isObjectId = mongoose.Types.ObjectId.isValid(id);
    const task = await HousekeepingTask.findOne(
      isObjectId ? { $or: [{ _id: id }, { taskId: id }] } : { taskId: id }
    );
    if (!task) throw new Error(`Housekeeping task ${id} not found.`);

    task.actualEnd = new Date();
    task.completionNotes = completionNotes || task.completionNotes || '';
    if (checklistResponses.length > 0) {
      task.checklistResponses = checklistResponses;
      task.checklistCompleted = true;
    }

    task.status = 'COMPLETED';
    task.inspectionStatus = task.inspectionRequired ? 'PENDING' : 'NOT_REQUIRED';
    await task.save();

    if (task.areaId) {
      await HousekeepingArea.findByIdAndUpdate(task.areaId, {
        status: 'PENDING_INSPECTION'
      });
    }

    await AuditService.logEvent({
      action: 'HOUSEKEEPING_TASK_COMPLETED',
      category: 'HOUSEKEEPING',
      actorUserId: actorUser?.userId || actorUser?.id || 'SYSTEM',
      actorRole: actorUser?.role || 'SYSTEM',
      details: { taskId: task.taskId, status: task.status, inspectionRequired: task.inspectionRequired }
    });

    return task;
  }

  static async closeTask(id, closeData, actorUser) {
    const isObjectId = mongoose.Types.ObjectId.isValid(id);
    const task = await HousekeepingTask.findOne(
      isObjectId ? { $or: [{ _id: id }, { taskId: id }] } : { taskId: id }
    );
    if (!task) throw new Error(`Housekeeping task ${id} not found.`);

    task.status = 'CLOSED';
    if (closeData?.closingNotes) task.closingNotes = closeData.closingNotes;
    await task.save();

    if (task.areaId) {
      await HousekeepingArea.findByIdAndUpdate(task.areaId, {
        status: 'AVAILABLE'
      });
    }

    await AuditService.logEvent({
      action: 'HOUSEKEEPING_TASK_CLOSED',
      category: 'HOUSEKEEPING',
      actorUserId: actorUser?.userId || actorUser?.id || 'SYSTEM',
      actorRole: actorUser?.role || 'SYSTEM',
      details: { taskId: task.taskId }
    });

    return task;
  }

  static async reopenTask(id, reopenData, actorUser) {
    const { reason = 'Task reopened for rework' } = reopenData || {};
    const isObjectId = mongoose.Types.ObjectId.isValid(id);
    const task = await HousekeepingTask.findOne(
      isObjectId ? { $or: [{ _id: id }, { taskId: id }] } : { taskId: id }
    );
    if (!task) throw new Error(`Housekeeping task ${id} not found.`);

    task.status = 'REOPENED';
    task.reopenCount = (task.reopenCount || 0) + 1;
    task.reopenReason = reason;
    await task.save();

    if (task.areaId) {
      await HousekeepingArea.findByIdAndUpdate(task.areaId, {
        status: 'CLEANING_REQUIRED'
      });
    }

    await AuditService.logEvent({
      action: 'HOUSEKEEPING_TASK_REOPENED',
      category: 'HOUSEKEEPING',
      actorUserId: actorUser?.userId || actorUser?.id || 'SYSTEM',
      actorRole: actorUser?.role || 'SYSTEM',
      details: { taskId: task.taskId, reason }
    });

    return task;
  }
}

module.exports = TaskService;
