const Employee = require('../models/Employee');
const EmployeeHistory = require('../models/EmployeeHistory');
const Department = require('../models/Department');
const Role = require('../models/Role');
const AccessRequest = require('../models/AccessRequest');
const IdGeneratorService = require('./IdGeneratorService');
const AuditService = require('./AuditService');
const NotificationService = require('./NotificationService');

class EmployeeTransferService {
  /**
   * Transfer employee to a new department
   */
  static async transferDepartment(
    employeeId,
    {
      newDepartmentId,
      newDepartmentName = '',
      effectiveDate = new Date(),
      newDesignation = '',
      newManagerId = null,
      newManagerName = '',
      newRoleCode = null,
      reason = 'Internal Department Transfer'
    },
    actor = { userId: 'SYSTEM', role: 'ADMIN_MANAGER' }
  ) {
    const employee = await Employee.findOne({ employeeId });
    if (!employee) throw new Error(`Employee ${employeeId} not found.`);

    if (employee.status !== 'ACTIVE') {
      throw new Error(`Cannot transfer employee ${employeeId} in status ${employee.status}. Employee must be ACTIVE.`);
    }

    // Resolve Department Name if missing
    let deptName = newDepartmentName;
    if (!deptName) {
      const deptDoc = await Department.findOne({
        $or: [{ departmentId: newDepartmentId }, { code: newDepartmentId }]
      }).lean();
      deptName = deptDoc?.name || newDepartmentId;
    }

    const previousAssignments = [...employee.departmentAssignments];
    const previousPrimary = employee.departmentAssignments.find(d => d.isPrimary && d.status === 'ACTIVE');
    const oldDeptName = previousPrimary?.departmentName || previousPrimary?.departmentId || 'None';

    // End previous active primary assignments (preserve history!)
    employee.departmentAssignments.forEach(d => {
      if (d.status === 'ACTIVE') {
        d.status = 'TRANSFERRED';
        d.endDate = new Date(effectiveDate);
      }
    });

    // Add new department assignment
    employee.departmentAssignments.push({
      departmentId: newDepartmentId,
      departmentName: deptName,
      isPrimary: true,
      startDate: new Date(effectiveDate),
      status: 'ACTIVE'
    });

    if (newDesignation) {
      employee.designation = newDesignation;
    }

    if (newManagerId !== undefined) {
      employee.managerId = newManagerId;
      employee.managerName = newManagerName || '';
    }

    // Role update if provided
    let newAccessRequest = null;
    if (newRoleCode) {
      const roleDoc = await Role.findOne({ roleCode: newRoleCode.toUpperCase() }).lean();

      // Mark old role assignments as SUPERSEDED
      employee.roleAssignments.forEach(r => {
        if (r.status === 'ACTIVE') {
          r.status = 'SUPERSEDED';
          r.endDate = new Date(effectiveDate);
        }
      });

      employee.roleAssignments.push({
        roleId: roleDoc?._id || null,
        roleCode: newRoleCode.toUpperCase(),
        roleName: roleDoc?.name || newRoleCode,
        startDate: new Date(effectiveDate),
        status: 'ACTIVE'
      });

      // Generate Access Review / Access Request
      const requestId = await IdGeneratorService.generateAccessRequestId();
      newAccessRequest = new AccessRequest({
        requestId,
        employeeId: employee.employeeId,
        employeeObjectId: employee._id,
        requestedRoleId: roleDoc?._id || null,
        requestedRoleCode: newRoleCode.toUpperCase(),
        requestedPermissions: [],
        source: 'TRANSFER',
        status: 'PENDING_APPROVAL',
        requestedBy: actor.userId || 'SYSTEM',
        reason: `Department transfer to ${deptName}: Access review required for role ${newRoleCode}`
      });
      await newAccessRequest.save();

      employee.accessProvisioningStatus = 'PENDING_APPROVAL';
    }

    employee.updatedBy = actor.userId || 'SYSTEM';
    await employee.save();

    // History record
    await EmployeeHistory.create({
      employeeId,
      eventType: 'DEPARTMENT_CHANGE',
      fromState: {
        department: oldDeptName,
        designation: previousPrimary?.designation
      },
      toState: {
        department: deptName,
        designation: employee.designation,
        effectiveDate
      },
      actor: actor.userId || 'SYSTEM',
      reason,
      notes: `Transferred from ${oldDeptName} to ${deptName}. Shift review and access review triggered.`
    });

    // Audit log
    await AuditService.logEvent({
      userId: actor.userId || 'SYSTEM',
      role: actor.role || 'ADMIN_MANAGER',
      action: 'EMPLOYEE_DEPARTMENT_CHANGED',
      module: 'STAFF_MANAGEMENT',
      entityType: 'EMPLOYEE',
      entityId: employeeId,
      oldValue: { department: oldDeptName },
      newValue: { department: deptName, effectiveDate, designation: employee.designation },
      details: `Department transfer executed for ${employeeId} from ${oldDeptName} to ${deptName}`
    });

    // Notification
    await NotificationService.sendNotification({
      event: 'EMPLOYEE_TRANSFERRED',
      recipientPhone: employee.phone,
      recipientEmail: employee.email,
      title: 'Department Assignment Updated',
      message: `Your department assignment has been updated to ${deptName} effective ${new Date(effectiveDate).toLocaleDateString()}. Access permissions review has been queued.`,
      channel: 'IN_APP',
      entityType: 'EMPLOYEE',
      entityId: employeeId
    });

    return { employee, accessRequest: newAccessRequest };
  }

  /**
   * Update or promote employee role
   */
  static async updateRole(
    employeeId,
    { newRoleCode, effectiveDate = new Date(), reason = 'Role Promotion / Change' },
    actor = { userId: 'SYSTEM', role: 'ADMIN_MANAGER' }
  ) {
    const employee = await Employee.findOne({ employeeId });
    if (!employee) throw new Error(`Employee ${employeeId} not found.`);

    const roleDoc = await Role.findOne({ roleCode: newRoleCode.toUpperCase() }).lean();
    const oldRole = employee.roleAssignments?.find(r => r.status === 'ACTIVE');

    employee.roleAssignments.forEach(r => {
      if (r.status === 'ACTIVE') {
        r.status = 'SUPERSEDED';
        r.endDate = new Date(effectiveDate);
      }
    });

    employee.roleAssignments.push({
      roleId: roleDoc?._id || null,
      roleCode: newRoleCode.toUpperCase(),
      roleName: roleDoc?.name || newRoleCode,
      startDate: new Date(effectiveDate),
      status: 'ACTIVE'
    });

    const requestId = await IdGeneratorService.generateAccessRequestId();
    const accessRequest = new AccessRequest({
      requestId,
      employeeId: employee.employeeId,
      employeeObjectId: employee._id,
      requestedRoleId: roleDoc?._id || null,
      requestedRoleCode: newRoleCode.toUpperCase(),
      source: 'PROMOTION',
      status: 'PENDING_APPROVAL',
      requestedBy: actor.userId || 'SYSTEM',
      reason
    });
    await accessRequest.save();

    employee.accessProvisioningStatus = 'PENDING_APPROVAL';
    employee.updatedBy = actor.userId || 'SYSTEM';
    await employee.save();

    await EmployeeHistory.create({
      employeeId,
      eventType: 'ROLE_CHANGE',
      fromState: { role: oldRole?.roleCode || 'None' },
      toState: { role: newRoleCode.toUpperCase(), effectiveDate },
      actor: actor.userId || 'SYSTEM',
      reason
    });

    await AuditService.logEvent({
      userId: actor.userId || 'SYSTEM',
      role: actor.role || 'ADMIN_MANAGER',
      action: 'EMPLOYEE_ROLE_CHANGED',
      module: 'STAFF_MANAGEMENT',
      entityType: 'EMPLOYEE',
      entityId: employeeId,
      oldValue: { role: oldRole?.roleCode },
      newValue: { role: newRoleCode.toUpperCase() },
      details: `Role updated for ${employeeId} to ${newRoleCode}`
    });

    return { employee, accessRequest };
  }
}

module.exports = EmployeeTransferService;
