const express = require('express');
const router = express.Router();
const BedController = require('../controllers/bedController');
const { authMiddleware, requirePermission, requireRoles } = require('../middleware/authMiddleware');
const { PERMISSIONS } = require('../config/permissions');

router.use(authMiddleware);

router.get('/wards', requirePermission(PERMISSIONS.BED_VIEW), BedController.listWards);
router.get('/beds', requirePermission(PERMISSIONS.BED_VIEW), BedController.listBeds);
router.post('/beds/suitable', requirePermission(PERMISSIONS.BED_VIEW), BedController.findSuitableBeds);
router.post('/beds/:bedId/reserve', requirePermission(PERMISSIONS.BED_ASSIGN), BedController.reserveBed);
router.post('/beds/:bedId/release', requirePermission(PERMISSIONS.BED_ASSIGN), BedController.releaseReservation);
router.put(
  '/beds/:bedId/status',
  requireRoles(['NURSE', 'HOUSEKEEPING', 'MAINTENANCE', 'ADMIN_MANAGER', 'SYSTEM_ADMIN']),
  BedController.updateStatus
);

module.exports = router;
