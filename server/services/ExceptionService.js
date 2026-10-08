const ExceptionCase = require('../models/ExceptionCase');
const AuditService = require('./AuditService');
const { v4: uuidv4 } = require('uuid');

class ExceptionService {
  /**
   * Create an exception case when an automated or human workflow requires review (00_MASTER.md Section 39)
   */
  static async raiseException({
    module,
    entityType,
    entityId,
    rpaJobId = null,
    exceptionType,
    description,
    severity = 'MEDIUM',
    source = 'SYSTEM',
    assignedRole = 'ADMIN_MANAGER',
    metadata = {}
  }) {
    try {
      const exceptionId = `EXC-${Date.now()}-${uuidv4().substring(0, 6).toUpperCase()}`;

      const exception = new ExceptionCase({
        exceptionId,
        module,
        entityType,
        entityId: String(entityId),
        rpaJobId,
        exceptionType,
        description,
        severity,
        source,
        currentStatus: 'OPEN',
        assignedRole,
        metadata
      });

      await exception.save();

      // Log audit trail
      await AuditService.logEvent({
        action: 'EXCEPTION_RAISED',
        module,
        entityType: 'ExceptionCase',
        entityId: exceptionId,
        newValue: { exceptionType, severity, assignedRole },
        details: `Exception raised for ${entityType} ${entityId}: ${description}`
      });

      return exception;
    } catch (error) {
      console.error('[ExceptionService Error]:', error.message);
      throw error;
    }
  }

  /**
   * Resolve an open exception case with human resolution details
   */
  static async resolveException({ exceptionId, resolvedBy, resolution, userId, userRole }) {
    const exception = await ExceptionCase.findOne({ exceptionId });
    if (!exception) {
      throw new Error(`Exception case ${exceptionId} not found.`);
    }

    const previousStatus = exception.currentStatus;
    exception.currentStatus = 'RESOLVED';
    exception.resolution = resolution;
    exception.resolvedBy = resolvedBy || userId;
    exception.resolvedAt = new Date();
    await exception.save();

    await AuditService.logEvent({
      userId,
      role: userRole,
      action: 'EXCEPTION_RESOLVED',
      module: exception.module,
      entityType: 'ExceptionCase',
      entityId: exceptionId,
      oldValue: { status: previousStatus },
      newValue: { status: 'RESOLVED', resolution },
      details: `Exception resolved by ${resolvedBy}: ${resolution}`
    });

    return exception;
  }
}

module.exports = ExceptionService;
