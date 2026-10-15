const PharmacyOrderService = require('../services/pharmacy/pharmacyOrderService');
const StockAvailabilityService = require('../services/pharmacy/stockAvailabilityService');

class PharmacyOrderController {
  static async getOrders(req, res, next) {
    try {
      const query = { ...req.query };
      // Patient privacy restriction
      if (req.user?.role === 'PATIENT') {
        query.patientId = req.user.userId;
      }
      const result = await PharmacyOrderService.getOrders(query);
      return res.json({ success: true, ...result });
    } catch (err) {
      next(err);
    }
  }

  static async getOrderById(req, res, next) {
    try {
      const order = await PharmacyOrderService.getOrderById(req.params.id);
      if (req.user?.role === 'PATIENT' && order.patientId !== req.user.userId) {
        return res.status(403).json({ success: false, message: 'Access denied to other patient orders.' });
      }
      return res.json({ success: true, order });
    } catch (err) {
      next(err);
    }
  }

  static async receiveOrder(req, res, next) {
    try {
      const order = await PharmacyOrderService.receiveOrder(req.params.id, req.user);
      return res.json({
        success: true,
        message: `Order '${req.params.id}' received for validation.`,
        order
      });
    } catch (err) {
      next(err);
    }
  }

  static async reserveStock(req, res, next) {
    try {
      const { medicineId, quantity, selectionMethod, overrideBatchId, overrideReason } = req.body;
      const result = await StockAvailabilityService.reserveStockForOrder({
        pharmacyOrderId: req.params.id,
        medicineId,
        quantity,
        selectionMethod,
        overrideBatchId,
        overrideReason,
        actorUser: req.user
      });
      return res.json({
        success: true,
        message: `Stock reserved for order '${req.params.id}'.`,
        ...result
      });
    } catch (err) {
      if (err.message.includes('Insufficient stock')) {
        return res.status(409).json({ success: false, message: err.message, errorCode: 'INSUFFICIENT_STOCK' });
      }
      next(err);
    }
  }

  static async releaseReservation(req, res, next) {
    try {
      const result = await StockAvailabilityService.releaseReservation({
        pharmacyOrderId: req.params.id,
        actorUser: req.user
      });
      return res.json({
        success: true,
        message: `Stock reservation released for order '${req.params.id}'.`,
        ...result
      });
    } catch (err) {
      next(err);
    }
  }

  static async holdOrder(req, res, next) {
    try {
      const { reason } = req.body;
      const order = await PharmacyOrderService.holdOrder(req.params.id, reason, req.user);
      return res.json({
        success: true,
        message: `Order '${req.params.id}' placed ON_HOLD.`,
        order
      });
    } catch (err) {
      next(err);
    }
  }

  static async cancelOrder(req, res, next) {
    try {
      const { reason } = req.body;
      const order = await PharmacyOrderService.cancelOrder(req.params.id, reason, req.user);
      return res.json({
        success: true,
        message: `Order '${req.params.id}' cancelled.`,
        order
      });
    } catch (err) {
      next(err);
    }
  }
}

module.exports = PharmacyOrderController;
