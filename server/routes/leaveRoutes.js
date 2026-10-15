const express = require('express');
const router = express.Router();
const LeaveController = require('../controllers/leaveController');
const {
  validateCreateLeaveType,
  validateCreatePolicy,
  validateCreateLeaveRequest,
  validateApproveRejectLeave,
  validateAdjustBalance,
  validateCancellationRequest
} = require('../validators/leaveValidators');
const { protect, optionalAuth } = require('../middleware/auth');

// 1. Leave Types
router.get('/types', optionalAuth, LeaveController.getLeaveTypes);
router.post('/types', optionalAuth, validateCreateLeaveType, LeaveController.createLeaveType);
router.get('/types/:id', optionalAuth, LeaveController.getLeaveTypeById);
router.patch('/types/:id', optionalAuth, LeaveController.updateLeaveType);

// 2. Policies
router.get('/policies', optionalAuth, LeaveController.getLeavePolicies);
router.post('/policies', optionalAuth, validateCreatePolicy, LeaveController.createLeavePolicy);
router.patch('/policies/:id', optionalAuth, LeaveController.updateLeavePolicy);

// 3. Requests
router.get('/requests', optionalAuth, LeaveController.getLeaveRequests);
router.post('/requests', optionalAuth, validateCreateLeaveRequest, LeaveController.createLeaveRequest);
router.get('/requests/:id', optionalAuth, LeaveController.getLeaveRequestById);
router.post('/requests/:id/submit', optionalAuth, LeaveController.createLeaveRequest);
router.post('/requests/:id/approve', optionalAuth, validateApproveRejectLeave, LeaveController.approveLeaveRequest);
router.post('/requests/:id/reject', optionalAuth, validateApproveRejectLeave, LeaveController.rejectLeaveRequest);
router.post('/requests/:id/withdraw', optionalAuth, validateApproveRejectLeave, LeaveController.withdrawLeaveRequest);

// 4. Cancellation
router.post('/requests/:id/cancellation', optionalAuth, validateCancellationRequest, LeaveController.requestCancellation);
router.post('/cancellations/:id/approve', optionalAuth, LeaveController.approveCancellation);
router.post('/cancellations/:id/reject', optionalAuth, LeaveController.rejectCancellation);

// 5. Balances & Ledger
router.get('/balances', optionalAuth, LeaveController.getBalances);
router.get('/balances/:employeeId', optionalAuth, LeaveController.getEmployeeBalances);
router.get('/ledger/:employeeId', optionalAuth, LeaveController.getLedger);
router.post('/balances/adjust', optionalAuth, validateAdjustBalance, LeaveController.adjustBalance);

// 6. Accrual & Carry Forward
router.post('/accrual/run', optionalAuth, LeaveController.triggerAccrual);
router.post('/carry-forward/run', optionalAuth, LeaveController.triggerCarryForward);

// 7. Reports
router.get('/reports/summary', optionalAuth, LeaveController.getSummaryReport);
router.get('/reports/usage', optionalAuth, LeaveController.getUtilizationReport);
router.get('/reports/utilization', optionalAuth, LeaveController.getUtilizationReport);
router.get('/reports/balance', optionalAuth, LeaveController.getSummaryReport);
router.get('/reports/department', optionalAuth, LeaveController.getDepartmentReport);
router.get('/reports/exceptions', optionalAuth, LeaveController.getExceptionsReport);

// 8. Holidays & Calendar
router.get('/holidays', optionalAuth, LeaveController.getHolidays);
router.post('/holidays', optionalAuth, LeaveController.createHoliday);
router.get('/calendar', optionalAuth, LeaveController.getLeaveRequests);

// 9. Employee Self Service
router.get('/me', optionalAuth, LeaveController.getMyLeave);
router.get('/me/balances', optionalAuth, LeaveController.getMyBalances);
router.post('/me/requests', optionalAuth, validateCreateLeaveRequest, LeaveController.createLeaveRequest);

// 10. RPA Automation Endpoints
router.post('/rpa/import', optionalAuth, LeaveController.rpaImportLeave);
router.post('/rpa/sync', optionalAuth, LeaveController.rpaSyncLeave);

module.exports = router;
