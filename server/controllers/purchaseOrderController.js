const PurchaseOrderService = require('../services/procurement/purchaseOrderService');
const ApprovalService = require('../services/procurement/approvalService');

class PurchaseOrderController {
  static async createPurchaseOrder(req, res, next) {
    try {
      const user = { userId: req.user?.id || 'SYSTEM', role: req.user?.role || 'PROCUREMENT_OFFICER', name: req.user?.name };
      const po = await PurchaseOrderService.createPurchaseOrder(req.body, user);
      res.status(201).json({ success: true, message: 'Purchase Order created successfully', purchaseOrder: po });
    } catch (error) {
      next(error);
    }
  }

  static async submitPoForApproval(req, res, next) {
    try {
      const user = { userId: req.user?.id || 'SYSTEM', role: req.user?.role || 'PROCUREMENT_OFFICER', name: req.user?.name };
      const po = await PurchaseOrderService.submitPoForApproval(req.params.id, user);
      res.json({ success: true, message: 'Purchase Order submitted for approval', purchaseOrder: po });
    } catch (error) {
      next(error);
    }
  }

  static async approvePurchaseOrder(req, res, next) {
    try {
      const user = { userId: req.user?.id || 'SYSTEM', role: req.user?.role || 'ADMIN_MANAGER', name: req.user?.name };
      const po = await ApprovalService.approvePurchaseOrder(req.params.id, req.body.notes, user);
      res.json({ success: true, message: 'Purchase Order approved successfully', purchaseOrder: po });
    } catch (error) {
      next(error);
    }
  }

  static async rejectPurchaseOrder(req, res, next) {
    try {
      const user = { userId: req.user?.id || 'SYSTEM', role: req.user?.role || 'ADMIN_MANAGER', name: req.user?.name };
      const po = await ApprovalService.rejectPurchaseOrder(req.params.id, req.body.reason, user);
      res.json({ success: true, message: 'Purchase Order rejected', purchaseOrder: po });
    } catch (error) {
      next(error);
    }
  }

  static async sendPoToVendor(req, res, next) {
    try {
      const user = { userId: req.user?.id || 'SYSTEM', role: req.user?.role || 'PROCUREMENT_OFFICER', name: req.user?.name };
      const po = await PurchaseOrderService.sendPoToVendor(req.params.id, user);
      res.json({ success: true, message: 'Purchase Order sent to vendor', purchaseOrder: po });
    } catch (error) {
      next(error);
    }
  }

  static async recordVendorAcknowledgement(req, res, next) {
    try {
      const user = { userId: req.user?.id || 'VENDOR', role: req.user?.role || 'VENDOR', name: req.user?.name };
      const result = await PurchaseOrderService.recordVendorAcknowledgement(req.params.id, req.body, user);
      res.json({ success: true, message: 'Vendor acknowledgement recorded', ...result });
    } catch (error) {
      next(error);
    }
  }

  static async createPoRevision(req, res, next) {
    try {
      const user = { userId: req.user?.id || 'SYSTEM', role: req.user?.role || 'PROCUREMENT_MANAGER', name: req.user?.name };
      const result = await PurchaseOrderService.createPoRevision(req.params.id, req.body, user);
      res.json({ success: true, message: 'Purchase Order revision created', ...result });
    } catch (error) {
      next(error);
    }
  }

  static async cancelPurchaseOrder(req, res, next) {
    try {
      const user = { userId: req.user?.id || 'SYSTEM', role: req.user?.role || 'PROCUREMENT_MANAGER', name: req.user?.name };
      const po = await PurchaseOrderService.cancelPurchaseOrder(req.params.id, req.body.reason, user);
      res.json({ success: true, message: 'Purchase Order cancelled', purchaseOrder: po });
    } catch (error) {
      next(error);
    }
  }

  static async getPurchaseOrders(req, res, next) {
    try {
      const result = await PurchaseOrderService.getPurchaseOrders(req.query);
      res.json({ success: true, ...result });
    } catch (error) {
      next(error);
    }
  }

  static async getPurchaseOrderById(req, res, next) {
    try {
      const po = await PurchaseOrderService.getPurchaseOrderById(req.params.id);
      res.json({ success: true, purchaseOrder: po });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = PurchaseOrderController;
