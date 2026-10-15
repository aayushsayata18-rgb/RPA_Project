const PayrollPeriod = require('../models/PayrollPeriod');
const PayrollInput = require('../models/PayrollInput');
const IdGeneratorService = require('./IdGeneratorService');
const AuditService = require('./AuditService');
const NotificationService = require('./NotificationService');

class PayrollPeriodService {
  /**
   * Create a new Payroll Period
   */
  static async createPeriod(data, actorUser) {
    const { startDate, endDate, frequency = 'MONTHLY', name, cutoffDate, attendanceCutoffDate, leaveCutoffDate } = data;

    if (!startDate || !endDate) {
      throw new Error('startDate and endDate are required');
    }

    const start = new Date(startDate);
    const end = new Date(endDate);

    if (start >= end) {
      throw new Error('startDate must be before endDate');
    }

    const year = start.getFullYear();
    const month = start.getMonth() + 1;
    const periodCode = data.periodCode || IdGeneratorService.generatePayrollPeriodCode(year, month);

    const existing = await PayrollPeriod.findOne({ periodCode });
    if (existing) {
      throw new Error(`Payroll period with code ${periodCode} already exists`);
    }

    const periodName = name || `Payroll Period ${periodCode}`;
    const actorId = actorUser?.userId || actorUser?.name || 'HR_ADMIN';

    const period = new PayrollPeriod({
      periodCode,
      name: periodName,
      startDate: start,
      endDate: end,
      frequency,
      status: 'DRAFT',
      cutoffDate: cutoffDate ? new Date(cutoffDate) : end,
      attendanceCutoffDate: attendanceCutoffDate ? new Date(attendanceCutoffDate) : end,
      leaveCutoffDate: leaveCutoffDate ? new Date(leaveCutoffDate) : end,
      createdBy: actorId
    });

    await period.save();

    await AuditService.logEvent({
      action: 'PAYROLL_PERIOD_CREATED',
      module: 'PAYROLL',
      entityId: period._id.toString(),
      entityType: 'PayrollPeriod',
      performedBy: actorId,
      details: { periodCode, startDate: start, endDate: end }
    });

    return period;
  }

  /**
   * List periods with optional filter
   */
  static async listPeriods(filter = {}) {
    return await PayrollPeriod.find(filter).sort({ startDate: -1 }).lean();
  }

  /**
   * Get period by ID or Code
   */
  static async getPeriodById(idOrCode) {
    let period;
    const str = String(idOrCode || '');
    if (/^[0-9a-fA-F]{24}$/.test(str)) {
      period = await PayrollPeriod.findById(idOrCode);
    } else {
      period = await PayrollPeriod.findOne({ periodCode: idOrCode });
    }
    if (!period) {
      throw new Error(`Payroll period '${idOrCode}' not found`);
    }
    return period;
  }

  /**
   * Open period for input collection
   */
  static async openPeriod(idOrCode, actorUser) {
    const period = await this.getPeriodById(idOrCode);

    if (period.status !== 'DRAFT') {
      throw new Error(`Cannot open payroll period currently in status ${period.status}`);
    }

    period.status = 'OPEN';
    period.updatedBy = actorUser?.userId || actorUser?.name || 'HR_ADMIN';
    await period.save();

    await AuditService.logEvent({
      action: 'PAYROLL_PERIOD_OPENED',
      module: 'PAYROLL',
      entityId: period._id.toString(),
      entityType: 'PayrollPeriod',
      performedBy: period.updatedBy,
      details: { periodCode: period.periodCode }
    });

    try {
      await NotificationService.sendNotification({
        userId: null,
        recipient: 'HR_PAYROLL_GROUP',
        channel: 'IN_APP',
        templateCode: 'PAYROLL_PERIOD_OPEN',
        event: 'PAYROLL_PERIOD_OPEN',
        subject: `Payroll Period ${period.periodCode} Opened`,
        message: `Payroll period ${period.periodCode} is now open for attendance and leave reconciliation.`,
        body: `Payroll period ${period.periodCode} is now open for attendance and leave reconciliation.`
      });
    } catch (e) {
      // Non-blocking notification
    }

    return period;
  }

  /**
   * Lock input collection
   */
  static async lockInputs(idOrCode, actorUser, reason = 'Cutoff reached') {
    const period = await this.getPeriodById(idOrCode);

    if (['FINALIZED', 'CANCELLED'].includes(period.status)) {
      throw new Error(`Cannot lock period in status ${period.status}`);
    }

    period.isLocked = true;
    period.inputLockDate = new Date();
    period.lockDetails = {
      lockedAt: new Date(),
      lockedBy: actorUser?.userId || actorUser?.name || 'HR_ADMIN',
      reason
    };

    await period.save();

    // Also mark inputs as locked if already calculated/approved
    await PayrollInput.updateMany(
      { payrollPeriodId: period._id, status: { $in: ['CALCULATED', 'REVIEWED', 'APPROVED'] } },
      { $set: { status: 'LOCKED' } }
    );

    await AuditService.logEvent({
      action: 'PAYROLL_INPUTS_LOCKED',
      module: 'PAYROLL',
      entityId: period._id.toString(),
      entityType: 'PayrollPeriod',
      performedBy: period.lockDetails.lockedBy,
      details: { periodCode: period.periodCode, reason }
    });

    return period;
  }

  /**
   * Submit period for approval (Segregation of Duties step 1)
   */
  static async submitForReview(idOrCode, actorUser, notes = '') {
    const period = await this.getPeriodById(idOrCode);

    if (!['OPEN', 'INPUT_COLLECTION', 'VALIDATION'].includes(period.status)) {
      throw new Error(`Cannot submit period for review from status ${period.status}`);
    }

    // Must have at least 1 input
    const inputCount = await PayrollInput.countDocuments({ payrollPeriodId: period._id });
    if (inputCount === 0) {
      throw new Error('Cannot submit period for review without generated payroll inputs');
    }

    const actorId = actorUser?.userId || actorUser?.name || 'HR_ADMIN';

    period.status = 'PENDING_APPROVAL';
    period.approvalDetails.submittedAt = new Date();
    period.approvalDetails.submittedBy = actorId;
    period.approvalDetails.reviewNotes = notes;
    await period.save();

    await AuditService.logEvent({
      action: 'PAYROLL_SUBMITTED_FOR_APPROVAL',
      module: 'PAYROLL',
      entityId: period._id.toString(),
      entityType: 'PayrollPeriod',
      performedBy: actorId,
      details: { periodCode: period.periodCode, inputCount }
    });

    return period;
  }

  /**
   * Approve period (Segregation of duties: preparer cannot approve)
   */
  static async approvePeriod(idOrCode, actorUser, notes = '', enforceSegregation = true) {
    const period = await this.getPeriodById(idOrCode);

    if (period.status !== 'PENDING_APPROVAL') {
      throw new Error(`Cannot approve period in status ${period.status}. Must be PENDING_APPROVAL.`);
    }

    const actorId = actorUser?.userId || actorUser?.name || 'PAYROLL_APPROVER';

    if (enforceSegregation && period.approvalDetails?.submittedBy && period.approvalDetails.submittedBy === actorId) {
      throw new Error('Segregation of duties violation: Submitter cannot approve their own payroll period.');
    }

    period.status = 'APPROVED';
    period.approvalDetails.approvedAt = new Date();
    period.approvalDetails.approvedBy = actorId;
    period.approvalDetails.approvalNotes = notes;
    await period.save();

    // Mark inputs as APPROVED
    await PayrollInput.updateMany(
      { payrollPeriodId: period._id, status: { $ne: 'EXCEPTION' } },
      { $set: { status: 'APPROVED', approvedBy: actorId, approvedAt: new Date() } }
    );

    await AuditService.logEvent({
      action: 'PAYROLL_PERIOD_APPROVED',
      module: 'PAYROLL',
      entityId: period._id.toString(),
      entityType: 'PayrollPeriod',
      performedBy: actorId,
      details: { periodCode: period.periodCode }
    });

    return period;
  }

  /**
   * Finalize payroll period (Permanent lock, cannot be edited without formal adjustment)
   */
  static async finalizePeriod(idOrCode, actorUser) {
    const period = await this.getPeriodById(idOrCode);

    if (period.status !== 'PROCESSED') {
      throw new Error(`Cannot finalize period in status ${period.status}. Must be PROCESSED first.`);
    }

    const actorId = actorUser?.userId || actorUser?.name || 'HR_ADMIN';

    period.status = 'FINALIZED';
    period.isLocked = true;
    period.finalizedAt = new Date();
    period.finalizedBy = actorId;
    await period.save();

    await AuditService.logEvent({
      action: 'PAYROLL_PERIOD_FINALIZED',
      module: 'PAYROLL',
      entityId: period._id.toString(),
      entityType: 'PayrollPeriod',
      performedBy: actorId,
      details: { periodCode: period.periodCode }
    });

    return period;
  }
}

module.exports = PayrollPeriodService;
