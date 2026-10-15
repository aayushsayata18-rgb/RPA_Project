/**
 * Payroll Processing Scheduled Job
 * Monitors APPROVED periods ready for execution
 */
const PayrollPeriod = require('../models/PayrollPeriod');
const PayrollProcessingService = require('../services/payrollProcessingService');

const runPayrollProcessingJob = async () => {
  try {
    const approvedPeriods = await PayrollPeriod.find({ status: 'APPROVED' });

    for (const period of approvedPeriods) {
      console.log(`[PayrollProcessingJob] Executing run for approved period ${period.periodCode}...`);
      await PayrollProcessingService.executePayrollRun(period._id, { userId: 'CRON_JOB', name: 'Auto Processing' });
    }
  } catch (err) {
    console.error('[PayrollProcessingJob] Error executing job:', err.message);
  }
};

module.exports = { runPayrollProcessingJob };
