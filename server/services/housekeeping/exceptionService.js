const mongoose = require('mongoose');
const HousekeepingException = require('../../models/HousekeepingException');
const IdGeneratorService = require('../IdGeneratorService');
const AuditService = require('../AuditService');

class ExceptionService {
  static async createException(data, actorUser) {
    const exceptionId = data.exceptionId || (await IdGeneratorService.generateHousekeepingExceptionId());
    const exceptionType = data.exceptionType || data.type || 'GENERAL_EXCEPTION';

    const exception = new HousekeepingException({
      ...data,
      exceptionId,
      type: exceptionType,
      exceptionType,
      source: data.source || 'HOUSEKEEPING_MODULE',
      status: 'OPEN'
    });
    await exception.save();

    await AuditService.logEvent({
      action: 'HOUSEKEEPING_EXCEPTION_CREATED',
      category: 'HOUSEKEEPING',
      actorUserId: actorUser?.userId || actorUser?.id || 'SYSTEM',
      actorRole: actorUser?.role || 'SYSTEM',
      details: { exceptionId, type: exception.type, severity: exception.severity }
    });

    return exception;
  }

  static async listExceptions(query = {}) {
    const filter = {};
    if (query.status) filter.status = query.status;
    if (query.severity) filter.severity = query.severity;
    if (query.type) filter.type = query.type;
    if (query.exceptionType) filter.exceptionType = query.exceptionType;
    if (query.taskId) filter.taskId = query.taskId;

    return await HousekeepingException.find(filter)
      .populate('taskId')
      .populate('areaId')
      .sort({ createdAt: -1 })
      .lean();
  }

  static async getExceptionById(id) {
    const isObjectId = mongoose.Types.ObjectId.isValid(id);
    const exception = await HousekeepingException.findOne(
      isObjectId ? { $or: [{ _id: id }, { exceptionId: id }] } : { exceptionId: id }
    )
      .populate('taskId')
      .populate('areaId')
      .lean();

    if (!exception) throw new Error(`Housekeeping exception ${id} not found.`);
    return exception;
  }

  static async updateException(id, data, actorUser) {
    const isObjectId = mongoose.Types.ObjectId.isValid(id);
    const exception = await HousekeepingException.findOneAndUpdate(
      isObjectId ? { $or: [{ _id: id }, { exceptionId: id }] } : { exceptionId: id },
      { $set: data },
      { new: true }
    );
    if (!exception) throw new Error(`Housekeeping exception ${id} not found.`);

    await AuditService.logEvent({
      action: 'HOUSEKEEPING_EXCEPTION_UPDATED',
      category: 'HOUSEKEEPING',
      actorUserId: actorUser?.userId || actorUser?.id || 'SYSTEM',
      actorRole: actorUser?.role || 'SYSTEM',
      details: { exceptionId: exception.exceptionId, updates: data }
    });

    return exception;
  }

  static async resolveException(id, resolutionData, actorUser) {
    const {
      resolution = '',
      resolutionNotes = '',
      correctiveActionTaken = '',
      resolvedBy = '',
      resolvedById = '',
      notes = ''
    } = resolutionData || {};

    const isObjectId = mongoose.Types.ObjectId.isValid(id);
    const exception = await HousekeepingException.findOne(
      isObjectId ? { $or: [{ _id: id }, { exceptionId: id }] } : { exceptionId: id }
    );
    if (!exception) throw new Error(`Housekeeping exception ${id} not found.`);

    exception.status = 'RESOLVED';
    exception.resolution = resolution || resolutionNotes || 'Resolved';
    exception.resolutionNotes = resolutionNotes || resolution || 'Resolved';
    exception.correctiveActionTaken = correctiveActionTaken;
    exception.resolvedBy = resolvedBy || actorUser?.name || 'Supervisor';
    exception.resolvedById = resolvedById || actorUser?.userId || actorUser?.id || 'SUPERVISOR';
    exception.resolvedByUserId = exception.resolvedById;
    exception.resolvedAt = new Date();
    if (notes) exception.notes = `${exception.notes || ''} [RESOLVED: ${notes}]`;
    await exception.save();

    await AuditService.logEvent({
      action: 'HOUSEKEEPING_EXCEPTION_RESOLVED',
      category: 'HOUSEKEEPING',
      actorUserId: actorUser?.userId || actorUser?.id || 'SYSTEM',
      actorRole: actorUser?.role || 'SYSTEM',
      details: { exceptionId: exception.exceptionId, resolution: exception.resolution }
    });

    return exception;
  }
}

module.exports = ExceptionService;
