const mongoose = require('mongoose');
const PayrollPeriod = require('../models/PayrollPeriod');
const PayrollInput = require('../models/PayrollInput');
const PayrollInputVersion = require('../models/PayrollInputVersion');
const Employee = require('../models/Employee');
const Attendance = require('../models/Attendance');
const LeaveRequest = require('../models/LeaveRequest');
const OvertimeRecord = require('../models/OvertimeRecord');
const PayrollAdjustment = require('../models/PayrollAdjustment');
const SalaryConfigurationService = require('./salaryConfigurationService');
const IdGeneratorService = require('./IdGeneratorService');
const AuditService = require('./AuditService');

class PayrollInputService {
  /**
   * Generate or Refresh Payroll Inputs for a given Payroll Period
   */
  static async generateInputsForPeriod(periodIdOrCode, actorUser, options = {}) {
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

    if (period.status === 'FINALIZED') {
      throw new Error('Cannot regenerate inputs for a FINALIZED payroll period');
    }

    const { startDate, endDate, periodCode } = period;
    const actorId = actorUser?.userId || actorUser?.name || 'SYSTEM';

    // 1. Fetch eligible employees (ACTIVE during period)
    const empQuery = { status: { $in: ['ACTIVE', 'ON_LEAVE'] } };
    if (Array.isArray(options.employeeIds) && options.employeeIds.length > 0) {
      empQuery._id = { $in: options.employeeIds };
    } else if (Array.isArray(options.employeeIdCodes) && options.employeeIdCodes.length > 0) {
      empQuery.employeeId = { $in: options.employeeIdCodes };
    }

    const employees = await Employee.find(empQuery);

    const inputsGenerated = [];
    let validCount = 0;
    let warningCount = 0;
    let errorCount = 0;

    for (const emp of employees) {
      // 2. Fetch Attendance for this period
      const attendances = await Attendance.find({
        employeeId: emp._id,
        attendanceDate: { $gte: startDate, $lte: endDate }
      });

      let workedDays = 0;
      let absentDays = 0;
      let lateDays = 0;
      let lateMinutes = 0;
      let workedMinutes = 0;
      let earlyDepartures = 0;

      for (const att of attendances) {
        if (['PRESENT', 'HALF_DAY', 'ON_DUTY'].includes(att.status)) {
          workedDays += att.status === 'HALF_DAY' ? 0.5 : 1;
        } else if (att.status === 'ABSENT') {
          absentDays += 1;
        }
        if (att.status === 'LATE' || att.lateMinutes > 0 || att.flags?.isLate) {
          lateDays += 1;
          lateMinutes += att.lateMinutes || att.flags?.lateMinutes || 0;
        }
        if (att.earlyDepartureMinutes > 0 || att.flags?.isEarlyDeparture) {
          earlyDepartures += 1;
        }
        workedMinutes += att.workedMinutes || 0;
      }

      // Estimate scheduled days in period (excluding weekends if no shift records)
      const scheduledDays = attendances.length > 0 ? attendances.length : 26;

      // 3. Fetch APPROVED Leave for this period
      const approvedLeaves = await LeaveRequest.find({
        employeeId: emp._id,
        status: 'APPROVED',
        startDate: { $lte: endDate },
        endDate: { $gte: startDate }
      }).populate('leaveTypeId');

      let paidLeaveDays = 0;
      let unpaidLeaveDays = 0;
      let otherLeaveDays = 0;

      for (const lv of approvedLeaves) {
        const isPaid = lv.leaveTypeId?.isPaid !== false;
        if (isPaid) {
          paidLeaveDays += lv.durationDays || 1;
        } else {
          unpaidLeaveDays += lv.durationDays || 1;
        }
      }

      // 4. Fetch APPROVED Overtime for this period
      const overtimeRecords = await OvertimeRecord.find({
        employeeId: emp._id,
        date: { $gte: startDate, $lte: endDate }
      });

      let candidateMinutes = 0;
      let approvedMinutes = 0;

      for (const ot of overtimeRecords) {
        candidateMinutes += ot.candidateMinutes || 0;
        if (ot.status === 'APPROVED') {
          approvedMinutes += ot.approvedMinutes || 0;
        }
      }

      // 5. Fetch Effective Salary Assignment
      const salaryAssignment = await SalaryConfigurationService.getEffectiveSalaryAssignment(
        emp._id,
        endDate
      );

      // 6. Fetch Approved Adjustments
      const adjustments = await PayrollAdjustment.find({
        employeeId: emp._id,
        payrollPeriodId: period._id,
        status: 'APPROVED'
      });

      const allowances = [];
      const deductions = [];

      if (salaryAssignment && Array.isArray(salaryAssignment.components)) {
        for (const comp of salaryAssignment.components) {
          if (comp.type === 'EARNING') {
            allowances.push({
              code: comp.code,
              name: comp.name,
              amount: comp.amount,
              type: 'SALARY_COMPONENT'
            });
          } else if (comp.type === 'DEDUCTION') {
            deductions.push({
              code: comp.code,
              name: comp.name,
              amount: comp.amount,
              type: 'SALARY_DEDUCTION'
            });
          }
        }
      }

      for (const adj of adjustments) {
        if (adj.adjustmentType === 'EARNING' || adj.adjustmentType === 'REIMBURSEMENT') {
          allowances.push({
            code: adj.code,
            name: adj.name,
            amount: adj.amount,
            type: 'ADJUSTMENT'
          });
        } else if (adj.adjustmentType === 'DEDUCTION') {
          deductions.push({
            code: adj.code,
            name: adj.name,
            amount: adj.amount,
            type: 'ADJUSTMENT'
          });
        }
      }

      // Source references for complete traceability
      const sourceReferences = [
        { sourceType: 'ATTENDANCE', sourceId: `ATT-${emp.employeeId}-${periodCode}`, sourceVersion: 1 },
        { sourceType: 'LEAVE', sourceId: `LV-${emp.employeeId}-${periodCode}`, sourceVersion: 1 },
        { sourceType: 'OVERTIME', sourceId: `OT-${emp.employeeId}-${periodCode}`, sourceVersion: 1 }
      ];

      if (salaryAssignment) {
        sourceReferences.push({
          sourceType: 'BONUS',
          sourceId: salaryAssignment.assignmentId,
          sourceVersion: salaryAssignment.version
        });
      }

      // Validation issues check
      const validationErrors = [];
      if (!salaryAssignment) {
        validationErrors.push({
          code: 'MISSING_SALARY_ASSIGNMENT',
          message: `No active salary assignment found for ${emp.employeeId}`,
          severity: 'ERROR'
        });
        errorCount++;
      } else {
        validCount++;
      }

      if (unpaidLeaveDays > 0) {
        validationErrors.push({
          code: 'UNPAID_LEAVE_DETECTED',
          message: `${unpaidLeaveDays} unpaid leave day(s) present in period`,
          severity: 'INFO'
        });
      }

      // 7. Check if PayrollInput exists -> Version if exists
      const existingInput = await PayrollInput.findOne({
        payrollPeriodId: period._id,
        employeeId: emp._id
      }).sort({ version: -1 });

      let inputVersion = 1;
      let inputDoc = null;

      if (existingInput) {
        // Archive existing version to PayrollInputVersion
        inputVersion = existingInput.version + 1;

        const archiveVersion = new PayrollInputVersion({
          payrollInputId: existingInput._id,
          payrollPeriodId: period._id,
          employeeId: emp._id,
          version: existingInput.version,
          snapshotData: existingInput.toObject(),
          changeReason: options.recalculationReason || 'Periodic input refresh/recalculation',
          sourceVersions: sourceReferences.map(s => ({
            sourceType: s.sourceType,
            sourceId: s.sourceId,
            version: s.sourceVersion
          })),
          createdBy: actorId
        });
        await archiveVersion.save();

        // Update existing document
        existingInput.version = inputVersion;
        existingInput.isStale = false;
        existingInput.staleReason = null;
        existingInput.attendanceSummary = {
          scheduledDays,
          workedDays,
          absentDays,
          lateDays,
          lateMinutes,
          workedMinutes,
          earlyDepartures
        };
        existingInput.leaveSummary = {
          paidLeaveDays,
          unpaidLeaveDays,
          otherLeaveDays
        };
        existingInput.overtime = {
          candidateMinutes,
          approvedMinutes
        };
        existingInput.allowances = allowances;
        existingInput.deductions = deductions;
        existingInput.sourceReferences = sourceReferences;
        existingInput.validationStatus = {
          isValid: validationErrors.filter(e => e.severity === 'ERROR').length === 0,
          errors: validationErrors
        };
        existingInput.status = validationErrors.some(e => e.severity === 'ERROR') ? 'EXCEPTION' : 'CALCULATED';
        existingInput.calculatedAt = new Date();
        await existingInput.save();
        inputDoc = existingInput;
      } else {
        const inputId = await IdGeneratorService.generatePayrollInputId();

        inputDoc = new PayrollInput({
          inputId,
          payrollPeriodId: period._id,
          periodCode: period.periodCode,
          employeeId: emp._id,
          employeeIdCode: emp.employeeId,
          version: 1,
          employeeSnapshot: {
            employeeCode: emp.employeeId,
            employeeName: `${emp.firstName || ''} ${emp.lastName || ''}`.trim() || emp.name || emp.employeeId,
            departmentId: mongoose.Types.ObjectId.isValid(emp.departmentAssignments?.[0]?.departmentId) ? emp.departmentAssignments[0].departmentId : null,
            departmentName: emp.departmentName || 'General',
            designation: emp.designation || 'Staff',
            employmentType: emp.employmentType || 'FULL_TIME',
            salaryStructureReference: salaryAssignment ? salaryAssignment.salaryStructureCode : null
          },
          attendanceSummary: {
            scheduledDays,
            workedDays,
            absentDays,
            lateDays,
            lateMinutes,
            workedMinutes,
            earlyDepartures
          },
          leaveSummary: {
            paidLeaveDays,
            unpaidLeaveDays,
            otherLeaveDays
          },
          overtime: {
            candidateMinutes,
            approvedMinutes
          },
          allowances,
          deductions,
          sourceReferences,
          validationStatus: {
            isValid: validationErrors.filter(e => e.severity === 'ERROR').length === 0,
            errors: validationErrors
          },
          status: validationErrors.some(e => e.severity === 'ERROR') ? 'EXCEPTION' : 'CALCULATED',
          calculatedAt: new Date()
        });

        await inputDoc.save();
      }

      inputsGenerated.push(inputDoc);
    }

    // Update Period summary
    period.summary.totalEmployees = employees.length;
    period.summary.validCount = validCount;
    period.summary.errorCount = errorCount;
    period.summary.warningCount = warningCount;
    if (period.status === 'OPEN' || period.status === 'DRAFT') {
      period.status = 'INPUT_COLLECTION';
    }
    await period.save();

    await AuditService.logEvent({
      action: 'PAYROLL_INPUTS_GENERATED',
      module: 'PAYROLL',
      entityId: period._id.toString(),
      entityType: 'PayrollPeriod',
      performedBy: actorId,
      details: {
        periodCode: period.periodCode,
        employeeCount: employees.length,
        validCount,
        errorCount
      }
    });

    return {
      periodCode: period.periodCode,
      totalEmployees: employees.length,
      validCount,
      errorCount,
      inputs: inputsGenerated
    };
  }

  /**
   * Stale input detection: When attendance or leave is corrected, invalidate payroll inputs
   */
  static async markStaleIfSourceChanged(sourceType, employeeId, targetDate, reason = 'Source correction detected') {
    const date = new Date(targetDate);
    const affectedPeriods = await PayrollPeriod.find({
      startDate: { $lte: date },
      endDate: { $gte: date },
      status: { $nin: ['CANCELLED'] }
    });

    const results = [];
    for (const period of affectedPeriods) {
      if (period.status === 'FINALIZED') {
        // Finalized payroll cannot be silently modified; adjustment case required
        continue;
      }

      const input = await PayrollInput.findOne({
        payrollPeriodId: period._id,
        employeeId
      });

      if (input) {
        input.isStale = true;
        input.staleReason = `STALE: ${sourceType} updated on ${targetDate}. Reason: ${reason}`;
        input.status = 'PENDING_REVIEW';
        await input.save();
        results.push({ periodCode: period.periodCode, inputId: input.inputId });
      }
    }

    return results;
  }
}

module.exports = PayrollInputService;
