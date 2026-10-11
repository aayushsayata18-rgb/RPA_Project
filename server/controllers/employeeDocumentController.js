const EmployeeDocumentService = require('../services/employeeDocumentService');

class EmployeeDocumentController {
  static async getEmployeeDocuments(req, res, next) {
    try {
      const documents = await EmployeeDocumentService.getDocuments(req.params.id);
      res.json({ success: true, data: documents });
    } catch (err) {
      next(err);
    }
  }

  static async addEmployeeDocument(req, res, next) {
    try {
      const actor = req.user ? { userId: req.user.userId, role: req.user.role } : { userId: 'SYSTEM', role: 'HR_MANAGER' };
      const doc = await EmployeeDocumentService.addDocument(req.params.id, req.body, actor);
      res.status(201).json({ success: true, message: 'Document uploaded.', data: doc });
    } catch (err) {
      next(err);
    }
  }
}

module.exports = EmployeeDocumentController;
