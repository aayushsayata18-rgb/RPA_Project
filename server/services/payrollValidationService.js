const PayrollPeriod = require('../models/PayrollPeriod');
const PayrollInput = require('../models/PayrollInput');
const Employee = require('../models/Employee');
const EmployeeSalaryAssignment = require('../models/EmployeeSalaryAssignment');
const ExceptionService = require('./ExceptionService');
const AuditService = require('./AuditService');

class PayrollValidationService {
  /**
   * Run Comprehensive Pre-Check Validation on a Payroll Period
   */
  static async validatePeriod(periodIdOrCode, actorUser) {
    let period;
    const str = String(periodIdOrCode || '');
    if (/^[0-9a-fA-F]{24}$/.test(str)) {
      period = await PayrollPeriod.findById(periodIdOrCode);
    } else {
      period = await PayrollPeriod.findOne({ periodCode: periodIdOrCode });
    }

    if (!period) {
      throw new Error(`Payroll period '${periodIdOrCode}' not found`);
    }

    const inputs = await PayrollInput.find({ payrollPeriodId: period._id });
    if (inputs.length === 0) {
      throw new Error('No payroll inputs found for this period. Generate inputs first.');
    }

    const errors = [];
    const warnings = [];
    let validCount = 0;

    for (const input of inputs) {
      const emp = await Employee.findById(input.employeeId);
      let empHasError = false;

      // 1. Employee existence and active check
      if (!emp) {
        errors.push({
          employeeIdCode: input.employeeIdCode,
          employeeName: input.employeeSnapshot?.employeeName || 'Unknown',
          code: 'EMPLOYEE_NOT_FOUND',
          message: `Employee ${input.employeeIdCode} does not exist in Staff database`,
          severity: 'ERROR'
        });
        empHasError = true;
      } else if (emp.status === 'TERMINATED') {
        warnings.push({
          employeeIdCode: input.employeeIdCode,
          employeeName: `${emp.firstName} ${emp.lastName}`,
          code: 'EMPLOYEE_TERMINATED',
          message: `Employee ${input.employeeIdCode} is terminated. Ensure exit settlement applies.`,
          severity: 'WARNING'
        });
      }

      // 2. Salary assignment validation
      const salaryAssignment = await EmployeeSalaryAssignment.findOne({
        employeeId: input.employeeId,
        status: { $in: ['ACTIVE', 'SUPERSEDED'] },
        effectiveFrom: { $lte: period.endDate },
        $or: [{ effectiveTo: null }, { effectiveTo: { $gte: period.startDate } }]
      });

      if (!salaryAssignment) {
        const errorItem = {
          employeeIdCode: input.employeeIdCode,
          employeeName: input.employeeSnapshot?.employeeName || input.employeeIdCode,
          code: 'MISSING_SALARY_ASSIGNMENT',
          message: `No active salary assignment found for ${input.employeeIdCode} in period ${period.periodCode}`,
          severity: 'ERROR'
        };
        errors.push(errorItem);
        empHasError = true;

        // Automatically raise an ExceptionCase (Section 37, 91)
        try {
          await ExceptionService.raiseException({
            module: 'PAYROLL',
            entityType: 'PAYROLL_INPUT',
            entityId: input.inputId,
            exceptionType: 'MISSING_SALARY_ASSIGNMENT',
            description: `Employee ${input.employeeIdCode} has no salary assignment for payroll period ${period.periodCode}`,
            severity: 'HIGH',
            assignedRole: 'HR_MANAGER',
            metadata: {
              periodCode: period.periodCode,
              employeeIdCode: input.employeeIdCode
            }
          });
        } catch (e) {
          // Non-blocking
        }
      }

      // 3. Stale Input check
      if (input.isStale) {
        errors.push({
          employeeIdCode: input.employeeIdCode,
          employeeName: input.employeeSnapshot?.employeeName || input.employeeIdCode,
          code: 'STALE_PAYROLL_INPUT',
          message: `Payroll input is marked STALE: ${input.staleReason}. Recalculation required.`,
          severity: 'ERROR'
        });
        empHasError = true;
      }

      // 4. Overtime verification: ensure no unapproved candidate minutes slipped into approved minutes
      if (input.overtime?.approvedMinutes > input.overtime?.candidateMinutes) {
        warnings.push({
          employeeIdCode: input.employeeIdCode,
          employeeName: input.employeeSnapshot?.employeeName || input.employeeIdCode,
          code: 'OVERTIME_DISCREPANCY',
          message: `Approved overtime (${input.overtime.approvedMinutes}m) exceeds candidate overtime (${input.overtime.candidateMinutes}m).`,
          severity: 'WARNING'
        });
      }

      // Update input status
      if (empHasError) {
        input.status = 'EXCEPTION';
      } else {
        validCount++;
        if (input.status === 'EXCEPTION' || input.status === 'DRAFT') {
          input.status = 'CALCULATED';
        }
      }
      await input.save();
    }

    const errorCount = errors.length;
    const warningCount = warnings.length;
    const isValid = errorCount === 0;

    // Update Period
    period.summary.validCount = validCount;
    period.summary.errorCount = errorCount;
    period.summary.warningCount = warningCount;
    period.validationResults = {
      validatedAt: new Date(),
      validatedBy: actorUser?.userId || actorUser?.name || 'SYSTEM',
      errors: [...errors, ...warnings]
    };
    period.status = isValid ? 'VALIDATION' : 'VALIDATION';
    await period.save();

    await AuditService.logEvent({
      action: 'PAYROLL_VALIDATION_EXECUTED',
      module: 'PAYROLL',
      entityId: period._id.toString(),
      entityType: 'PayrollPeriod',
      performedBy: actorUser?.userId || actorUser?.name || 'SYSTEM',
      details: {
        periodCode: period.periodCode,
        employeeCount: inputs.length,
        validCount,
        warningCount,
        errorCount,
        isValid
      }
    });

    return {
      success: isValid,
      periodCode: period.periodCode,
      employeeCount: inputs.length,
      validCount,
      warningCount,
      errorCount,
      errors,
      warnings
    };
  }
}

module.exports = PayrollValidationService;
