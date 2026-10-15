const Attendance = require('../models/Attendance');
const AttendanceCorrection = require('../models/AttendanceCorrection');
const AttendanceHistory = require('../models/AttendanceHistory');
const Employee = require('../models/Employee');
const IdGeneratorService = require('./IdGeneratorService');
const AuditService = require('./AuditService');
const NotificationService = require('./NotificationService');
const AttendanceService = require('./attendanceService');

class AttendanceCorrectionService {
  /**
   * Submit an attendance correction request (Spec Section 9 & 23)
   */
  static async submitCorrectionRequest({
    attendanceId,
    requestedCheckIn,
    requestedCheckOut,
    reason,
    evidenceDocuments = [],
    user
  }) {
    if (!reason || reason.trim().length < 5) {
      throw new Error('A detailed reason (minimum 5 characters) must be provided.');
    }

    const attendance = await Attendance.findOne({
      $or: [{ attendanceId }, { _id: attendanceId.match(/^[0-9a-fA-F]{24}$/) ? attendanceId : null }]
    });

    if (!attendance) {
      throw new Error(`Attendance record ${attendanceId} not found.`);
    }

    // Check if employee is attempting to alter someone else's attendance
    if (user && user.role === 'PATIENT') {
      throw new Error('Unauthorized.');
    }

    // Prevent duplicate pending requests for the same attendance record
    const existingPending = await AttendanceCorrection.findOne({
      attendanceId: attendance._id,
      status: 'PENDING'
    });

    if (existingPending) {
      throw new Error(`A correction request (${existingPending.requestId}) is already pending review for this date.`);
    }

    const employee = await Employee.findById(attendance.employeeId);
    const requestId = await IdGeneratorService.generateAttendanceCorrectionId();

    const reqCheckIn = requestedCheckIn ? new Date(requestedCheckIn) : attendance.checkIn.timestamp;
    const reqCheckOut = requestedCheckOut ? new Date(requestedCheckOut) : attendance.checkOut.timestamp;

    if (reqCheckIn && reqCheckOut && reqCheckOut < reqCheckIn) {
      throw new Error('Requested check-out time cannot precede requested check-in time.');
    }

    const originalValues = {
      checkIn: attendance.checkIn.timestamp,
      checkOut: attendance.checkOut.timestamp,
      status: attendance.status
    };

    const requestedValues = {
      checkIn: reqCheckIn,
      checkOut: reqCheckOut,
      status: 'PRESENT'
    };

    const correction = new AttendanceCorrection({
      requestId,
      attendanceId: attendance._id,
      employeeId: attendance.employeeId,
      employeeIdCode: attendance.employeeIdCode,
      requestedBy: user ? user._id : null,
      requestedByName: user ? user.name || user.email : (employee ? `${employee.firstName} ${employee.lastName}` : 'Employee'),
      originalValues,
      requestedValues,
      reason: reason.trim(),
      evidenceDocuments,
      status: 'PENDING'
    });

    await correction.save();

    // Update Attendance state
    attendance.correctionStatus = 'PENDING';
    attendance.correctionRequestId = correction._id;
    await attendance.save();

    // Append to audit history
    await AttendanceHistory.create({
      attendanceId: attendance._id,
      action: 'CORRECTION_REQUESTED',
      oldValues: originalValues,
      newValues: requestedValues,
      performedBy: user ? String(user._id || user.userId) : 'EMPLOYEE',
      performedByName: user ? user.name || user.email : 'Staff Member',
      reason: `Correction requested: ${reason.trim()}`
    });

    // Notify HR and Supervisor
    await NotificationService.sendNotification({
      event: 'ATTENDANCE_CORRECTION_SUBMITTED',
      title: 'New Attendance Correction Request',
      message: `Staff ${attendance.employeeIdCode} submitted correction request ${requestId} for ${attendance.attendanceDate.toISOString().split('T')[0]}.`,
      entityType: 'AttendanceCorrection',
      entityId: requestId
    });

    await AuditService.logEvent({
      action: 'ATTENDANCE_CORRECTION_REQUESTED',
      module: 'ATTENDANCE',
      entityType: 'AttendanceCorrection',
      entityId: requestId,
      actorUserId: user ? String(user._id || user.userId) : 'EMPLOYEE',
      actorRole: user ? user.role : 'EMPLOYEE',
      details: `Correction ${requestId} submitted by employee ${attendance.employeeIdCode}. Reason: ${reason}`
    });

    return {
      success: true,
      message: 'Correction request submitted successfully. Awaiting supervisor or HR approval.',
      correction
    };
  }

  /**
   * Get correction requests queue
   */
  static async getCorrectionRequests(query = {}) {
    const { status, employeeIdCode, page = 1, limit = 50 } = query;
    const filter = {};

    if (status) filter.status = status;
    if (employeeIdCode) filter.employeeIdCode = employeeIdCode.trim().toUpperCase();

    const skip = (parseInt(page, 10) - 1) * parseInt(limit, 10);

    const [requests, total] = await Promise.all([
      AttendanceCorrection.find(filter)
        .populate('employeeId', 'employeeId firstName lastName departmentName designation')
        .populate('attendanceId')
        .sort({ requestedAt: -1 })
        .skip(skip)
        .limit(parseInt(limit, 10))
        .lean(),
      AttendanceCorrection.countDocuments(filter)
    ]);

    return {
      success: true,
      requests,
      pagination: {
        total,
        page: parseInt(page, 10),
        limit: parseInt(limit, 10),
        totalPages: Math.ceil(total / parseInt(limit, 10))
      }
    };
  }

  /**
   * Get single correction by ID
   */
  static async getCorrectionById(id) {
    const correction = await AttendanceCorrection.findOne({
      $or: [{ requestId: id }, { _id: id.match(/^[0-9a-fA-F]{24}$/) ? id : null }]
    })
      .populate('employeeId')
      .populate('attendanceId')
      .lean();

    if (!correction) {
      throw new Error(`Correction request ${id} not found.`);
    }

    return {
      success: true,
      correction
    };
  }

  /**
   * Approve Attendance Correction (Spec Section 24)
   * Must preserve original record, recalculate durations/status, and audit
   */
  static async approveCorrection(id, { user, reviewerComments = 'Approved as requested' }) {
    const correction = await AttendanceCorrection.findOne({
      $or: [{ requestId: id }, { _id: id.match(/^[0-9a-fA-F]{24}$/) ? id : null }]
    });

    if (!correction) {
      throw new Error(`Correction request ${id} not found.`);
    }

    if (correction.status !== 'PENDING') {
      throw new Error(`Correction request is already ${correction.status}. Concurrency prevented.`);
    }

    const attendance = await Attendance.findById(correction.attendanceId);
    if (!attendance) {
      throw new Error('Target attendance record no longer exists.');
    }

    // 1. Update Correction Request
    correction.status = 'APPROVED';
    correction.reviewedBy = user ? String(user._id || user.userId) : 'HR_ADMIN';
    correction.reviewedByName = user ? user.name || user.email : 'HR Approver';
    correction.reviewedAt = new Date();
    correction.reviewerComments = reviewerComments;
    await correction.save();

    // 2. Update Attendance Record
    const oldValues = {
      checkIn: attendance.checkIn.timestamp,
      checkOut: attendance.checkOut.timestamp,
      status: attendance.status
    };

    if (correction.requestedValues.checkIn) {
      attendance.checkIn.timestamp = new Date(correction.requestedValues.checkIn);
      attendance.lateMinutes = AttendanceService.calculateLateMinutes('09:00', attendance.checkIn.timestamp);
    }

    if (correction.requestedValues.checkOut) {
      attendance.checkOut.timestamp = new Date(correction.requestedValues.checkOut);
      attendance.earlyDepartureMinutes = AttendanceService.calculateEarlyDepartureMinutes('18:00', attendance.checkOut.timestamp);
    }

    if (attendance.checkIn.timestamp && attendance.checkOut.timestamp) {
      const { workedMinutes, overtimeMinutes } = AttendanceService.calculateDurations(
        attendance.checkIn.timestamp,
        attendance.checkOut.timestamp
      );
      attendance.workedMinutes = workedMinutes;
      attendance.overtimeMinutes = overtimeMinutes;
      attendance.status = attendance.lateMinutes > 0 ? 'LATE' : 'PRESENT';
    } else {
      attendance.status = 'MISSED_PUNCH';
    }

    attendance.correctionStatus = 'APPROVED';
    attendance.reconciliationStatus = 'MATCHED';
    attendance.updatedBy = user ? user.email || user.userId : 'HR_ADMIN';
    await attendance.save();

    // 3. Append to Attendance History
    await AttendanceHistory.create({
      attendanceId: attendance._id,
      action: 'CORRECTION_APPROVED',
      oldValues,
      newValues: {
        checkIn: attendance.checkIn.timestamp,
        checkOut: attendance.checkOut.timestamp,
        status: attendance.status
      },
      performedBy: user ? String(user._id || user.userId) : 'HR_ADMIN',
      performedByName: user ? user.name || user.email : 'HR Administrator',
      reason: `Approved: ${reviewerComments}`
    });

    // 4. Log Central Audit Event
    await AuditService.logEvent({
      action: 'ATTENDANCE_CORRECTION_APPROVED',
      module: 'ATTENDANCE',
      entityType: 'AttendanceCorrection',
      entityId: correction.requestId,
      actorUserId: user ? String(user._id || user.userId) : 'HR_ADMIN',
      actorRole: user ? user.role : 'HR_MANAGER',
      details: `Correction ${correction.requestId} approved for employee ${attendance.employeeIdCode}. Remarks: ${reviewerComments}`
    });

    // 5. Notify Employee
    await NotificationService.sendNotification({
      event: 'ATTENDANCE_CORRECTION_APPROVED',
      title: 'Attendance Correction Approved',
      message: `Your attendance correction request ${correction.requestId} for ${attendance.attendanceDate.toISOString().split('T')[0]} has been approved.`,
      entityType: 'AttendanceCorrection',
      entityId: correction.requestId
    });

    return {
      success: true,
      message: 'Correction approved and attendance successfully updated.',
      correction,
      attendance
    };
  }

  /**
   * Reject Attendance Correction (Spec Section 25)
   * Original values remain unchanged!
   */
  static async rejectCorrection(id, { user, reviewerComments }) {
    if (!reviewerComments || reviewerComments.trim().length < 3) {
      throw new Error('Mandatory reviewer comment is required when rejecting a correction request.');
    }

    const correction = await AttendanceCorrection.findOne({
      $or: [{ requestId: id }, { _id: id.match(/^[0-9a-fA-F]{24}$/) ? id : null }]
    });

    if (!correction) {
      throw new Error(`Correction request ${id} not found.`);
    }

    if (correction.status !== 'PENDING') {
      throw new Error(`Correction request is already ${correction.status}.`);
    }

    const attendance = await Attendance.findById(correction.attendanceId);

    // 1. Mark correction as REJECTED
    correction.status = 'REJECTED';
    correction.reviewedBy = user ? String(user._id || user.userId) : 'HR_ADMIN';
    correction.reviewedByName = user ? user.name || user.email : 'HR Reviewer';
    correction.reviewedAt = new Date();
    correction.reviewerComments = reviewerComments.trim();
    await correction.save();

    // 2. Mark attendance correction status as REJECTED without altering punch data
    if (attendance) {
      attendance.correctionStatus = 'REJECTED';
      await attendance.save();

      await AttendanceHistory.create({
        attendanceId: attendance._id,
        action: 'CORRECTION_REJECTED',
        oldValues: correction.originalValues,
        newValues: correction.originalValues,
        performedBy: user ? String(user._id || user.userId) : 'HR_ADMIN',
        performedByName: user ? user.name || user.email : 'HR Reviewer',
        reason: `Correction rejected: ${reviewerComments.trim()}`
      });
    }

    // 3. Central Audit
    await AuditService.logEvent({
      action: 'ATTENDANCE_CORRECTION_REJECTED',
      module: 'ATTENDANCE',
      entityType: 'AttendanceCorrection',
      entityId: correction.requestId,
      actorUserId: user ? String(user._id || user.userId) : 'HR_ADMIN',
      actorRole: user ? user.role : 'HR_MANAGER',
      details: `Correction ${correction.requestId} rejected. Reason: ${reviewerComments}`
    });

    // 4. Notify Employee
    await NotificationService.sendNotification({
      event: 'ATTENDANCE_CORRECTION_REJECTED',
      title: 'Attendance Correction Rejected',
      message: `Your attendance correction request ${correction.requestId} was reviewed and rejected. Reason: ${reviewerComments}`,
      entityType: 'AttendanceCorrection',
      entityId: correction.requestId
    });

    return {
      success: true,
      message: 'Correction request rejected. Original record preserved unchanged.',
      correction
    };
  }
}

module.exports = AttendanceCorrectionService;
