const SalaryStructure = require('../models/SalaryStructure');
const EmployeeSalaryAssignment = require('../models/EmployeeSalaryAssignment');
const Employee = require('../models/Employee');
const IdGeneratorService = require('./IdGeneratorService');
const AuditService = require('./AuditService');

class SalaryConfigurationService {
  /**
   * Create or version a Salary Structure
   */
  static async createSalaryStructure(data, actorUser) {
    const { code, name, description, components = [], effectiveFrom, effectiveTo } = data;

    if (!code || !name) {
      throw new Error('code and name are required for salary structure');
    }

    const upperCode = code.toUpperCase().trim();
    const existing = await SalaryStructure.findOne({ code: upperCode, status: 'ACTIVE' });

    let version = 1;
    if (existing) {
      // Supersede older structure
      existing.status = 'SUPERSEDED';
      existing.effectiveTo = effectiveFrom ? new Date(effectiveFrom) : new Date();
      await existing.save();
      version = existing.version + 1;
    }

    const actorId = actorUser?.userId || actorUser?.name || 'HR_ADMIN';

    const structure = new SalaryStructure({
      code: upperCode,
      name,
      description,
      version,
      components: components.map(c => ({
        code: c.code.toUpperCase(),
        name: c.name,
        type: c.type || 'EARNING',
        calculationType: c.calculationType || 'FIXED',
        formula: c.formula || null,
        percentageOf: c.percentageOf || null,
        percentageValue: c.percentageValue || 0,
        defaultValue: c.defaultValue || 0,
        isTaxable: c.isTaxable !== false
      })),
      effectiveFrom: effectiveFrom ? new Date(effectiveFrom) : new Date(),
      effectiveTo: effectiveTo ? new Date(effectiveTo) : null,
      status: 'ACTIVE',
      createdBy: actorId,
      approvedBy: actorId,
      approvedAt: new Date()
    });

    await structure.save();

    await AuditService.logEvent({
      action: 'SALARY_STRUCTURE_CREATED',
      module: 'PAYROLL',
      entityId: structure._id.toString(),
      entityType: 'SalaryStructure',
      performedBy: actorId,
      details: { code: upperCode, version }
    });

    return structure;
  }

  /**
   * List all active salary structures
   */
  static async listSalaryStructures(filter = {}) {
    return await SalaryStructure.find(filter).sort({ code: 1, version: -1 }).lean();
  }

  /**
   * Assign salary to employee (Historical versioning preserved)
   */
  static async assignSalary(data, actorUser) {
    const { employeeId, employeeIdCode, salaryStructureId, baseAmount, currency = 'USD', effectiveFrom, effectiveTo, changeReason, components } = data;

    let employee = null;
    if (employeeId) {
      employee = await Employee.findById(employeeId);
    } else if (employeeIdCode) {
      employee = await Employee.findOne({ employeeId: employeeIdCode });
    }

    if (!employee) {
      throw new Error(`Employee not found`);
    }

    const structure = await SalaryStructure.findById(salaryStructureId);
    if (!structure) {
      throw new Error(`Salary Structure with ID ${salaryStructureId} not found`);
    }

    const effectiveDate = effectiveFrom ? new Date(effectiveFrom) : new Date();

    // Find any current active assignment for this employee
    const previousAssignments = await EmployeeSalaryAssignment.find({
      employeeId: employee._id,
      status: 'ACTIVE'
    }).sort({ version: -1 });

    let version = 1;
    if (previousAssignments.length > 0) {
      version = previousAssignments[0].version + 1;
      for (const prev of previousAssignments) {
        prev.status = 'SUPERSEDED';
        prev.effectiveTo = effectiveDate;
        await prev.save();
      }
    }

    const assignmentId = await IdGeneratorService.generateSalaryAssignmentId();
    const actorId = actorUser?.userId || actorUser?.name || 'HR_ADMIN';

    // Map components: if explicit components passed, use them, else calculate from structure
    let assignedComponents = [];
    if (Array.isArray(components) && components.length > 0) {
      assignedComponents = components;
    } else {
      assignedComponents = structure.components.map(comp => {
        let amount = comp.defaultValue || 0;
        if (comp.calculationType === 'PERCENTAGE' && comp.percentageValue > 0) {
          amount = (baseAmount * comp.percentageValue) / 100;
        }
        return {
          code: comp.code,
          name: comp.name,
          type: comp.type,
          amount: Math.round(amount * 100) / 100
        };
      });
    }

    const assignment = new EmployeeSalaryAssignment({
      assignmentId,
      employeeId: employee._id,
      employeeIdCode: employee.employeeId,
      salaryStructureId: structure._id,
      salaryStructureCode: structure.code,
      version,
      currency,
      baseAmount,
      components: assignedComponents,
      effectiveFrom: effectiveDate,
      effectiveTo: effectiveTo ? new Date(effectiveTo) : null,
      status: 'ACTIVE',
      changeReason: changeReason || (version === 1 ? 'Initial Assignment' : 'Salary Revision'),
      requestedBy: actorId,
      approvedBy: actorId,
      approvedAt: new Date()
    });

    await assignment.save();

    await AuditService.logEvent({
      action: 'SALARY_ASSIGNMENT_CREATED',
      module: 'PAYROLL',
      entityId: assignment._id.toString(),
      entityType: 'EmployeeSalaryAssignment',
      performedBy: actorId,
      details: {
        employeeIdCode: employee.employeeId,
        assignmentId,
        version,
        baseAmount,
        changeReason: assignment.changeReason
      }
    });

    return assignment;
  }

  /**
   * Get current effective salary assignment as of a given date
   */
  static async getEffectiveSalaryAssignment(employeeId, asOfDate = new Date()) {
    const targetDate = new Date(asOfDate);
    const assignment = await EmployeeSalaryAssignment.findOne({
      employeeId,
      effectiveFrom: { $lte: targetDate },
      $or: [{ effectiveTo: null }, { effectiveTo: { $gte: targetDate } }],
      status: { $in: ['ACTIVE', 'SUPERSEDED'] }
    })
      .sort({ effectiveFrom: -1, version: -1 })
      .populate('salaryStructureId');

    return assignment;
  }

  /**
   * Get employee salary history
   */
  static async getEmployeeSalaryHistory(employeeId) {
    return await EmployeeSalaryAssignment.find({ employeeId })
      .sort({ version: -1 })
      .populate('salaryStructureId')
      .lean();
  }
}

module.exports = SalaryConfigurationService;
