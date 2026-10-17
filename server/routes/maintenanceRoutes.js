const express = require('express');
const router = express.Router();

const { protect } = require('../middleware/auth');

const AssetController = require('../controllers/maintenance/assetController');
const RequestController = require('../controllers/maintenance/requestController');
const WorkOrderController = require('../controllers/maintenance/workOrderController');
const PreventiveController = require('../controllers/maintenance/preventiveController');
const ChecklistController = require('../controllers/maintenance/checklistController');
const PartsController = require('../controllers/maintenance/partsController');
const ContractController = require('../controllers/maintenance/contractController');
const CalibrationController = require('../controllers/maintenance/calibrationController');
const ExceptionController = require('../controllers/maintenance/exceptionController');
const AnalyticsController = require('../controllers/maintenance/analyticsController');
const RpaController = require('../controllers/maintenance/rpaController');

// ==========================================
// 1. ASSET MASTER & CATEGORY APIs
// ==========================================
router.get('/categories', protect, AssetController.getCategories);
router.post('/categories', protect, AssetController.createCategory);
router.get('/asset-categories', protect, AssetController.getCategories);
router.post('/asset-categories', protect, AssetController.createCategory);

router.get('/assets', protect, AssetController.getAssets);
router.post('/assets/check-duplicates', protect, AssetController.checkDuplicates);
router.get('/assets/:id', protect, AssetController.getAssetById);
router.get('/assets/:id/history', protect, AssetController.getAssetHistory);
router.post('/assets', protect, AssetController.createAsset);
router.put('/assets/:id', protect, AssetController.updateAsset);
router.patch('/assets/:id/status', protect, AssetController.updateAssetStatus);

// ==========================================
// 2. MAINTENANCE REQUEST APIs
// ==========================================
router.get('/requests', protect, RequestController.getRequests);
router.get('/requests/:id', protect, RequestController.getRequestById);
router.post('/requests', protect, RequestController.createRequest);
router.post('/requests/:id/approve', protect, RequestController.approveRequest);
router.post('/requests/:id/reject', protect, RequestController.rejectRequest);
router.post('/requests/:id/triage', protect, RequestController.triageRequest);
router.post('/requests/:id/convert', protect, RequestController.convertRequest);
router.post('/requests/:id/create-work-order', protect, RequestController.createWorkOrder);

// ==========================================
// 3. WORK ORDER APIs & CALENDAR
// ==========================================
router.get('/work-orders/calendar', protect, WorkOrderController.getCalendar);
router.get('/work-orders', protect, WorkOrderController.getWorkOrders);
router.get('/work-orders/:id', protect, WorkOrderController.getWorkOrderById);
router.post('/work-orders', protect, WorkOrderController.createWorkOrder);
router.post('/work-orders/:id/assign', protect, WorkOrderController.assignWorkOrder);
router.post('/work-orders/:id/schedule', protect, WorkOrderController.scheduleWorkOrder);
router.post('/work-orders/:id/start', protect, WorkOrderController.startWorkOrder);
router.post('/work-orders/:id/hold', protect, WorkOrderController.holdWorkOrder);
router.post('/work-orders/:id/resume', protect, WorkOrderController.resumeWorkOrder);
router.post('/work-orders/:id/complete', protect, WorkOrderController.completeWorkOrder);
router.post('/work-orders/:id/verify', protect, WorkOrderController.verifyWorkOrder);
router.post('/work-orders/:id/close', protect, WorkOrderController.closeWorkOrder);
router.post('/work-orders/:id/reopen', protect, WorkOrderController.reopenWorkOrder);

// ==========================================
// 4. PREVENTIVE MAINTENANCE APIs
// ==========================================
router.get('/preventive-plans', protect, PreventiveController.getPlans);
router.post('/preventive-plans/generate-due', protect, PreventiveController.generateDueWorkOrders);
router.get('/preventive-plans/:id', protect, PreventiveController.getPlanById);
router.post('/preventive-plans', protect, PreventiveController.createPlan);
router.put('/preventive-plans/:id', protect, PreventiveController.updatePlan);
router.post('/preventive-plans/:id/generate-work-order', protect, PreventiveController.generateWorkOrder);

// ==========================================
// 5. MAINTENANCE CHECKLIST APIs
// ==========================================
router.get('/checklists', protect, ChecklistController.getChecklists);
router.get('/checklists/:id', protect, ChecklistController.getChecklistById);
router.post('/checklists', protect, ChecklistController.createChecklist);
router.put('/checklists/:id', protect, ChecklistController.updateChecklist);

// ==========================================
// 6. SPARE PARTS & CONSUMABLES APIs
// ==========================================
router.get('/parts', protect, PartsController.getPartRequests);
router.post('/parts/request', protect, PartsController.createPartRequest);
router.post('/parts/:id/approve', protect, PartsController.approvePartRequest);
router.post('/parts/:id/issue', protect, PartsController.issuePart);
router.post('/parts/:id/return', protect, PartsController.returnPart);

router.get('/part-requests', protect, PartsController.getPartRequests);
router.post('/part-requests', protect, PartsController.createPartRequest);
router.post('/part-requests/:id/approve', protect, PartsController.approvePartRequest);
router.post('/part-requests/:id/issue', protect, PartsController.issuePart);
router.post('/part-requests/:id/return', protect, PartsController.returnPart);

// ==========================================
// 7. CONTRACTS & AMC APIs
// ==========================================
router.get('/contracts', protect, ContractController.getContracts);
router.get('/contracts/:id', protect, ContractController.getContractById);
router.post('/contracts', protect, ContractController.createContract);
router.put('/contracts/:id', protect, ContractController.updateContract);
router.post('/contracts/:id/renew', protect, ContractController.renewContract);

// ==========================================
// 8. CALIBRATION APIs
// ==========================================
router.get('/calibrations', protect, CalibrationController.getCalibrations);
router.get('/calibrations/:id', protect, CalibrationController.getCalibrationById);
router.post('/calibrations', protect, CalibrationController.createCalibration);
router.put('/calibrations/:id', protect, CalibrationController.updateCalibration);
router.post('/calibrations/:id/complete', protect, CalibrationController.completeCalibration);

// ==========================================
// 9. EXCEPTION APIs
// ==========================================
router.get('/exceptions', protect, ExceptionController.getExceptions);
router.get('/exceptions/:id', protect, ExceptionController.getExceptionById);
router.post('/exceptions', protect, ExceptionController.createException);
router.post('/exceptions/:id/resolve', protect, ExceptionController.resolveException);

// ==========================================
// 10. ANALYTICS APIs
// ==========================================
router.get('/analytics/dashboard', protect, AnalyticsController.getDashboardMetrics);
router.get('/analytics/cost', protect, AnalyticsController.getCostAnalytics);
router.get('/analytics/downtime', protect, AnalyticsController.getDowntimeAnalytics);
router.get('/analytics/mttr-mtbf', protect, AnalyticsController.getMttrMtbfAnalytics);

// ==========================================
// 11. RPA AUTOMATION & CMMS SYNC APIs
// ==========================================
router.post('/rpa/work-orders/:id/export', protect, RpaController.exportWorkOrder);
router.post('/rpa/work-orders/:id/sync', protect, RpaController.syncWorkOrderStatus);
router.post('/rpa/export-cmms', protect, RpaController.exportCmms);
router.post('/rpa/trigger-pm-dispatch', protect, RpaController.triggerPmDispatch);

module.exports = router;
