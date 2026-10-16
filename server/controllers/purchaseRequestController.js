const PurchaseRequestService = require('../services/procurement/purchaseRequestService');
const ApprovalService = require('../services/procurement/approvalService');

class PurchaseRequestController {
  static async createRequest(req, res, next) {
    try {
      const user = { userId: req.user?.id || req.body.requesterId || 'SYSTEM', role: req.user?.role || 'DEPARTMENT_REQUESTER', name: req.user?.name };
      const pr = await PurchaseRequestService.createRequest(req.body, user);
      res.status(201).json({ success: true, message: 'Purchase request created successfully', request: pr });
    } catch (error) {
      next(error);
    }
  }

  static async updateRequest(req, res, next) {
    try {
      const user = { userId: req.user?.id || 'SYSTEM', role: req.user?.role || 'REQUESTER', name: req.user?.name };
      const pr = await PurchaseRequestService.updateRequest(req.params.id, req.body, user);
      res.json({ success: true, message: 'Purchase request updated successfully', request: pr });
    } catch (error) {
      next(error);
    }
  }

  static async submitRequest(req, res, next) {
    try {
      const user = { userId: req.user?.id || 'SYSTEM', role: req.user?.role || 'REQUESTER', name: req.user?.name };
      const pr = await PurchaseRequestService.submitRequest(req.params.id, user);
      res.json({ success: true, message: 'Purchase request submitted for approval', request: pr });
    } catch (error) {
      next(error);
    }
  }

  static async approveRequest(req, res, next) {
    try {
      const user = { userId: req.user?.id || 'SYSTEM', role: req.user?.role || 'ADMIN_MANAGER', name: req.user?.name };
      const pr = await ApprovalService.approvePurchaseRequest(req.params.id, req.body.notes, user);
      res.json({ success: true, message: 'Purchase request approved successfully', request: pr });
    } catch (error) {
      next(error);
    }
  }

  static async rejectRequest(req, res, next) {
    try {
      const user = { userId: req.user?.id || 'SYSTEM', role: req.user?.role || 'ADMIN_MANAGER', name: req.user?.name };
      const pr = await ApprovalService.rejectPurchaseRequest(req.params.id, req.body.reason, user);
      res.json({ success: true, message: 'Purchase request rejected', request: pr });
    } catch (error) {
      next(error);
    }
  }

  static async returnRequest(req, res, next) {
    try {
      const user = { userId: req.user?.id || 'SYSTEM', role: req.user?.role || 'ADMIN_MANAGER', name: req.user?.name };
      const pr = await ApprovalService.returnPurchaseRequestForCorrection(req.params.id, req.body.reason, user);
      res.json({ success: true, message: 'Purchase request returned for correction', request: pr });
    } catch (error) {
      next(error);
    }
  }

  static async cancelRequest(req, res, next) {
    try {
      const user = { userId: req.user?.id || 'SYSTEM', role: req.user?.role || 'REQUESTER', name: req.user?.name };
      const pr = await PurchaseRequestService.cancelRequest(req.params.id, req.body.reason, user);
      res.json({ success: true, message: 'Purchase request cancelled', request: pr });
    } catch (error) {
      next(error);
    }
  }

  static async getRequests(req, res, next) {
    try {
      const result = await PurchaseRequestService.getRequests(req.query);
      res.json({ success: true, ...result });
    } catch (error) {
      next(error);
    }
  }

  static async getRequestById(req, res, next) {
    try {
      const pr = await PurchaseRequestService.getRequestById(req.params.id);
      res.json({ success: true, request: pr });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = PurchaseRequestController;
