const AuditEvent = require('../models/AuditEvent');

// @desc    Get audit logs with comprehensive filtering
// @route   GET /api/audit
// @access  Private (Admin / Management)
exports.getAuditLogs = async (req, res, next) => {
  try {
    const { module, action, entityType, entityId, userId, status, page = 1, limit = 50 } = req.query;
    const query = {};

    if (module) query.module = module;
    if (action) query.action = action;
    if (entityType) query.entityType = entityType;
    if (entityId) query.entityId = entityId;
    if (userId) query.userId = userId;
    if (status) query.status = status;

    const skip = (page - 1) * limit;
    const [events, total] = await Promise.all([
      AuditEvent.find(query).sort({ createdAt: -1 }).skip(skip).limit(Number(limit)).lean(),
      AuditEvent.countDocuments(query)
    ]);

    res.json({
      success: true,
      data: {
        events,
        total,
        page: Number(page),
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    next(error);
  }
};
