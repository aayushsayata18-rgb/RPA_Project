const PayrollPeriod = require('../models/PayrollPeriod');
const PayrollInput = require('../models/PayrollInput');
const PayrollRun = require('../models/PayrollRun');
const PayrollResult = require('../models/PayrollResult');
const PayrollCalculationService = require('./payrollCalculationService');
const IdGeneratorService = require('./IdGeneratorService');
const AuditService = require('./AuditService');
const NotificationService = require('./NotificationService');

class PayrollProcessingService {
  /**
   * Execute Payroll Processing Run with Idempotency & Concurrency Guard
   */
  static async executePayrollRun(periodIdOrCode, actorUser, options = {}) {
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

    if (['FINALIZED', 'CANCELLED'].includes(period.status)) {
      throw new Error(`Cannot process payroll period in status ${period.status}`);
    }

    // Require APPROVED status unless explicit force flag passed by authorized user
    if (period.status !== 'APPROVED' && !options.bypassApproval) {
      throw new Error(`Cannot process payroll period in status ${period.status}. Period must be APPROVED first.`);
    }

    const correlationId = options.correlationId || `RUN-${period.periodCode}-${Date.now()}`;
    const actorId = actorUser?.userId || actorUser?.name || 'PAYROLL_SYSTEM';

    // Check for duplicate submission / idempotency (Section 68, 87, 96 TC 2)
    const existingRun = await PayrollRun.findOne({
      payrollPeriodId: period._id,
      correlationId
    });

    if (existingRun && ['PROCESSING', 'SUCCESS'].includes(existingRun.status)) {
      return {
        idempotent: true,
        message: 'Duplicate processing prevented: this payroll run was already processed.',
        run: existingRun
      };
    }

    // Determine runNumber
    const runCount = await PayrollRun.countDocuments({ payrollPeriodId: period._id });
    const runNumber = runCount + 1;
    const runId = await IdGeneratorService.generatePayrollRunId();

    const run = new PayrollRun({
      runId,
      payrollPeriodId: period._id,
      periodCode: period.periodCode,
      runNumber,
      correlationId,
      status: 'PROCESSING',
      startedAt: new Date(),
      startedBy: actorId,
      approvedBy: period.approvalDetails?.approvedBy || actorId,
      source: options.source || 'INTERNAL_ENGINE'
    });
    await run.save();

    // Lock period status to PROCESSING
    period.status = 'PROCESSING';
    period.processingDetails.runCount = runNumber;
    period.processingDetails.lastRunId = runId;
    await period.save();

    // Fetch valid inputs
    const inputs = await PayrollInput.find({
      payrollPeriodId: period._id,
      status: { $ne: 'EXCEPTION' }
    });

    let successfulCount = 0;
    let failedCount = 0;
    let grossTotal = 0;
    let deductionsTotal = 0;
    let netTotal = 0;
    const errorDetails = [];

    for (const input of inputs) {
      try {
        const resultDoc = await PayrollCalculationService.calculateInputResult(input, period, run);
        successfulCount++;
        grossTotal = Math.round((grossTotal + resultDoc.grossEarnings) * 100) / 100;
        deductionsTotal = Math.round((deductionsTotal + resultDoc.totalDeductions) * 100) / 100;
        netTotal = Math.round((netTotal + resultDoc.netPay) * 100) / 100;
      } catch (err) {
        failedCount++;
        errorDetails.push({
          employeeIdCode: input.employeeIdCode,
          error: err.message
        });
      }
    }

    // Complete run
    run.status = failedCount === 0 ? 'SUCCESS' : (successfulCount > 0 ? 'PARTIAL_SUCCESS' : 'FAILED');
    run.completedAt = new Date();
    run.employeeCount = inputs.length;
    run.successfulCount = successfulCount;
    run.failedCount = failedCount;
    run.totals = {
      grossTotal,
      deductionsTotal,
      netTotal,
      currency: 'USD'
    };
    run.errorDetails = errorDetails;
    run.logSummary = `Processed ${successfulCount}/${inputs.length} employees successfully. Net total: $${netTotal}`;
    await run.save();

    // Update Period
    period.status = 'PROCESSED';
    period.processingDetails.processedAt = new Date();
    period.processingDetails.processedBy = actorId;
    period.summary.grossTotal = grossTotal;
    period.summary.deductionsTotal = deductionsTotal;
    period.summary.netTotal = netTotal;
    await period.save();

    await AuditService.logEvent({
      action: 'PAYROLL_RUN_COMPLETED',
      module: 'PAYROLL',
      entityId: period._id.toString(),
      entityType: 'PayrollPeriod',
      performedBy: actorId,
      details: {
        runId,
        runNumber,
        correlationId,
        successfulCount,
        failedCount,
        grossTotal,
        netTotal
      }
    });

    try {
      await NotificationService.sendNotification({
        userId: null,
        recipient: 'PAYROLL_FINANCE_GROUP',
        channel: 'IN_APP',
        templateCode: 'PAYROLL_PROCESSED',
        event: 'PAYROLL_PROCESSED',
        subject: `Payroll Period ${period.periodCode} Processed`,
        message: `Run #${runNumber} completed with ${successfulCount} records processed. Net: $${netTotal}.`,
        body: `Run #${runNumber} completed with ${successfulCount} records processed. Net: $${netTotal}.`
      });
    } catch (e) {
      // Non-blocking
    }

    return {
      success: run.status === 'SUCCESS' || run.status === 'PARTIAL_SUCCESS',
      run,
      summary: {
        periodCode: period.periodCode,
        runNumber,
        successfulCount,
        failedCount,
        grossTotal,
        netTotal
      }
    };
  }
}

module.exports = PayrollProcessingService;
