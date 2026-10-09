const { authorizePermission, authorizeRoles } = require('./rbac');

module.exports = {
  checkPermission: authorizePermission,
  requirePermission: authorizePermission,
  authorizePermission,
  authorizeRoles,
  requireRoles: authorizeRoles
};
