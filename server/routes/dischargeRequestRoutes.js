const express = require('express');
const router = express.Router();
const DischargeRequestController = require('../controllers/dischargeRequestController');
const { authenticateToken } = require('../middleware/auth');
const { requirePermission } = require('../middleware/permission');
const { PERMISSIONS } = require('../config/permissions');

router.use(authenticateToken);

router.get('/', requirePermission(PERMISSIONS.DISCHARGE_VIEW), DischargeRequestController.listRequests);
router.post('/', requirePermission(PERMISSIONS.DISCHARGE_REQUEST), DischargeRequestController.createRequest);
router.get('/:id', requirePermission(PERMISSIONS.DISCHARGE_VIEW), DischargeRequestController.getRequestById);
router.post('/:id/cancel', requirePermission(PERMISSIONS.DISCHARGE_REQUEST), DischargeRequestController.cancelRequest);

module.exports = router;
