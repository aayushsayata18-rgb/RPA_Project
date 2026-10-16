const AlertService = require('../services/inventory/alertService');
const ExpiryService = require('../services/inventory/expiryService');

class AlertController {
  static async getAlerts(req, res, next) {
    try {
      const result = await AlertService.getAlerts(req.query);
      res.json({ success: true, ...result });
    } catch (err) {
      next(err);
    }
  }

  static async scanLowStock(req, res, next) {
    try {
      const user = req.user || { userId: 'SYSTEM' };
      const result = await AlertService.scanLowStockItems(user);
      res.json({ success: true, ...result });
    } catch (err) {
      next(err);
    }
  }

  static async scanExpiry(req, res, next) {
    try {
      const user = req.user || { userId: 'SYSTEM' };
      const nearDays = req.query.nearExpiryDays ? parseInt(req.query.nearExpiryDays, 10) : 30;
      const result = await ExpiryService.scanExpiringStock(nearDays, user);
      res.json({ success: true, ...result });
    } catch (err) {
      next(err);
    }
  }

  static async updateStatus(req, res, next) {
    try {
      const user = req.user || { userId: 'SYSTEM' };
      const { status } = req.body;
      const alert = await AlertService.updateAlertStatus(req.params.id, status, user);
      res.json({ success: true, alert });
    } catch (err) {
      next(err);
    }
  }
}

module.exports = AlertController;
