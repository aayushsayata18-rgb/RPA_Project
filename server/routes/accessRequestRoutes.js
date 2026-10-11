const express = require('express');
const router = express.Router();
const EmployeeAccessController = require('../controllers/employeeAccessController');
const { protect, optionalAuth } = require('../middleware/auth');
const { authorizeRoles } = require('../middleware/rbac');
const { ROLES } = require('../config/roles');

// List access requests
router.get('/', optionalAuth, EmployeeAccessController.getAccessRequests);

// Create access request
router.post(
  '/',
  protect,
  authorizeRoles(ROLES.HR_MANAGER, ROLES.ADMIN_MANAGER, ROLES.SYSTEM_ADMIN),
  EmployeeAccessController.requestAccess
);

// Approve access request (Subject to separation of duties in controller)
router.post(
  '/:id/approve',
  protect,
  authorizeRoles(ROLES.SYSTEM_ADMIN, ROLES.ADMIN_MANAGER),
  EmployeeAccessController.approveAccess
);

// Reject access request
router.post(
  '/:id/reject',
  protect,
  authorizeRoles(ROLES.SYSTEM_ADMIN, ROLES.ADMIN_MANAGER),
  EmployeeAccessController.rejectAccess
);

// Provision access
router.post(
  '/:id/provision',
  protect,
  authorizeRoles(ROLES.SYSTEM_ADMIN, ROLES.ADMIN_MANAGER),
  EmployeeAccessController.provisionAccess
);

// Revoke access
router.post(
  '/:id/revoke',
  protect,
  authorizeRoles(ROLES.SYSTEM_ADMIN, ROLES.ADMIN_MANAGER),
  EmployeeAccessController.revokeAccess
);

module.exports = router;
