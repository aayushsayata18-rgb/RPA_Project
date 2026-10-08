const express = require('express');
const router = express.Router();
const { getAuditLogs } = require('../controllers/auditController');
const { protect } = require('../middleware/auth');
const { authorizeRoles } = require('../middleware/rbac');
const { ROLES } = require('../config/roles');

router.use(protect);
router.get('/', authorizeRoles(ROLES.SYSTEM_ADMIN, ROLES.ADMIN_MANAGER, ROLES.HOSPITAL_MANAGEMENT), getAuditLogs);

module.exports = router;
