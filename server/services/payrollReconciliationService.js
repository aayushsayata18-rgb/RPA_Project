const PayrollPeriod = require('../models/PayrollPeriod');
const PayrollInput = require('../models/PayrollInput');
const PayrollResult = require('../models/PayrollResult');
const ExceptionService = require('./ExceptionService');
const AuditService = require('./AuditService');

class PayrollReconciliationService {
  /**
   * Reconcile Internal Payroll Inputs with Results
   */
  static async reconcileInternal(periodIdOrCode) {
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
    const results = await PayrollResult.find({ payrollPeriodId: period._id });

    const inputEmpCodes = new Set(inputs.map(i => i.employeeIdCode));
    const resultEmpCodes = new Set(results.map(r => r.employeeIdCode));

    const missingInResults = [];
    for (const code of inputEmpCodes) {
      if (!resultEmpCodes.has(code)) {
        missingInResults.push(code);
      }
    }

    const unexpectedInResults = [];
    for (const code of resultEmpCodes) {
      if (!inputEmpCodes.has(code)) {
        unexpectedInResults.push(code);
      }
    }

    // Check for duplicate results per employee
    const seen = new Set();
    const duplicates = [];
    for (const r of results) {
      if (seen.has(r.employeeIdCode)) {
        duplicates.push(r.employeeIdCode);
      }
      seen.add(r.employeeIdCode);
    }

    const totalGross = Math.round(results.reduce((sum, r) => sum + r.grossEarnings, 0) * 100) / 100;
    const totalDeductions = Math.round(results.reduce((sum, r) => sum + r.totalDeductions, 0) * 100) / 100;
    const totalNet = Math.round(results.reduce((sum, r) => sum + r.netPay, 0) * 100) / 100;

    const isMatched = missingInResults.length === 0 && unexpectedInResults.length === 0 && duplicates.length === 0;

    return {
      periodCode: period.periodCode,
      status: isMatched ? 'MATCHED' : 'DISCREPANCY',
      inputCount: inputs.length,
      resultCount: results.length,
      missingInResults,
      unexpectedInResults,
      duplicates,
      totals: {
        totalGross,
        totalDeductions,
        totalNet
      }
    };
  }

  /**
   * Reconcile External Payroll System Results
   */
  static async reconcileExternal(periodIdOrCode, externalPayload, correlationId = null) {
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

    const internalInputs = await PayrollInput.find({
      payrollPeriodId: period._id,
      status: { $ne: 'EXCEPTION' }
    });

    const internalCount = internalInputs.length;
    const externalRecords = Array.isArray(externalPayload.records) ? externalPayload.records : [];
    const externalCount = externalRecords.length;

    const internalCodes = new Set(internalInputs.map(i => i.employeeIdCode));
    const externalCodes = new Set(externalRecords.map(r => r.employeeIdCode || r.employeeCode));

    const missingInExternal = [];
    for (const code of internalCodes) {
      if (!externalCodes.has(code)) {
        missingInExternal.push(code);
      }
    }

    const unexpectedInExternal = [];
    for (const code of externalCodes) {
      if (!internalCodes.has(code)) {
        unexpectedInExternal.push(code);
      }
    }

    const isMatch = missingInExternal.length === 0 && unexpectedInExternal.length === 0 && internalCount === externalCount;

    if (!isMatch) {
      // Raise ExceptionCase (Section 54)
      await ExceptionService.raiseException({
        module: 'PAYROLL',
        entityType: 'PAYROLL_PERIOD',
        entityId: period.periodCode,
        exceptionType: 'PAYROLL_RESULT_MISMATCH',
        description: `External payroll mismatch for ${period.periodCode}: Submitted ${internalCount} employees, but external returned ${externalCount}. Missing: ${missingInExternal.join(', ')}`,
        severity: 'HIGH',
        correlationId,
        metadata: {
          periodCode: period.periodCode,
          submittedCount: internalCount,
          returnedCount: externalCount,
          missingInExternal,
          unexpectedInExternal
        }
      });
    }

    await AuditService.logEvent({
      action: 'EXTERNAL_PAYROLL_RECONCILED',
      module: 'PAYROLL',
      entityId: period._id.toString(),
      entityType: 'PayrollPeriod',
      performedBy: 'RPA_CONNECTOR',
      correlationId,
      details: {
        periodCode: period.periodCode,
        submittedCount: internalCount,
        externalCount,
        isMatch
      }
    });

    return {
      success: isMatch,
      status: isMatch ? 'RECONCILED' : 'MISMATCH_DETECTED',
      submittedCount: internalCount,
      externalCount,
      missingInExternal,
      unexpectedInExternal
    };
  }
}

module.exports = PayrollReconciliationService;
