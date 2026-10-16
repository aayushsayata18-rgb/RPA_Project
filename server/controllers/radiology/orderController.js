const OrderService = require('../../services/radiology/orderService');

class OrderController {
  static async listOrders(req, res, next) {
    try {
      const filters = {
        status: req.query.status,
        priority: req.query.priority,
        modalityType: req.query.modalityType,
        patientId: req.query.patientId,
        search: req.query.search
      };
      const pagination = {
        page: req.query.page,
        limit: req.query.limit
      };
      const result = await OrderService.listOrders(filters, pagination);
      res.json({
        success: true,
        data: result.orders,
        pagination: result.pagination
      });
    } catch (err) {
      next(err);
    }
  }

  static async getOrderById(req, res, next) {
    try {
      const order = await OrderService.getOrderById(req.params.id);
      res.json({
        success: true,
        data: order
      });
    } catch (err) {
      next(err);
    }
  }

  static async createOrder(req, res, next) {
    try {
      const order = await OrderService.createOrder({
        ...req.body,
        user: req.user
      });
      res.status(201).json({
        success: true,
        message: 'Radiology order placed successfully.',
        data: order
      });
    } catch (err) {
      next(err);
    }
  }

  static async checkDuplicate(req, res, next) {
    try {
      const result = await OrderService.checkDuplicateOrder(req.body);
      res.json({
        success: true,
        data: result
      });
    } catch (err) {
      next(err);
    }
  }

  static async cancelOrder(req, res, next) {
    try {
      const { reason } = req.body;
      const order = await OrderService.cancelOrder(req.params.id, reason, req.user);
      res.json({
        success: true,
        message: 'Radiology order cancelled successfully.',
        data: order
      });
    } catch (err) {
      next(err);
    }
  }
}

module.exports = OrderController;
