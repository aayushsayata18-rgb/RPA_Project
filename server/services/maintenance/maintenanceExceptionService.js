const MaintenanceException = require('../../models/MaintenanceException');
const IdGeneratorService = require('../IdGeneratorService');
const AuditService = require('../AuditService');

class MaintenanceExceptionService {
  /**
   * Log/Create Exception
   */
  static async createException(data, userId) {
    const payload = { ...data };
    if (!payload.exceptionId) {
      payload.exceptionId = await IdGeneratorService.generateMaintenanceExceptionId();
    }

    if (payload.exceptionType && !payload.type) {
      payload.type = payload.exceptionType;
    }
    if (payload.type && !payload.exceptionType) {
      payload.exceptionType = payload.type;
    }
    if (payload.title && !payload.description) {
      payload.description = payload.title;
    }
    if (!payload.title && payload.description) {
      payload.title = payload.description.slice(0, 80);
    }

    if (!payload.assignedTo && userId) {
      payload.assignedTo = userId;
    }

    const ex = new MaintenanceException(payload);
    await ex.save();

    await AuditService.logEvent({
      action: 'MAINTENANCE_EXCEPTION_CREATED',
      module: 'MAINTENANCE',
      entityId: ex.exceptionId,
      performedBy: userId,
      details: {
        exceptionId: ex.exceptionId,
        type: ex.type,
        severity: ex.severity,
        description: ex.description
      }
    });

    return ex;
  }

  /**
   * Get all exceptions
   */
  static async getExceptions(query = {}) {
    const { status, severity, type, page = 1, limit = 20 } = query;
    const filter = {};
    if (status) filter.status = status;
    if (severity) filter.severity = severity;
    if (type) filter.type = type;

    const skip = (Math.max(1, parseInt(page, 10)) - 1) * parseInt(limit, 10);
    const take = parseInt(limit, 10);

    const [items, total] = await Promise.all([
      MaintenanceException.find(filter)
        .populate('assetId', 'name assetId assetTag status')
        .populate('requestId', 'requestId title priority')
        .populate('workOrderId', 'workOrderId priority status')
        .populate('assignedTo', 'firstName lastName')
        .populate('resolvedBy', 'firstName lastName')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(take)
        .lean(),
      MaintenanceException.countDocuments(filter)
    ]);

    return {
      items,
      total,
      page: parseInt(page, 10),
      totalPages: Math.ceil(total / take) || 1
    };
  }

  /**
   * Get exception by ID
   */
  static async getExceptionById(id) {
    const isMongoId = id.match(/^[0-9a-fA-F]{24}$/);
    const query = isMongoId ? { _id: id } : { exceptionId: id };

    const ex = await MaintenanceException.findOne(query)
      .populate('assetId')
      .populate('requestId')
      .populate('workOrderId')
      .populate('assignedTo')
      .populate('resolvedBy')
      .lean();

    if (!ex) {
      const err = new Error('Maintenance exception not found');
      err.statusCode = 404;
      throw err;
    }

    return ex;
  }

  /**
   * Resolve Exception
   */
  static async resolveException(id, { resolution }, userId) {
    const isMongoId = id.match(/^[0-9a-fA-F]{24}$/);
    const query = isMongoId ? { _id: id } : { exceptionId: id };

    const ex = await MaintenanceException.findOne(query);
    if (!ex) {
      const err = new Error('Maintenance exception not found');
      err.statusCode = 404;
      throw err;
    }

    ex.status = 'RESOLVED';
    ex.resolution = resolution || 'Resolved by maintenance supervisor';
    ex.resolvedBy = userId;
    ex.resolvedAt = new Date();
    await ex.save();

    await AuditService.logEvent({
      action: 'MAINTENANCE_EXCEPTION_RESOLVED',
      module: 'MAINTENANCE',
      entityId: ex.exceptionId,
      performedBy: userId,
      details: { exceptionId: ex.exceptionId, resolution }
    });

    return ex;
  }
}

module.exports = MaintenanceExceptionService;
