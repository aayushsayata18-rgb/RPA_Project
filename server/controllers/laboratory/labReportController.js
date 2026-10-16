const ReportService = require('../../services/laboratory/reportService');

class LabReportController {
  static async listReports(req, res, next) {
    try {
      const { patientCode, status, search, page, limit } = req.query;
      let resolvedPatientCode = patientCode;
      if (req.user?.role === 'PATIENT') {
        resolvedPatientCode = req.user.userId;
      }

      const result = await ReportService.listReports({
        patientCode: resolvedPatientCode,
        status,
        search,
        page,
        limit
      });

      res.json({
        success: true,
        data: result.reports,
        pagination: result.pagination
      });
    } catch (err) {
      next(err);
    }
  }

  static async getReportById(req, res, next) {
    try {
      const report = await ReportService.getReportById(req.params.id);

      if (req.user?.role === 'PATIENT' && req.user.userId !== report.patientCode) {
        return res.status(403).json({
          success: false,
          error: {
            code: 'ACCESS_DENIED',
            message: 'You are not authorized to view this laboratory report.'
          }
        });
      }

      res.json({
        success: true,
        data: report
      });
    } catch (err) {
      next(err);
    }
  }

  static async generateReport(req, res, next) {
    try {
      const orderId = req.body.orderId || req.body.labOrderId;
      const { clinicalComments } = req.body;
      if (!orderId) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'MISSING_ORDER_ID',
            message: 'Order ID is required to generate a laboratory report.'
          }
        });
      }

      const report = await ReportService.generateReport({
        orderId,
        clinicalComments,
        user: req.user
      });

      const reportObj = report && typeof report.toObject === 'function' ? report.toObject() : report;
      res.status(201).json({
        success: true,
        message: `Laboratory report ${report.reportNumber} generated.`,
        data: {
          ...reportObj,
          labReportId: report.reportId || report.reportNumber || report._id,
          reportId: report.reportId,
          reportNumber: report.reportNumber
        }
      });
    } catch (err) {
      next(err);
    }
  }

  static async releaseReport(req, res, next) {
    try {
      const report = await ReportService.releaseReport({
        reportIdentifier: req.params.id,
        user: req.user
      });

      const reportObj = report && typeof report.toObject === 'function' ? report.toObject() : report;
      res.json({
        success: true,
        message: `Laboratory report ${report.reportNumber} released to patient and doctor portal.`,
        data: {
          ...reportObj,
          labReportId: report.reportId || report.reportNumber || report._id,
          reportId: report.reportId,
          reportNumber: report.reportNumber,
          releasedToPatient: report.status === 'RELEASED'
        }
      });
    } catch (err) {
      next(err);
    }
  }

  static async recordDownload(req, res, next) {
    try {
      const ipAddress = req.ip || req.connection?.remoteAddress || '';
      const report = await ReportService.recordReportDownload({
        reportIdentifier: req.params.id,
        user: req.user,
        ipAddress
      });

      const reportObj = report && typeof report.toObject === 'function' ? report.toObject() : report;
      res.json({
        success: true,
        message: 'Download audit logged successfully.',
        data: {
          ...reportObj,
          labReportId: report.reportId || report.reportNumber || report._id,
          reportId: report.reportId,
          downloadCount: report.downloadAuditTrail ? report.downloadAuditTrail.length : 1
        }
      });
    } catch (err) {
      next(err);
    }
  }
}

module.exports = LabReportController;
