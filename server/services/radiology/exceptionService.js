const RadiologyException = require('../../models/RadiologyException');
const IdGeneratorService = require('../IdGeneratorService');
const AuditService = require('../AuditService');

class ExceptionService {
  /**
   * List radiology exceptions with filters
   */
  static async listExceptions(filters = {}) {
    const query = {};
    if (filters.status) query.status = filters.status;
    if (filters.severity) query.severity = filters.severity;
    if (filters.type) query.type = filters.type;

    return RadiologyException.find(query)
      .populate('patientId')
      .populate('orderId')
      .sort({ createdAt: -1 })
      .lean();
  }

  /**
   * Get exception by ID or exceptionId
   */
  static async getExceptionById(idOrExceptionId) {
    const exception = await RadiologyException.findOne({
      $or: [
        { _id: String(idOrExceptionId).match(/^[0-9a-fA-F]{24}$/) ? idOrExceptionId : null },
        { exceptionId: idOrExceptionId }
      ]
    })
      .populate('patientId')
      .populate('orderId')
      .lean();

    if (!exception) {
      throw new Error('Radiology exception not found.');
    }
    return exception;
  }

  /**
   * Create an operational exception
   */
  static async createException(data, user = null) {
    const exceptionId = await IdGeneratorService.generateRadiologyExceptionId();
    const exception = new RadiologyException({
      exceptionId,
      ...data,
      source: data.source || 'MANUAL_ENTRY'
    });
    await exception.save();

    await AuditService.logAction({
      user,
      action: 'CREATE_RADIOLOGY_EXCEPTION',
      entity: 'RadiologyException',
      entityId: exception._id,
      description: `Logged operational exception ${exception.exceptionId}: ${exception.description}`
    });

    return exception;
  }

  /**
   * Resolve an operational exception
   */
  static async resolveException(idOrExceptionId, resolution = '', user = null) {
    const exception = await RadiologyException.findOne({
      $or: [
        { _id: String(idOrExceptionId).match(/^[0-9a-fA-F]{24}$/) ? idOrExceptionId : null },
        { exceptionId: idOrExceptionId }
      ]
    });

    if (!exception) {
      throw new Error('Radiology exception not found.');
    }

    exception.status = 'RESOLVED';
    exception.resolution = resolution || 'Resolved by authorized administrator';
    exception.resolvedBy = user?._id || null;
    exception.resolvedAt = new Date();
    await exception.save();

    await AuditService.logAction({
      user,
      action: 'RESOLVE_RADIOLOGY_EXCEPTION',
      entity: 'RadiologyException',
      entityId: exception._id,
      description: `Resolved exception ${exception.exceptionId}: ${resolution || 'N/A'}`
    });

    return exception;
  }
}

module.exports = ExceptionService;
