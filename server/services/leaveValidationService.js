const Employee = require('../models/Employee');
const LeaveType = require('../models/LeaveType');
const LeavePolicy = require('../models/LeavePolicy');
const LeaveBalance = require('../models/LeaveBalance');
const LeaveRequest = require('../models/LeaveRequest');
const HolidayCalendar = require('../models/HolidayCalendar');
const ShiftAssignment = require('../models/ShiftAssignment');
const ExceptionService = require('./ExceptionService');

class LeaveValidationService {
  /**
   * Normalize date to midnight (00:00:00.000)
   */
  static normalizeDate(dateInput) {
    const d = new Date(dateInput);
    d.setHours(0, 0, 0, 0);
    return d;
  }

  /**
   * Calculate leave duration taking into account dayType, holidays, and weekends
   */
  static async calculateDuration({
    startDate,
    endDate,
    dayType = 'FULL_DAY',
    partialStartTime = null,
    partialEndTime = null,
    departmentId = null,
    excludeHolidays = true
  }) {
    const start = this.normalizeDate(startDate);
    const end = this.normalizeDate(endDate);

    if (start > end) {
      throw new Error('Start date cannot be after end date.');
    }

    if (dayType === 'FIRST_HALF' || dayType === 'SECOND_HALF') {
      return 0.5;
    }

    if (dayType === 'PARTIAL_DAY') {
      if (!partialStartTime || !partialEndTime) {
        throw new Error('Partial day leave requires both partialStartTime and partialEndTime.');
      }
      const [sh, sm] = partialStartTime.split(':').map(Number);
      const [eh, em] = partialEndTime.split(':').map(Number);
      const hours = (eh * 60 + em - (sh * 60 + sm)) / 60;
      if (hours <= 0) {
        throw new Error('Partial end time must be after partial start time.');
      }
      // Assuming 8-hour workday standard for partial fraction
      return parseFloat((hours / 8).toFixed(2));
    }

    // Full day calculation across date span
    let current = new Date(start);
    let totalDays = 0;

    // Fetch holidays if applicable
    let holidays = [];
    if (excludeHolidays) {
      holidays = await HolidayCalendar.find({
        date: { $gte: start, $lte: end },
        status: 'ACTIVE',
        $or: [
          { isAllDepartments: true },
          ...(departmentId ? [{ applicableDepartments: departmentId }] : [])
        ]
      }).select('date').lean();
    }
    const holidayTimestamps = new Set(holidays.map(h => this.normalizeDate(h.date).getTime()));

    while (current <= end) {
      const curTime = current.getTime();
      if (!holidayTimestamps.has(curTime)) {
        totalDays++;
      }
      current.setDate(current.getDate() + 1);
    }

    return Math.max(totalDays, 1);
  }

  /**
   * Validate a proposed leave request against all business rules
   */
  static async validateLeaveRequest({
    employeeId,
    leaveTypeId,
    startDate,
    endDate,
    dayType = 'FULL_DAY',
    partialStartTime = null,
    partialEndTime = null,
    reason,
    documents = [],
    excludeRequestId = null
  }) {
    const validationErrors = [];
    const warnings = [];

    // 1. Employee Verification
    const employee = await Employee.findById(employeeId);
    if (!employee) {
      validationErrors.push('Employee does not exist in Staff Management.');
      return { isValid: false, errors: validationErrors, warnings };
    }

    const empStatus = (employee.status || 'ACTIVE').toUpperCase();
    if (empStatus === 'TERMINATED' || empStatus === 'INACTIVE') {
      validationErrors.push(`Cannot request leave for ${empStatus} employee.`);
    }

    // 2. Leave Type Verification
    const leaveType = await LeaveType.findById(leaveTypeId);
    if (!leaveType) {
      validationErrors.push('Leave type does not exist.');
      return { isValid: false, errors: validationErrors, warnings };
    }

    if (leaveType.status !== 'ACTIVE') {
      validationErrors.push(`Leave type '${leaveType.name}' is ${leaveType.status} and cannot be requested.`);
    }

    // 3. Day Type Validation
    if ((dayType === 'FIRST_HALF' || dayType === 'SECOND_HALF') && !leaveType.allowHalfDay) {
      validationErrors.push(`Half-day leave is not permitted for leave type '${leaveType.name}'.`);
    }

    if (dayType === 'PARTIAL_DAY' && !leaveType.allowPartialDay) {
      validationErrors.push(`Partial-day leave is not permitted for leave type '${leaveType.name}'.`);
    }

    const start = this.normalizeDate(startDate);
    const end = this.normalizeDate(endDate);

    if (start > end) {
      validationErrors.push('Start date cannot be after end date.');
    }

    // Notice Period Validation
    if (leaveType.minimumNoticeHours > 0) {
      const now = new Date();
      const diffHours = (start.getTime() - now.getTime()) / (1000 * 60 * 60);
      if (diffHours < leaveType.minimumNoticeHours) {
        warnings.push(`Notice period of ${leaveType.minimumNoticeHours} hours recommended. Request submitted with ${Math.max(0, Math.round(diffHours))} hours notice.`);
      }
    }

    // 4. Leave Policy Lookup
    const primaryDeptId = employee.departmentAssignments?.find(d => d.isPrimary && d.status === 'ACTIVE')?.departmentId?._id || null;
    const empType = employee.designation ? employee.designation.toUpperCase() : 'ALL';

    const policy = await LeavePolicy.findOne({
      leaveTypeId: leaveType._id,
      status: 'ACTIVE',
      $or: [
        { departmentId: primaryDeptId },
        { departmentId: null }
      ]
    }).sort({ departmentId: -1, version: -1 });

    const duration = await this.calculateDuration({
      startDate: start,
      endDate: end,
      dayType,
      partialStartTime,
      partialEndTime,
      departmentId: primaryDeptId
    });

    // Maximum Continuous Days Check
    const maxContinuous = policy?.maximumContinuousDays || leaveType.maximumContinuousDays;
    if (maxContinuous && duration > maxContinuous) {
      validationErrors.push(`Requested duration (${duration} days) exceeds maximum continuous limit of ${maxContinuous} days.`);
    }

    // Document Requirement Check (Sec 31: Documentation required after N days)
    const docRequiredDays = policy?.documentationRequiredAfterDays || leaveType.documentRequiredAfterDays || 0;
    const isDocMandatory = leaveType.requiresDocument || (docRequiredDays > 0 && duration > docRequiredDays);
    if (isDocMandatory && (!documents || documents.length === 0)) {
      validationErrors.push(`Supporting document is mandatory for '${leaveType.name}' requests exceeding ${docRequiredDays} day(s).`);
    }

    // 5. Overlapping Leave Detection
    const overlapQuery = {
      employeeId: employee._id,
      status: { $in: ['PENDING', 'UNDER_REVIEW', 'APPROVED'] },
      $or: [
        { startDate: { $lte: end }, endDate: { $gte: start } }
      ]
    };
    if (excludeRequestId) {
      overlapQuery._id = { $ne: excludeRequestId };
    }

    const existingLeaves = await LeaveRequest.find(overlapQuery).populate('leaveTypeId');
    if (existingLeaves.length > 0) {
      for (const ex of existingLeaves) {
        // If exact same date and different leave type, flag as multi-type conflict
        if (ex.leaveTypeId._id.toString() !== leaveType._id.toString()) {
          validationErrors.push(`Conflict: Employee already has '${ex.leaveTypeId.name}' (${ex.status}) scheduled between ${ex.startDate.toISOString().split('T')[0]} and ${ex.endDate.toISOString().split('T')[0]}.`);
        } else {
          validationErrors.push(`Leave overlap: Employee already has leave requested/approved for ${ex.startDate.toISOString().split('T')[0]} to ${ex.endDate.toISOString().split('T')[0]}.`);
        }
      }
    }

    // 6. Balance Verification
    let availableBalance = 0;
    if (leaveType.balanceTracked) {
      const currentYear = start.getFullYear();
      let balance = await LeaveBalance.findOne({
        employeeId: employee._id,
        leaveTypeId: leaveType._id,
        year: currentYear
      });

      if (!balance) {
        // If balance record not initialized, check policy default
        availableBalance = policy?.annualEntitlement || 0;
      } else {
        availableBalance = balance.available;
      }

      if (availableBalance < duration) {
        const negativeAllowed = policy?.negativeBalanceAllowed || false;
        if (!negativeAllowed) {
          validationErrors.push(`Insufficient leave balance: Available is ${availableBalance} days, but requested is ${duration} days.`);
        } else {
          warnings.push(`Request exceeds current balance by ${duration - availableBalance} days (Allowed under negative balance policy).`);
        }
      }
    }

    // 7. Shift Conflict Detection (Information / Warning)
    try {
      const scheduledShifts = await ShiftAssignment.find({
        employeeId: employee._id,
        assignmentDate: { $gte: start, $lte: end },
        status: { $in: ['PUBLISHED', 'APPROVED'] }
      }).populate('shiftId');

      if (scheduledShifts.length > 0) {
        warnings.push(`Employee has ${scheduledShifts.length} published shift assignment(s) during this period which will require reconciliation upon approval.`);
      }
    } catch (e) {}

    return {
      isValid: validationErrors.length === 0,
      errors: validationErrors,
      warnings,
      duration,
      employee,
      leaveType,
      policy,
      availableBalance
    };
  }
}

module.exports = LeaveValidationService;
