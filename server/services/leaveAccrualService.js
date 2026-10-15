const Employee = require('../models/Employee');
const LeaveType = require('../models/LeaveType');
const LeavePolicy = require('../models/LeavePolicy');
const LeaveBalance = require('../models/LeaveBalance');
const LeaveBalanceTransaction = require('../models/LeaveBalanceTransaction');
const LeaveBalanceService = require('./leaveBalanceService');
const IdGeneratorService = require('./IdGeneratorService');
const AuditService = require('./AuditService');
const ExceptionService = require('./ExceptionService');

class LeaveAccrualService {
  /**
   * Run scheduled accrual for a given period (month/year)
   */
  static async runAccrualJob({
    month = new Date().getMonth() + 1,
    year = new Date().getFullYear(),
    frequency = 'MONTHLY',
    actorUser = null
  }) {
    const periodKey = `ACCRUAL_${year}_M${String(month).padStart(2, '0')}`;
    const activeEmployees = await Employee.find({
      status: 'ACTIVE'
    });

    const activePolicies = await LeavePolicy.find({
      status: 'ACTIVE',
      accrualMethod: frequency
    }).populate('leaveTypeId');

    let processedEmployees = 0;
    let accrualCount = 0;
    let skippedCount = 0;
    const errors = [];

    for (const employee of activeEmployees) {
      processedEmployees++;
      const primaryDept = employee.departmentAssignments?.find(da => da.isPrimary && da.status === 'ACTIVE')?.departmentId;

      for (const policy of activePolicies) {
        if (!policy.leaveTypeId || policy.leaveTypeId.status !== 'ACTIVE') continue;

        // Verify department match if department-specific
        if (policy.departmentId && primaryDept) {
          const pId = policy.departmentId.toString();
          const empDeptId = (primaryDept._id || primaryDept).toString();
          if (pId !== empDeptId) continue;
        }

        try {
          // Idempotency check: has this employee already received accrual for this period?
          const existingTxn = await LeaveBalanceTransaction.findOne({
            employeeId: employee._id,
            leaveTypeId: policy.leaveTypeId._id,
            year,
            transactionType: 'ACCRUAL',
            referenceId: periodKey
          });

          if (existingTxn) {
            skippedCount++;
            continue;
          }

          // Calculate accrual rate
          let accrualAmount = policy.accrualRate;
          if (!accrualAmount || accrualAmount <= 0) {
            accrualAmount = policy.annualEntitlement / (frequency === 'MONTHLY' ? 12 : frequency === 'QUARTERLY' ? 4 : 1);
            accrualAmount = parseFloat(accrualAmount.toFixed(2));
          }

          const balance = await LeaveBalanceService.getOrCreateBalance({
            employeeId: employee._id,
            leaveTypeId: policy.leaveTypeId._id,
            year
          });

          // Check maximum balance ceiling
          const currentTotal = balance.openingBalance + balance.accrued + balance.carriedForward + balance.adjusted;
          if (policy.maximumBalance && currentTotal >= policy.maximumBalance) {
            skippedCount++;
            continue;
          }

          const beforeAvailable = balance.available;
          balance.accrued += accrualAmount;
          await LeaveBalanceService.recalculateBalance(balance._id);

          const txnId = await IdGeneratorService.generateLeaveTransactionId();
          await LeaveBalanceTransaction.create({
            transactionId: txnId,
            employeeId: employee._id,
            employeeCode: employee.employeeId,
            leaveTypeId: policy.leaveTypeId._id,
            leaveTypeCode: policy.leaveTypeCode,
            year,
            transactionType: 'ACCRUAL',
            amount: accrualAmount,
            balanceBefore: beforeAvailable,
            balanceAfter: balance.available,
            referenceType: 'AccrualJob',
            referenceId: periodKey,
            reason: `${frequency} leave accrual for ${periodKey}`,
            createdBy: actorUser?.userId || 'ACCRUAL_CRON'
          });

          accrualCount++;
        } catch (err) {
          errors.push({
            employeeId: employee.employeeId,
            leaveType: policy.leaveTypeCode,
            error: err.message
          });

          await ExceptionService.raiseException({
            module: 'LEAVE',
            entityType: 'LeaveBalance',
            entityId: employee.employeeId,
            exceptionType: 'BALANCE_CALCULATION_ERROR',
            description: `Accrual calculation failed for employee ${employee.employeeId} on ${policy.leaveTypeCode}: ${err.message}`
          });
        }
      }
    }

    await AuditService.logEvent({
      action: 'ACCRUAL_APPLIED',
      module: 'LEAVE',
      entityType: 'LeaveAccrualJob',
      entityId: periodKey,
      actorUserId: actorUser?.userId || 'SYSTEM',
      actorRole: 'SYSTEM_SCHEDULER',
      details: {
        periodKey,
        processedEmployees,
        accrualCount,
        skippedCount,
        errorCount: errors.length
      }
    });

    return {
      success: true,
      periodKey,
      processedEmployees,
      accrualCount,
      skippedCount,
      errors
    };
  }

  /**
   * Run Year-End Carry Forward Job from previous year to new year
   */
  static async runCarryForwardJob({ fromYear, toYear, actorUser = null }) {
    const prevBalances = await LeaveBalance.find({ year: fromYear }).populate('leaveTypeId');
    let processed = 0;
    let carriedCount = 0;

    for (const prevBal of prevBalances) {
      processed++;
      if (!prevBal.leaveTypeId || !prevBal.leaveTypeId.carryForwardAllowed) continue;

      const unused = Math.max(0, prevBal.available);
      if (unused <= 0) continue;

      // Find policy for carry forward limit
      const policy = await LeavePolicy.findOne({
        leaveTypeId: prevBal.leaveTypeId._id,
        status: 'ACTIVE'
      }).sort({ version: -1 });

      const limit = policy?.carryForwardLimit || 0;
      const carryAmount = limit > 0 ? Math.min(unused, limit) : unused;

      if (carryAmount <= 0) continue;

      const newBal = await LeaveBalanceService.getOrCreateBalance({
        employeeId: prevBal.employeeId,
        leaveTypeId: prevBal.leaveTypeId._id,
        year: toYear
      });

      const beforeAvail = newBal.available;
      newBal.carriedForward = carryAmount;
      await LeaveBalanceService.recalculateBalance(newBal._id);

      const txnId = await IdGeneratorService.generateLeaveTransactionId();
      await LeaveBalanceTransaction.create({
        transactionId: txnId,
        employeeId: prevBal.employeeId,
        employeeCode: prevBal.employeeCode,
        leaveTypeId: prevBal.leaveTypeId._id,
        leaveTypeCode: prevBal.leaveTypeCode,
        year: toYear,
        transactionType: 'CARRY_FORWARD',
        amount: carryAmount,
        balanceBefore: beforeAvail,
        balanceAfter: newBal.available,
        referenceType: 'CarryForwardJob',
        referenceId: `CF-${fromYear}-${toYear}`,
        reason: `Carry forward of ${carryAmount} day(s) from year ${fromYear}`,
        createdBy: actorUser?.userId || 'SYSTEM_YEAR_END'
      });

      carriedCount++;
    }

    return { processed, carriedCount, fromYear, toYear };
  }
}

module.exports = LeaveAccrualService;
