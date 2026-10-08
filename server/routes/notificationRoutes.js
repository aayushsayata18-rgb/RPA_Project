const express = require('express');
const router = express.Router();
const { getMyNotifications, markAsRead, sendNotification } = require('../controllers/notificationController');
const { protect } = require('../middleware/auth');
const { authorizeRoles } = require('../middleware/rbac');
const { ROLES } = require('../config/roles');

router.use(protect);
router.get('/', getMyNotifications);
router.put('/:notificationId/read', markAsRead);
router.post('/send', authorizeRoles(ROLES.SYSTEM_ADMIN, ROLES.ADMIN_MANAGER), sendNotification);

module.exports = router;
