const { protect, optionalAuth } = require('./auth');
const { authorizeRoles, authorizePermission } = require('./rbac');

module.exports = {
  authMiddleware: protect,
  authenticateToken: protect,
  protect,
  optionalAuth,
  requireRoles: authorizeRoles,
  authorizeRoles,
  requirePermission: authorizePermission,
  authorizePermission
};
