const express = require('express');
const router = express.Router();
const ShiftController = require('../controllers/shiftController');
const {
  validateCreateShift,
  validateCreateRoster,
  validateCreateAssignment,
  validateChangeRequest,
  validateSwapRequest
} = require('../validators/shiftValidators');
const { protect, optionalAuth } = require('../middleware/auth');
const { authorizeRoles } = require('../middleware/rbac');
const { ROLES } = require('../config/roles');

// 1. Shift Definitions
router.get('/definitions', optionalAuth, ShiftController.getShifts);
router.post('/definitions', optionalAuth, validateCreateShift, ShiftController.createShift);
router.get('/definitions/:id', optionalAuth, ShiftController.getShiftById);
router.patch('/definitions/:id', optionalAuth, ShiftController.updateShift);
router.post('/definitions/:id/archive', optionalAuth, ShiftController.archiveShift);

// 2. Rosters
router.get('/rosters', optionalAuth, ShiftController.getRosters);
router.post('/rosters', optionalAuth, validateCreateRoster, ShiftController.createRoster);
router.get('/rosters/:id', optionalAuth, ShiftController.getRosterById);
router.get('/rosters/:id/calendar', optionalAuth, ShiftController.getRosterCalendar);
router.post('/rosters/:id/submit', optionalAuth, ShiftController.submitRoster);
router.post('/rosters/:id/approve', optionalAuth, ShiftController.approveRoster);
router.post('/rosters/:id/publish', optionalAuth, ShiftController.publishRoster);
router.post('/rosters/:id/lock', optionalAuth, ShiftController.lockRoster);

// 3. Shift Assignments
router.get('/assignments', optionalAuth, ShiftController.getAssignments);
router.post('/assignments', optionalAuth, validateCreateAssignment, ShiftController.createAssignment);
router.patch('/assignments/:id', optionalAuth, ShiftController.updateAssignment);
router.post('/assignments/batch', optionalAuth, ShiftController.batchImport);
router.post('/assignments/import', optionalAuth, ShiftController.batchImport);

// 4. Employee Self-Service
router.get('/my-schedule', optionalAuth, ShiftController.getMySchedule);

// 5. Shift Change Requests
router.get('/change-requests', optionalAuth, ShiftController.getChangeRequests);
router.post('/change-requests', optionalAuth, validateChangeRequest, ShiftController.createChangeRequest);
router.post('/change-requests/:id/approve', optionalAuth, ShiftController.approveChangeRequest);
router.post('/change-requests/:id/reject', optionalAuth, ShiftController.rejectChangeRequest);

// 6. Shift Swap Requests
router.get('/swap-requests', optionalAuth, ShiftController.getSwapRequests);
router.post('/swap-requests', optionalAuth, validateSwapRequest, ShiftController.createSwapRequest);
router.post('/swap-requests/:id/accept', optionalAuth, ShiftController.acceptSwapTarget);
router.post('/swap-requests/:id/target-reject', optionalAuth, ShiftController.rejectSwapTarget);
router.post('/swap-requests/:id/approve', optionalAuth, ShiftController.approveSwap);
router.post('/swap-requests/:id/reject', optionalAuth, ShiftController.rejectSwap);

// 7. Conflicts
router.get('/conflicts', optionalAuth, ShiftController.getConflicts);
router.post('/conflicts/:id/resolve', optionalAuth, ShiftController.resolveConflict);
router.post('/conflicts/detect', optionalAuth, ShiftController.detectConflicts);

// 8. Department Staffing Coverage & Reports
router.get('/coverage', optionalAuth, ShiftController.getCoverage);
router.get('/reports/coverage', optionalAuth, ShiftController.getCoverage);
router.get('/reports/employee-schedule', optionalAuth, ShiftController.getEmployeeScheduleReport);
router.get('/reports/employee-schedule/csv', optionalAuth, ShiftController.exportScheduleCsv);
router.get('/reports/utilization', optionalAuth, ShiftController.getShiftUtilizationReport);

// 9. RPA Automation Integration
router.post('/rpa/sync', optionalAuth, ShiftController.rpaSyncRoster);
router.post('/rpa/import-roster', optionalAuth, ShiftController.batchImport);

module.exports = router;
