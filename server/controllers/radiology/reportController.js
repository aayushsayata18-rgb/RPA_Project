const ReportService = require('../../services/radiology/reportService');

class ReportController {
  static async listReports(req, res, next) {
    try {
      const filters = {
        status: req.query.status,
        patientId: req.query.patientId,
        studyId: req.query.studyId,
        search: req.query.search
      };
      const pagination = {
        page: req.query.page,
        limit: req.query.limit
      };
      const result = await ReportService.listReports(filters, pagination);
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
      const report = await ReportService.getReportById(req.params.id, req.user);
      res.json({
        success: true,
        data: report
      });
    } catch (err) {
      next(err);
    }
  }

  static async createReport(req, res, next) {
    try {
      const report = await ReportService.createDraftReport({
        ...req.body,
        user: req.user
      });
      res.status(201).json({
        success: true,
        message: 'Radiology report draft created.',
        data: report
      });
    } catch (err) {
      next(err);
    }
  }

  static async updateReport(req, res, next) {
    try {
      const report = await ReportService.updateDraft(req.params.id, req.body, req.user);
      res.json({
        success: true,
        message: 'Radiology report draft updated.',
        data: report
      });
    } catch (err) {
      next(err);
    }
  }

  static async verifyReport(req, res, next) {
    try {
      const report = await ReportService.verifyReport(req.params.id, req.user);
      res.json({
        success: true,
        message: 'Radiology report verified and finalized.',
        data: report
      });
    } catch (err) {
      next(err);
    }
  }

  static async finalizeReport(req, res, next) {
    try {
      const report = await ReportService.verifyReport(req.params.id, req.user);
      res.json({
        success: true,
        message: 'Radiology report finalized.',
        data: report
      });
    } catch (err) {
      next(err);
    }
  }

  static async releaseReport(req, res, next) {
    try {
      const report = await ReportService.releaseReport(req.params.id, req.user);
      res.json({
        success: true,
        message: 'Radiology report released to clinical and patient portals.',
        data: report
      });
    } catch (err) {
      next(err);
    }
  }

  static async amendReport(req, res, next) {
    try {
      const report = await ReportService.amendReport(req.params.id, {
        ...req.body,
        user: req.user
      });
      res.json({
        success: true,
        message: 'Radiology report amended successfully with new version.',
        data: report
      });
    } catch (err) {
      next(err);
    }
  }

  static async downloadReport(req, res, next) {
    try {
      const report = await ReportService.getReportById(req.params.id, req.user);
      // In production/MERN, return printable report text and payload
      res.json({
        success: true,
        reportNumber: report.reportNumber,
        patientName: report.patientName,
        data: report,
        downloadUrl: `/api/radiology/reports/${report._id}/pdf`
      });
    } catch (err) {
      next(err);
    }
  }
}

module.exports = ReportController;
