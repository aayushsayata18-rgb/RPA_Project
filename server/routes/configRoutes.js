const express = require('express');
const router = express.Router();
const { getConfigurations, updateConfiguration } = require('../controllers/configController');
const { protect } = require('../middleware/auth');
const { authorizeRoles } = require('../middleware/rbac');
const { ROLES } = require('../config/roles');

router.use(protect);
router.get('/', getConfigurations);
router.put('/:configKey', authorizeRoles(ROLES.SYSTEM_ADMIN, ROLES.ADMIN_MANAGER), updateConfiguration);

module.exports = router;
