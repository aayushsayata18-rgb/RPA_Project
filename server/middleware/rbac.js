const { ROLE_PERMISSIONS } = require('../config/permissions');
const { ROLES } = require('../config/roles');

// Role checking middleware
const authorizeRoles = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required.',
        errorCode: 'UNAUTHENTICATED'
      });
    }

    if (req.user.role === ROLES.SYSTEM_ADMIN || allowedRoles.includes(req.user.role)) {
      return next();
    }

    return res.status(403).json({
      success: false,
      message: `Access denied. Role '${req.user.role}' is not authorized to access this resource.`,
      errorCode: 'FORBIDDEN_ROLE'
    });
  };
};

// Granular permission checking middleware
const authorizePermission = (...requiredPermissions) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required.',
        errorCode: 'UNAUTHENTICATED'
      });
    }

    // System Admin bypasses granular checks
    if (req.user.role === ROLES.SYSTEM_ADMIN) {
      return next();
    }

    const rolePerms = ROLE_PERMISSIONS[req.user.role] || [];
    const customPerms = req.user.customPermissions || [];
    const allUserPerms = new Set([...rolePerms, ...customPerms]);

    const hasPermission = requiredPermissions.every((perm) => allUserPerms.has(perm));

    if (hasPermission) {
      return next();
    }

    return res.status(403).json({
      success: false,
      message: `Access denied. Missing required permission(s): ${requiredPermissions.join(', ')}`,
      errorCode: 'FORBIDDEN_INSUFFICIENT_PERMISSIONS'
    });
  };
};

module.exports = {
  authorizeRoles,
  authorizePermission
};
