const express = require('express');
const router = express.Router();
const BedController = require('../controllers/bedController');
const { authMiddleware, requirePermission, requireRoles } = require('../middleware/authMiddleware');
const { PERMISSIONS } = require('../config/permissions');

router.use(authMiddleware);

// ==========================================
// ACCOMMODATION CATEGORIES
// ==========================================
router.get('/accommodation-categories', requirePermission(PERMISSIONS.BED_VIEW), BedController.listCategories);
router.post(
  '/accommodation-categories',
  requireRoles(['ADMIN_MANAGER', 'SYSTEM_ADMIN', 'HOSPITAL_MANAGEMENT']),
  BedController.createCategory
);
router.patch(
  '/accommodation-categories/:id',
  requireRoles(['ADMIN_MANAGER', 'SYSTEM_ADMIN']),
  BedController.updateCategory
);

// ==========================================
// WARDS & ROOMS
// ==========================================
router.get('/wards', requirePermission(PERMISSIONS.BED_VIEW), BedController.listWards);
router.get('/wards/:id', requirePermission(PERMISSIONS.BED_VIEW), BedController.getWard);
router.post(
  '/wards',
  requireRoles(['ADMIN_MANAGER', 'SYSTEM_ADMIN', 'HOSPITAL_MANAGEMENT']),
  BedController.createWard
);
router.patch(
  '/wards/:id',
  requireRoles(['ADMIN_MANAGER', 'SYSTEM_ADMIN']),
  BedController.updateWard
);

router.get('/rooms', requirePermission(PERMISSIONS.BED_VIEW), BedController.listRooms);
router.post(
  '/rooms',
  requireRoles(['ADMIN_MANAGER', 'SYSTEM_ADMIN']),
  BedController.createRoom
);

// ==========================================
// PHYSICAL BEDS & AVAILABILITY
// ==========================================
router.get('/beds/availability', requirePermission(PERMISSIONS.BED_VIEW), BedController.getAvailabilityDashboard);
router.get('/availability', requirePermission(PERMISSIONS.BED_VIEW), BedController.getAvailabilityDashboard);

router.get('/beds', requirePermission(PERMISSIONS.BED_VIEW), BedController.listBeds);
router.get('/beds/:id', requirePermission(PERMISSIONS.BED_VIEW), BedController.getBed);
router.post(
  '/beds',
  requireRoles(['ADMIN_MANAGER', 'SYSTEM_ADMIN']),
  BedController.createBed
);
router.patch(
  '/beds/:id',
  requireRoles(['ADMIN_MANAGER', 'SYSTEM_ADMIN']),
  BedController.updateBed
);

// Deterministic Bed Search Engine
router.post('/beds/search', requirePermission(PERMISSIONS.BED_VIEW), BedController.searchBeds);
router.post('/beds/suitable', requirePermission(PERMISSIONS.BED_VIEW), BedController.findSuitableBeds);
router.post('/search', requirePermission(PERMISSIONS.BED_VIEW), BedController.searchBeds);
router.post('/suitable', requirePermission(PERMISSIONS.BED_VIEW), BedController.findSuitableBeds);

// Bed Status Transitions & Controlled State Machine
router.patch('/beds/:id/status', requirePermission(PERMISSIONS.BED_STATUS_UPDATE), BedController.updateStatus);
router.put('/beds/:bedId/status', requirePermission(PERMISSIONS.BED_STATUS_UPDATE), BedController.updateStatus);

// Discharge Bed Release
router.post('/beds/:id/release', requirePermission(PERMISSIONS.BED_ASSIGN), BedController.releaseBed);
router.post('/:bedId/release', requirePermission(PERMISSIONS.BED_ASSIGN), BedController.releaseBed);

// Bed History & Audit Trail
router.get('/beds/:id/history', requirePermission(PERMISSIONS.BED_VIEW), BedController.getBedHistory);

// ==========================================
// BED RESERVATIONS
// ==========================================
router.get('/bed-reservations', requirePermission(PERMISSIONS.BED_VIEW), BedController.listReservations);
router.post('/bed-reservations', requirePermission(PERMISSIONS.BED_ASSIGN), BedController.reserveBed);
router.post('/beds/:bedId/reserve', requirePermission(PERMISSIONS.BED_ASSIGN), BedController.reserveBed);
router.post('/beds/:bedId/cancel-reservation', requirePermission(PERMISSIONS.BED_ASSIGN), BedController.releaseReservation);

// ==========================================
// BED ASSIGNMENTS
// ==========================================
router.get('/bed-assignments', requirePermission(PERMISSIONS.BED_VIEW), BedController.listAssignments);
router.post('/bed-assignments', requirePermission(PERMISSIONS.BED_ASSIGN), BedController.assignBed);

// ==========================================
// BED TRANSFERS
// ==========================================
router.post('/bed-transfers', requirePermission(PERMISSIONS.BED_TRANSFER), BedController.transferBed);

// ==========================================
// WAITING LIST
// ==========================================
router.get('/waiting-list', requirePermission(PERMISSIONS.BED_VIEW), BedController.listWaitingList);
router.post('/waiting-list', requirePermission(PERMISSIONS.BED_ASSIGN), BedController.addToWaitingList);

// ==========================================
// HOUSEKEEPING INTEGRATION
// ==========================================
router.get(
  '/housekeeping/tasks',
  requireRoles(['HOUSEKEEPING', 'NURSE', 'ADMIN_MANAGER', 'SYSTEM_ADMIN']),
  BedController.listHousekeepingTasks
);
router.post(
  '/housekeeping/complete',
  requireRoles(['HOUSEKEEPING', 'NURSE', 'ADMIN_MANAGER', 'SYSTEM_ADMIN']),
  BedController.completeCleaning
);

// ==========================================
// RECONCILIATION & RPA
// ==========================================
router.post(
  '/reconcile',
  requireRoles(['ADMIN_MANAGER', 'SYSTEM_ADMIN', 'HOSPITAL_MANAGEMENT']),
  BedController.reconcileInventory
);

module.exports = router;
