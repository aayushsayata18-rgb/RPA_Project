const Attendance = require('../models/Attendance');
const Employee = require('../models/Employee');
const ExceptionCase = require('../models/ExceptionCase');
const AttendanceService = require('./attendanceService');

class AttendanceReportService {
  /**
   * Daily Attendance Report (Spec Section 38)
   */
  static async getDailyReport(dateInput) {
    const targetDate = AttendanceService.normalizeDate(dateInput || new Date());
    const nextDay = new Date(targetDate);
    nextDay.setDate(nextDay.getDate() + 1);

    const [employees, records] = await Promise.all([
      Employee.find({ $or: [{ status: 'ACTIVE' }, { employmentStatus: 'ACTIVE' }] }).select('employeeId firstName lastName departmentName designation').lean(),
      Attendance.find({ attendanceDate: { $gte: targetDate, $lt: nextDay } }).populate('employeeId').lean()
    ]);

    const recordMap = new Map();
    records.forEach((r) => {
      if (r.employeeId && r.employeeId.employeeId) {
        recordMap.set(r.employeeId.employeeId, r);
      } else if (r.employeeIdCode) {
        recordMap.set(r.employeeIdCode, r);
      }
    });

    let presentCount = 0;
    let lateCount = 0;
    let absentCount = 0;
    let leaveCount = 0;
    let missingPunchCount = 0;

    const departmentStats = {};

    const detailedRows = employees.map((emp) => {
      const rec = recordMap.get(emp.employeeId);
      const dept = emp.departmentName || 'General Staff';

      if (!departmentStats[dept]) {
        departmentStats[dept] = { total: 0, present: 0, late: 0, absent: 0, leave: 0, missingPunch: 0 };
      }
      departmentStats[dept].total++;

      if (rec) {
        if (rec.status === 'PRESENT') {
          presentCount++;
          departmentStats[dept].present++;
        } else if (rec.status === 'LATE') {
          presentCount++;
          lateCount++;
          departmentStats[dept].present++;
          departmentStats[dept].late++;
        } else if (rec.status === 'MISSED_PUNCH') {
          missingPunchCount++;
          departmentStats[dept].missingPunch++;
        } else if (rec.status === 'ON_LEAVE') {
          leaveCount++;
          departmentStats[dept].leave++;
        } else if (rec.status === 'ABSENT') {
          absentCount++;
          departmentStats[dept].absent++;
        }
      } else {
        // No record today -> Absent or pending
        absentCount++;
        departmentStats[dept].absent++;
      }

      return {
        employeeId: emp.employeeId,
        name: `${emp.firstName} ${emp.lastName}`,
        department: dept,
        designation: emp.designation,
        checkIn: rec && rec.checkIn ? rec.checkIn.timestamp : null,
        checkOut: rec && rec.checkOut ? rec.checkOut.timestamp : null,
        status: rec ? rec.status : 'ABSENT',
        lateMinutes: rec ? rec.lateMinutes : 0,
        workedMinutes: rec ? rec.workedMinutes : 0,
        source: rec ? rec.source : 'N/A'
      };
    });

    return {
      success: true,
      reportDate: targetDate.toISOString().split('T')[0],
      totalHeadcount: employees.length,
      metrics: {
        present: presentCount,
        absent: absentCount,
        late: lateCount,
        leave: leaveCount,
        missingPunch: missingPunchCount,
        attendancePercentage: employees.length > 0 ? ((presentCount / employees.length) * 100).toFixed(1) : 0
      },
      departmentStats,
      rows: detailedRows
    };
  }

  /**
   * Monthly Attendance Report by Staff Member (Spec Section 38 & 39)
   */
  static async getMonthlyReport({ year, month, departmentId = null }) {
    const currentYear = year ? parseInt(year, 10) : new Date().getFullYear();
    const currentMonth = month ? parseInt(month, 10) - 1 : new Date().getMonth();

    const startDate = new Date(currentYear, currentMonth, 1);
    const endDate = new Date(currentYear, currentMonth + 1, 0, 23, 59, 59, 999);

    // Eligible working days excluding standard Sundays (Spec Section 39)
    let workingDaysCount = 0;
    const cur = new Date(startDate);
    while (cur <= endDate) {
      if (cur.getDay() !== 0) {
        workingDaysCount++;
      }
      cur.setDate(cur.getDate() + 1);
    }

    const empFilter = { $or: [{ status: 'ACTIVE' }, { employmentStatus: 'ACTIVE' }] };
    const employees = await Employee.find(empFilter).lean();

    const attendanceRecords = await Attendance.find({
      attendanceDate: { $gte: startDate, $lte: endDate }
    }).lean();

    // Group records by employee ID code
    const empRecordsMap = new Map();
    attendanceRecords.forEach((r) => {
      const code = r.employeeIdCode;
      if (!empRecordsMap.has(code)) {
        empRecordsMap.set(code, []);
      }
      empRecordsMap.get(code).push(r);
    });

    const reportRows = employees.map((emp) => {
      const recs = empRecordsMap.get(emp.employeeId) || [];

      let presentDays = 0;
      let lateCount = 0;
      let lateMinutes = 0;
      let workedMinutesTotal = 0;
      let leaveDays = 0;
      let missingPunches = 0;

      recs.forEach((r) => {
        if (r.status === 'PRESENT' || r.status === 'LATE' || r.status === 'CORRECTION_APPROVED') {
          presentDays++;
        }
        if (r.lateMinutes > 0) {
          lateCount++;
          lateMinutes += r.lateMinutes;
        }
        if (r.workedMinutes > 0) {
          workedMinutesTotal += r.workedMinutes;
        }
        if (r.status === 'ON_LEAVE') {
          leaveDays++;
        }
        if (r.status === 'MISSED_PUNCH') {
          missingPunches++;
        }
      });

      const absentDays = Math.max(0, workingDaysCount - (presentDays + leaveDays));
      const percentage = workingDaysCount > 0 ? ((presentDays / workingDaysCount) * 100).toFixed(1) : 0;

      return {
        employeeId: emp.employeeId,
        name: `${emp.firstName} ${emp.lastName}`,
        department: emp.departmentName || 'N/A',
        designation: emp.designation || 'Staff',
        workingDays: workingDaysCount,
        presentDays,
        absentDays,
        leaveDays,
        lateCount,
        lateMinutes,
        workedHours: (workedMinutesTotal / 60).toFixed(1),
        missingPunches,
        attendancePercentage: percentage
      };
    });

    return {
      success: true,
      period: `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}`,
      eligibleWorkingDays: workingDaysCount,
      reportRows
    };
  }

  /**
   * Department Attendance Report (Spec Section 38)
   */
  static async getDepartmentReport({ date }) {
    const daily = await AttendanceReportService.getDailyReport(date);
    const departmentRows = Object.entries(daily.departmentStats).map(([deptName, stat]) => {
      const attendancePercent = stat.total > 0 ? ((stat.present / stat.total) * 100).toFixed(1) : 0;
      return {
        department: deptName,
        totalStaff: stat.total,
        present: stat.present,
        absent: stat.absent,
        late: stat.late,
        leave: stat.leave,
        missingPunch: stat.missingPunch,
        attendancePercentage: attendancePercent
      };
    });

    return {
      success: true,
      reportDate: daily.reportDate,
      departments: departmentRows
    };
  }

  /**
   * Attendance Exception Cases Report (Spec Section 38 & 60)
   */
  static async getExceptionReport({ page = 1, limit = 50 }) {
    const skip = (parseInt(page, 10) - 1) * parseInt(limit, 10);
    const filter = { module: 'ATTENDANCE' };

    const [exceptions, total] = await Promise.all([
      ExceptionCase.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit, 10))
        .lean(),
      ExceptionCase.countDocuments(filter)
    ]);

    return {
      success: true,
      exceptions,
      pagination: {
        total,
        page: parseInt(page, 10),
        limit: parseInt(limit, 10),
        totalPages: Math.ceil(total / parseInt(limit, 10))
      }
    };
  }
}

module.exports = AttendanceReportService;
