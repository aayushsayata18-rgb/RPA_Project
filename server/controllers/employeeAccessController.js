const EmployeeAccessService = require('../services/employeeAccessService');

class EmployeeAccessController {
  static async getAccessRequests(req, res, next) {
    try {
      const result = await EmployeeAccessService.getAccessRequests(req.query);
      res.json({ success: true, ...result });
    } catch (err) {
      next(err);
    }
  }

  static async getEmployeeAccess(req, res, next) {
    try {
      const result = await EmployeeAccessService.getAccessRequests({ employeeId: req.params.id });
      res.json({ success: true, ...result });
    } catch (err) {
      next(err);
    }
  }

  static async requestAccess(req, res, next) {
    try {
      const actor = req.user ? { userId: req.user.userId, role: req.user.role, linkedEntityId: req.user.linkedEntityId } : { userId: 'SYSTEM', role: 'ADMIN_MANAGER' };
      const accessRequest = await EmployeeAccessService.requestAccess({
        employeeId: req.params.id || req.body.employeeId,
        ...req.body
      }, actor);
      res.status(201).json({ success: true, message: 'Access request created.', data: accessRequest });
    } catch (err) {
      next(err);
    }
  }

  static async approveAccess(req, res, next) {
    try {
      const actor = req.user ? { userId: req.user.userId, role: req.user.role, linkedEntityId: req.user.linkedEntityId } : { userId: 'SYSTEM', role: 'SYSTEM_ADMIN' };
      const accessRequest = await EmployeeAccessService.approveAccess(req.params.id, actor);
      res.json({ success: true, message: 'Access request approved.', data: accessRequest });
    } catch (err) {
      next(err);
    }
  }

  static async rejectAccess(req, res, next) {
    try {
      const actor = req.user ? { userId: req.user.userId, role: req.user.role, linkedEntityId: req.user.linkedEntityId } : { userId: 'SYSTEM', role: 'SYSTEM_ADMIN' };
      const { reason } = req.body;
      const accessRequest = await EmployeeAccessService.rejectAccess(req.params.id, actor, reason);
      res.json({ success: true, message: 'Access request rejected.', data: accessRequest });
    } catch (err) {
      next(err);
    }
  }

  static async provisionAccess(req, res, next) {
    try {
      const actor = req.user ? { userId: req.user.userId, role: req.user.role } : { userId: 'SYSTEM', role: 'SYSTEM_ADMIN' };
      const result = await EmployeeAccessService.provisionAccess(req.params.id, actor);
      res.json({ success: true, message: 'Access provisioned successfully.', ...result });
    } catch (err) {
      next(err);
    }
  }

  static async revokeAccess(req, res, next) {
    try {
      const actor = req.user ? { userId: req.user.userId, role: req.user.role } : { userId: 'SYSTEM', role: 'SYSTEM_ADMIN' };
      const { reason } = req.body;
      const accessRequest = await EmployeeAccessService.revokeAccess(req.params.id, actor, reason);
      res.json({ success: true, message: 'Access revoked.', data: accessRequest });
    } catch (err) {
      next(err);
    }
  }
}

module.exports = EmployeeAccessController;
