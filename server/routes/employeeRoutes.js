const express = require('express');
const router = express.Router();
const EmployeeController = require('../controllers/employeeController');
const EmployeeAccessController = require('../controllers/employeeAccessController');
const EmployeeDocumentController = require('../controllers/employeeDocumentController');
const { protect, optionalAuth } = require('../middleware/auth');
const { authorizeRoles } = require('../middleware/rbac');
const { ROLES } = require('../config/roles');

// 1. Static and Dashboard endpoints (Must precede /:id)
router.get('/dashboard/metrics', optionalAuth, EmployeeController.getDashboardMetrics);
router.post('/duplicates/check', optionalAuth, EmployeeController.checkDuplicates);

// 2. Employee Directory & Creation
router.get('/', optionalAuth, EmployeeController.getEmployees);
router.post(
  '/',
  protect,
  authorizeRoles(ROLES.HR_MANAGER, ROLES.ADMIN_MANAGER, ROLES.SYSTEM_ADMIN, ROLES.HOSPITAL_MANAGEMENT),
  EmployeeController.createEmployee
);

// 3. Single Employee Profile CRUD & Lifecycle
router.get('/:id', optionalAuth, EmployeeController.getEmployeeById);
router.put(
  '/:id',
  protect,
  authorizeRoles(ROLES.HR_MANAGER, ROLES.ADMIN_MANAGER, ROLES.SYSTEM_ADMIN),
  EmployeeController.updateEmployee
);
router.patch(
  '/:id/status',
  protect,
  authorizeRoles(ROLES.ADMIN_MANAGER, ROLES.HR_MANAGER, ROLES.SYSTEM_ADMIN, ROLES.HOSPITAL_MANAGEMENT),
  EmployeeController.updateEmployeeStatus
);

// 4. Onboarding Approval & Review
router.post(
  '/:id/submit-approval',
  protect,
  authorizeRoles(ROLES.HR_MANAGER, ROLES.ADMIN_MANAGER, ROLES.SYSTEM_ADMIN),
  EmployeeController.submitForApproval
);
router.post(
  '/:id/approve',
  protect,
  authorizeRoles(ROLES.ADMIN_MANAGER, ROLES.HR_MANAGER, ROLES.SYSTEM_ADMIN, ROLES.HOSPITAL_MANAGEMENT),
  EmployeeController.approveEmployee
);
router.post(
  '/:id/reject',
  protect,
  authorizeRoles(ROLES.ADMIN_MANAGER, ROLES.HR_MANAGER, ROLES.SYSTEM_ADMIN, ROLES.HOSPITAL_MANAGEMENT),
  EmployeeController.rejectEmployee
);
router.post(
  '/:id/return-correction',
  protect,
  authorizeRoles(ROLES.ADMIN_MANAGER, ROLES.HR_MANAGER, ROLES.SYSTEM_ADMIN),
  EmployeeController.returnForCorrection
);

// 5. Department Transfer & Role Promotion
router.post(
  '/:id/transfer',
  protect,
  authorizeRoles(ROLES.ADMIN_MANAGER, ROLES.HR_MANAGER, ROLES.SYSTEM_ADMIN),
  EmployeeController.transferEmployee
);
router.post(
  '/:id/roles',
  protect,
  authorizeRoles(ROLES.ADMIN_MANAGER, ROLES.HR_MANAGER, ROLES.SYSTEM_ADMIN),
  EmployeeController.updateRole
);

// 6. Offboarding & Termination
router.post(
  '/:id/offboard',
  protect,
  authorizeRoles(ROLES.HR_MANAGER, ROLES.ADMIN_MANAGER, ROLES.SYSTEM_ADMIN, ROLES.HOSPITAL_MANAGEMENT),
  EmployeeController.offboardEmployee
);
router.put(
  '/:id/offboard/checklist/:itemIndex',
  protect,
  authorizeRoles(ROLES.HR_MANAGER, ROLES.ADMIN_MANAGER, ROLES.SYSTEM_ADMIN),
  EmployeeController.updateOffboardingChecklist
);

// 7. Employee History & Audit
router.get('/:id/history', optionalAuth, EmployeeController.getEmployeeHistory);

// 8. Documents
router.get('/:id/documents', optionalAuth, EmployeeDocumentController.getEmployeeDocuments);
router.post(
  '/:id/documents',
  protect,
  authorizeRoles(ROLES.HR_MANAGER, ROLES.ADMIN_MANAGER, ROLES.SYSTEM_ADMIN),
  EmployeeDocumentController.addEmployeeDocument
);

// 9. Access Requests for this employee
router.get('/:id/access', optionalAuth, EmployeeAccessController.getEmployeeAccess);
router.post(
  '/:id/access-request',
  protect,
  authorizeRoles(ROLES.HR_MANAGER, ROLES.ADMIN_MANAGER, ROLES.SYSTEM_ADMIN),
  EmployeeAccessController.requestAccess
);

// 10. External System Sync
router.post(
  '/:id/sync',
  protect,
  authorizeRoles(ROLES.ADMIN_MANAGER, ROLES.HR_MANAGER, ROLES.SYSTEM_ADMIN),
  EmployeeController.syncEmployee
);
router.get('/:id/sync', optionalAuth, EmployeeController.getEmployeeSyncs);
router.post('/sync/:syncId/complete', optionalAuth, EmployeeController.completeSync);

module.exports = router;
