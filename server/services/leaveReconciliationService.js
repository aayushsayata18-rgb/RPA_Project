const ShiftAssignment = require('../models/ShiftAssignment');
const ShiftConflict = require('../models/ShiftConflict');
const Attendance = require('../models/Attendance');
const AttendanceHistory = require('../models/AttendanceHistory');
const ExceptionService = require('./ExceptionService');
const AuditService = require('./AuditService');
const IdGeneratorService = require('./IdGeneratorService');

class LeaveReconciliationService {
  /**
   * Normalize date to midnight
   */
  static normalizeDate(d) {
    const date = new Date(d);
    date.setHours(0, 0, 0, 0);
    return date;
  }

  /**
   * Reconcile approved leave with Shift Management assignments (Sec 25, 28, 79)
   */
  static async reconcileLeaveWithShifts(leaveRequest) {
    const start = this.normalizeDate(leaveRequest.startDate);
    const end = this.normalizeDate(leaveRequest.endDate);

    const assignments = await ShiftAssignment.find({
      employeeId: leaveRequest.employeeId,
      assignmentDate: { $gte: start, $lte: end },
      status: { $in: ['DRAFT', 'PENDING_APPROVAL', 'APPROVED', 'PUBLISHED'] }
    }).populate('shiftId');

    const reconciled = [];

    for (const assignment of assignments) {
      if (leaveRequest.dayType === 'FULL_DAY') {
        assignment.reconciliationNotes = `Employee approved for full-day ${leaveRequest.leaveTypeCode} (${leaveRequest.requestNumber}). Assignment flagged on leave.`;
        assignment.status = 'CANCELLED'; // Or held
        await assignment.save();
      } else {
        assignment.reconciliationNotes = `Partial/Half-day leave (${leaveRequest.dayType}) approved under ${leaveRequest.requestNumber}. Working coverage required for remainder of shift.`;
        await assignment.save();
      }

      reconciled.push({
        assignmentId: assignment.assignmentId,
        date: assignment.assignmentDate,
        shiftCode: assignment.shiftCode
      });
    }

    return reconciled;
  }

  /**
   * Reconcile cancellation of approved leave with Shift assignments
   */
  static async reconcileCancellationWithShifts(leaveRequest) {
    const start = this.normalizeDate(leaveRequest.startDate);
    const end = this.normalizeDate(leaveRequest.endDate);

    const assignments = await ShiftAssignment.find({
      employeeId: leaveRequest.employeeId,
      assignmentDate: { $gte: start, $lte: end }
    });

    for (const assignment of assignments) {
      assignment.reconciliationNotes = `Leave ${leaveRequest.requestNumber} was cancelled. Assignment schedule restored.`;
      if (assignment.status === 'CANCELLED') {
        assignment.status = 'PUBLISHED';
      }
      await assignment.save();
    }
  }

  /**
   * Reconcile approved leave with Attendance Management (Sec 26, 27, 80)
   */
  static async reconcileLeaveWithAttendance(leaveRequest) {
    const start = this.normalizeDate(leaveRequest.startDate);
    const end = this.normalizeDate(leaveRequest.endDate);

    let cur = new Date(start);
    const updatedRecords = [];

    while (cur <= end) {
      const curDate = new Date(cur);
      const nextDate = new Date(curDate);
      nextDate.setDate(nextDate.getDate() + 1);

      let record = await Attendance.findOne({
        employeeId: leaveRequest.employeeId,
        attendanceDate: { $gte: curDate, $lt: nextDate }
      });

      if (!record) {
        // If no attendance record exists, initialize as ON_LEAVE
        const attendanceId = await IdGeneratorService.generateAttendanceId();
        record = new Attendance({
          attendanceId,
          employeeId: leaveRequest.employeeId,
          employeeCode: leaveRequest.employeeCode,
          attendanceDate: curDate,
          status: leaveRequest.dayType === 'FULL_DAY' ? 'ON_LEAVE' : 'PARTIAL_LEAVE',
          reconciliationStatus: 'MATCHED',
          notes: `Approved leave ${leaveRequest.requestNumber} (${leaveRequest.leaveTypeCode})`,
          isLate: false,
          isHalfDay: leaveRequest.dayType === 'FIRST_HALF' || leaveRequest.dayType === 'SECOND_HALF'
        });
        await record.save();
      } else {
        // Record already exists, check punches
        const hasCheckIn = !!record.checkIn?.timestamp;
        const hasCheckOut = !!record.checkOut?.timestamp;

        if (leaveRequest.dayType === 'FULL_DAY') {
          if (hasCheckIn || hasCheckOut) {
            // Punch activity while on approved full-day leave -> LEAVE_ATTENDANCE_CONFLICT!
            record.reconciliationStatus = 'LEAVE_CONFLICT';
            record.notes = `Punch detected while recorded on approved full-day leave ${leaveRequest.requestNumber}`;
            await record.save();

            await ExceptionService.raiseException({
              module: 'LEAVE',
              entityType: 'Attendance',
              entityId: record.attendanceId,
              exceptionType: 'LEAVE_ATTENDANCE_CONFLICT',
              description: `Employee ${leaveRequest.employeeCode} has physical punch activity on ${curDate.toISOString().split('T')[0]} while on approved full-day leave ${leaveRequest.requestNumber}.`,
              severity: 'MEDIUM'
            });
          } else {
            record.status = 'ON_LEAVE';
            record.reconciliationStatus = 'MATCHED';
            record.notes = `Approved leave ${leaveRequest.requestNumber} (${leaveRequest.leaveTypeCode})`;
            await record.save();
          }
        } else {
          // Half-day or partial day leave
          record.status = (hasCheckIn && hasCheckOut) ? 'PRESENT' : 'PARTIAL_LEAVE';
          record.isHalfDay = true;
          record.reconciliationStatus = 'MATCHED';
          record.notes = `Reconciled ${leaveRequest.dayType} leave (${leaveRequest.requestNumber}) with shift attendance.`;
          await record.save();
        }
      }

      updatedRecords.push(record);
      cur.setDate(cur.getDate() + 1);
    }

    return updatedRecords;
  }

  /**
   * Reconcile cancellation with attendance
   */
  static async reconcileCancellationWithAttendance(leaveRequest) {
    const start = this.normalizeDate(leaveRequest.startDate);
    const end = this.normalizeDate(leaveRequest.endDate);

    const records = await Attendance.find({
      employeeId: leaveRequest.employeeId,
      attendanceDate: { $gte: start, $lte: end }
    });

    for (const record of records) {
      if (record.status === 'ON_LEAVE') {
        record.status = 'ABSENT'; // Or pending next punch
        record.notes = `Leave ${leaveRequest.requestNumber} was cancelled.`;
        await record.save();
      }
    }
  }
}

module.exports = LeaveReconciliationService;
