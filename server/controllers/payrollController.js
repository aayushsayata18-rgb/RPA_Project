const PayrollPeriodService = require('../services/payrollPeriodService');
const PayrollInputService = require('../services/payrollInputService');
const PayrollValidationService = require('../services/payrollValidationService');
const PayrollProcessingService = require('../services/payrollProcessingService');
const PayrollReconciliationService = require('../services/payrollReconciliationService');
const PayslipService = require('../services/payslipService');
const PayrollQueryService = require('../services/payrollQueryService');
const SalaryConfigurationService = require('../services/salaryConfigurationService');
const PayrollInput = require('../models/PayrollInput');
const PayrollResult = require('../models/PayrollResult');
const Payslip = require('../models/Payslip');
const OvertimeRecord = require('../models/OvertimeRecord');
const Employee = require('../models/Employee');
const IdGeneratorService = require('../services/IdGeneratorService');
const AuditService = require('../services/AuditService');

class PayrollController {
  // ==========================================
  // 1. PERIODS
  // ==========================================

  static async createPeriod(req, res, next) {
    try {
      const period = await PayrollPeriodService.createPeriod(req.body, req.user);
      return res.status(201).json({
        success: true,
        message: 'Payroll period created successfully',
        period
      });
    } catch (err) {
      next(err);
    }
  }

  static async listPeriods(req, res, next) {
    try {
      const { status, frequency } = req.query;
      const filter = {};
      if (status) filter.status = status;
      if (frequency) filter.frequency = frequency;

      const periods = await PayrollPeriodService.listPeriods(filter);
      return res.json({
        success: true,
        count: periods.length,
        periods
      });
    } catch (err) {
      next(err);
    }
  }

  static async getPeriodById(req, res, next) {
    try {
      const period = await PayrollPeriodService.getPeriodById(req.params.id);
      return res.json({
        success: true,
        period
      });
    } catch (err) {
      next(err);
    }
  }

  static async openPeriod(req, res, next) {
    try {
      const period = await PayrollPeriodService.openPeriod(req.params.id, req.user);
      return res.json({
        success: true,
        message: `Payroll period ${period.periodCode} opened successfully`,
        period
      });
    } catch (err) {
      next(err);
    }
  }

  static async lockInputs(req, res, next) {
    try {
      const period = await PayrollPeriodService.lockInputs(req.params.id, req.user, req.body.reason);
      return res.json({
        success: true,
        message: `Inputs locked for payroll period ${period.periodCode}`,
        period
      });
    } catch (err) {
      next(err);
    }
  }

  static async validatePeriod(req, res, next) {
    try {
      const report = await PayrollValidationService.validatePeriod(req.params.id, req.user);
      return res.json(report);
    } catch (err) {
      next(err);
    }
  }

  static async submitForReview(req, res, next) {
    try {
      const period = await PayrollPeriodService.submitForReview(req.params.id, req.user, req.body.notes);
      return res.json({
        success: true,
        message: `Payroll period submitted for approval`,
        period
      });
    } catch (err) {
      next(err);
    }
  }

  static async approvePeriod(req, res, next) {
    try {
      const enforceSegregation = req.body.enforceSegregation !== false;
      const period = await PayrollPeriodService.approvePeriod(req.params.id, req.user, req.body.notes, enforceSegregation);
      return res.json({
        success: true,
        message: `Payroll period approved successfully`,
        period
      });
    } catch (err) {
      next(err);
    }
  }

  static async processPeriod(req, res, next) {
    try {
      const result = await PayrollProcessingService.executePayrollRun(req.params.id, req.user, req.body);
      return res.json(result);
    } catch (err) {
      next(err);
    }
  }

  static async finalizePeriod(req, res, next) {
    try {
      const period = await PayrollPeriodService.finalizePeriod(req.params.id, req.user);
      return res.json({
        success: true,
        message: `Payroll period finalized and permanently locked`,
        period
      });
    } catch (err) {
      next(err);
    }
  }

  // ==========================================
  // 2. INPUTS
  // ==========================================

  static async generateInputs(req, res, next) {
    try {
      const result = await PayrollInputService.generateInputsForPeriod(req.params.id, req.user, req.body);
      return res.json({
        success: true,
        message: 'Payroll inputs generated successfully',
        ...result
      });
    } catch (err) {
      next(err);
    }
  }

  static async getInputsForPeriod(req, res, next) {
    try {
      const period = await PayrollPeriodService.getPeriodById(req.params.id);
      const { status, employeeIdCode } = req.query;
      const filter = { payrollPeriodId: period._id };
      if (status) filter.status = status;
      if (employeeIdCode) filter.employeeIdCode = employeeIdCode;

      const inputs = await PayrollInput.find(filter).sort({ 'employeeSnapshot.employeeName': 1 });
      return res.json({
        success: true,
        count: inputs.length,
        periodCode: period.periodCode,
        inputs
      });
    } catch (err) {
      next(err);
    }
  }

  static async getInputById(req, res, next) {
    try {
      const input = await PayrollInput.findById(req.params.id);
      if (!input) {
        return res.status(404).json({ success: false, message: 'Payroll input not found' });
      }
      return res.json({ success: true, input });
    } catch (err) {
      next(err);
    }
  }

  // ==========================================
  // 3. SALARY CONFIGURATION
  // ==========================================

  static async createSalaryStructure(req, res, next) {
    try {
      const structure = await SalaryConfigurationService.createSalaryStructure(req.body, req.user);
      return res.status(201).json({
        success: true,
        message: 'Salary structure configured successfully',
        structure
      });
    } catch (err) {
      next(err);
    }
  }

  static async listSalaryStructures(req, res, next) {
    try {
      const structures = await SalaryConfigurationService.listSalaryStructures();
      return res.json({
        success: true,
        count: structures.length,
        structures
      });
    } catch (err) {
      next(err);
    }
  }

  static async assignSalary(req, res, next) {
    try {
      const assignment = await SalaryConfigurationService.assignSalary(req.body, req.user);
      return res.status(201).json({
        success: true,
        message: 'Salary assigned to employee successfully',
        assignment
      });
    } catch (err) {
      next(err);
    }
  }

  static async getEmployeeSalaryHistory(req, res, next) {
    try {
      const history = await SalaryConfigurationService.getEmployeeSalaryHistory(req.params.employeeId);
      return res.json({
        success: true,
        count: history.length,
        history
      });
    } catch (err) {
      next(err);
    }
  }

  // ==========================================
  // 4. OVERTIME
  // ==========================================

  static async listOvertime(req, res, next) {
    try {
      const { status, employeeIdCode } = req.query;
      const filter = {};
      if (status) filter.status = status;
      if (employeeIdCode) filter.employeeIdCode = employeeIdCode;

      const records = await OvertimeRecord.find(filter).sort({ date: -1 });
      return res.json({
        success: true,
        count: records.length,
        records
      });
    } catch (err) {
      next(err);
    }
  }

  static async createOvertime(req, res, next) {
    try {
      const { employeeId, employeeIdCode, date, candidateMinutes, requestedMinutes, reason, attendanceId, payrollPeriodId } = req.body;

      let emp = null;
      if (employeeId) emp = await Employee.findById(employeeId);
      else if (employeeIdCode) emp = await Employee.findOne({ employeeId: employeeIdCode });

      if (!emp) {
        return res.status(404).json({ success: false, message: 'Employee not found' });
      }

      const overtimeId = await IdGeneratorService.generateOvertimeId();
      const ot = new OvertimeRecord({
        overtimeId,
        employeeId: emp._id,
        employeeIdCode: emp.employeeId,
        date: date ? new Date(date) : new Date(),
        candidateMinutes: candidateMinutes || requestedMinutes || 60,
        requestedMinutes: requestedMinutes || candidateMinutes || 60,
        approvedMinutes: 0,
        reason: reason || 'Shift overtime support',
        status: 'PENDING',
        requestedBy: req.user?.userId || req.user?.name || emp.employeeId,
        attendanceId: attendanceId || null,
        payrollPeriodId: payrollPeriodId || null
      });

      await ot.save();
      return res.status(201).json({ success: true, overtime: ot });
    } catch (err) {
      next(err);
    }
  }

  static async approveOvertime(req, res, next) {
    try {
      const ot = await OvertimeRecord.findById(req.params.id);
      if (!ot) {
        return res.status(404).json({ success: false, message: 'Overtime record not found' });
      }

      const approvedMinutes = req.body.approvedMinutes !== undefined ? req.body.approvedMinutes : ot.requestedMinutes;
      ot.approvedMinutes = Math.min(approvedMinutes, ot.candidateMinutes);
      ot.status = 'APPROVED';
      ot.approvedBy = req.user?.userId || req.user?.name || 'SUPERVISOR';
      ot.approvedAt = new Date();
      await ot.save();

      return res.json({
        success: true,
        message: 'Overtime record approved successfully',
        overtime: ot
      });
    } catch (err) {
      next(err);
    }
  }

  static async rejectOvertime(req, res, next) {
    try {
      const ot = await OvertimeRecord.findById(req.params.id);
      if (!ot) {
        return res.status(404).json({ success: false, message: 'Overtime record not found' });
      }

      ot.status = 'REJECTED';
      ot.rejectionReason = req.body.reason || 'Operational review rejection';
      ot.approvedBy = req.user?.userId || req.user?.name || 'SUPERVISOR';
      await ot.save();

      return res.json({
        success: true,
        message: 'Overtime record rejected',
        overtime: ot
      });
    } catch (err) {
      next(err);
    }
  }

  // ==========================================
  // 5. RESULTS & RECONCILIATION
  // ==========================================

  static async getResultsForPeriod(req, res, next) {
    try {
      const period = await PayrollPeriodService.getPeriodById(req.params.id);
      const results = await PayrollResult.find({ payrollPeriodId: period._id });
      return res.json({
        success: true,
        count: results.length,
        periodCode: period.periodCode,
        results
      });
    } catch (err) {
      next(err);
    }
  }

  static async reconcileInternal(req, res, next) {
    try {
      const report = await PayrollReconciliationService.reconcileInternal(req.params.id);
      return res.json(report);
    } catch (err) {
      next(err);
    }
  }

  static async reconcileExternal(req, res, next) {
    try {
      const report = await PayrollReconciliationService.reconcileExternal(
        req.params.id,
        req.body,
        req.body.correlationId
      );
      return res.json(report);
    } catch (err) {
      next(err);
    }
  }

  // ==========================================
  // 6. PAYSLIPS
  // ==========================================

  static async generatePayslips(req, res, next) {
    try {
      const result = await PayslipService.generatePayslipsForPeriod(req.params.id, req.user);
      return res.json(result);
    } catch (err) {
      next(err);
    }
  }

  static async listPayslips(req, res, next) {
    try {
      const { periodCode, employeeIdCode } = req.query;
      const filter = {};
      if (periodCode) filter.periodCode = periodCode;
      if (employeeIdCode) filter.employeeIdCode = employeeIdCode;

      const payslips = await Payslip.find(filter).sort({ periodCode: -1 });
      return res.json({
        success: true,
        count: payslips.length,
        payslips
      });
    } catch (err) {
      next(err);
    }
  }

  static async getPayslipById(req, res, next) {
    try {
      const ipAddress = req.ip || req.headers['x-forwarded-for'];
      const payslip = await PayslipService.viewPayslip(req.params.id, req.user, ipAddress);
      return res.json({
        success: true,
        payslip
      });
    } catch (err) {
      next(err);
    }
  }

  // ==========================================
  // 7. PAYROLL QUERIES
  // ==========================================

  static async submitQuery(req, res, next) {
    try {
      const query = await PayrollQueryService.submitQuery(req.body, req.user);
      return res.status(201).json({
        success: true,
        message: 'Payroll query submitted successfully',
        query
      });
    } catch (err) {
      next(err);
    }
  }

  static async listQueries(req, res, next) {
    try {
      const { status, category, employeeIdCode } = req.query;
      const filter = {};
      if (status) filter.status = status;
      if (category) filter.category = category;
      if (employeeIdCode) filter.employeeIdCode = employeeIdCode;

      const queries = await PayrollQueryService.listQueries(filter);
      return res.json({
        success: true,
        count: queries.length,
        queries
      });
    } catch (err) {
      next(err);
    }
  }

  static async resolveQuery(req, res, next) {
    try {
      const query = await PayrollQueryService.resolveQuery(req.params.id, req.body.resolution, req.user);
      return res.json({
        success: true,
        message: 'Payroll query resolved successfully',
        query
      });
    } catch (err) {
      next(err);
    }
  }

  // ==========================================
  // 8. EMPLOYEE SELF-SERVICE (/api/me/payroll)
  // ==========================================

  static async getMyPayroll(req, res, next) {
    try {
      const empId = req.user?.employeeId || req.user?.id;
      const emp = await Employee.findOne({ $or: [{ employeeId: empId }, { _id: req.user?._id }] });

      if (!emp) {
        return res.status(404).json({ success: false, message: 'Employee profile not found' });
      }

      const payslips = await PayslipService.getEmployeePayslips(emp._id);
      const queries = await PayrollQuery.find({ employeeId: emp._id }).sort({ createdAt: -1 });

      return res.json({
        success: true,
        employee: {
          employeeId: emp.employeeId,
          name: `${emp.firstName || ''} ${emp.lastName || ''}`.trim() || emp.name,
          department: emp.departmentName || 'General',
          designation: emp.designation
        },
        recentPayslips: payslips.slice(0, 6),
        openQueries: queries.filter(q => q.status === 'OPEN')
      });
    } catch (err) {
      next(err);
    }
  }

  static async getMyPayslips(req, res, next) {
    try {
      const empId = req.user?.employeeId || req.user?.id;
      const emp = await Employee.findOne({ $or: [{ employeeId: empId }, { _id: req.user?._id }] });

      if (!emp) {
        return res.status(404).json({ success: false, message: 'Employee profile not found' });
      }

      const payslips = await PayslipService.getEmployeePayslips(emp._id);
      return res.json({
        success: true,
        count: payslips.length,
        payslips
      });
    } catch (err) {
      next(err);
    }
  }

  static async getMyQueries(req, res, next) {
    try {
      const empId = req.user?.employeeId || req.user?.id;
      const emp = await Employee.findOne({ $or: [{ employeeId: empId }, { _id: req.user?._id }] });

      if (!emp) {
        return res.status(404).json({ success: false, message: 'Employee profile not found' });
      }

      const queries = await PayrollQuery.find({ employeeId: emp._id }).sort({ createdAt: -1 });
      return res.json({
        success: true,
        count: queries.length,
        queries
      });
    } catch (err) {
      next(err);
    }
  }

  static async submitMyQuery(req, res, next) {
    try {
      const empId = req.user?.employeeId || req.user?.id;
      const emp = await Employee.findOne({ $or: [{ employeeId: empId }, { _id: req.user?._id }] });

      if (!emp) {
        return res.status(404).json({ success: false, message: 'Employee profile not found' });
      }

      const queryData = {
        ...req.body,
        employeeId: emp._id,
        employeeIdCode: emp.employeeId
      };

      const query = await PayrollQueryService.submitQuery(queryData, req.user);
      return res.status(201).json({
        success: true,
        message: 'Query submitted successfully',
        query
      });
    } catch (err) {
      next(err);
    }
  }
}

module.exports = PayrollController;
