const express = require('express');
const router = express.Router();
const PayrollController = require('../controllers/payrollController');
const {
  validateCreatePeriod,
  validateAssignSalary,
  validateCreateSalaryStructure,
  validatePayrollQuery
} = require('../validators/payrollValidators');
const { protect, optionalAuth } = require('../middleware/auth');

// ==========================================
// 1. PAYROLL PERIODS
// ==========================================
router.get('/periods', optionalAuth, PayrollController.listPeriods);
router.post('/periods', optionalAuth, validateCreatePeriod, PayrollController.createPeriod);
router.get('/periods/:id', optionalAuth, PayrollController.getPeriodById);
router.post('/periods/:id/open', optionalAuth, PayrollController.openPeriod);
router.post('/periods/:id/lock', optionalAuth, PayrollController.lockInputs);
router.post('/periods/:id/validate', optionalAuth, PayrollController.validatePeriod);
router.post('/periods/:id/submit-review', optionalAuth, PayrollController.submitForReview);
router.post('/periods/:id/approve', optionalAuth, PayrollController.approvePeriod);
router.post('/periods/:id/process', optionalAuth, PayrollController.processPeriod);
router.post('/periods/:id/finalize', optionalAuth, PayrollController.finalizePeriod);

// ==========================================
// 2. PAYROLL INPUTS
// ==========================================
router.post('/periods/:id/generate-inputs', optionalAuth, PayrollController.generateInputs);
router.get('/periods/:id/inputs', optionalAuth, PayrollController.getInputsForPeriod);
router.get('/inputs/:id', optionalAuth, PayrollController.getInputById);

// ==========================================
// 3. SALARY CONFIGURATION & ASSIGNMENT
// ==========================================
router.get('/salary-structures', optionalAuth, PayrollController.listSalaryStructures);
router.post('/salary-structures', optionalAuth, validateCreateSalaryStructure, PayrollController.createSalaryStructure);
router.post('/salaries/assign', optionalAuth, validateAssignSalary, PayrollController.assignSalary);
router.get('/salaries/history/:employeeId', optionalAuth, PayrollController.getEmployeeSalaryHistory);

// ==========================================
// 4. OVERTIME
// ==========================================
router.get('/overtime', optionalAuth, PayrollController.listOvertime);
router.post('/overtime', optionalAuth, PayrollController.createOvertime);
router.post('/overtime/:id/approve', optionalAuth, PayrollController.approveOvertime);
router.post('/overtime/:id/reject', optionalAuth, PayrollController.rejectOvertime);

// ==========================================
// 5. RESULTS & RECONCILIATION
// ==========================================
router.get('/periods/:id/results', optionalAuth, PayrollController.getResultsForPeriod);
router.post('/periods/:id/reconcile', optionalAuth, PayrollController.reconcileInternal);
router.post('/periods/:id/reconcile-external', optionalAuth, PayrollController.reconcileExternal);

// ==========================================
// 6. PAYSLIPS
// ==========================================
router.post('/periods/:id/generate-payslips', optionalAuth, PayrollController.generatePayslips);
router.get('/payslips', optionalAuth, PayrollController.listPayslips);
router.get('/payslips/:id', optionalAuth, PayrollController.getPayslipById);

// ==========================================
// 7. PAYROLL QUERIES
// ==========================================
router.get('/queries', optionalAuth, PayrollController.listQueries);
router.post('/queries', optionalAuth, validatePayrollQuery, PayrollController.submitQuery);
router.post('/queries/:id/resolve', optionalAuth, PayrollController.resolveQuery);

// ==========================================
// 8. EMPLOYEE SELF-SERVICE (/api/me/payroll)
// ==========================================
router.get('/me', optionalAuth, PayrollController.getMyPayroll);
router.get('/me/payslips', optionalAuth, PayrollController.getMyPayslips);
router.get('/me/queries', optionalAuth, PayrollController.getMyQueries);
router.post('/me/queries', optionalAuth, validatePayrollQuery, PayrollController.submitMyQuery);

module.exports = router;
