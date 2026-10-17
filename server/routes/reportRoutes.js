const express = require('express');
const router = express.Router();
const {
  getCatalog,
  getReportDefinition,
  executeReport,
  getExecutionStatus,
  downloadReportFile,
  listExecutions,
  getMetricTrend,
  getPeriodComparison,
  getBedDrillDown,
  getManagementInsights,
  getDataQualityAudit
} = require('../controllers/reportController');
const {
  getManagementDashboard,
  getOperationsDashboard,
  getFinanceDashboard,
  getHRDashboard,
  getRPADashboard
} = require('../controllers/dashboardController');
const {
  listKPIs,
  calculateKPIs,
  getKPITrend
} = require('../controllers/kpiController');
const {
  listSchedules,
  createSchedule,
  updateSchedule,
  listAlerts,
  acknowledgeAlert,
  resolveAlert
} = require('../controllers/reportScheduleController');
const { protect } = require('../middleware/auth');
const { authorizeRoles } = require('../middleware/rbac');
const { ROLES } = require('../config/roles');

// All reports routes require authentication
router.use(protect);

// 1. Dashboards (Section 111)
router.get('/dashboard/management', getManagementDashboard);
router.get('/dashboard/operations', getOperationsDashboard);
router.get('/dashboard/finance', getFinanceDashboard);
router.get('/dashboard/hr', getHRDashboard);
router.get('/dashboard/rpa', getRPADashboard);

// 2. KPIs (Section 112)
router.get('/kpis', listKPIs);
router.post(
  '/kpis/calculate',
  authorizeRoles(ROLES.SYSTEM_ADMIN, ROLES.ADMIN_MANAGER, ROLES.HOSPITAL_MANAGEMENT),
  calculateKPIs
);
router.get('/kpis/:code/trend', getKPITrend);

// 2b. Advanced Analytics & Surveillance (Section 69-71, 95-97, 100)
router.get('/analytics/trends', getMetricTrend);
router.get('/analytics/comparison', getPeriodComparison);
router.get('/analytics/drilldown/beds', getBedDrillDown);
router.get('/analytics/insights', getManagementInsights);
router.get('/quality/audit', getDataQualityAudit);

// 3. Executions & Downloads (Section 108 & 109)
router.get('/executions', listExecutions);
router.get('/executions/:executionId', getExecutionStatus);
router.get('/executions/:executionId/download', downloadReportFile);

// 4. Schedules (Section 110)
router.get('/schedules', listSchedules);
router.post(
  '/schedules',
  authorizeRoles(ROLES.SYSTEM_ADMIN, ROLES.ADMIN_MANAGER, ROLES.HOSPITAL_MANAGEMENT),
  createSchedule
);
router.patch(
  '/schedules/:id',
  authorizeRoles(ROLES.SYSTEM_ADMIN, ROLES.ADMIN_MANAGER, ROLES.HOSPITAL_MANAGEMENT),
  updateSchedule
);

// 5. Analytics Alerts (Section 113)
router.get('/alerts', listAlerts);
router.post(
  '/alerts/:id/acknowledge',
  authorizeRoles(ROLES.SYSTEM_ADMIN, ROLES.ADMIN_MANAGER, ROLES.HOSPITAL_MANAGEMENT),
  acknowledgeAlert
);
router.post(
  '/alerts/:id/resolve',
  authorizeRoles(ROLES.SYSTEM_ADMIN, ROLES.ADMIN_MANAGER, ROLES.HOSPITAL_MANAGEMENT),
  resolveAlert
);

// 6. Catalog Discovery & Execution (Section 106 & 107)
router.get('/', getCatalog);
router.get('/catalog', getCatalog);
router.post('/execute/:reportId', executeReport);
router.post('/:reportId/execute', executeReport);
router.post('/:reportId/run', executeReport);
router.get('/:reportId', getReportDefinition);

module.exports = router;
