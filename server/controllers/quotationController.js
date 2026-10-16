const QuotationService = require('../services/procurement/quotationService');

class QuotationController {
  static async recordQuotation(req, res, next) {
    try {
      const user = { userId: req.user?.id || 'SYSTEM', role: req.user?.role || 'PROCUREMENT_OFFICER', name: req.user?.name };
      const quotation = await QuotationService.recordQuotation(req.body, user);
      res.status(201).json({ success: true, message: 'Quotation recorded successfully', quotation });
    } catch (error) {
      next(error);
    }
  }

  static async updateQuotationStatus(req, res, next) {
    try {
      const user = { userId: req.user?.id || 'SYSTEM', role: req.user?.role || 'PROCUREMENT_OFFICER', name: req.user?.name };
      const quotation = await QuotationService.updateQuotationStatus(req.params.id, req.body.status, user);
      res.json({ success: true, message: 'Quotation status updated', quotation });
    } catch (error) {
      next(error);
    }
  }

  static async getQuotations(req, res, next) {
    try {
      const result = await QuotationService.getQuotations(req.query);
      res.json({ success: true, ...result });
    } catch (error) {
      next(error);
    }
  }

  static async getQuotationById(req, res, next) {
    try {
      const quotation = await QuotationService.getQuotationById(req.params.id);
      res.json({ success: true, quotation });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = QuotationController;
