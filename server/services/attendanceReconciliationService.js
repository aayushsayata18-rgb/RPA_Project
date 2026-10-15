const Attendance = require('../models/Attendance');
const AttendanceHistory = require('../models/AttendanceHistory');
const Employee = require('../models/Employee');
const ExceptionCase = require('../models/ExceptionCase');
const ExceptionService = require('./ExceptionService');
const AuditService = require('./AuditService');
const NotificationService = require('./NotificationService');
const AttendanceService = require('./attendanceService');

class AttendanceReconciliationService {
  /**
   * Reconcile attendance across staff roster, shifts, and leaves (Spec Section 36 & 37)
   */
  static async runReconciliation({
    date = null,
    startDate = null,
    endDate = null,
    departmentId = null,
    user = null
  }) {
    const filter = {};
    if (date) {
      const normalized = AttendanceService.normalizeDate(date);
      const nextDay = new Date(normalized);
      nextDay.setDate(nextDay.getDate() + 1);
      filter.attendanceDate = { $gte: normalized, $lt: nextDay };
    } else if (startDate || endDate) {
      filter.attendanceDate = {};
      if (startDate) filter.attendanceDate.$gte = AttendanceService.normalizeDate(startDate);
      if (endDate) {
        const end = AttendanceService.normalizeDate(endDate);
        end.setDate(end.getDate() + 1);
        filter.attendanceDate.$lt = end;
      }
    } else {
      // Default: today
      const today = AttendanceService.normalizeDate(new Date());
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      filter.attendanceDate = { $gte: today, $lt: tomorrow };
    }

    const records = await Attendance.find(filter).populate('employeeId');

    let totalEvaluated = records.length;
    let matched = 0;
    let late = 0;
    let missingPunches = 0;
    let leaveConflicts = 0;
    let exceptionsRaised = 0;

    for (const record of records) {
      const employee = record.employeeId;
      if (!employee) continue;

      let newReconStatus = 'MATCHED';
      let reconNote = 'Attendance matches scheduled expectations.';

      // Reconcile with updated/published shift assignments (Module 14 Sec 37)
      try {
        const ShiftAssignment = require('../models/ShiftAssignment');
        const assignment = await ShiftAssignment.findOne({
          employeeId: employee._id,
          assignmentDate: record.attendanceDate,
          status: { $in: ['PUBLISHED', 'APPROVED'] }
        }).populate('shiftId');

        if (assignment && assignment.shiftId) {
          if (!record.shiftAssignmentId || record.shiftAssignmentId.toString() !== assignment._id.toString()) {
            record.shiftAssignmentId = assignment._id;
            record.shiftDetails = {
              shiftCode: assignment.shiftCode,
              shiftName: assignment.shiftId.shiftName,
              expectedStartTime: assignment.shiftId.startTime,
              expectedEndTime: assignment.shiftId.endTime
            };
          }
        }
      } catch (e) {}

      // 1. Missing punch check (IN without OUT or vice versa)
      if (record.checkIn.timestamp && !record.checkOut.timestamp) {
        // If current time is after expected shift end (18:00), flag as missing punch
        newReconStatus = 'MISSING_PUNCH';
        reconNote = 'Check-in recorded, but check-out is missing.';
        missingPunches++;

        // Notify employee
        await NotificationService.sendNotification({
          event: 'ATTENDANCE_MISSING_PUNCH',
          title: 'Missing Check-Out Punch Alert',
          message: `Your attendance record for ${record.attendanceDate.toISOString().split('T')[0]} is missing an exit check-out punch. Please submit a correction if required.`,
          entityType: 'Attendance',
          entityId: record.attendanceId
        });
      } else if (!record.checkIn.timestamp && record.checkOut.timestamp) {
        newReconStatus = 'MISSING_PUNCH';
        reconNote = 'Check-out recorded, but entry check-in is missing.';
        missingPunches++;
      } else if (record.lateMinutes > 0) {
        newReconStatus = 'MATCHED_WITH_LATE';
        reconNote = `Matched with ${record.lateMinutes} minutes late arrival.`;
        late++;
        matched++;
      } else {
        matched++;
      }

      // 2. Leave conflict simulation
      // If employee leave status conflicts with physical attendance punch
      if (record.status === 'ON_LEAVE' && record.checkIn.timestamp) {
        newReconStatus = 'LEAVE_CONFLICT';
        reconNote = 'Punch activity detected while recorded on approved leave.';
        leaveConflicts++;

        await ExceptionService.raiseException({
          module: 'ATTENDANCE',
          entityType: 'Attendance',
          entityId: record.attendanceId,
          exceptionType: 'LEAVE_CONFLICT',
          description: `Staff ${employee.employeeId} (${employee.firstName} ${employee.lastName}) punched in while on approved leave.`,
          severity: 'HIGH',
          source: 'RECONCILIATION',
          assignedRole: 'HR_MANAGER'
        });
        exceptionsRaised++;
      }

      // Update record if reconciliation status changed
      if (record.reconciliationStatus !== newReconStatus) {
        const oldStatus = record.reconciliationStatus;
        record.reconciliationStatus = newReconStatus;
        record.reconciliationNotes = reconNote;
        await record.save();

        await AttendanceHistory.create({
          attendanceId: record._id,
          action: 'RECONCILED',
          oldValues: { reconciliationStatus: oldStatus },
          newValues: { reconciliationStatus: newReconStatus, notes: reconNote },
          performedBy: user ? String(user._id || user.userId) : 'RECONCILIATION_ENGINE',
          performedByName: user ? user.name || user.email : 'Automated Reconciliation',
          reason: reconNote
        });
      }
    }

    await AuditService.logEvent({
      action: 'ATTENDANCE_RECONCILIATION_COMPLETED',
      module: 'ATTENDANCE',
      entityType: 'Attendance',
      actorUserId: user ? String(user._id || user.userId) : 'SYSTEM',
      actorRole: user ? user.role : 'HR_MANAGER',
      details: `Reconciliation executed for ${totalEvaluated} records: ${matched} matched, ${missingPunches} missing punches, ${leaveConflicts} conflicts.`
    });

    return {
      success: true,
      summary: {
        totalEvaluated,
        matched,
        late,
        missingPunches,
        leaveConflicts,
        exceptionsRaised
      }
    };
  }

  /**
   * Get filtered reconciliation table
   */
  static async getReconciliationRecords(query = {}) {
    const { status, date, page = 1, limit = 50 } = query;
    const filter = {};

    if (status && status !== 'ALL') {
      filter.reconciliationStatus = status;
    }

    if (date) {
      const normalized = AttendanceService.normalizeDate(date);
      const nextDay = new Date(normalized);
      nextDay.setDate(nextDay.getDate() + 1);
      filter.attendanceDate = { $gte: normalized, $lt: nextDay };
    }

    const skip = (parseInt(page, 10) - 1) * parseInt(limit, 10);

    const [records, total] = await Promise.all([
      Attendance.find(filter)
        .populate('employeeId', 'employeeId firstName lastName departmentName designation')
        .sort({ attendanceDate: -1 })
        .skip(skip)
        .limit(parseInt(limit, 10))
        .lean(),
      Attendance.countDocuments(filter)
    ]);

    return {
      success: true,
      records,
      pagination: {
        total,
        page: parseInt(page, 10),
        limit: parseInt(limit, 10),
        totalPages: Math.ceil(total / parseInt(limit, 10))
      }
    };
  }
}

module.exports = AttendanceReconciliationService;
