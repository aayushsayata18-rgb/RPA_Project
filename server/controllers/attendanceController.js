const AttendanceService = require('../services/attendanceService');
const AttendanceImportService = require('../services/attendanceImportService');
const AttendanceCorrectionService = require('../services/attendanceCorrectionService');
const AttendanceReconciliationService = require('../services/attendanceReconciliationService');
const AttendanceReportService = require('../services/attendanceReportService');
const Employee = require('../models/Employee');

class AttendanceController {
  /**
   * GET /api/attendance/dashboard/metrics
   */
  static async getDashboardMetrics(req, res, next) {
    try {
      const result = await AttendanceService.getDashboardMetrics(req.query.date);
      res.json(result);
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/attendance
   */
  static async getAttendanceList(req, res, next) {
    try {
      const result = await AttendanceService.getAttendanceList(req.query);
      res.json(result);
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/attendance/:id
   */
  static async getAttendanceById(req, res, next) {
    try {
      const result = await AttendanceService.getAttendanceById(req.params.id);
      res.json(result);
    } catch (err) {
      next(err);
    }
  }

  /**
   * POST /api/attendance/punch
   * Biometric / RPA / API punch ingestion
   */
  static async recordPunch(req, res, next) {
    try {
      const {
        employeeIdCode,
        employeeId,
        eventDateTime,
        direction,
        source,
        sourceEventId,
        deviceId,
        rawPayload
      } = req.body;

      const result = await AttendanceService.processPunchEvent({
        employeeIdCode: employeeIdCode || employeeId,
        eventDateTime,
        direction,
        source: source || 'API',
        sourceEventId,
        deviceId,
        rawPayload,
        user: req.user
      });

      res.status(result.success ? 200 : 400).json(result);
    } catch (err) {
      next(err);
    }
  }

  /**
   * POST /api/attendance/manual
   * Authorized Manual Entry
   */
  static async createManualAttendance(req, res, next) {
    try {
      const {
        employeeIdCode,
        employeeId,
        date,
        checkInTime,
        checkOutTime,
        reason,
        remarks
      } = req.body;

      const result = await AttendanceService.createManualAttendance({
        employeeIdCode: employeeIdCode || employeeId,
        date,
        checkInTime,
        checkOutTime,
        reason,
        remarks,
        user: req.user
      });

      res.status(201).json(result);
    } catch (err) {
      next(err);
    }
  }

  /**
   * POST /api/attendance/import
   * Batch Upload (CSV, Excel, RPA)
   */
  static async importBatch(req, res, next) {
    try {
      const { records, source, fileName, rawContent } = req.body;
      const result = await AttendanceImportService.importRecords({
        records,
        source: source || 'CSV',
        fileName,
        rawContent,
        user: req.user
      });
      res.status(200).json(result);
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/attendance/imports
   */
  static async getImportBatches(req, res, next) {
    try {
      const { page, limit } = req.query;
      const result = await AttendanceImportService.getImportBatches(page, limit);
      res.json(result);
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/attendance/imports/:id
   */
  static async getImportBatchById(req, res, next) {
    try {
      const result = await AttendanceImportService.getImportBatchById(req.params.id);
      res.json(result);
    } catch (err) {
      next(err);
    }
  }

  /**
   * POST /api/attendance/:id/correction
   * Submit correction request
   */
  static async submitCorrection(req, res, next) {
    try {
      const { requestedCheckIn, requestedCheckOut, reason, evidenceDocuments } = req.body;
      const result = await AttendanceCorrectionService.submitCorrectionRequest({
        attendanceId: req.params.id,
        requestedCheckIn,
        requestedCheckOut,
        reason,
        evidenceDocuments,
        user: req.user
      });
      res.status(201).json(result);
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/attendance/corrections
   */
  static async getCorrections(req, res, next) {
    try {
      const result = await AttendanceCorrectionService.getCorrectionRequests(req.query);
      res.json(result);
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/attendance/corrections/:id
   */
  static async getCorrectionById(req, res, next) {
    try {
      const result = await AttendanceCorrectionService.getCorrectionById(req.params.id);
      res.json(result);
    } catch (err) {
      next(err);
    }
  }

  /**
   * POST /api/attendance/corrections/:id/approve
   */
  static async approveCorrection(req, res, next) {
    try {
      const { reviewerComments } = req.body;
      const result = await AttendanceCorrectionService.approveCorrection(req.params.id, {
        user: req.user,
        reviewerComments
      });
      res.json(result);
    } catch (err) {
      next(err);
    }
  }

  /**
   * POST /api/attendance/corrections/:id/reject
   */
  static async rejectCorrection(req, res, next) {
    try {
      const { reviewerComments } = req.body;
      const result = await AttendanceCorrectionService.rejectCorrection(req.params.id, {
        user: req.user,
        reviewerComments
      });
      res.json(result);
    } catch (err) {
      next(err);
    }
  }

  /**
   * POST /api/attendance/reconcile
   */
  static async runReconciliation(req, res, next) {
    try {
      const { date, startDate, endDate, departmentId } = req.body;
      const result = await AttendanceReconciliationService.runReconciliation({
        date,
        startDate,
        endDate,
        departmentId,
        user: req.user
      });
      res.json(result);
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/attendance/reconciliation
   */
  static async getReconciliation(req, res, next) {
    try {
      const result = await AttendanceReconciliationService.getReconciliationRecords(req.query);
      res.json(result);
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/attendance/reports/daily
   */
  static async getDailyReport(req, res, next) {
    try {
      const result = await AttendanceReportService.getDailyReport(req.query.date);
      res.json(result);
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/attendance/reports/monthly
   */
  static async getMonthlyReport(req, res, next) {
    try {
      const { year, month, departmentId } = req.query;
      const result = await AttendanceReportService.getMonthlyReport({ year, month, departmentId });
      res.json(result);
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/attendance/reports/department
   */
  static async getDepartmentReport(req, res, next) {
    try {
      const result = await AttendanceReportService.getDepartmentReport(req.query);
      res.json(result);
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/attendance/reports/exceptions
   */
  static async getExceptionReport(req, res, next) {
    try {
      const result = await AttendanceReportService.getExceptionReport(req.query);
      res.json(result);
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/me/attendance
   * Employee Self-Service Attendance
   */
  static async getMyAttendance(req, res, next) {
    try {
      let employeeCode = req.query.employeeIdCode;

      // If user is logged in as staff, resolve employee record
      if (req.user) {
        const emp = await Employee.findOne({
          $or: [
            { userId: req.user._id },
            { email: req.user.email },
            { employeeId: req.user.username }
          ]
        });
        if (emp) {
          employeeCode = emp.employeeId;
        }
      }

      if (!employeeCode) {
        // Fallback demo employee if querying self-service in test mode
        employeeCode = 'EMP10001';
      }

      const query = {
        ...req.query,
        employeeIdCode: employeeCode
      };

      const result = await AttendanceService.getAttendanceList(query);
      res.json(result);
    } catch (err) {
      next(err);
    }
  }
}

module.exports = AttendanceController;
