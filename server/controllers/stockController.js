const StockService = require('../services/inventory/stockService');
const AlertService = require('../services/inventory/alertService');
const GoodsReceipt = require('../models/GoodsReceipt');

class StockController {
  static async getAvailability(req, res, next) {
    try {
      const { inventoryItemId } = req.params;
      const { locationId } = req.query;
      const result = await StockService.getAvailability(inventoryItemId, locationId);
      res.json({ success: true, availability: result });
    } catch (err) {
      next(err);
    }
  }

  static async issueStock(req, res, next) {
    try {
      const user = req.user || { userId: 'SYSTEM' };
      const result = await StockService.issueStock(req.body, user);
      res.status(200).json({ success: true, ...result });
    } catch (err) {
      next(err);
    }
  }

  static async processGoodsReceipt(req, res, next) {
    try {
      const user = req.user || { userId: 'SYSTEM' };
      const result = await StockService.processGoodsReceipt(req.body, user);
      res.status(201).json({ success: true, ...result });
    } catch (err) {
      next(err);
    }
  }

  static async getGoodsReceipts(req, res, next) {
    try {
      const { page = 1, limit = 20, purchaseOrderId, vendorId, status } = req.query;
      const filter = {};
      if (purchaseOrderId) filter.purchaseOrderId = purchaseOrderId;
      if (vendorId) filter.vendorId = vendorId;
      if (status) filter.status = status;

      const skip = (parseInt(page, 10) - 1) * parseInt(limit, 10);
      const total = await GoodsReceipt.countDocuments(filter);
      const goodsReceipts = await GoodsReceipt.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit, 10))
        .lean();

      res.json({
        success: true,
        goodsReceipts,
        total,
        page: parseInt(page, 10),
        pages: Math.ceil(total / parseInt(limit, 10))
      });
    } catch (err) {
      next(err);
    }
  }

  static async getGoodsReceiptById(req, res, next) {
    try {
      const grn = await GoodsReceipt.findOne({ goodsReceiptId: req.params.id }).lean();
      if (!grn) {
        return res.status(404).json({ success: false, error: { message: 'Goods receipt not found.' } });
      }
      res.json({ success: true, goodsReceipt: grn });
    } catch (err) {
      next(err);
    }
  }

  static async getMovements(req, res, next) {
    try {
      const result = await StockService.getMovements(req.query);
      res.json({ success: true, ...result });
    } catch (err) {
      next(err);
    }
  }

  static async getDashboardKPIs(req, res, next) {
    try {
      const kpis = await AlertService.getDashboardKPIs();
      res.json({ success: true, kpis });
    } catch (err) {
      next(err);
    }
  }
}

module.exports = StockController;
