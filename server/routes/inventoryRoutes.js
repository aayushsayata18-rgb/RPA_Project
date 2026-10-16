const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { authorizeRoles } = require('../middleware/rbac');
const { ROLES } = require('../config/roles');

const InventoryItemController = require('../controllers/inventoryItemController');
const BatchController = require('../controllers/batchController');
const StockController = require('../controllers/stockController');
const ReservationController = require('../controllers/reservationController');
const TransferController = require('../controllers/transferController');
const AdjustmentController = require('../controllers/adjustmentController');
const StockCountController = require('../controllers/stockCountController');
const ReconciliationController = require('../controllers/reconciliationController');
const AlertController = require('../controllers/alertController');
const StockLocationController = require('../controllers/stockLocationController');

const {
  validateItemPayload,
  validateBatchPayload,
  validateReservationPayload,
  validateIssuePayload,
  validateTransferPayload,
  validateAdjustmentPayload
} = require('../validators/inventory/inventoryValidator');

// Protect all inventory endpoints
router.use(protect);

// Allow staff members involved in inventory, pharmacy, clinical care, procurement, and administration:
const INVENTORY_READ_ROLES = [
  ROLES.SYSTEM_ADMIN,
  ROLES.ADMIN_MANAGER,
  ROLES.HOSPITAL_MANAGEMENT,
  ROLES.PROCUREMENT_OFFICER,
  ROLES.PHARMACIST,
  ROLES.DOCTOR,
  ROLES.NURSE,
  ROLES.LAB_TECHNICIAN,
  ROLES.RADIOLOGY_TECHNICIAN
];

const INVENTORY_OPERATIONS_ROLES = [
  ROLES.SYSTEM_ADMIN,
  ROLES.ADMIN_MANAGER,
  ROLES.HOSPITAL_MANAGEMENT,
  ROLES.PROCUREMENT_OFFICER,
  ROLES.PHARMACIST
];

const INVENTORY_APPROVAL_ROLES = [
  ROLES.SYSTEM_ADMIN,
  ROLES.ADMIN_MANAGER,
  ROLES.HOSPITAL_MANAGEMENT
];

// ==========================================
// 1. Inventory Items Master
// ==========================================
router.get('/items', authorizeRoles(...INVENTORY_READ_ROLES), InventoryItemController.getItems);
router.get('/items/:id', authorizeRoles(...INVENTORY_READ_ROLES), InventoryItemController.getItemById);
router.post(
  '/items',
  authorizeRoles(...INVENTORY_OPERATIONS_ROLES),
  validateItemPayload,
  InventoryItemController.createItem
);
router.put(
  '/items/:id',
  authorizeRoles(...INVENTORY_OPERATIONS_ROLES),
  InventoryItemController.updateItem
);
router.patch(
  '/items/:id/status',
  authorizeRoles(...INVENTORY_OPERATIONS_ROLES),
  InventoryItemController.changeStatus
);

// ==========================================
// 2. Locations Master
// ==========================================
router.get('/locations', authorizeRoles(...INVENTORY_READ_ROLES), StockLocationController.getLocations);
router.get('/locations/:id', authorizeRoles(...INVENTORY_READ_ROLES), StockLocationController.getLocationById);
router.post(
  '/locations',
  authorizeRoles(...INVENTORY_OPERATIONS_ROLES),
  StockLocationController.createLocation
);
router.put(
  '/locations/:id',
  authorizeRoles(...INVENTORY_OPERATIONS_ROLES),
  StockLocationController.updateLocation
);

// ==========================================
// 3. Batches / Lots
// ==========================================
router.get('/batches', authorizeRoles(...INVENTORY_READ_ROLES), BatchController.getBatches);
router.get('/batches/:id', authorizeRoles(...INVENTORY_READ_ROLES), BatchController.getBatchById);
router.post(
  '/batches',
  authorizeRoles(...INVENTORY_OPERATIONS_ROLES),
  validateBatchPayload,
  BatchController.createBatch
);
router.patch(
  '/batches/:id/status',
  authorizeRoles(...INVENTORY_OPERATIONS_ROLES),
  BatchController.updateStatus
);

// ==========================================
// 4. Stock Availability & Movements
// ==========================================
router.get('/availability/:inventoryItemId', authorizeRoles(...INVENTORY_READ_ROLES), StockController.getAvailability);
router.get('/movements', authorizeRoles(...INVENTORY_READ_ROLES), StockController.getMovements);
router.get('/dashboard/kpis', authorizeRoles(...INVENTORY_READ_ROLES), StockController.getDashboardKPIs);

// ==========================================
// 5. Stock Issues & Goods Receipts
// ==========================================
router.post(
  '/issues',
  authorizeRoles(...INVENTORY_OPERATIONS_ROLES),
  validateIssuePayload,
  StockController.issueStock
);
router.post(
  '/goods-receipts',
  authorizeRoles(...INVENTORY_OPERATIONS_ROLES),
  StockController.processGoodsReceipt
);
router.get(
  '/goods-receipts',
  authorizeRoles(...INVENTORY_READ_ROLES),
  StockController.getGoodsReceipts
);
router.get(
  '/goods-receipts/:id',
  authorizeRoles(...INVENTORY_READ_ROLES),
  StockController.getGoodsReceiptById
);

// ==========================================
// 6. Reservations
// ==========================================
router.post(
  '/reservations',
  authorizeRoles(...INVENTORY_OPERATIONS_ROLES, ROLES.DOCTOR, ROLES.NURSE),
  validateReservationPayload,
  ReservationController.createReservation
);
router.get('/reservations', authorizeRoles(...INVENTORY_READ_ROLES), ReservationController.getReservations);
router.post(
  '/reservations/:id/release',
  authorizeRoles(...INVENTORY_OPERATIONS_ROLES, ROLES.DOCTOR, ROLES.NURSE),
  ReservationController.releaseReservation
);

// ==========================================
// 7. Transfers
// ==========================================
router.post(
  '/transfers',
  authorizeRoles(...INVENTORY_OPERATIONS_ROLES),
  validateTransferPayload,
  TransferController.requestTransfer
);
router.get('/transfers', authorizeRoles(...INVENTORY_READ_ROLES), TransferController.getTransfers);
router.get('/transfers/:id', authorizeRoles(...INVENTORY_READ_ROLES), TransferController.getTransferById);
router.post(
  '/transfers/:id/approve',
  authorizeRoles(...INVENTORY_APPROVAL_ROLES),
  TransferController.approveTransfer
);
router.post(
  '/transfers/:id/dispatch',
  authorizeRoles(...INVENTORY_OPERATIONS_ROLES),
  TransferController.dispatchTransfer
);
router.post(
  '/transfers/:id/receive',
  authorizeRoles(...INVENTORY_OPERATIONS_ROLES),
  TransferController.receiveTransfer
);

// ==========================================
// 8. Adjustments
// ==========================================
router.post(
  '/adjustments',
  authorizeRoles(...INVENTORY_OPERATIONS_ROLES),
  validateAdjustmentPayload,
  AdjustmentController.createAdjustment
);
router.get('/adjustments', authorizeRoles(...INVENTORY_READ_ROLES), AdjustmentController.getAdjustments);
router.post(
  '/adjustments/:id/approve',
  authorizeRoles(...INVENTORY_APPROVAL_ROLES),
  AdjustmentController.approveAdjustment
);
router.post(
  '/adjustments/:id/process',
  authorizeRoles(...INVENTORY_APPROVAL_ROLES),
  AdjustmentController.processAdjustment
);

// ==========================================
// 9. Stock Counts
// ==========================================
router.post(
  '/counts',
  authorizeRoles(...INVENTORY_OPERATIONS_ROLES),
  StockCountController.startCountSession
);
router.get('/counts', authorizeRoles(...INVENTORY_READ_ROLES), StockCountController.getCountSessions);
router.get('/counts/:id', authorizeRoles(...INVENTORY_READ_ROLES), StockCountController.getCountSessionById);
router.post(
  '/counts/:id/counts',
  authorizeRoles(...INVENTORY_OPERATIONS_ROLES),
  StockCountController.submitCounts
);
router.post(
  '/counts/:id/approve',
  authorizeRoles(...INVENTORY_APPROVAL_ROLES),
  StockCountController.approveAndPost
);

// ==========================================
// 10. Reconciliation
// ==========================================
router.post(
  '/reconciliations',
  authorizeRoles(...INVENTORY_OPERATIONS_ROLES),
  ReconciliationController.runReconciliation
);
router.get('/reconciliations', authorizeRoles(...INVENTORY_READ_ROLES), ReconciliationController.getReconciliations);
router.get('/reconciliations/:id', authorizeRoles(...INVENTORY_READ_ROLES), ReconciliationController.getReconciliationById);
router.post(
  '/reconciliations/:id/resolve',
  authorizeRoles(...INVENTORY_APPROVAL_ROLES),
  ReconciliationController.resolveDiscrepancy
);

// ==========================================
// 11. Alerts & Expiry Scanning
// ==========================================
router.get('/alerts', authorizeRoles(...INVENTORY_READ_ROLES), AlertController.getAlerts);
router.post(
  '/alerts/scan-low-stock',
  authorizeRoles(...INVENTORY_OPERATIONS_ROLES),
  AlertController.scanLowStock
);
router.post(
  '/alerts/scan-expiry',
  authorizeRoles(...INVENTORY_OPERATIONS_ROLES),
  AlertController.scanExpiry
);
router.patch(
  '/alerts/:id/status',
  authorizeRoles(...INVENTORY_OPERATIONS_ROLES),
  AlertController.updateStatus
);

module.exports = router;
