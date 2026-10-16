const DeliveryService = require('../services/procurement/deliveryService');

class DeliveryController {
  static async createDelivery(req, res, next) {
    try {
      const user = { userId: req.user?.id || 'SYSTEM', role: req.user?.role || 'PROCUREMENT_OFFICER', name: req.user?.name };
      const delivery = await DeliveryService.createDelivery(req.body, user);
      res.status(201).json({ success: true, message: 'Delivery recorded successfully', delivery });
    } catch (error) {
      next(error);
    }
  }

  static async updateDeliveryStatus(req, res, next) {
    try {
      const user = { userId: req.user?.id || 'SYSTEM', role: req.user?.role || 'PROCUREMENT_OFFICER', name: req.user?.name };
      const delivery = await DeliveryService.updateDeliveryStatus(req.params.id, req.body, user);
      res.json({ success: true, message: 'Delivery status updated', delivery });
    } catch (error) {
      next(error);
    }
  }

  static async checkDelayedDeliveries(req, res, next) {
    try {
      const result = await DeliveryService.checkDelayedDeliveries();
      res.json({ success: true, message: 'Delayed delivery check complete', ...result });
    } catch (error) {
      next(error);
    }
  }

  static async getDeliveries(req, res, next) {
    try {
      const result = await DeliveryService.getDeliveries(req.query);
      res.json({ success: true, ...result });
    } catch (error) {
      next(error);
    }
  }

  static async getDeliveryById(req, res, next) {
    try {
      const delivery = await DeliveryService.getDeliveryById(req.params.id);
      res.json({ success: true, delivery });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = DeliveryController;
