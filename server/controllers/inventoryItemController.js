const InventoryItemService = require('../services/inventory/inventoryItemService');

class InventoryItemController {
  static async getItems(req, res, next) {
    try {
      const result = await InventoryItemService.getItems(req.query);
      res.json({ success: true, ...result });
    } catch (err) {
      next(err);
    }
  }

  static async getItemById(req, res, next) {
    try {
      const item = await InventoryItemService.getItemById(req.params.id);
      res.json({ success: true, item });
    } catch (err) {
      next(err);
    }
  }

  static async createItem(req, res, next) {
    try {
      const user = req.user || { userId: 'SYSTEM' };
      const item = await InventoryItemService.createItem(req.body, user);
      res.status(201).json({ success: true, item });
    } catch (err) {
      next(err);
    }
  }

  static async updateItem(req, res, next) {
    try {
      const user = req.user || { userId: 'SYSTEM' };
      const item = await InventoryItemService.updateItem(req.params.id, req.body, user);
      res.json({ success: true, item });
    } catch (err) {
      next(err);
    }
  }

  static async changeStatus(req, res, next) {
    try {
      const user = req.user || { userId: 'SYSTEM' };
      const { status } = req.body;
      const item = await InventoryItemService.changeStatus(req.params.id, status, user);
      res.json({ success: true, item });
    } catch (err) {
      next(err);
    }
  }
}

module.exports = InventoryItemController;
