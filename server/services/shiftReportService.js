const ShiftAssignment = require('../models/ShiftAssignment');
const Shift = require('../models/Shift');
const Employee = require('../models/Employee');
const Department = require('../models/Department');
const Attendance = require('../models/Attendance');
const ShiftValidationService = require('./shiftValidationService');

class ShiftReportService {
  /**
   * Employee Schedule Report (Sec 50)
   */
  static async getEmployeeScheduleReport({
    departmentId = null,
    employeeId = null,
    startDate = null,
    endDate = null
  } = {}) {
    const filter = { status: { $in: ['APPROVED', 'PUBLISHED'] } };

    if (departmentId) filter.departmentId = departmentId;
    if (employeeId) {
      filter.$or = [
        ...(employeeId.match(/^[0-9a-fA-F]{24}$/) ? [{ employeeId: employeeId }] : []),
        { employeeIdCode: employeeId }
      ];
    }
    if (startDate || endDate) {
      filter.assignmentDate = {};
      if (startDate) filter.assignmentDate.$gte = ShiftValidationService.normalizeDate(startDate);
      if (endDate) filter.assignmentDate.$lte = ShiftValidationService.normalizeDate(endDate);
    }

    const assignments = await ShiftAssignment.find(filter)
      .populate('employeeId', 'employeeId firstName lastName designation departmentName')
      .populate('shiftId', 'shiftCode shiftName startTime endTime crossesMidnight breakMinutes')
      .populate('departmentId', 'departmentId name code')
      .sort({ assignmentDate: 1, employeeIdCode: 1 })
      .lean();

    return assignments.map(a => ({
      assignmentId: a.assignmentId,
      date: a.assignmentDate ? a.assignmentDate.toISOString().split('T')[0] : '',
      employeeId: a.employeeIdCode,
      employeeName: a.employeeId ? `${a.employeeId.firstName} ${a.employeeId.lastName}` : '',
      designation: a.employeeId?.designation || '',
      department: a.departmentId?.name || a.departmentCode || '',
      shiftCode: a.shiftCode,
      shiftName: a.shiftId?.shiftName || '',
      startTime: a.shiftId?.startTime || '',
      endTime: a.shiftId?.endTime || '',
      crossesMidnight: Boolean(a.shiftId?.crossesMidnight),
      status: a.status
    }));
  }

  /**
   * Shift Utilization Report (Sec 50)
   */
  static async getShiftUtilizationReport({ startDate = null, endDate = null } = {}) {
    const filter = { status: { $in: ['APPROVED', 'PUBLISHED'] } };
    if (startDate || endDate) {
      filter.assignmentDate = {};
      if (startDate) filter.assignmentDate.$gte = ShiftValidationService.normalizeDate(startDate);
      if (endDate) filter.assignmentDate.$lte = ShiftValidationService.normalizeDate(endDate);
    }

    const assignments = await ShiftAssignment.find(filter).lean();
    const shifts = await Shift.find().lean();

    const stats = {};
    for (const s of shifts) {
      stats[s.shiftCode] = {
        shiftCode: s.shiftCode,
        shiftName: s.shiftName,
        startTime: s.startTime,
        endTime: s.endTime,
        assignedCount: 0,
        presentAttendanceCount: 0,
        lateCount: 0
      };
    }

    for (const a of assignments) {
      if (stats[a.shiftCode]) {
        stats[a.shiftCode].assignedCount++;
      }
    }

    // Correlate with Attendance records
    const attendanceFilter = {};
    if (startDate || endDate) {
      attendanceFilter.attendanceDate = {};
      if (startDate) attendanceFilter.attendanceDate.$gte = ShiftValidationService.normalizeDate(startDate);
      if (endDate) attendanceFilter.attendanceDate.$lte = ShiftValidationService.normalizeDate(endDate);
    }
    const attendances = await Attendance.find(attendanceFilter).lean();

    for (const att of attendances) {
      const code = att.shiftDetails?.shiftCode || 'GENERAL';
      if (stats[code]) {
        if (att.status === 'PRESENT') stats[code].presentAttendanceCount++;
        if (att.lateMinutes > 0) stats[code].lateCount++;
      }
    }

    return Object.values(stats);
  }

  /**
   * Convert array of JSON records to CSV string
   */
  static convertToCsv(records = []) {
    if (!records.length) return '';
    const headers = Object.keys(records[0]);
    const lines = [headers.join(',')];

    for (const row of records) {
      const line = headers.map(h => {
        const val = row[h] !== undefined && row[h] !== null ? String(row[h]) : '';
        return `"${val.replace(/"/g, '""')}"`;
      }).join(',');
      lines.push(line);
    }

    return lines.join('\n');
  }
}

module.exports = ShiftReportService;
