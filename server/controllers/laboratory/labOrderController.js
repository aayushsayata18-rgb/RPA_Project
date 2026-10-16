const LabOrderService = require('../../services/laboratory/labOrderService');
const { validateOrderCreation } = require('../../validators/labValidators');

class LabOrderController {
  static async listOrders(req, res, next) {
    try {
      const { patientCode, status, priority, search, page, limit } = req.query;
      // If user is PATIENT, constrain to their own patientCode
      let resolvedPatientCode = patientCode;
      if (req.user?.role === 'PATIENT') {
        resolvedPatientCode = req.user.userId;
      }

      const result = await LabOrderService.listOrders({
        patientCode: resolvedPatientCode,
        status,
        priority,
        search,
        page,
        limit
      });

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
      const order = await LabOrderService.getOrderById(req.params.id);
      // Access check for patient
      if (req.user?.role === 'PATIENT' && req.user.userId !== order.patientCode) {
        return res.status(403).json({
          success: false,
          error: {
            code: 'ACCESS_DENIED',
            message: 'You are not authorized to view this laboratory order.'
          }
        });
      }

      res.json({
        success: true,
        data: order
      });
    } catch (err) {
      next(err);
    }
  }

  static async checkDuplicate(req, res, next) {
    try {
      const { patientId, patientCode, testCodes, testIds } = req.body;
      const result = await LabOrderService.checkDuplicateOrder({
        patientId,
        patientCode,
        testCodes,
        testIds
      });
      res.json({
        success: true,
        data: result
      });
    } catch (err) {
      next(err);
    }
  }

  static async createOrder(req, res, next) {
    try {
      const payload = { ...req.body };
      if (!payload.orderingDoctorId) {
        payload.orderingDoctorId = payload.doctorId || req.user?.doctorId || 'DOC-01';
      }
      if ((!payload.testIds || payload.testIds.length === 0) && Array.isArray(payload.items)) {
        payload.testIds = payload.items.map(it => it.labTestId || it.testId || it).filter(Boolean);
      }
      if (payload.priority === 'ROUTINE') {
        payload.priority = 'NORMAL';
      }
      if (!payload.patientCode && payload.patientId) {
        payload.patientCode = payload.patientId;
      }

      const validation = validateOrderCreation(payload);
      if (!validation.isValid) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: validation.errors.join(' ')
          }
        });
      }

      const result = await LabOrderService.createOrder({
        ...payload,
        user: req.user
      });

      const orderObj = result.order && typeof result.order.toObject === 'function'
        ? result.order.toObject()
        : result.order;

      res.status(201).json({
        success: true,
        message: `Laboratory order ${result.order.orderId} created successfully.`,
        data: {
          ...orderObj,
          labOrderId: result.order.orderId,
          orderId: result.order.orderId,
          items: result.items,
          samples: result.samples
        }
      });
    } catch (err) {
      if (err.code === 'DUPLICATE_LAB_ORDER') {
        return res.status(409).json({
          success: false,
          error: {
            code: 'DUPLICATE_LAB_ORDER',
            message: err.message,
            details: err.details
          }
        });
      }
      next(err);
    }
  }

  static async cancelOrder(req, res, next) {
    try {
      const { cancellationReason } = req.body;
      const order = await LabOrderService.cancelOrder({
        orderIdentifier: req.params.id,
        cancellationReason,
        user: req.user
      });
      res.json({
        success: true,
        message: `Laboratory order ${order.orderId} cancelled successfully.`,
        data: order
      });
    } catch (err) {
      next(err);
    }
  }
}

module.exports = LabOrderController;
