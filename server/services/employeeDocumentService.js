const Employee = require('../models/Employee');
const EmployeeHistory = require('../models/EmployeeHistory');
const AuditService = require('./AuditService');
const { v4: uuidv4 } = require('uuid');

class EmployeeDocumentService {
  /**
   * Add or update employee document with versioning
   */
  static async addDocument(
    employeeId,
    { documentType, documentName, documentUrl = '', notes = '' },
    actor = { userId: 'SYSTEM', role: 'HR_MANAGER' }
  ) {
    const employee = await Employee.findOne({ employeeId });
    if (!employee) throw new Error(`Employee ${employeeId} not found.`);

    // Check existing documents of this type for version increment
    const existing = employee.employeeDocuments.filter(d => d.documentType === documentType);
    const newVersion = existing.length + 1;
    const documentId = `DOC-${employeeId}-${Date.now()}`;

    const newDoc = {
      documentId,
      documentType,
      documentName: documentName || `${documentType} v${newVersion}`,
      documentUrl,
      version: newVersion,
      uploadedAt: new Date(),
      uploadedBy: actor.userId || 'SYSTEM'
    };

    employee.employeeDocuments.push(newDoc);
    employee.updatedBy = actor.userId || 'SYSTEM';
    await employee.save();

    await EmployeeHistory.create({
      employeeId,
      eventType: 'DOCUMENT_ADDED',
      fromState: null,
      toState: { documentId, documentType, version: newVersion },
      actor: actor.userId || 'SYSTEM',
      reason: `Uploaded ${documentType} (v${newVersion})`,
      notes
    });

    await AuditService.logEvent({
      userId: actor.userId || 'SYSTEM',
      role: actor.role || 'HR_MANAGER',
      action: 'EMPLOYEE_DOCUMENT_ADDED',
      module: 'STAFF_MANAGEMENT',
      entityType: 'EMPLOYEE',
      entityId: employeeId,
      details: `Document ${documentId} (${documentType} v${newVersion}) uploaded for ${employeeId}`
    });

    return newDoc;
  }

  /**
   * Get all documents for an employee
   */
  static async getDocuments(employeeId) {
    const employee = await Employee.findOne({ employeeId }).select('employeeDocuments').lean();
    if (!employee) throw new Error(`Employee ${employeeId} not found.`);
    return employee.employeeDocuments || [];
  }
}

module.exports = EmployeeDocumentService;
