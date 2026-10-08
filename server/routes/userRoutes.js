const express = require('express');
const router = express.Router();
const { getUsers, updateUser } = require('../controllers/userController');
const { protect } = require('../middleware/auth');
const { authorizeRoles } = require('../middleware/rbac');
const { ROLES } = require('../config/roles');

router.use(protect);

router.get('/', authorizeRoles(ROLES.SYSTEM_ADMIN, ROLES.ADMIN_MANAGER, ROLES.HR_MANAGER, ROLES.HOSPITAL_MANAGEMENT), getUsers);
router.put('/:userId', authorizeRoles(ROLES.SYSTEM_ADMIN, ROLES.ADMIN_MANAGER), updateUser);

module.exports = router;
