const LeaveBalance = require('../models/LeaveBalance');
const LeaveBalanceTransaction = require('../models/LeaveBalanceTransaction');
const LeaveType = require('../models/LeaveType');
const LeavePolicy = require('../models/LeavePolicy');
const Employee = require('../models/Employee');
const IdGeneratorService = require('./IdGeneratorService');
const AuditService = require('./AuditService');

class LeaveBalanceService {
  /**
   * Get or initialize leave balance for employee, leave type and year
   */
  static async getOrCreateBalance({ employeeId, leaveTypeId, year = null }) {
    const targetYear = year || new Date().getFullYear();

    let balance = await LeaveBalance.findOne({
      employeeId,
      leaveTypeId,
      year: targetYear
    });

    if (!balance) {
      const employee = await Employee.findById(employeeId);
      const leaveType = await LeaveType.findById(leaveTypeId);
      if (!employee || !leaveType) {
        throw new Error('Employee or LeaveType not found for balance initialization.');
      }

      // Check applicable policy for opening/entitlement
      const policy = await LeavePolicy.findOne({
        leaveTypeId: leaveType._id,
        status: 'ACTIVE'
      }).sort({ version: -1 });

      const entitlement = policy ? policy.annualEntitlement : 0;
      const balanceId = await IdGeneratorService.generateLeaveBalanceId();

      balance = new LeaveBalance({
        balanceId,
        employeeId: employee._id,
        employeeCode: employee.employeeId,
        leaveTypeId: leaveType._id,
        leaveTypeCode: leaveType.code,
        year: targetYear,
        openingBalance: entitlement,
        accrued: 0,
        carriedForward: 0,
        used: 0,
        pending: 0,
        adjusted: 0,
        available: entitlement,
        closingBalance: entitlement,
        lastCalculatedAt: new Date()
      });

      await balance.save();

      // Record opening transaction
      const txnId = await IdGeneratorService.generateLeaveTransactionId();
      await LeaveBalanceTransaction.create({
        transactionId: txnId,
        employeeId: employee._id,
        employeeCode: employee.employeeId,
        leaveTypeId: leaveType._id,
        leaveTypeCode: leaveType.code,
        year: targetYear,
        transactionType: 'OPENING_BALANCE',
        amount: entitlement,
        balanceBefore: 0,
        balanceAfter: entitlement,
        reason: `Initial annual entitlement for year ${targetYear}`,
        createdBy: 'SYSTEM'
      });
    }

    return balance;
  }

  /**
   * Recalculate and persist balance metrics
   */
  static async recalculateBalance(balanceOrId) {
    let balance = balanceOrId;
    if (!balance || !balance.save) {
      balance = await LeaveBalance.findById(balanceOrId);
    }
    if (!balance) return null;

    // Available = Opening + Accrued + CarriedForward + Adjusted - Used - Pending
    const available = Math.max(
      0,
      balance.openingBalance + balance.accrued + balance.carriedForward + balance.adjusted - balance.used - balance.pending
    );
    const closing = balance.openingBalance + balance.accrued + balance.carriedForward + balance.adjusted - balance.used;

    balance.available = available;
    balance.closingBalance = closing;
    balance.lastCalculatedAt = new Date();
    await balance.save();

    return balance;
  }

  /**
   * Reserve balance when request is submitted
   */
  static async reservePending({ employeeId, leaveTypeId, amount, year = null }) {
    const balance = await this.getOrCreateBalance({ employeeId, leaveTypeId, year });
    balance.pending += amount;
    return await this.recalculateBalance(balance);
  }

  /**
   * Release reserved balance when request is rejected or withdrawn
   */
  static async releasePending({ employeeId, leaveTypeId, amount, year = null }) {
    const balance = await this.getOrCreateBalance({ employeeId, leaveTypeId, year });
    balance.pending = Math.max(0, balance.pending - amount);
    return await this.recalculateBalance(balance);
  }

  /**
   * Apply leave consumption upon final approval
   */
  static async applyLeaveUsed({
    employeeId,
    leaveTypeId,
    amount,
    year = null,
    referenceId = null,
    actorUser = null
  }) {
    const balance = await this.getOrCreateBalance({ employeeId, leaveTypeId, year });
    const targetYear = year || new Date().getFullYear();

    const beforeAvailable = balance.available;
    // Release pending if previously reserved
    balance.pending = Math.max(0, balance.pending - amount);
    balance.used += amount;

    await this.recalculateBalance(balance);

    // Record ledger entry
    const txnId = await IdGeneratorService.generateLeaveTransactionId();
    await LeaveBalanceTransaction.create({
      transactionId: txnId,
      employeeId: balance.employeeId,
      employeeCode: balance.employeeCode,
      leaveTypeId: balance.leaveTypeId,
      leaveTypeCode: balance.leaveTypeCode,
      year: targetYear,
      transactionType: 'LEAVE_USED',
      amount: -amount,
      balanceBefore: beforeAvailable,
      balanceAfter: balance.available,
      referenceType: 'LeaveRequest',
      referenceId: referenceId ? String(referenceId) : null,
      reason: `Approved leave request ${referenceId || ''}`,
      createdBy: actorUser?.userId || actorUser?.name || 'SYSTEM'
    });

    return balance;
  }

  /**
   * Reverse leave consumption upon cancellation approval
   */
  static async reverseLeaveCancelled({
    employeeId,
    leaveTypeId,
    amount,
    year = null,
    referenceId = null,
    actorUser = null
  }) {
    const balance = await this.getOrCreateBalance({ employeeId, leaveTypeId, year });
    const targetYear = year || new Date().getFullYear();

    const beforeAvailable = balance.available;
    balance.used = Math.max(0, balance.used - amount);

    await this.recalculateBalance(balance);

    // Record ledger entry
    const txnId = await IdGeneratorService.generateLeaveTransactionId();
    await LeaveBalanceTransaction.create({
      transactionId: txnId,
      employeeId: balance.employeeId,
      employeeCode: balance.employeeCode,
      leaveTypeId: balance.leaveTypeId,
      leaveTypeCode: balance.leaveTypeCode,
      year: targetYear,
      transactionType: 'LEAVE_CANCELLED',
      amount: amount,
      balanceBefore: beforeAvailable,
      balanceAfter: balance.available,
      referenceType: 'LeaveCancellationRequest',
      referenceId: referenceId ? String(referenceId) : null,
      reason: `Reversal for cancelled leave ${referenceId || ''}`,
      createdBy: actorUser?.userId || actorUser?.name || 'SYSTEM'
    });

    return balance;
  }

  /**
   * Authorized HR Manual Balance Adjustment
   */
  static async adjustBalance({
    employeeId,
    leaveTypeId,
    adjustmentAmount,
    reason,
    year = null,
    actorUser
  }) {
    if (!reason || reason.trim().length < 3) {
      throw new Error('Mandatory adjustment reason must be provided.');
    }
    if (typeof adjustmentAmount !== 'number' || isNaN(adjustmentAmount)) {
      throw new Error('Valid adjustment amount is required.');
    }

    const balance = await this.getOrCreateBalance({ employeeId, leaveTypeId, year });
    const targetYear = year || new Date().getFullYear();
    const beforeAvailable = balance.available;

    balance.adjusted += adjustmentAmount;
    await this.recalculateBalance(balance);

    const txnId = await IdGeneratorService.generateLeaveTransactionId();
    const txn = await LeaveBalanceTransaction.create({
      transactionId: txnId,
      employeeId: balance.employeeId,
      employeeCode: balance.employeeCode,
      leaveTypeId: balance.leaveTypeId,
      leaveTypeCode: balance.leaveTypeCode,
      year: targetYear,
      transactionType: 'ADJUSTMENT',
      amount: adjustmentAmount,
      balanceBefore: beforeAvailable,
      balanceAfter: balance.available,
      referenceType: 'HRAdjustment',
      reason,
      createdBy: actorUser?.userId || actorUser?.name || 'HR_ADMIN'
    });

    await AuditService.logEvent({
      action: 'LEAVE_BALANCE_ADJUSTED',
      module: 'LEAVE',
      entityType: 'LeaveBalance',
      entityId: balance.balanceId,
      actorUserId: actorUser?.userId || actorUser?.id || 'SYSTEM',
      actorRole: actorUser?.role || 'HR_MANAGER',
      details: {
        employeeCode: balance.employeeCode,
        leaveType: balance.leaveTypeCode,
        adjustmentAmount,
        reason,
        newAvailable: balance.available
      }
    });

    return { balance, transaction: txn };
  }

  /**
   * Get all active balances for an employee
   */
  static async getEmployeeBalances(employeeId, year = null) {
    const targetYear = year || new Date().getFullYear();
    const activeTypes = await LeaveType.find({ status: 'ACTIVE', balanceTracked: true });

    const balances = [];
    for (const lt of activeTypes) {
      const bal = await this.getOrCreateBalance({
        employeeId,
        leaveTypeId: lt._id,
        year: targetYear
      });
      balances.push({
        ...bal.toObject(),
        leaveType: lt
      });
    }

    return balances;
  }

  /**
   * Get ledger history for an employee
   */
  static async getLedgerHistory(employeeId, { leaveTypeId = null, year = null, limit = 50, page = 1 } = {}) {
    const query = { employeeId };
    if (leaveTypeId) query.leaveTypeId = leaveTypeId;
    if (year) query.year = year;

    const skip = (page - 1) * limit;
    const [transactions, total] = await Promise.all([
      LeaveBalanceTransaction.find(query)
        .populate('leaveTypeId', 'name code unit')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      LeaveBalanceTransaction.countDocuments(query)
    ]);

    return { transactions, total, page, totalPages: Math.ceil(total / limit) };
  }
}

module.exports = LeaveBalanceService;
