const express = require('express');
const router = express.Router({ mergeParams: true });
const DoctorAvailabilityController = require('../controllers/doctorAvailabilityController');
const { protect, optionalAuth } = require('../middleware/auth');
const { authorizeRoles } = require('../middleware/rbac');
const { ROLES } = require('../config/roles');

router.get('/dashboard', optionalAuth, DoctorAvailabilityController.getAvailabilityDashboard);
router.get('/', optionalAuth, DoctorAvailabilityController.getDoctorAvailability);
router.post(
  '/',
  protect,
  authorizeRoles(ROLES.ADMIN_MANAGER, ROLES.SYSTEM_ADMIN, ROLES.HR_MANAGER, ROLES.DOCTOR),
  DoctorAvailabilityController.recordAvailability
);
router.put(
  '/:availabilityId',
  protect,
  authorizeRoles(ROLES.ADMIN_MANAGER, ROLES.SYSTEM_ADMIN, ROLES.HR_MANAGER, ROLES.DOCTOR),
  DoctorAvailabilityController.updateAvailability
);

module.exports = router;
