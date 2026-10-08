const ExceptionCase = require('../models/ExceptionCase');
const AuditService = require('./AuditService');
const { v4: uuidv4 } = require('uuid');

class ExceptionService {
  /**
   * Create an exception case when an automated or human workflow requires review (00_MASTER.md Section 39)
   */
  static async raiseException({
    module = 'GENERAL',
    entityType,
    entityId,
    rpaJobId = null,
    exceptionType,
    type,
    description,
    details,
    severity = 'MEDIUM',
    source = 'SYSTEM',
    assignedRole = 'ADMIN_MANAGER',
    correlationId = null,
    metadata = {}
  }) {
    try {
      const exceptionId = `EXC-${Date.now()}-${uuidv4().substring(0, 6).toUpperCase()}`;

      const finalType = exceptionType || type || 'SYSTEM_EXCEPTION';
      const finalDesc = description || details || 'Exception raised for review.';

      const exception = new ExceptionCase({
        exceptionId,
        module,
        entityType,
        entityId: String(entityId),
        rpaJobId,
        exceptionType: finalType,
        description: finalDesc,
        severity,
        source,
        currentStatus: 'OPEN',
        assignedRole,
        correlationId,
        metadata
      });

      await exception.save();

      // Log audit trail
      await AuditService.logEvent({
        action: 'EXCEPTION_RAISED',
        module,
        entityType: 'ExceptionCase',
        entityId: exceptionId,
        correlationId,
        newValue: { exceptionType: finalType, severity, assignedRole },
        details: `Exception raised for ${entityType} ${entityId}: ${finalDesc}`
      });

      return exception;
    } catch (error) {
      console.error('[ExceptionService Error]: Failed to raise exception:', error.message);
      return null;
    }
  }

  static async createExceptionCase(params) {
    return await this.raiseException(params);
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
