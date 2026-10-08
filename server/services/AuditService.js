const AuditEvent = require('../models/AuditEvent');
const { v4: uuidv4 } = require('uuid');

class AuditService {
  /**
   * Log an audit event across any module (00_MASTER.md Section 41 & 69)
   */
  static async logEvent({
    userId = 'SYSTEM',
    userEmail = null,
    role = 'SYSTEM',
    action,
    module,
    entityType,
    entityId,
    oldValue = null,
    newValue = null,
    ipAddress = null,
    userAgent = null,
    correlationId = null,
    rpaJobId = null,
    status = 'SUCCESS',
    details = ''
  }) {
    try {
      const eventId = `AUD-${Date.now()}-${uuidv4().substring(0, 8).toUpperCase()}`;

      const event = new AuditEvent({
        eventId,
        userId,
        userEmail,
        role,
        action,
        module,
        entityType,
        entityId: String(entityId),
        oldValue,
        newValue,
        ipAddress,
        userAgent,
        correlationId: correlationId || eventId,
        rpaJobId,
        status,
        details
      });

      await event.save();
      return event;
    } catch (error) {
      console.error('[AuditService Error]: Failed to persist audit event:', error.message);
      // Non-blocking failure so business operations do not crash
      return null;
    }
  }

  /**
   * Query audit history for a specific entity or module
   */
  static async getHistory({ module, entityType, entityId, limit = 50, page = 1 }) {
    const query = {};
    if (module) query.module = module;
    if (entityType) query.entityType = entityType;
    if (entityId) query.entityId = String(entityId);

    const skip = (page - 1) * limit;
    const [events, total] = await Promise.all([
      AuditEvent.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      AuditEvent.countDocuments(query)
    ]);

    return { events, total, page, totalPages: Math.ceil(total / limit) };
  }
}

module.exports = AuditService;
