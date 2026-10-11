const express = require('express');
const router = express.Router({ mergeParams: true });
const DoctorScheduleController = require('../controllers/doctorScheduleController');
const { protect, optionalAuth } = require('../middleware/auth');
const { authorizeRoles } = require('../middleware/rbac');
const { ROLES } = require('../config/roles');

router.get('/', optionalAuth, DoctorScheduleController.getSchedules);
router.post(
  '/',
  protect,
  authorizeRoles(ROLES.ADMIN_MANAGER, ROLES.SYSTEM_ADMIN, ROLES.HR_MANAGER),
  DoctorScheduleController.createSchedule
);
router.put(
  '/:scheduleId',
  protect,
  authorizeRoles(ROLES.ADMIN_MANAGER, ROLES.SYSTEM_ADMIN, ROLES.HR_MANAGER),
  DoctorScheduleController.updateSchedule
);
router.delete(
  '/:scheduleId',
  protect,
  authorizeRoles(ROLES.ADMIN_MANAGER, ROLES.SYSTEM_ADMIN, ROLES.HR_MANAGER),
  DoctorScheduleController.cancelSchedule
);
router.post('/check-conflict', optionalAuth, DoctorScheduleController.checkConflict);

module.exports = router;
