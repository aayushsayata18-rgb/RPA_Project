const RfqService = require('../services/procurement/rfqService');

class RfqController {
  static async createRfq(req, res, next) {
    try {
      const user = { userId: req.user?.id || 'SYSTEM', role: req.user?.role || 'PROCUREMENT_OFFICER', name: req.user?.name };
      const rfq = await RfqService.createRfq(req.body, user);
      res.status(201).json({ success: true, message: 'RFQ created successfully', rfq });
    } catch (error) {
      next(error);
    }
  }

  static async issueRfq(req, res, next) {
    try {
      const user = { userId: req.user?.id || 'SYSTEM', role: req.user?.role || 'PROCUREMENT_OFFICER', name: req.user?.name };
      const rfq = await RfqService.issueRfq(req.params.id, user);
      res.json({ success: true, message: 'RFQ issued to vendors', rfq });
    } catch (error) {
      next(error);
    }
  }

  static async closeRfq(req, res, next) {
    try {
      const user = { userId: req.user?.id || 'SYSTEM', role: req.user?.role || 'PROCUREMENT_OFFICER', name: req.user?.name };
      const rfq = await RfqService.closeRfq(req.params.id, user);
      res.json({ success: true, message: 'RFQ closed', rfq });
    } catch (error) {
      next(error);
    }
  }

  static async getRfqs(req, res, next) {
    try {
      const result = await RfqService.getRfqs(req.query);
      res.json({ success: true, ...result });
    } catch (error) {
      next(error);
    }
  }

  static async getRfqById(req, res, next) {
    try {
      const rfq = await RfqService.getRfqById(req.params.id);
      res.json({ success: true, rfq });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = RfqController;
