const Payslip = require('../models/Payslip');
const PayrollResult = require('../models/PayrollResult');
const PayrollPeriod = require('../models/PayrollPeriod');
const PayrollInput = require('../models/PayrollInput');
const Employee = require('../models/Employee');
const IdGeneratorService = require('./IdGeneratorService');
const AuditService = require('./AuditService');
const NotificationService = require('./NotificationService');

class PayslipService {
  /**
   * Generate Payslips for a processed Payroll Period
   */
  static async generatePayslipsForPeriod(periodIdOrCode, actorUser) {
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

    const results = await PayrollResult.find({
      payrollPeriodId: period._id,
      status: { $in: ['CALCULATED', 'VERIFIED', 'FINALIZED'] }
    });

    if (results.length === 0) {
      throw new Error('No payroll results available to generate payslips');
    }

    const actorId = actorUser?.userId || actorUser?.name || 'PAYROLL_ADMIN';
    const generatedPayslips = [];

    for (const res of results) {
      const input = await PayrollInput.findById(res.payrollInputId);
      const emp = await Employee.findById(res.employeeId);

      // Check if payslip already exists
      let payslip = await Payslip.findOne({
        payrollPeriodId: period._id,
        employeeId: res.employeeId
      });

      if (!payslip) {
        const payslipNumber = await IdGeneratorService.generatePayslipNumber(period.periodCode);

        // Masked bank details
        const maskedBank = {
          bankName: 'Hospital Premier Bank',
          accountNumberMasked: '••••••••' + (emp?.contactDetails?.phone?.slice(-4) || '1234')
        };

        payslip = new Payslip({
          payslipNumber,
          payrollPeriodId: period._id,
          periodCode: period.periodCode,
          payrollResultId: res._id,
          employeeId: res.employeeId,
          employeeIdCode: res.employeeIdCode,
          employeeName: input?.employeeSnapshot?.employeeName || emp?.name || res.employeeIdCode,
          departmentName: input?.employeeSnapshot?.departmentName || 'General',
          designation: input?.employeeSnapshot?.designation || 'Staff',
          bankDetailsMasked: maskedBank,
          documentId: `DOC-${payslipNumber}`,
          grossAmount: res.grossEarnings,
          deductionAmount: res.totalDeductions,
          netAmount: res.netPay,
          currency: res.currency,
          attendanceSummary: {
            scheduledDays: input?.attendanceSummary?.scheduledDays || 26,
            workedDays: input?.attendanceSummary?.workedDays || 0,
            absentDays: input?.attendanceSummary?.absentDays || 0,
            paidLeaveDays: input?.leaveSummary?.paidLeaveDays || 0,
            unpaidLeaveDays: input?.leaveSummary?.unpaidLeaveDays || 0,
            overtimeMinutes: input?.overtime?.approvedMinutes || 0
          },
          earningsBreakdown: res.breakdown?.earnings || [],
          deductionsBreakdown: res.breakdown?.deductions || [],
          status: 'PUBLISHED',
          generatedAt: new Date(),
          publishedAt: new Date()
        });

        await payslip.save();

        // Dispatch notification
        try {
          await NotificationService.sendNotification({
            userId: emp?.userId || null,
            recipient: emp?.email || res.employeeIdCode,
            channel: 'IN_APP',
            templateCode: 'PAYSLIP_AVAILABLE',
            event: 'PAYSLIP_AVAILABLE',
            subject: `Your ${period.periodCode} payslip is now available`,
            message: `Your payslip (${payslipNumber}) for period ${period.periodCode} has been generated. Net pay: $${res.netPay}.`,
            body: `Your payslip (${payslipNumber}) for period ${period.periodCode} has been generated. Net pay: $${res.netPay}.`
          });
        } catch (e) {
          // Non-blocking
        }
      }

      generatedPayslips.push(payslip);
    }

    await AuditService.logEvent({
      action: 'PAYSLIPS_GENERATED',
      module: 'PAYROLL',
      entityId: period._id.toString(),
      entityType: 'PayrollPeriod',
      performedBy: actorId,
      details: {
        periodCode: period.periodCode,
        count: generatedPayslips.length
      }
    });

    return {
      success: true,
      periodCode: period.periodCode,
      count: generatedPayslips.length,
      payslips: generatedPayslips
    };
  }

  /**
   * Get employee's own payslips
   */
  static async getEmployeePayslips(employeeId) {
    return await Payslip.find({ employeeId })
      .sort({ periodCode: -1 })
      .lean();
  }

  /**
   * View single payslip with identity verification and strict audit logging (Section 34, 75)
   */
  static async viewPayslip(payslipId, actorUser, ipAddress = null) {
    const payslip = await Payslip.findById(payslipId);
    if (!payslip) {
      throw new Error('Payslip not found');
    }

    const actorId = actorUser?.userId || actorUser?.employeeId || actorUser?.name || 'ANONYMOUS';
    const isHrOrAdmin = ['HR_MANAGER', 'PAYROLL_STAFF', 'ADMIN', 'SUPER_ADMIN'].includes(actorUser?.role);

    // Verify identity: normal employee can ONLY access their own payslip
    if (!isHrOrAdmin && actorUser?.employeeId && payslip.employeeIdCode !== actorUser.employeeId) {
      throw new Error('Unauthorized: You can only view your own payslip.');
    }

    // Append access log
    const correlationId = `VIEW-${Date.now()}`;
    payslip.accessLogs.push({
      accessedBy: actorId,
      accessedAt: new Date(),
      ipAddress,
      correlationId
    });
    await payslip.save();

    await AuditService.logEvent({
      action: 'PAYSLIP_VIEWED',
      module: 'PAYROLL',
      entityId: payslip._id.toString(),
      entityType: 'Payslip',
      performedBy: actorId,
      correlationId,
      details: {
        payslipNumber: payslip.payslipNumber,
        employeeIdCode: payslip.employeeIdCode,
        periodCode: payslip.periodCode
      }
    });

    return payslip;
  }
}

module.exports = PayslipService;
