const Employee = require('../models/Employee');
const Shift = require('../models/Shift');
const ShiftAssignment = require('../models/ShiftAssignment');
const ShiftConflict = require('../models/ShiftConflict');
const ExceptionCase = require('../models/ExceptionCase');
const ExceptionService = require('./ExceptionService');
const AuditService = require('./AuditService');
const IdGeneratorService = require('./IdGeneratorService');
const ShiftService = require('./shiftService');

class ShiftValidationService {
  /**
   * Normalize date to midnight
   */
  static normalizeDate(dateInput) {
    const d = new Date(dateInput);
    d.setHours(0, 0, 0, 0);
    return d;
  }

  /**
   * Validate a single proposed assignment against employee status, leaves, departments, and overlapping shifts
   */
  static async validateAssignment({
    employeeId,
    shiftId,
    assignmentDate,
    departmentId = null,
    rosterId = null,
    excludeAssignmentId = null
  }) {
    const conflicts = [];
    const normalizedDate = this.normalizeDate(assignmentDate);

    // 1. Employee existence and status validation (Sec 17, 19, 20)
    let employee = null;
    if (typeof employeeId === 'object' && employeeId._id) {
      employee = employeeId;
    } else {
      employee = await Employee.findOne({
        $or: [
          ...(employeeId.match(/^[0-9a-fA-F]{24}$/) ? [{ _id: employeeId }] : []),
          { employeeId: employeeId }
        ]
      }).populate('departmentAssignments.departmentId');
    }

    if (!employee) {
      conflicts.push({
        conflictType: 'MISSING_EMPLOYEE',
        severity: 'CRITICAL',
        description: `Employee '${employeeId}' does not exist in Staff Management.`,
        date: normalizedDate
      });
      return { isValid: false, conflicts, employee: null, shift: null };
    }

    const empStatus = (employee.status || employee.employmentStatus || 'ACTIVE').toUpperCase();
    if (empStatus === 'TERMINATED' || empStatus === 'INACTIVE') {
      conflicts.push({
        conflictType: 'INACTIVE_EMPLOYEE',
        severity: 'CRITICAL',
        employeeId: employee._id,
        employeeIdCode: employee.employeeId,
        date: normalizedDate,
        description: `Cannot assign shifts to ${empStatus} employee ${employee.employeeId} (${employee.firstName} ${employee.lastName}).`
      });
    }

    if (empStatus === 'ON_LEAVE' || empStatus === 'SUSPENDED') {
      conflicts.push({
        conflictType: 'LEAVE_CONFLICT',
        severity: 'CRITICAL',
        employeeId: employee._id,
        employeeIdCode: employee.employeeId,
        date: normalizedDate,
        description: `Employee ${employee.employeeId} has status ${empStatus} on ${normalizedDate.toISOString().split('T')[0]}.`
      });
    }

    // Module 15 Leave Management Integration: Check approved leave records on date
    try {
      const LeaveRequest = require('../models/LeaveRequest');
      const approvedLeave = await LeaveRequest.findOne({
        employeeId: employee._id,
        status: 'APPROVED',
        startDate: { $lte: normalizedDate },
        endDate: { $gte: normalizedDate }
      });

      if (approvedLeave) {
        conflicts.push({
          conflictType: 'LEAVE_CONFLICT',
          severity: 'CRITICAL',
          employeeId: employee._id,
          employeeIdCode: employee.employeeId,
          date: normalizedDate,
          description: `Employee ${employee.employeeId} has approved ${approvedLeave.leaveTypeCode || 'LEAVE'} (${approvedLeave.requestNumber}) on ${normalizedDate.toISOString().split('T')[0]}.`
        });
      }
    } catch (e) {}

    // 2. Shift Definition validation (Sec 6, 7)
    let shift = null;
    if (typeof shiftId === 'object' && shiftId._id) {
      shift = shiftId;
    } else {
      shift = await Shift.findOne({
        $or: [
          ...(shiftId.match(/^[0-9a-fA-F]{24}$/) ? [{ _id: shiftId }] : []),
          { shiftId: shiftId },
          { shiftCode: (shiftId || '').toUpperCase() }
        ]
      });
    }

    if (!shift) {
      conflicts.push({
        conflictType: 'INVALID_SHIFT',
        severity: 'CRITICAL',
        employeeId: employee._id,
        employeeIdCode: employee.employeeId,
        date: normalizedDate,
        description: `Shift definition '${shiftId}' does not exist.`
      });
      return { isValid: false, conflicts, employee, shift: null };
    }

    if (shift.status === 'ARCHIVED' || shift.status === 'INACTIVE') {
      conflicts.push({
        conflictType: 'INVALID_SHIFT',
        severity: 'CRITICAL',
        employeeId: employee._id,
        employeeIdCode: employee.employeeId,
        date: normalizedDate,
        description: `Shift '${shift.shiftCode}' is currently ${shift.status} and cannot be assigned.`
      });
    }

    // 3. Department validation (Sec 18)
    const targetDepartmentId = departmentId || shift.departmentIds?.[0] || null;
    if (targetDepartmentId && employee.departmentAssignments && employee.departmentAssignments.length > 0) {
      const activeDepts = employee.departmentAssignments
        .filter(da => da.status === 'ACTIVE')
        .map(da => (da.departmentId?._id || da.departmentId || '').toString());

      const tDepStr = targetDepartmentId._id ? targetDepartmentId._id.toString() : targetDepartmentId.toString();
      if (activeDepts.length > 0 && !activeDepts.includes(tDepStr)) {
        conflicts.push({
          conflictType: 'DEPARTMENT_CONFLICT',
          severity: 'WARNING',
          employeeId: employee._id,
          employeeIdCode: employee.employeeId,
          date: normalizedDate,
          description: `Employee ${employee.employeeId} is not assigned to the shift department.`
        });
      }
    }

    // 4. Overlap & Duplicate check (Sec 17, 8)
    // Check assignments for this employee on date - 1, date, and date + 1 to account for cross-midnight
    const prevDay = new Date(normalizedDate);
    prevDay.setDate(prevDay.getDate() - 1);
    const nextDay = new Date(normalizedDate);
    nextDay.setDate(nextDay.getDate() + 1);

    const query = {
      employeeId: employee._id,
      assignmentDate: { $gte: prevDay, $lte: nextDay },
      status: { $in: ['DRAFT', 'PENDING_APPROVAL', 'APPROVED', 'PUBLISHED'] }
    };
    if (excludeAssignmentId) {
      query._id = { $ne: excludeAssignmentId };
    }

    const existingAssignments = await ShiftAssignment.find(query).populate('shiftId');

    const proposedWindow = ShiftService.calculateShiftWindow(shift, normalizedDate);

    for (const existing of existingAssignments) {
      if (!existing.shiftId) continue;

      const existingDateNorm = this.normalizeDate(existing.assignmentDate);
      const isSameDate = existingDateNorm.getTime() === normalizedDate.getTime();

      // Check Duplicate
      if (isSameDate && existing.shiftId._id.toString() === shift._id.toString()) {
        conflicts.push({
          conflictType: 'DUPLICATE_ASSIGNMENT',
          severity: 'CRITICAL',
          employeeId: employee._id,
          employeeIdCode: employee.employeeId,
          assignmentId: existing._id,
          date: normalizedDate,
          description: `Employee ${employee.employeeId} is already assigned to shift '${shift.shiftCode}' on ${normalizedDate.toISOString().split('T')[0]}.`
        });
        continue;
      }

      // Check Overlapping working windows
      const existingWindow = ShiftService.calculateShiftWindow(existing.shiftId, existing.assignmentDate);
      const overlaps = (
        proposedWindow.startDateTime < existingWindow.endDateTime &&
        proposedWindow.endDateTime > existingWindow.startDateTime
      );

      if (overlaps) {
        conflicts.push({
          conflictType: 'OVERLAPPING_SHIFT',
          severity: 'CRITICAL',
          employeeId: employee._id,
          employeeIdCode: employee.employeeId,
          assignmentId: existing._id,
          date: normalizedDate,
          description: `Shift '${shift.shiftCode}' (${shift.startTime}-${shift.endTime}) overlaps with existing shift '${existing.shiftId.shiftCode}' (${existing.shiftId.startTime}-${existing.shiftId.endTime}) for employee ${employee.employeeId}.`
        });
      }
    }

    const hasCritical = conflicts.some(c => c.severity === 'CRITICAL');
    return {
      isValid: !hasCritical,
      conflicts,
      employee,
      shift
    };
  }

  /**
   * Run full conflict detection across all assignments of a Roster (Sec 17-20, 32, 49)
   */
  static async detectRosterConflicts(rosterId) {
    const Roster = require('../models/Roster');
    const roster = await Roster.findById(rosterId);
    if (!roster) throw new Error(`Roster not found: ${rosterId}`);

    const assignments = await ShiftAssignment.find({
      rosterId: roster._id,
      status: { $ne: 'CANCELLED' }
    }).populate('shiftId').populate('employeeId');

    const detectedConflicts = [];

    for (const assignment of assignments) {
      if (!assignment.employeeId || !assignment.shiftId) continue;

      const valResult = await this.validateAssignment({
        employeeId: assignment.employeeId,
        shiftId: assignment.shiftId,
        assignmentDate: assignment.assignmentDate,
        departmentId: roster.departmentId,
        rosterId: roster._id,
        excludeAssignmentId: assignment._id
      });

      if (valResult.conflicts && valResult.conflicts.length > 0) {
        for (const c of valResult.conflicts) {
          detectedConflicts.push({
            ...c,
            rosterId: roster._id,
            assignmentId: assignment._id
          });
        }
      }
    }

    // Persist conflicts into ShiftConflict collection
    const savedConflicts = [];
    for (const dc of detectedConflicts) {
      // Deduplicate if already open
      const existingConflict = await ShiftConflict.findOne({
        rosterId: roster._id,
        assignmentId: dc.assignmentId,
        conflictType: dc.conflictType,
        status: 'OPEN'
      });

      if (!existingConflict) {
        const conflictId = await IdGeneratorService.generateShiftConflictId();
        const sc = new ShiftConflict({
          conflictId,
          conflictType: dc.conflictType,
          severity: dc.severity,
          rosterId: roster._id,
          assignmentId: dc.assignmentId,
          employeeId: dc.employeeId,
          employeeIdCode: dc.employeeIdCode,
          date: dc.date,
          description: dc.description,
          status: 'OPEN'
        });
        await sc.save();
        savedConflicts.push(sc);

        // Raise exception if critical
        if (dc.severity === 'CRITICAL') {
          await ExceptionService.raiseException({
            module: 'SHIFT_MANAGEMENT',
            entityType: 'ShiftConflict',
            entityId: sc.conflictId,
            referenceType: 'Roster',
            referenceId: roster.rosterId,
            exceptionType: dc.conflictType,
            description: dc.description,
            severity: 'HIGH',
            source: 'SYSTEM'
          }).catch(() => {});
        }
      } else {
        savedConflicts.push(existingConflict);
      }
    }

    const criticalCount = savedConflicts.filter(c => c.severity === 'CRITICAL' && c.status === 'OPEN').length;
    const warningCount = savedConflicts.filter(c => c.severity === 'WARNING' && c.status === 'OPEN').length;

    return {
      rosterId: roster.rosterId,
      totalConflicts: savedConflicts.length,
      criticalCount,
      warningCount,
      canPublish: criticalCount === 0,
      conflicts: savedConflicts
    };
  }

  /**
   * Resolve an open Shift Conflict
   */
  static async resolveConflict(conflictId, { resolutionNotes = '', dismiss = false }, user = null) {
    const conflict = await ShiftConflict.findOne({
      $or: [
        ...(conflictId.match(/^[0-9a-fA-F]{24}$/) ? [{ _id: conflictId }] : []),
        { conflictId: conflictId }
      ]
    });

    if (!conflict) throw new Error(`Conflict not found: ${conflictId}`);

    conflict.status = dismiss ? 'DISMISSED' : 'RESOLVED';
    conflict.resolutionNotes = resolutionNotes || (dismiss ? 'Dismissed by authorized administrator' : 'Resolved by user');
    conflict.resolvedBy = user?._id || null;
    conflict.resolvedAt = new Date();
    await conflict.save();

    await AuditService.logEvent({
      userId: user?.userId || 'SYSTEM',
      actorRole: user?.role || 'HR_MANAGER',
      action: 'SHIFT_CONFLICT_RESOLVED',
      module: 'SHIFT_MANAGEMENT',
      entityType: 'ShiftConflict',
      entityId: conflict.conflictId,
      details: `Shift conflict ${conflict.conflictId} (${conflict.conflictType}) marked ${conflict.status}.`
    });

    return conflict;
  }
}

module.exports = ShiftValidationService;
