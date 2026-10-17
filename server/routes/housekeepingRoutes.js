const express = require('express');
const router = express.Router();

const { protect } = require('../middleware/auth');
const { authorizePermission } = require('../middleware/rbac');

const AreaController = require('../controllers/housekeeping/areaController');
const TaskController = require('../controllers/housekeeping/taskController');
const ScheduleController = require('../controllers/housekeeping/scheduleController');
const ChecklistController = require('../controllers/housekeeping/checklistController');
const InspectionController = require('../controllers/housekeeping/inspectionController');
const SupplyController = require('../controllers/housekeeping/supplyController');
const ExceptionController = require('../controllers/housekeeping/exceptionController');
const AnalyticsController = require('../controllers/housekeeping/analyticsController');
const RpaController = require('../controllers/housekeeping/rpaController');

// ==========================================
// 1. AREA APIs
// ==========================================
router.get('/areas', protect, AreaController.listAreas);
router.get('/areas/:id', protect, AreaController.getAreaById);
router.post('/areas', protect, authorizePermission('HOUSEKEEPING_AREA_MANAGE'), AreaController.createArea);
router.put('/areas/:id', protect, authorizePermission('HOUSEKEEPING_AREA_MANAGE'), AreaController.updateArea);
router.patch('/areas/:id/status', protect, authorizePermission('HOUSEKEEPING_AREA_MANAGE'), AreaController.updateAreaStatus);

// ==========================================
// 2. CHECKLIST APIs
// ==========================================
router.get('/checklists', protect, ChecklistController.listChecklists);
router.get('/checklists/:id', protect, ChecklistController.getChecklistById);
router.post('/checklists', protect, authorizePermission('HOUSEKEEPING_CHECKLIST_MANAGE'), ChecklistController.createChecklist);
router.put('/checklists/:id', protect, authorizePermission('HOUSEKEEPING_CHECKLIST_MANAGE'), ChecklistController.updateChecklist);

// ==========================================
// 3. SCHEDULE APIs
// ==========================================
router.get('/schedules', protect, ScheduleController.listSchedules);
router.get('/schedules/:id', protect, ScheduleController.getScheduleById);
router.post('/schedules', protect, authorizePermission('HOUSEKEEPING_SCHEDULE_MANAGE'), ScheduleController.createSchedule);
router.put('/schedules/:id', protect, authorizePermission('HOUSEKEEPING_SCHEDULE_MANAGE'), ScheduleController.updateSchedule);
router.patch('/schedules/:id/status', protect, authorizePermission('HOUSEKEEPING_SCHEDULE_MANAGE'), ScheduleController.updateScheduleStatus);

// ==========================================
// 4. TASK & TURNOVER APIs
// ==========================================
router.get('/tasks/turnover/board', protect, TaskController.getTurnoverBoard);
router.get('/tasks', protect, TaskController.listTasks);
router.get('/tasks/:id', protect, TaskController.getTaskById);
router.post('/tasks', protect, authorizePermission('HOUSEKEEPING_TASK_CREATE'), TaskController.createTask);
router.post('/tasks/turnover', protect, authorizePermission('HOUSEKEEPING_TASK_CREATE'), TaskController.triggerBedTurnover);
router.patch('/tasks/:id', protect, authorizePermission('HOUSEKEEPING_TASK_MANAGE'), TaskController.updateTask);
router.post('/tasks/:id/assign', protect, authorizePermission('HOUSEKEEPING_TASK_MANAGE'), TaskController.assignTask);
router.post('/tasks/:id/schedule', protect, authorizePermission('HOUSEKEEPING_TASK_MANAGE'), TaskController.scheduleTask);
router.post('/tasks/:id/start', protect, authorizePermission('HOUSEKEEPING_TASK_MANAGE'), TaskController.startTask);
router.post('/tasks/:id/hold', protect, authorizePermission('HOUSEKEEPING_TASK_MANAGE'), TaskController.holdTask);
router.post('/tasks/:id/complete', protect, authorizePermission('HOUSEKEEPING_TASK_MANAGE'), TaskController.completeTask);
router.post('/tasks/:id/close', protect, authorizePermission('HOUSEKEEPING_TASK_MANAGE'), TaskController.closeTask);
router.post('/tasks/:id/reopen', protect, authorizePermission('HOUSEKEEPING_TASK_MANAGE'), TaskController.reopenTask);

// ==========================================
// 5. QUALITY INSPECTION APIs
// ==========================================
router.get('/inspections', protect, authorizePermission('HOUSEKEEPING_INSPECT'), InspectionController.listInspections);
router.get('/inspections/:id', protect, authorizePermission('HOUSEKEEPING_INSPECT'), InspectionController.getInspectionById);
router.post('/inspections', protect, authorizePermission('HOUSEKEEPING_INSPECT'), InspectionController.performInspection);
router.post('/tasks/:id/inspect', protect, authorizePermission('HOUSEKEEPING_INSPECT'), (req, res, next) => {
  req.body.taskId = req.params.id;
  InspectionController.performInspection(req, res, next);
});

// ==========================================
// 6. CONSUMABLE SUPPLY APIs
// ==========================================
router.get('/supplies', protect, SupplyController.listSupplyRequests);
router.get('/supplies/:id', protect, SupplyController.getSupplyRequestById);
router.post('/supplies/request', protect, authorizePermission('HOUSEKEEPING_SUPPLY_REQUEST'), SupplyController.requestSupplies);
router.post('/supplies/:id/approve', protect, authorizePermission('HOUSEKEEPING_SUPPLY_REQUEST'), SupplyController.approveSupplyRequest);
router.post('/supplies/:id/issue', protect, authorizePermission('HOUSEKEEPING_SUPPLY_REQUEST'), SupplyController.issueSupplyRequest);
router.post('/supplies/:id/return', protect, authorizePermission('HOUSEKEEPING_SUPPLY_REQUEST'), SupplyController.returnSupplyRequest);

// ==========================================
// 7. OPERATIONAL EXCEPTION APIs
// ==========================================
router.get('/exceptions', protect, ExceptionController.listExceptions);
router.get('/exceptions/:id', protect, ExceptionController.getExceptionById);
router.post('/exceptions', protect, ExceptionController.createException);
router.patch('/exceptions/:id', protect, authorizePermission('HOUSEKEEPING_EXCEPTION_MANAGE'), ExceptionController.updateException);
router.post('/exceptions/:id/resolve', protect, authorizePermission('HOUSEKEEPING_EXCEPTION_MANAGE'), ExceptionController.resolveException);

// ==========================================
// 8. RPA AUTOMATION APIs
// ==========================================
router.post('/rpa/sync-turnovers', protect, RpaController.syncTurnovers);
router.post('/rpa/trigger', protect, RpaController.triggerRpaJob);
router.post('/rpa/tasks/:id/sync', protect, RpaController.syncExternalTaskStatus);

// ==========================================
// 9. ANALYTICS APIs
// ==========================================
router.get('/analytics/dashboard', protect, authorizePermission('HOUSEKEEPING_ANALYTICS_VIEW'), AnalyticsController.getDashboardMetrics);
router.get('/analytics/tasks', protect, authorizePermission('HOUSEKEEPING_ANALYTICS_VIEW'), AnalyticsController.getTaskAnalytics);
router.get('/analytics/sla', protect, authorizePermission('HOUSEKEEPING_ANALYTICS_VIEW'), AnalyticsController.getSlaAnalytics);
router.get('/analytics/staff', protect, authorizePermission('HOUSEKEEPING_ANALYTICS_VIEW'), AnalyticsController.getStaffAnalytics);
router.get('/analytics/turnover', protect, authorizePermission('HOUSEKEEPING_ANALYTICS_VIEW'), AnalyticsController.getTurnoverAnalytics);

module.exports = router;
