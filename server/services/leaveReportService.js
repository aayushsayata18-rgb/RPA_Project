const LeaveRequest = require('../models/LeaveRequest');
const LeaveBalance = require('../models/LeaveBalance');
const LeaveType = require('../models/LeaveType');
const Department = require('../models/Department');
const Employee = require('../models/Employee');
const ExceptionCase = require('../models/ExceptionCase');

class LeaveReportService {
  /**
   * Leave Summary Report
   */
  static async getLeaveSummary({ departmentId = null, year = new Date().getFullYear() }) {
    const balanceQuery = { year };
    if (departmentId) {
      const deptEmployees = await Employee.find({
        'departmentAssignments.departmentId': departmentId
      }).select('_id');
      balanceQuery.employeeId = { $in: deptEmployees.map(e => e._id) };
    }

    const balances = await LeaveBalance.find(balanceQuery)
      .populate('employeeId', 'employeeId firstName lastName designation departmentName')
      .populate('leaveTypeId', 'name code isPaid')
      .lean();

    return balances.map(b => ({
      employeeCode: b.employeeCode || b.employeeId?.employeeId,
      employeeName: b.employeeId ? `${b.employeeId.firstName} ${b.employeeId.lastName}` : '',
      department: b.employeeId?.departmentName || '',
      leaveType: b.leaveTypeCode || b.leaveTypeId?.code,
      leaveTypeName: b.leaveTypeId?.name,
      opening: b.openingBalance,
      accrued: b.accrued,
      carriedForward: b.carriedForward,
      used: b.used,
      pending: b.pending,
      available: b.available,
      closing: b.closingBalance
    }));
  }

  /**
   * Department Leave Report
   */
  static async getDepartmentLeaveReport() {
    const departments = await Department.find({ isActive: true }).lean();
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const next7Days = new Date(today);
    next7Days.setDate(next7Days.getDate() + 7);

    const report = [];

    for (const dept of departments) {
      const deptEmps = await Employee.find({
        'departmentAssignments.departmentId': { $in: [dept._id.toString(), dept.departmentId] },
        status: 'ACTIVE'
      }).select('_id');

      const empIds = deptEmps.map(e => e._id);

      const [onLeaveToday, upcoming] = await Promise.all([
        LeaveRequest.countDocuments({
          employeeId: { $in: empIds },
          status: 'APPROVED',
          startDate: { $lte: today },
          endDate: { $gte: today }
        }),
        LeaveRequest.countDocuments({
          employeeId: { $in: empIds },
          status: 'APPROVED',
          startDate: { $gt: today, $lte: next7Days }
        })
      ]);

      report.push({
        departmentId: dept.departmentId,
        departmentName: dept.name,
        code: dept.code,
        totalActiveStaff: empIds.length,
        onLeaveToday,
        upcomingLeaveNext7Days: upcoming
      });
    }

    return report;
  }

  /**
   * Leave Utilization Report
   */
  static async getUtilizationReport({ year = new Date().getFullYear() }) {
    const types = await LeaveType.find().lean();
    const startOfYear = new Date(year, 0, 1);
    const endOfYear = new Date(year, 11, 31, 23, 59, 59);

    const utilization = [];

    for (const lt of types) {
      const requests = await LeaveRequest.find({
        leaveTypeId: lt._id,
        startDate: { $gte: startOfYear, $lte: endOfYear }
      }).lean();

      let totalRequested = 0;
      let totalApproved = 0;
      let totalRejected = 0;
      let totalCancelled = 0;
      let totalUsedDays = 0;

      for (const r of requests) {
        totalRequested++;
        if (r.status === 'APPROVED') {
          totalApproved++;
          totalUsedDays += r.duration;
        } else if (r.status === 'REJECTED') {
          totalRejected++;
        } else if (r.status === 'CANCELLED') {
          totalCancelled++;
        }
      }

      utilization.push({
        leaveTypeId: lt.leaveTypeId,
        code: lt.code,
        name: lt.name,
        isPaid: lt.isPaid,
        totalRequests: totalRequested,
        totalApproved,
        totalRejected,
        totalCancelled,
        totalDaysUtilized: totalUsedDays
      });
    }

    return utilization;
  }

  /**
   * Leave Exceptions Report
   */
  static async getLeaveExceptionsReport() {
    return await ExceptionCase.find({
      module: 'LEAVE'
    }).sort({ createdAt: -1 }).limit(100).lean();
  }

  /**
   * Export Helper to CSV
   */
  static convertToCSV(data) {
    if (!data || data.length === 0) return '';
    const headers = Object.keys(data[0]);
    const rows = data.map(item =>
      headers.map(h => `"${String(item[h] ?? '').replace(/"/g, '""')}"`).join(',')
    );
    return [headers.join(','), ...rows].join('\n');
  }
}

module.exports = LeaveReportService;
