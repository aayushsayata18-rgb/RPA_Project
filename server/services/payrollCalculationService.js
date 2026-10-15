const PayrollResult = require('../models/PayrollResult');
const EmployeeSalaryAssignment = require('../models/EmployeeSalaryAssignment');
const IdGeneratorService = require('./IdGeneratorService');

class PayrollCalculationService {
  /**
   * Calculate financial payroll result for a single PayrollInput
   */
  static async calculateInputResult(input, period, run = null) {
    // 1. Fetch effective salary assignment
    const salaryAssignment = await EmployeeSalaryAssignment.findOne({
      employeeId: input.employeeId,
      status: { $in: ['ACTIVE', 'SUPERSEDED'] },
      effectiveFrom: { $lte: period.endDate },
      $or: [{ effectiveTo: null }, { effectiveTo: { $gte: period.startDate } }]
    }).sort({ effectiveFrom: -1, version: -1 });

    if (!salaryAssignment) {
      throw new Error(`Missing salary assignment for ${input.employeeIdCode}`);
    }

    const baseAmount = Number(salaryAssignment.baseAmount) || 0;
    const scheduledDays = Math.max(input.attendanceSummary?.scheduledDays || 26, 1);
    const workedDays = input.attendanceSummary?.workedDays || 0;
    const paidLeaveDays = input.leaveSummary?.paidLeaveDays || 0;
    const unpaidLeaveDays = input.leaveSummary?.unpaidLeaveDays || 0;
    const approvedOvertimeMinutes = input.overtime?.approvedMinutes || 0;

    // Daily and Hourly rates
    const dailyRate = Math.round((baseAmount / scheduledDays) * 100) / 100;
    const hourlyRate = Math.round((dailyRate / 8) * 100) / 100;

    // 2. Earnings Calculation
    const earningsList = [];

    // Base salary (attendance-based proration or full base)
    // If worked + paid leave >= scheduledDays, full base; otherwise prorated
    const payableDays = Math.min(workedDays + paidLeaveDays, scheduledDays);
    let earnedBase = baseAmount;
    if (unpaidLeaveDays > 0 || (workedDays + paidLeaveDays < scheduledDays && scheduledDays > 0)) {
      earnedBase = Math.round(dailyRate * payableDays * 100) / 100;
    }

    earningsList.push({
      code: 'BASIC',
      name: 'Basic / Base Salary',
      amount: earnedBase,
      type: 'EARNING'
    });

    // Configured Allowances
    if (Array.isArray(input.allowances)) {
      for (const alw of input.allowances) {
        earningsList.push({
          code: alw.code,
          name: alw.name,
          amount: Math.round(Number(alw.amount || 0) * 100) / 100,
          type: 'EARNING'
        });
      }
    }

    // Overtime Pay (1.5x standard hourly rate)
    let overtimePay = 0;
    if (approvedOvertimeMinutes > 0) {
      const overtimeHours = approvedOvertimeMinutes / 60;
      overtimePay = Math.round(overtimeHours * hourlyRate * 1.5 * 100) / 100;
      earningsList.push({
        code: 'OVERTIME',
        name: `Approved Overtime (${(approvedOvertimeMinutes / 60).toFixed(1)} hrs)`,
        amount: overtimePay,
        type: 'EARNING'
      });
    }

    const grossEarnings = Math.round(earningsList.reduce((acc, cur) => acc + cur.amount, 0) * 100) / 100;

    // 3. Deductions Calculation
    const deductionsList = [];

    // Unpaid leave deduction if base was not already prorated
    let unpaidLeaveDeduction = 0;
    if (unpaidLeaveDays > 0 && earnedBase === baseAmount) {
      unpaidLeaveDeduction = Math.round(dailyRate * unpaidLeaveDays * 100) / 100;
      deductionsList.push({
        code: 'UNPAID_LEAVE',
        name: `Unpaid Leave Deduction (${unpaidLeaveDays} days)`,
        amount: unpaidLeaveDeduction,
        type: 'DEDUCTION'
      });
    }

    // Configured Deductions
    if (Array.isArray(input.deductions)) {
      for (const ded of input.deductions) {
        deductionsList.push({
          code: ded.code,
          name: ded.name,
          amount: Math.round(Number(ded.amount || 0) * 100) / 100,
          type: 'DEDUCTION'
        });
      }
    }

    const totalDeductions = Math.round(deductionsList.reduce((acc, cur) => acc + cur.amount, 0) * 100) / 100;
    const netPay = Math.max(Math.round((grossEarnings - totalDeductions) * 100) / 100, 0);

    const resultId = await IdGeneratorService.generatePayrollResultId();

    const resultData = {
      resultId,
      payrollPeriodId: period._id,
      periodCode: period.periodCode,
      payrollRunId: run ? run._id : null,
      employeeId: input.employeeId,
      employeeIdCode: input.employeeIdCode,
      payrollInputId: input._id,
      grossEarnings,
      totalDeductions,
      netPay,
      currency: salaryAssignment.currency || 'USD',
      breakdown: {
        earnings: earningsList,
        deductions: deductionsList,
        statutory: [],
        attendanceAdjustments: {
          workedDays,
          scheduledDays,
          paidLeaveDays,
          unpaidLeaveDays,
          unpaidLeaveDeduction,
          overtimePay
        }
      },
      source: 'INTERNAL_ENGINE',
      calculationVersion: 1,
      status: 'CALCULATED',
      calculatedAt: new Date()
    };

    // Upsert PayrollResult for (payrollPeriodId + employeeId)
    const resultDoc = await PayrollResult.findOneAndUpdate(
      { payrollPeriodId: period._id, employeeId: input.employeeId },
      { $set: resultData },
      { upsert: true, new: true }
    );

    return resultDoc;
  }
}

module.exports = PayrollCalculationService;
