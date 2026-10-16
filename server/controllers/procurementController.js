const ProcurementReportService = require('../services/procurement/procurementReportService');
const ExceptionCase = require('../models/ExceptionCase');
const VendorChangeRequest = require('../models/VendorChangeRequest');
const PurchaseOrder = require('../models/PurchaseOrder');
const AuditService = require('../services/AuditService');

class ProcurementController {
  static async getDashboardKPIs(req, res, next) {
    try {
      const stats = await ProcurementReportService.getDashboardKPIs();
      res.json({ success: true, stats });
    } catch (error) {
      next(error);
    }
  }

  static async getSpendAnalytics(req, res, next) {
    try {
      const analytics = await ProcurementReportService.getSpendAnalytics();
      res.json({ success: true, analytics });
    } catch (error) {
      next(error);
    }
  }

  static async getDeliveryPerformance(req, res, next) {
    try {
      const performance = await ProcurementReportService.getDeliveryPerformance();
      res.json({ success: true, performance });
    } catch (error) {
      next(error);
    }
  }

  static async getExceptions(req, res, next) {
    try {
      const filter = { module: 'PROCUREMENT' };
      if (req.query.status) filter.currentStatus = req.query.status;
      if (req.query.severity) filter.severity = req.query.severity;
      if (req.query.exceptionType) filter.exceptionType = req.query.exceptionType;

      const exceptions = await ExceptionCase.find(filter).sort({ createdAt: -1 }).limit(100).lean();
      res.json({ success: true, exceptions, total: exceptions.length });
    } catch (error) {
      next(error);
    }
  }

  static async resolveException(req, res, next) {
    try {
      const { exceptionId } = req.params;
      const { resolution } = req.body;
      const exc = await ExceptionCase.findOne({ exceptionId });
      if (!exc) throw new Error(`Exception ${exceptionId} not found`);

      exc.currentStatus = 'RESOLVED';
      exc.resolution = resolution || 'Resolved by procurement officer';
      exc.resolvedBy = req.user?.id || 'SYSTEM';
      exc.resolvedAt = new Date();
      await exc.save();

      await AuditService.logEvent({
        userId: req.user?.id || 'SYSTEM',
        role: req.user?.role || 'PROCUREMENT_OFFICER',
        action: 'PROCUREMENT_EXCEPTION_RESOLVED',
        module: 'PROCUREMENT',
        entityType: 'ExceptionCase',
        entityId: exceptionId,
        newValue: { currentStatus: 'RESOLVED', resolution },
        details: `Exception ${exceptionId} resolved.`
      });

      res.json({ success: true, message: 'Exception resolved', exception: exc });
    } catch (error) {
      next(error);
    }
  }

  static async getChangeRequests(req, res, next) {
    try {
      const requests = await VendorChangeRequest.find().sort({ createdAt: -1 }).lean();
      res.json({ success: true, changeRequests: requests });
    } catch (error) {
      next(error);
    }
  }

  static async reviewChangeRequest(req, res, next) {
    try {
      const { id } = req.params;
      const { status, resolutionNotes } = req.body;
      const cr = await VendorChangeRequest.findOne({ changeRequestId: id });
      if (!cr) throw new Error(`Vendor Change Request ${id} not found`);

      cr.status = status;
      cr.resolutionNotes = resolutionNotes || '';
      cr.reviewedBy = req.user?.id || 'SYSTEM';
      cr.reviewedAt = new Date();
      await cr.save();

      res.json({ success: true, message: `Change request marked as ${status}`, changeRequest: cr });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = ProcurementController;
