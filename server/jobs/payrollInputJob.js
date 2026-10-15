/**
 * Payroll Input Scheduled Job
 * Periodically refreshes input collection and detects stale inputs
 */
const PayrollPeriod = require('../models/PayrollPeriod');
const PayrollInputService = require('../services/payrollInputService');

const runPayrollInputJob = async () => {
  try {
    const activePeriods = await PayrollPeriod.find({
      status: { $in: ['OPEN', 'INPUT_COLLECTION'] }
    });

    for (const period of activePeriods) {
      console.log(`[PayrollInputJob] Generating inputs for period ${period.periodCode}...`);
      await PayrollInputService.generateInputsForPeriod(period._id, { userId: 'CRON_JOB', name: 'Payroll Job' });
    }
  } catch (err) {
    console.error('[PayrollInputJob] Error executing job:', err.message);
  }
};

module.exports = { runPayrollInputJob };
