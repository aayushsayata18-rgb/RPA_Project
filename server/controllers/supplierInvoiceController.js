const InvoiceMatchingService = require('../services/procurement/invoiceMatchingService');

class SupplierInvoiceController {
  static async registerInvoice(req, res, next) {
    try {
      const user = { userId: req.user?.id || 'SYSTEM', role: req.user?.role || 'BILLING_STAFF', name: req.user?.name };
      const invoice = await InvoiceMatchingService.registerInvoice(req.body, user);
      res.status(201).json({ success: true, message: 'Supplier invoice recorded successfully', invoice });
    } catch (error) {
      next(error);
    }
  }

  static async performMatch(req, res, next) {
    try {
      const user = { userId: req.user?.id || 'SYSTEM', role: req.user?.role || 'BILLING_STAFF', name: req.user?.name };
      const invoice = await InvoiceMatchingService.performThreeWayMatch(req.params.id, user);
      res.json({ success: true, message: 'Three-way match completed', invoice });
    } catch (error) {
      next(error);
    }
  }

  static async approveMatch(req, res, next) {
    try {
      const user = { userId: req.user?.id || 'SYSTEM', role: req.user?.role || 'PROCUREMENT_MANAGER', name: req.user?.name };
      const invoice = await InvoiceMatchingService.approveMatchAndHandoffToFinance(req.params.id, user);
      res.json({ success: true, message: 'Invoice approved and handed off to Finance', invoice });
    } catch (error) {
      next(error);
    }
  }

  static async getInvoices(req, res, next) {
    try {
      const result = await InvoiceMatchingService.getInvoices(req.query);
      res.json({ success: true, ...result });
    } catch (error) {
      next(error);
    }
  }

  static async getInvoiceById(req, res, next) {
    try {
      const invoice = await InvoiceMatchingService.getInvoiceById(req.params.id);
      res.json({ success: true, invoice });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = SupplierInvoiceController;
