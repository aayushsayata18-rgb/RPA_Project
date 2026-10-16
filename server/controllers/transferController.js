const TransferService = require('../services/inventory/transferService');

class TransferController {
  static async requestTransfer(req, res, next) {
    try {
      const user = req.user || { userId: 'SYSTEM' };
      const transfer = await TransferService.requestTransfer(req.body, user);
      res.status(201).json({ success: true, transfer });
    } catch (err) {
      next(err);
    }
  }

  static async approveTransfer(req, res, next) {
    try {
      const user = req.user || { userId: 'SYSTEM' };
      const transfer = await TransferService.approveTransfer(req.params.id, user);
      res.json({ success: true, transfer });
    } catch (err) {
      next(err);
    }
  }

  static async dispatchTransfer(req, res, next) {
    try {
      const user = req.user || { userId: 'SYSTEM' };
      const transfer = await TransferService.dispatchTransfer(req.params.id, user);
      res.json({ success: true, transfer });
    } catch (err) {
      next(err);
    }
  }

  static async receiveTransfer(req, res, next) {
    try {
      const user = req.user || { userId: 'SYSTEM' };
      const { items } = req.body;
      const transfer = await TransferService.receiveTransfer(req.params.id, items, user);
      res.json({ success: true, transfer });
    } catch (err) {
      next(err);
    }
  }

  static async getTransfers(req, res, next) {
    try {
      const result = await TransferService.getTransfers(req.query);
      res.json({ success: true, ...result });
    } catch (err) {
      next(err);
    }
  }

  static async getTransferById(req, res, next) {
    try {
      const transfer = await TransferService.getTransferById(req.params.id);
      res.json({ success: true, transfer });
    } catch (err) {
      next(err);
    }
  }
}

module.exports = TransferController;
