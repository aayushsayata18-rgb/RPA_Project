const LeaveService = require('../services/leaveService');
const LeaveBalanceService = require('../services/leaveBalanceService');
const LeaveApprovalService = require('../services/leaveApprovalService');
const LeaveAccrualService = require('../services/leaveAccrualService');
const LeaveReportService = require('../services/leaveReportService');
const Employee = require('../models/Employee');

class LeaveController {
  // ==========================================
  // 1. LEAVE TYPES
  // ==========================================

  static async getLeaveTypes(req, res) {
    try {
      const types = await LeaveService.listLeaveTypes(req.query);
      return res.json({ success: true, count: types.length, leaveTypes: types });
    } catch (err) {
      return res.status(500).json({ success: false, error: err.message });
    }
  }

  static async createLeaveType(req, res) {
    try {
      const leaveType = await LeaveService.createLeaveType(req.body, req.user);
      return res.status(201).json({ success: true, leaveType });
    } catch (err) {
      return res.status(400).json({ success: false, error: err.message });
    }
  }

  static async getLeaveTypeById(req, res) {
    try {
      const leaveType = await LeaveService.getLeaveTypeById(req.params.id);
      if (!leaveType) return res.status(404).json({ success: false, error: 'Leave type not found' });
      return res.json({ success: true, leaveType });
    } catch (err) {
      return res.status(500).json({ success: false, error: err.message });
    }
  }

  static async updateLeaveType(req, res) {
    try {
      const leaveType = await LeaveService.updateLeaveType(req.params.id, req.body, req.user);
      return res.json({ success: true, leaveType });
    } catch (err) {
      return res.status(400).json({ success: false, error: err.message });
    }
  }

  // ==========================================
  // 2. LEAVE POLICIES
  // ==========================================

  static async getLeavePolicies(req, res) {
    try {
      const policies = await LeaveService.listLeavePolicies(req.query);
      return res.json({ success: true, count: policies.length, policies });
    } catch (err) {
      return res.status(500).json({ success: false, error: err.message });
    }
  }

  static async createLeavePolicy(req, res) {
    try {
      const policy = await LeaveService.createLeavePolicy(req.body, req.user);
      return res.status(201).json({ success: true, policy });
    } catch (err) {
      return res.status(400).json({ success: false, error: err.message });
    }
  }

  static async updateLeavePolicy(req, res) {
    try {
      const policy = await LeaveService.updateLeavePolicy(req.params.id, req.body, req.user);
      return res.json({ success: true, policy });
    } catch (err) {
      return res.status(400).json({ success: false, error: err.message });
    }
  }

  // ==========================================
  // 3. LEAVE REQUESTS
  // ==========================================

  static async getLeaveRequests(req, res) {
    try {
      const result = await LeaveService.listLeaveRequests(req.query);
      return res.json({ success: true, ...result });
    } catch (err) {
      return res.status(500).json({ success: false, error: err.message });
    }
  }

  static async createLeaveRequest(req, res) {
    try {
      let employeeId = req.body.employeeId;
      // If employee self-service or employeeId not supplied in body, resolve from auth user
      if (!employeeId && req.user?.employeeId) {
        const emp = await Employee.findOne({ employeeId: req.user.employeeId });
        if (emp) employeeId = emp._id;
      }

      if (!employeeId) {
        return res.status(400).json({ success: false, error: 'Employee ID is required.' });
      }

      const result = await LeaveService.createLeaveRequest(
        { ...req.body, employeeId },
        req.user
      );

      return res.status(201).json({
        success: true,
        request: result.request,
        warnings: result.warnings
      });
    } catch (err) {
      return res.status(400).json({ success: false, error: err.message });
    }
  }

  static async getLeaveRequestById(req, res) {
    try {
      const request = await LeaveService.getLeaveRequestById(req.params.id);
      if (!request) return res.status(404).json({ success: false, error: 'Leave request not found' });
      return res.json({ success: true, request });
    } catch (err) {
      return res.status(500).json({ success: false, error: err.message });
    }
  }

  static async approveLeaveRequest(req, res) {
    try {
      const request = await LeaveApprovalService.approveLeaveRequest({
        requestId: req.params.id,
        notes: req.body.notes || '',
        actorUser: req.user
      });
      return res.json({ success: true, message: 'Leave request approved successfully', request });
    } catch (err) {
      return res.status(400).json({ success: false, error: err.message });
    }
  }

  static async rejectLeaveRequest(req, res) {
    try {
      const request = await LeaveApprovalService.rejectLeaveRequest({
        requestId: req.params.id,
        reason: req.body.reason,
        actorUser: req.user
      });
      return res.json({ success: true, message: 'Leave request rejected', request });
    } catch (err) {
      return res.status(400).json({ success: false, error: err.message });
    }
  }

  static async withdrawLeaveRequest(req, res) {
    try {
      const request = await LeaveApprovalService.withdrawLeaveRequest({
        requestId: req.params.id,
        actorUser: req.user
      });
      return res.json({ success: true, message: 'Leave request withdrawn successfully', request });
    } catch (err) {
      return res.status(400).json({ success: false, error: err.message });
    }
  }

  // ==========================================
  // 4. CANCELLATION WORKFLOW
  // ==========================================

  static async requestCancellation(req, res) {
    try {
      const cancellation = await LeaveService.requestCancellation({
        requestId: req.params.id,
        reason: req.body.reason,
        actorUser: req.user
      });
      return res.status(201).json({ success: true, cancellation });
    } catch (err) {
      return res.status(400).json({ success: false, error: err.message });
    }
  }

  static async approveCancellation(req, res) {
    try {
      const result = await LeaveApprovalService.approveCancellation({
        cancellationId: req.params.id,
        reviewerComments: req.body.comments || '',
        actorUser: req.user
      });
      return res.json({ success: true, message: 'Cancellation approved', ...result });
    } catch (err) {
      return res.status(400).json({ success: false, error: err.message });
    }
  }

  static async rejectCancellation(req, res) {
    try {
      const cancellation = await LeaveApprovalService.rejectCancellation({
        cancellationId: req.params.id,
        reason: req.body.reason,
        actorUser: req.user
      });
      return res.json({ success: true, message: 'Cancellation rejected', cancellation });
    } catch (err) {
      return res.status(400).json({ success: false, error: err.message });
    }
  }

  // ==========================================
  // 5. BALANCES & LEDGER
  // ==========================================

  static async getBalances(req, res) {
    try {
      const year = req.query.year ? parseInt(req.query.year, 10) : new Date().getFullYear();
      if (req.query.employeeId) {
        const balances = await LeaveBalanceService.getEmployeeBalances(req.query.employeeId, year);
        return res.json({ success: true, count: balances.length, balances });
      }
      const summary = await LeaveReportService.getLeaveSummary({
        departmentId: req.query.departmentId,
        year
      });
      return res.json({ success: true, count: summary.length, balances: summary });
    } catch (err) {
      return res.status(500).json({ success: false, error: err.message });
    }
  }

  static async getEmployeeBalances(req, res) {
    try {
      let employeeId = req.params.employeeId;
      // If code given, lookup ObjectId
      if (!employeeId.match(/^[0-9a-fA-F]{24}$/)) {
        const emp = await Employee.findOne({ employeeId });
        if (!emp) return res.status(404).json({ success: false, error: 'Employee not found' });
        employeeId = emp._id;
      }
      const year = req.query.year ? parseInt(req.query.year, 10) : new Date().getFullYear();
      const balances = await LeaveBalanceService.getEmployeeBalances(employeeId, year);
      return res.json({ success: true, count: balances.length, balances });
    } catch (err) {
      return res.status(500).json({ success: false, error: err.message });
    }
  }

  static async getLedger(req, res) {
    try {
      let employeeId = req.params.employeeId;
      if (!employeeId.match(/^[0-9a-fA-F]{24}$/)) {
        const emp = await Employee.findOne({ employeeId });
        if (!emp) return res.status(404).json({ success: false, error: 'Employee not found' });
        employeeId = emp._id;
      }
      const result = await LeaveBalanceService.getLedgerHistory(employeeId, req.query);
      return res.json({ success: true, ...result });
    } catch (err) {
      return res.status(500).json({ success: false, error: err.message });
    }
  }

  static async adjustBalance(req, res) {
    try {
      let employeeId = req.body.employeeId;
      if (!employeeId.match(/^[0-9a-fA-F]{24}$/)) {
        const emp = await Employee.findOne({ employeeId });
        if (!emp) return res.status(404).json({ success: false, error: 'Employee not found' });
        employeeId = emp._id;
      }

      const result = await LeaveBalanceService.adjustBalance({
        employeeId,
        leaveTypeId: req.body.leaveTypeId,
        adjustmentAmount: parseFloat(req.body.adjustmentAmount),
        reason: req.body.reason,
        year: req.body.year ? parseInt(req.body.year, 10) : null,
        actorUser: req.user
      });

      return res.json({ success: true, message: 'Balance adjusted successfully', ...result });
    } catch (err) {
      return res.status(400).json({ success: false, error: err.message });
    }
  }

  // ==========================================
  // 6. ACCRUAL & CARRY FORWARD
  // ==========================================

  static async triggerAccrual(req, res) {
    try {
      const result = await LeaveAccrualService.runAccrualJob({
        month: req.body.month,
        year: req.body.year,
        frequency: req.body.frequency || 'MONTHLY',
        actorUser: req.user
      });
      return res.json({ success: true, ...result });
    } catch (err) {
      return res.status(500).json({ success: false, error: err.message });
    }
  }

  static async triggerCarryForward(req, res) {
    try {
      const result = await LeaveAccrualService.runCarryForwardJob({
        fromYear: parseInt(req.body.fromYear, 10),
        toYear: parseInt(req.body.toYear, 10),
        actorUser: req.user
      });
      return res.json({ success: true, ...result });
    } catch (err) {
      return res.status(500).json({ success: false, error: err.message });
    }
  }

  // ==========================================
  // 7. REPORTS & EXPORTS
  // ==========================================

  static async getSummaryReport(req, res) {
    try {
      const data = await LeaveReportService.getLeaveSummary(req.query);
      if (req.query.format === 'csv') {
        const csv = LeaveReportService.convertToCSV(data);
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', 'attachment; filename="leave_summary.csv"');
        return res.send(csv);
      }
      return res.json({ success: true, count: data.length, summary: data });
    } catch (err) {
      return res.status(500).json({ success: false, error: err.message });
    }
  }

  static async getDepartmentReport(req, res) {
    try {
      const data = await LeaveReportService.getDepartmentLeaveReport();
      if (req.query.format === 'csv') {
        const csv = LeaveReportService.convertToCSV(data);
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', 'attachment; filename="department_leave.csv"');
        return res.send(csv);
      }
      return res.json({ success: true, count: data.length, departments: data });
    } catch (err) {
      return res.status(500).json({ success: false, error: err.message });
    }
  }

  static async getUtilizationReport(req, res) {
    try {
      const data = await LeaveReportService.getUtilizationReport(req.query);
      if (req.query.format === 'csv') {
        const csv = LeaveReportService.convertToCSV(data);
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', 'attachment; filename="leave_utilization.csv"');
        return res.send(csv);
      }
      return res.json({ success: true, count: data.length, utilization: data });
    } catch (err) {
      return res.status(500).json({ success: false, error: err.message });
    }
  }

  static async getExceptionsReport(req, res) {
    try {
      const exceptions = await LeaveReportService.getLeaveExceptionsReport();
      return res.json({ success: true, count: exceptions.length, exceptions });
    } catch (err) {
      return res.status(500).json({ success: false, error: err.message });
    }
  }

  // ==========================================
  // 8. HOLIDAY CALENDAR
  // ==========================================

  static async getHolidays(req, res) {
    try {
      const holidays = await LeaveService.listHolidays(req.query);
      return res.json({ success: true, count: holidays.length, holidays });
    } catch (err) {
      return res.status(500).json({ success: false, error: err.message });
    }
  }

  static async createHoliday(req, res) {
    try {
      const holiday = await LeaveService.createHoliday(req.body, req.user);
      return res.status(201).json({ success: true, holiday });
    } catch (err) {
      return res.status(400).json({ success: false, error: err.message });
    }
  }

  // ==========================================
  // 9. EMPLOYEE SELF-SERVICE (/api/me/leave)
  // ==========================================

  static async getMyLeave(req, res) {
    try {
      const employeeCode = req.user?.employeeId;
      if (!employeeCode) {
        return res.status(400).json({ success: false, error: 'User is not linked to an employee profile.' });
      }

      const employee = await Employee.findOne({ employeeId: employeeCode });
      if (!employee) {
        return res.status(404).json({ success: false, error: 'Employee record not found.' });
      }

      const requests = await LeaveService.listLeaveRequests({ employeeId: employee._id });
      const balances = await LeaveBalanceService.getEmployeeBalances(employee._id);

      return res.json({
        success: true,
        employee: {
          employeeId: employee.employeeId,
          name: `${employee.firstName} ${employee.lastName}`,
          department: employee.departmentName
        },
        balances,
        requests: requests.requests,
        totalRequests: requests.total
      });
    } catch (err) {
      return res.status(500).json({ success: false, error: err.message });
    }
  }

  static async getMyBalances(req, res) {
    try {
      const employeeCode = req.user?.employeeId;
      if (!employeeCode) {
        return res.status(400).json({ success: false, error: 'User is not linked to an employee profile.' });
      }

      const employee = await Employee.findOne({ employeeId: employeeCode });
      if (!employee) {
        return res.status(404).json({ success: false, error: 'Employee record not found.' });
      }

      const balances = await LeaveBalanceService.getEmployeeBalances(employee._id);
      return res.json({ success: true, count: balances.length, balances });
    } catch (err) {
      return res.status(500).json({ success: false, error: err.message });
    }
  }

  // ==========================================
  // 10. RPA AUTOMATION ENDPOINTS
  // ==========================================

  static async rpaImportLeave(req, res) {
    try {
      const result = await LeaveService.rpaImportExternalLeave({
        records: req.body.records || [],
        correlationId: req.body.correlationId,
        actorUser: req.user
      });
      return res.json({ success: result.success, ...result });
    } catch (err) {
      return res.status(500).json({ success: false, error: err.message });
    }
  }

  static async rpaSyncLeave(req, res) {
    try {
      const result = await LeaveService.rpaSyncApprovedLeave({
        requestId: req.body.requestId,
        dateRange: req.body.dateRange,
        correlationId: req.body.correlationId
      });
      return res.json({ success: true, ...result });
    } catch (err) {
      return res.status(500).json({ success: false, error: err.message });
    }
  }
}

module.exports = LeaveController;
