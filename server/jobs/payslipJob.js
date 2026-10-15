/**
 * Payslip Generation & Publication Job
 */
const PayrollPeriod = require('../models/PayrollPeriod');
const PayslipService = require('../services/payslipService');

const runPayslipJob = async () => {
  try {
    const processedPeriods = await PayrollPeriod.find({ status: 'PROCESSED' });

    for (const period of processedPeriods) {
      console.log(`[PayslipJob] Generating payslips for processed period ${period.periodCode}...`);
      await PayslipService.generatePayslipsForPeriod(period._id, { userId: 'CRON_JOB', name: 'Payslip Auto Generator' });
    }
  } catch (err) {
    console.error('[PayslipJob] Error executing job:', err.message);
  }
};

module.exports = { runPayslipJob };
