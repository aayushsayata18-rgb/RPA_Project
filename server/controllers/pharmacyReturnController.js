const ReturnService = require('../services/pharmacy/returnService');

class PharmacyReturnController {
  static async createReturn(req, res, next) {
    try {
      const data = {
        ...req.body,
        items: req.body.items || req.body.returnedItems,
        requestedBy: req.body.requestedBy || req.user?.userId,
        actorUser: req.user
      };
      const pharmacyReturn = await ReturnService.createReturn(data);
      return res.status(201).json({
        success: true,
        message: `Pharmacy return '${pharmacyReturn.returnId}' requested successfully.`,
        pharmacyReturn
      });
    } catch (err) {
      if (err.message.includes('not found')) {
        return res.status(404).json({ success: false, message: err.message });
      }
      next(err);
    }
  }

  static async getReturns(req, res, next) {
    try {
      const query = { ...req.query };
      if (req.user?.role === 'PATIENT') {
        query.patientId = req.user.userId;
      }
      const result = await ReturnService.getReturns(query);
      return res.json({ success: true, ...result });
    } catch (err) {
      next(err);
    }
  }

  static async getReturnById(req, res, next) {
    try {
      const pharmacyReturn = await ReturnService.getReturnById(req.params.id);
      if (req.user?.role === 'PATIENT' && pharmacyReturn.patientId !== req.user.userId) {
        return res.status(403).json({ success: false, message: 'Access denied to other patient returns.' });
      }
      return res.json({ success: true, pharmacyReturn });
    } catch (err) {
      next(err);
    }
  }

  static async reviewReturn(req, res, next) {
    try {
      const { action, reviewNotes } = req.body;
      const pharmacyReturn = await ReturnService.reviewReturn(req.params.id, {
        action,
        reviewNotes,
        approvedBy: req.user?.userId,
        actorUser: req.user
      });
      return res.json({
        success: true,
        message: `Return '${req.params.id}' ${action}D successfully.`,
        pharmacyReturn
      });
    } catch (err) {
      next(err);
    }
  }

  static async processReturn(req, res, next) {
    try {
      const { itemDispositions } = req.body;
      const pharmacyReturn = await ReturnService.processReturnDisposition(req.params.id, {
        itemDispositions,
        processedBy: req.user?.userId,
        actorUser: req.user
      });
      return res.json({
        success: true,
        message: `Return '${req.params.id}' disposition processed. Status: ${pharmacyReturn.status}.`,
        pharmacyReturn
      });
    } catch (err) {
      next(err);
    }
  }
}

module.exports = PharmacyReturnController;
