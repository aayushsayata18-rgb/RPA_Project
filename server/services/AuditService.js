const AuditEvent = require('../models/AuditEvent');
const { v4: uuidv4 } = require('uuid');

class AuditService {
  /**
   * Log an audit event across any module (00_MASTER.md Section 41 & 69)
   */
  static async logEvent({
    userId = 'SYSTEM',
    actorUserId = null,
    userEmail = null,
    role = 'SYSTEM',
    actorRole = null,
    action,
    module = null,
    category = null,
    entityType = null,
    entityId = null,
    patientId = null,
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

      const resolvedDetails = typeof details === 'object' && details !== null ? JSON.stringify(details) : String(details || '');
      const resolvedModule = module || category || 'ADMISSION';
      const resolvedEntityType = entityType || (category ? String(category) : 'ADMISSION');
      const resolvedEntityId = String(entityId || patientId || 'SYSTEM');

      const event = new AuditEvent({
        eventId,
        userId: actorUserId || userId || 'SYSTEM',
        userEmail,
        role: actorRole || role || 'SYSTEM',
        action,
        module: resolvedModule,
        entityType: resolvedEntityType,
        entityId: resolvedEntityId,
        oldValue,
        newValue,
        ipAddress,
        userAgent,
        correlationId: correlationId || eventId,
        rpaJobId,
        status,
        details: resolvedDetails
      });

      await event.save();
      return event;
    } catch (error) {
      console.error('[AuditService Error]: Failed to persist audit event:', error.message);
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
