const EmployeeService = require('../services/employeeService');
const EmployeeOnboardingService = require('../services/employeeOnboardingService');
const EmployeeTransferService = require('../services/employeeTransferService');
const EmployeeOffboardingService = require('../services/employeeOffboardingService');
const EmployeeSyncService = require('../services/employeeSyncService');

class EmployeeController {
  static async checkDuplicates(req, res, next) {
    try {
      const result = await EmployeeService.checkDuplicates(req.body);
      res.json({ success: true, ...result });
    } catch (err) {
      next(err);
    }
  }

  static async getDashboardMetrics(req, res, next) {
    try {
      const metrics = await EmployeeService.getDashboardMetrics();
      res.json({ success: true, data: metrics });
    } catch (err) {
      next(err);
    }
  }

  static async getEmployees(req, res, next) {
    try {
      const result = await EmployeeService.getEmployees(req.query);
      res.json({ success: true, ...result });
    } catch (err) {
      next(err);
    }
  }

  static async getEmployeeById(req, res, next) {
    try {
      const employee = await EmployeeService.getEmployeeById(req.params.id);
      if (!employee) {
        return res.status(404).json({ success: false, message: 'Employee not found.' });
      }
      res.json({ success: true, data: employee });
    } catch (err) {
      next(err);
    }
  }

  static async createEmployee(req, res, next) {
    try {
      const actor = req.user ? { userId: req.user.userId, role: req.user.role } : { userId: 'SYSTEM', role: 'ADMIN_MANAGER' };
      const employee = await EmployeeService.createEmployee(req.body, actor);
      res.status(201).json({ success: true, message: 'Employee created successfully.', data: employee });
    } catch (err) {
      next(err);
    }
  }

  static async updateEmployee(req, res, next) {
    try {
      const actor = req.user ? { userId: req.user.userId, role: req.user.role } : { userId: 'SYSTEM', role: 'ADMIN_MANAGER' };
      const employee = await EmployeeService.updateEmployee(req.params.id, req.body, actor);
      res.json({ success: true, message: 'Employee updated successfully.', data: employee });
    } catch (err) {
      next(err);
    }
  }

  static async updateEmployeeStatus(req, res, next) {
    try {
      const actor = req.user ? { userId: req.user.userId, role: req.user.role } : { userId: 'SYSTEM', role: 'ADMIN_MANAGER' };
      const { status, reason } = req.body;
      const employee = await EmployeeService.updateEmployeeStatus(req.params.id, status, reason, actor);
      res.json({ success: true, message: `Status updated to ${status}.`, data: employee });
    } catch (err) {
      next(err);
    }
  }

  static async getEmployeeHistory(req, res, next) {
    try {
      const history = await EmployeeService.getEmployeeHistory(req.params.id);
      res.json({ success: true, data: history });
    } catch (err) {
      next(err);
    }
  }

  static async submitForApproval(req, res, next) {
    try {
      const actor = req.user ? { userId: req.user.userId, role: req.user.role } : { userId: 'SYSTEM', role: 'HR_MANAGER' };
      const employee = await EmployeeOnboardingService.submitForApproval(req.params.id, actor);
      res.json({ success: true, message: 'Submitted for approval.', data: employee });
    } catch (err) {
      next(err);
    }
  }

  static async approveEmployee(req, res, next) {
    try {
      const actor = req.user ? { userId: req.user.userId, role: req.user.role } : { userId: 'SYSTEM', role: 'ADMIN_MANAGER' };
      const { comments } = req.body;
      const result = await EmployeeOnboardingService.approveOnboarding(req.params.id, actor, comments);
      res.json({ success: true, message: 'Employee onboarding approved.', ...result });
    } catch (err) {
      next(err);
    }
  }

  static async rejectEmployee(req, res, next) {
    try {
      const actor = req.user ? { userId: req.user.userId, role: req.user.role } : { userId: 'SYSTEM', role: 'ADMIN_MANAGER' };
      const { reason } = req.body;
      const employee = await EmployeeOnboardingService.rejectOnboarding(req.params.id, actor, reason);
      res.json({ success: true, message: 'Employee onboarding rejected.', data: employee });
    } catch (err) {
      next(err);
    }
  }

  static async returnForCorrection(req, res, next) {
    try {
      const actor = req.user ? { userId: req.user.userId, role: req.user.role } : { userId: 'SYSTEM', role: 'ADMIN_MANAGER' };
      const { comments } = req.body;
      const employee = await EmployeeOnboardingService.returnForCorrection(req.params.id, actor, comments);
      res.json({ success: true, message: 'Returned for correction.', data: employee });
    } catch (err) {
      next(err);
    }
  }

  static async transferEmployee(req, res, next) {
    try {
      const actor = req.user ? { userId: req.user.userId, role: req.user.role } : { userId: 'SYSTEM', role: 'ADMIN_MANAGER' };
      const result = await EmployeeTransferService.transferDepartment(req.params.id, req.body, actor);
      res.json({ success: true, message: 'Department transfer executed successfully.', ...result });
    } catch (err) {
      next(err);
    }
  }

  static async updateRole(req, res, next) {
    try {
      const actor = req.user ? { userId: req.user.userId, role: req.user.role } : { userId: 'SYSTEM', role: 'ADMIN_MANAGER' };
      const result = await EmployeeTransferService.updateRole(req.params.id, req.body, actor);
      res.json({ success: true, message: 'Role updated successfully.', ...result });
    } catch (err) {
      next(err);
    }
  }

  static async offboardEmployee(req, res, next) {
    try {
      const actor = req.user ? { userId: req.user.userId, role: req.user.role } : { userId: 'SYSTEM', role: 'HR_MANAGER' };
      const employee = await EmployeeOffboardingService.initiateOffboarding(req.params.id, req.body, actor);
      res.json({ success: true, message: 'Employee offboarding initiated.', data: employee });
    } catch (err) {
      next(err);
    }
  }

  static async updateOffboardingChecklist(req, res, next) {
    try {
      const actor = req.user ? { userId: req.user.userId, role: req.user.role } : { userId: 'SYSTEM', role: 'HR_MANAGER' };
      const { itemIndex } = req.params;
      const employee = await EmployeeOffboardingService.updateChecklistItem(req.params.id, parseInt(itemIndex, 10), req.body, actor);
      res.json({ success: true, message: 'Checklist updated.', data: employee });
    } catch (err) {
      next(err);
    }
  }

  static async syncEmployee(req, res, next) {
    try {
      const actor = req.user ? { userId: req.user.userId, role: req.user.role } : { userId: 'SYSTEM', role: 'ADMIN_MANAGER' };
      const result = await EmployeeSyncService.syncEmployee(req.params.id, req.body, actor);
      res.json({ success: true, message: 'External synchronization queued.', ...result });
    } catch (err) {
      next(err);
    }
  }

  static async completeSync(req, res, next) {
    try {
      const result = await EmployeeSyncService.completeSync(req.params.syncId, req.body);
      res.json({ success: true, message: 'Sync status updated.', data: result });
    } catch (err) {
      next(err);
    }
  }

  static async getEmployeeSyncs(req, res, next) {
    try {
      const syncs = await EmployeeSyncService.getEmployeeSyncs(req.params.id);
      res.json({ success: true, data: syncs });
    } catch (err) {
      next(err);
    }
  }
}

module.exports = EmployeeController;
