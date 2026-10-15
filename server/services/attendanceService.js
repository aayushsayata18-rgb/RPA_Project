const Attendance = require('../models/Attendance');
const AttendanceEvent = require('../models/AttendanceEvent');
const AttendanceHistory = require('../models/AttendanceHistory');
const Employee = require('../models/Employee');
const ExceptionCase = require('../models/ExceptionCase');
const AuditService = require('./AuditService');
const ExceptionService = require('./ExceptionService');
const NotificationService = require('./NotificationService');
const IdGeneratorService = require('./IdGeneratorService');

class AttendanceService {
  /**
   * Normalize a date to midnight UTC/Local for consistent daily grouping
   */
  static normalizeDate(dateInput) {
    const d = new Date(dateInput || Date.now());
    d.setHours(0, 0, 0, 0);
    return d;
  }

  /**
   * Calculate late minutes given shift start (HH:mm) and actual check-in Date
   */
  static calculateLateMinutes(shiftStartStr, checkInDate, graceMinutes = 15) {
    if (!checkInDate || !shiftStartStr) return 0;
    const [shiftHour, shiftMin] = shiftStartStr.split(':').map(Number);
    const expected = new Date(checkInDate);
    expected.setHours(shiftHour, shiftMin, 0, 0);

    const diffMs = checkInDate.getTime() - expected.getTime();
    const diffMinutes = Math.floor(diffMs / (1000 * 60));

    if (diffMinutes > graceMinutes) {
      return diffMinutes;
    }
    return 0;
  }

  /**
   * Calculate early departure minutes given shift end (HH:mm) and actual check-out Date
   */
  static calculateEarlyDepartureMinutes(shiftEndStr, checkOutDate) {
    if (!checkOutDate || !shiftEndStr) return 0;
    const [shiftHour, shiftMin] = shiftEndStr.split(':').map(Number);
    const expected = new Date(checkOutDate);
    expected.setHours(shiftHour, shiftMin, 0, 0);

    const diffMs = expected.getTime() - checkOutDate.getTime();
    const diffMinutes = Math.floor(diffMs / (1000 * 60));

    if (diffMinutes > 0) {
      return diffMinutes;
    }
    return 0;
  }

  /**
   * Calculate worked duration and overtime candidates
   */
  static calculateDurations(checkInDate, checkOutDate, expectedShiftDurationMinutes = 540) {
    if (!checkInDate || !checkOutDate) {
      return { workedMinutes: 0, overtimeMinutes: 0 };
    }
    const diffMs = checkOutDate.getTime() - checkInDate.getTime();
    const workedMinutes = Math.max(0, Math.floor(diffMs / (1000 * 60)));
    const overtimeMinutes = Math.max(0, workedMinutes - expectedShiftDurationMinutes);

    return { workedMinutes, overtimeMinutes };
  }

  /**
   * Get filtered attendance list
   */
  static async getAttendanceList(query = {}) {
    const {
      date,
      startDate,
      endDate,
      departmentId,
      department,
      employeeId,
      employeeIdCode,
      status,
      source,
      reconciliationStatus,
      page = 1,
      limit = 50
    } = query;

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
    }

    if (status) filter.status = status;
    if (source) filter.source = source;
    if (reconciliationStatus) filter.reconciliationStatus = reconciliationStatus;
    if (employeeIdCode) filter.employeeIdCode = employeeIdCode.trim();

    const skip = (parseInt(page, 10) - 1) * parseInt(limit, 10);

    const [records, total] = await Promise.all([
      Attendance.find(filter)
        .populate('employeeId', 'employeeId firstName lastName departmentName designation employmentStatus')
        .sort({ attendanceDate: -1, 'checkIn.timestamp': -1 })
        .skip(skip)
        .limit(parseInt(limit, 10))
        .lean(),
      Attendance.countDocuments(filter)
    ]);

    // In-memory filter for department if supplied and not populated at root
    let finalRecords = records;
    if (departmentId || department) {
      const targetDept = (departmentId || department).toLowerCase();
      finalRecords = records.filter(
        (r) =>
          r.employeeId &&
          r.employeeId.departmentName &&
          r.employeeId.departmentName.toLowerCase().includes(targetDept)
      );
    }

    return {
      success: true,
      records: finalRecords,
      pagination: {
        total,
        page: parseInt(page, 10),
        limit: parseInt(limit, 10),
        totalPages: Math.ceil(total / parseInt(limit, 10))
      }
    };
  }

  /**
   * Get attendance record by ID with full history and employee details
   */
  static async getAttendanceById(id) {
    const attendance = await Attendance.findOne({
      $or: [{ attendanceId: id }, { _id: id.match(/^[0-9a-fA-F]{24}$/) ? id : null }]
    })
      .populate('employeeId')
      .populate('correctionRequestId')
      .lean();

    if (!attendance) {
      throw new Error(`Attendance record not found for key: ${id}`);
    }

    const history = await AttendanceHistory.find({ attendanceId: attendance._id })
      .sort({ timestamp: -1 })
      .lean();

    return {
      success: true,
      attendance: {
        ...attendance,
        history
      }
    };
  }

  /**
   * Ingest and process a single punch event (from Biometric device, RPA, or API)
   */
  static async processPunchEvent({
    employeeIdCode,
    eventDateTime,
    direction = 'IN',
    source = 'BIOMETRIC',
    sourceEventId = null,
    deviceId = null,
    rawPayload = {},
    importBatchId = null,
    user = null
  }) {
    const eventTime = new Date(eventDateTime || Date.now());
    const eventId = await IdGeneratorService.generateAttendanceEventId();

    // 1. Look up employee
    const employee = await Employee.findOne({ employeeId: employeeIdCode.trim().toUpperCase() });
    if (!employee) {
      // Record raw event as UNMATCHED (Spec Section 34)
      const rawEvent = new AttendanceEvent({
        eventId,
        employeeIdCode: employeeIdCode.trim().toUpperCase(),
        eventDateTime: eventTime,
        direction,
        source,
        sourceEventId,
        deviceId,
        rawPayload,
        importBatchId,
        processingStatus: 'UNMATCHED',
        errorMessage: `Employee ${employeeIdCode} does not exist in Staff Master.`
      });
      await rawEvent.save();

      // Raise Exception
      await ExceptionService.raiseException({
        module: 'ATTENDANCE',
        entityType: 'Employee',
        entityId: employeeIdCode,
        exceptionType: 'EMPLOYEE_NOT_FOUND',
        description: `Punch event received for unknown Employee ID: ${employeeIdCode}`,
        severity: 'MEDIUM',
        source,
        assignedRole: 'HR_MANAGER',
        metadata: { eventId, deviceId, eventDateTime: eventTime }
      });

      return {
        success: false,
        error: 'EMPLOYEE_NOT_FOUND',
        message: `Employee ${employeeIdCode} not found in Staff Master. Logged for HR review.`
      };
    }

    // 2. Check for Inactive / Terminated employee (Spec Section 35)
    const empStatus = employee.status || employee.employmentStatus;
    if (empStatus === 'TERMINATED' || empStatus === 'SUSPENDED' || empStatus === 'INACTIVE') {
      const rawEvent = new AttendanceEvent({
        eventId,
        employeeId: employee._id,
        employeeIdCode: employee.employeeId,
        eventDateTime: eventTime,
        direction,
        source,
        sourceEventId,
        deviceId,
        rawPayload,
        importBatchId,
        processingStatus: 'INVALID',
        errorMessage: `Employee is ${empStatus}. Attendance rejected.`
      });
      await rawEvent.save();

      await ExceptionService.raiseException({
        module: 'ATTENDANCE',
        entityType: 'Employee',
        entityId: employee.employeeId,
        exceptionType: 'ATTENDANCE_FOR_INACTIVE_EMPLOYEE',
        description: `Punch event detected for ${empStatus} staff member ${employee.firstName} ${employee.lastName} (${employee.employeeId}).`,
        severity: 'HIGH',
        source: source === 'RPA' ? 'RPA' : 'SYSTEM',
        assignedRole: 'HR_MANAGER'
      });

      return {
        success: false,
        error: 'INACTIVE_EMPLOYEE',
        message: `Attendance rejected: Employee status is ${empStatus}. ExceptionCase created.`
      };
    }

    // 3. Duplicate punch detection (Spec Section 15 & 48)
    if (sourceEventId) {
      const existingEvent = await AttendanceEvent.findOne({ source, sourceEventId });
      if (existingEvent) {
        return {
          success: true,
          isDuplicate: true,
          message: `Duplicate event ignored. Already ingested under event ${existingEvent.eventId}.`
        };
      }
    }

    // Fingerprint check for rapid duplicate punches (within 2 minutes with same direction)
    const twoMinutesBefore = new Date(eventTime.getTime() - 2 * 60 * 1000);
    const twoMinutesAfter = new Date(eventTime.getTime() + 2 * 60 * 1000);
    const rapidDuplicate = await AttendanceEvent.findOne({
      employeeId: employee._id,
      direction,
      eventDateTime: { $gte: twoMinutesBefore, $lte: twoMinutesAfter }
    });

    if (rapidDuplicate) {
      const rawEvent = new AttendanceEvent({
        eventId,
        employeeId: employee._id,
        employeeIdCode: employee.employeeId,
        eventDateTime: eventTime,
        direction,
        source,
        sourceEventId,
        deviceId,
        rawPayload,
        importBatchId,
        processingStatus: 'DUPLICATE',
        errorMessage: 'Rapid duplicate punch within duplicate grace window.'
      });
      await rawEvent.save();

      return {
        success: true,
        isDuplicate: true,
        message: `Rapid duplicate punch suppressed for ${employee.employeeId}. Raw event saved.`
      };
    }

    // Save valid raw event
    const savedEvent = new AttendanceEvent({
      eventId,
      employeeId: employee._id,
      employeeIdCode: employee.employeeId,
      eventDateTime: eventTime,
      direction,
      source,
      sourceEventId,
      deviceId,
      rawPayload,
      importBatchId,
      processingStatus: 'PROCESSED'
    });
    await savedEvent.save();

    // 4. Normalized Attendance date
    const attendanceDate = AttendanceService.normalizeDate(eventTime);

    let attendance = await Attendance.findOne({
      employeeId: employee._id,
      attendanceDate
    });

    let shiftStart = '09:00';
    let shiftEnd = '18:00';
    let shiftCode = 'GENERAL';
    let shiftName = 'General Hospital Shift';
    let shiftAssignmentRef = null;

    try {
      const ShiftAssignment = require('../models/ShiftAssignment');
      const publishedAssignment = await ShiftAssignment.findOne({
        employeeId: employee._id,
        assignmentDate: attendanceDate,
        status: { $in: ['PUBLISHED', 'APPROVED'] }
      }).populate('shiftId');

      if (publishedAssignment && publishedAssignment.shiftId) {
        shiftStart = publishedAssignment.shiftId.startTime || '09:00';
        shiftEnd = publishedAssignment.shiftId.endTime || '18:00';
        shiftCode = publishedAssignment.shiftCode || 'GENERAL';
        shiftName = publishedAssignment.shiftId.shiftName || 'General Shift';
        shiftAssignmentRef = publishedAssignment._id;
      } else {
        // Fallback: check if date range matches for the day
        const dayStart = new Date(attendanceDate);
        dayStart.setHours(0, 0, 0, 0);
        const dayEnd = new Date(dayStart);
        dayEnd.setDate(dayEnd.getDate() + 1);

        const fallback = await ShiftAssignment.findOne({
          employeeId: employee._id,
          assignmentDate: { $gte: dayStart, $lt: dayEnd },
          status: { $in: ['PUBLISHED', 'APPROVED'] }
        }).populate('shiftId');

        if (fallback && fallback.shiftId) {
          shiftStart = fallback.shiftId.startTime || '09:00';
          shiftEnd = fallback.shiftId.endTime || '18:00';
          shiftCode = fallback.shiftCode || 'GENERAL';
          shiftName = fallback.shiftId.shiftName || 'General Shift';
          shiftAssignmentRef = fallback._id;
        }
      }
    } catch (err) {
      console.error('[AttendanceService] Error looking up shift assignment:', err.message);
    }


    if (!attendance) {
      const attendanceId = await IdGeneratorService.generateAttendanceId();
      attendance = new Attendance({
        attendanceId,
        employeeId: employee._id,
        employeeIdCode: employee.employeeId,
        attendanceDate,
        source,
        shiftAssignmentId: shiftAssignmentRef,
        shiftDetails: {
          shiftCode,
          shiftName,
          expectedStartTime: shiftStart,
          expectedEndTime: shiftEnd
        },
        status: 'MISSED_PUNCH'
      });
    } else if (shiftAssignmentRef && !attendance.shiftAssignmentId) {
      attendance.shiftAssignmentId = shiftAssignmentRef;
      attendance.shiftDetails = {
        shiftCode,
        shiftName,
        expectedStartTime: shiftStart,
        expectedEndTime: shiftEnd
      };
    }


    // 5. Update punches based on direction
    const oldValues = {
      checkIn: attendance.checkIn.timestamp,
      checkOut: attendance.checkOut.timestamp,
      status: attendance.status
    };

    if (direction === 'IN') {
      attendance.checkIn = {
        timestamp: eventTime,
        source,
        sourceEventId,
        deviceId
      };

      const late = AttendanceService.calculateLateMinutes(shiftStart, eventTime);
      attendance.lateMinutes = late;

      attendance.status = late > 0 ? 'LATE' : 'PRESENT';
    } else if (direction === 'OUT') {
      // Validate: checkout must not precede checkin if checkin exists (Spec Section 33)
      if (attendance.checkIn.timestamp && eventTime < attendance.checkIn.timestamp) {
        await ExceptionService.raiseException({
          module: 'ATTENDANCE',
          entityType: 'Attendance',
          entityId: attendance.attendanceId,
          exceptionType: 'INVALID_ATTENDANCE_TIME',
          description: `Check-out time (${eventTime.toISOString()}) is before check-in time (${attendance.checkIn.timestamp.toISOString()}).`,
          severity: 'HIGH',
          source,
          assignedRole: 'HR_MANAGER'
        });

        attendance.status = 'INVALID';
        attendance.remarks = 'Check-out timestamp earlier than check-in timestamp.';
        await attendance.save();

        return {
          success: false,
          error: 'INVALID_ATTENDANCE_TIME',
          message: 'Impossible punch time: Check-out earlier than check-in. Flagged for review.'
        };
      }

      attendance.checkOut = {
        timestamp: eventTime,
        source,
        sourceEventId,
        deviceId
      };

      attendance.earlyDepartureMinutes = AttendanceService.calculateEarlyDepartureMinutes(shiftEnd, eventTime);

      if (attendance.checkIn.timestamp) {
        const { workedMinutes, overtimeMinutes } = AttendanceService.calculateDurations(
          attendance.checkIn.timestamp,
          eventTime
        );
        attendance.workedMinutes = workedMinutes;
        attendance.overtimeMinutes = overtimeMinutes;

        attendance.status = attendance.lateMinutes > 0 ? 'LATE' : 'PRESENT';
        attendance.reconciliationStatus = attendance.lateMinutes > 0 ? 'MATCHED_WITH_LATE' : 'MATCHED';
      } else {
        // Missing Check-in punch
        attendance.status = 'MISSED_PUNCH';
        attendance.reconciliationStatus = 'MISSING_PUNCH';
      }
    }

    await attendance.save();

    // Append to audit history
    await AttendanceHistory.create({
      attendanceId: attendance._id,
      action: direction === 'IN' ? 'PUNCH_IN' : 'PUNCH_OUT',
      oldValues,
      newValues: {
        checkIn: attendance.checkIn.timestamp,
        checkOut: attendance.checkOut.timestamp,
        status: attendance.status
      },
      performedBy: user ? String(user._id || user.userId) : 'SYSTEM',
      performedByName: user ? user.name || user.email : `${source}_DEVICE`,
      reason: `Automated punch from device ${deviceId || 'N/A'}`
    });

    return {
      success: true,
      attendance,
      event: savedEvent
    };
  }

  /**
   * Authorized Manual Attendance Creation (Spec Section 61)
   */
  static async createManualAttendance({
    employeeIdCode,
    date,
    checkInTime,
    checkOutTime,
    reason,
    remarks,
    user
  }) {
    if (!reason || reason.trim().length < 5) {
      throw new Error('Mandatory justification reason (at least 5 characters) is required for manual entry.');
    }

    const employee = await Employee.findOne({ employeeId: employeeIdCode.trim().toUpperCase() });
    if (!employee) {
      throw new Error(`Employee ${employeeIdCode} not found in Staff Master.`);
    }

    const attendanceDate = AttendanceService.normalizeDate(date);

    let checkIn = null;
    let checkOut = null;
    if (checkInTime) checkIn = new Date(checkInTime);
    if (checkOutTime) checkOut = new Date(checkOutTime);

    if (checkIn && checkOut && checkOut < checkIn) {
      throw new Error('Check-out time cannot be earlier than check-in time.');
    }

    let attendance = await Attendance.findOne({
      employeeId: employee._id,
      attendanceDate
    });

    const isNew = !attendance;
    if (!attendance) {
      const attendanceId = await IdGeneratorService.generateAttendanceId();
      attendance = new Attendance({
        attendanceId,
        employeeId: employee._id,
        employeeIdCode: employee.employeeId,
        attendanceDate,
        source: 'MANUAL',
        createdBy: user ? user.email || user.userId : 'HR_ADMIN'
      });
    }

    const oldValues = {
      checkIn: attendance.checkIn.timestamp,
      checkOut: attendance.checkOut.timestamp,
      status: attendance.status
    };

    if (checkIn) {
      attendance.checkIn = {
        timestamp: checkIn,
        source: 'MANUAL',
        deviceId: 'PORTAL_MANUAL_ENTRY'
      };
      attendance.lateMinutes = AttendanceService.calculateLateMinutes('09:00', checkIn);
    }

    if (checkOut) {
      attendance.checkOut = {
        timestamp: checkOut,
        source: 'MANUAL',
        deviceId: 'PORTAL_MANUAL_ENTRY'
      };
      attendance.earlyDepartureMinutes = AttendanceService.calculateEarlyDepartureMinutes('18:00', checkOut);
    }

    if (checkIn && checkOut) {
      const { workedMinutes, overtimeMinutes } = AttendanceService.calculateDurations(checkIn, checkOut);
      attendance.workedMinutes = workedMinutes;
      attendance.overtimeMinutes = overtimeMinutes;
      attendance.status = attendance.lateMinutes > 0 ? 'LATE' : 'PRESENT';
    } else {
      attendance.status = 'MISSED_PUNCH';
    }

    attendance.source = 'MANUAL';
    attendance.remarks = remarks || reason;
    attendance.updatedBy = user ? user.email || user.userId : 'HR_ADMIN';

    await attendance.save();

    // Log History & Central Audit Event
    await AttendanceHistory.create({
      attendanceId: attendance._id,
      action: isNew ? 'MANUAL_CREATE' : 'MANUAL_OVERRIDE',
      oldValues,
      newValues: {
        checkIn: attendance.checkIn.timestamp,
        checkOut: attendance.checkOut.timestamp,
        status: attendance.status
      },
      performedBy: user ? String(user._id || user.userId) : 'HR_ADMIN',
      performedByName: user ? user.name || user.email : 'HR Administrator',
      reason: reason.trim()
    });

    await AuditService.logEvent({
      action: isNew ? 'ATTENDANCE_MANUAL_CREATED' : 'ATTENDANCE_MANUAL_OVERRIDE',
      module: 'ATTENDANCE',
      entityType: 'Attendance',
      entityId: attendance.attendanceId,
      actorUserId: user ? String(user._id || user.userId) : 'HR_ADMIN',
      actorRole: user ? user.role : 'HR_MANAGER',
      details: `Manual attendance entry for ${employee.employeeId}. Reason: ${reason}`
    });

    return {
      success: true,
      message: 'Manual attendance successfully recorded with audit log.',
      attendance
    };
  }

  /**
   * Get Dashboard KPI Metrics
   */
  static async getDashboardMetrics(dateQuery) {
    const today = AttendanceService.normalizeDate(dateQuery);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const [
      totalEmployees,
      todayRecords,
      pendingCorrections,
      unresolvedExceptions
    ] = await Promise.all([
      Employee.countDocuments({ $or: [{ status: 'ACTIVE' }, { employmentStatus: 'ACTIVE' }] }),
      Attendance.find({ attendanceDate: { $gte: today, $lt: tomorrow } }).lean(),
      Attendance.countDocuments({ correctionStatus: 'PENDING' }),
      ExceptionCase.countDocuments({ module: 'ATTENDANCE', currentStatus: 'OPEN' })
    ]);

    let present = 0;
    let absent = 0;
    let late = 0;
    let missingPunch = 0;
    let onLeave = 0;

    todayRecords.forEach((rec) => {
      if (rec.status === 'PRESENT') present++;
      else if (rec.status === 'LATE') {
        present++;
        late++;
      } else if (rec.status === 'MISSED_PUNCH') missingPunch++;
      else if (rec.status === 'ON_LEAVE') onLeave++;
      else if (rec.status === 'ABSENT') absent++;
    });

    // Employees without records count as not yet checked in / potentially absent
    const notCheckedIn = Math.max(0, totalEmployees - (present + onLeave + missingPunch));

    return {
      success: true,
      date: today.toISOString().split('T')[0],
      totalActiveStaff: totalEmployees,
      kpi: {
        presentToday: present,
        absentToday: absent + notCheckedIn,
        lateToday: late,
        missingPunches: missingPunch,
        onLeave: onLeave,
        pendingCorrections,
        openExceptions: unresolvedExceptions
      }
    };
  }
}

module.exports = AttendanceService;
