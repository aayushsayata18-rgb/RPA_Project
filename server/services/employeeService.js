const Employee = require('../models/Employee');
const EmployeeHistory = require('../models/EmployeeHistory');
const Department = require('../models/Department');
const Role = require('../models/Role');
const User = require('../models/User');
const AccessRequest = require('../models/AccessRequest');
const EmployeeExternalSync = require('../models/EmployeeExternalSync');
const IdGeneratorService = require('./IdGeneratorService');
const AuditService = require('./AuditService');
const NotificationService = require('./NotificationService');

class EmployeeService {
  /**
   * Check for potential duplicate employees before creation
   */
  static async checkDuplicates({ email, phone, firstName, lastName, dateOfBirth, excludeEmployeeId = null }) {
    const query = { $or: [] };

    if (email) {
      query.$or.push({ email: email.toLowerCase().trim() });
    }
    if (phone) {
      query.$or.push({ phone: phone.trim() });
    }

    if (firstName && lastName) {
      const nameMatch = {
        firstName: new RegExp(`^${firstName.trim()}$`, 'i'),
        lastName: new RegExp(`^${lastName.trim()}$`, 'i')
      };
      if (dateOfBirth) {
        nameMatch.dateOfBirth = new Date(dateOfBirth);
      }
      query.$or.push(nameMatch);
    }

    if (query.$or.length === 0) {
      return { hasDuplicates: false, matches: [] };
    }

    if (excludeEmployeeId) {
      query.employeeId = { $ne: excludeEmployeeId };
    }

    const matches = await Employee.find(query).lean();
    return {
      hasDuplicates: matches.length > 0,
      matches: matches.map(m => ({
        employeeId: m.employeeId,
        displayName: m.displayName || `${m.firstName} ${m.lastName}`,
        email: m.email,
        phone: m.phone,
        department: m.departmentAssignments?.[0]?.departmentName || 'Not Assigned',
        designation: m.designation,
        status: m.status
      }))
    };
  }

  /**
   * Create new employee record with unique generated Employee ID
   */
  static async createEmployee(employeeData, actor = { userId: 'SYSTEM', role: 'ADMIN_MANAGER' }) {
    // 1. Generate concurrency-safe Employee ID
    const employeeId = await IdGeneratorService.generateEmployeeId();

    // 2. Resolve department if given
    let departmentAssignments = [];
    if (employeeData.departmentId) {
      let deptName = employeeData.departmentName || '';
      if (!deptName) {
        const dept = await Department.findOne({
          $or: [{ departmentId: employeeData.departmentId }, { code: employeeData.departmentId }]
        }).lean();
        if (dept) deptName = dept.name;
      }
      departmentAssignments.push({
        departmentId: employeeData.departmentId,
        departmentName: deptName || employeeData.departmentId,
        isPrimary: true,
        startDate: employeeData.joiningDate || new Date(),
        status: 'ACTIVE'
      });
    } else if (Array.isArray(employeeData.departmentAssignments) && employeeData.departmentAssignments.length > 0) {
      departmentAssignments = employeeData.departmentAssignments;
    }

    // 3. Resolve role if given
    let roleAssignments = [];
    if (employeeData.roleCode) {
      const roleDoc = await Role.findOne({ roleCode: employeeData.roleCode.toUpperCase() }).lean();
      roleAssignments.push({
        roleId: roleDoc?._id || null,
        roleCode: employeeData.roleCode.toUpperCase(),
        roleName: roleDoc?.name || employeeData.roleCode,
        startDate: employeeData.joiningDate || new Date(),
        status: 'ACTIVE'
      });
    } else if (Array.isArray(employeeData.roleAssignments) && employeeData.roleAssignments.length > 0) {
      roleAssignments = employeeData.roleAssignments;
    }

    // Default status: PENDING_APPROVAL unless explicitly requested as DRAFT
    const initialStatus = employeeData.status === 'DRAFT' ? 'DRAFT' : 'PENDING_APPROVAL';

    const newEmployee = new Employee({
      ...employeeData,
      employeeId,
      departmentAssignments,
      roleAssignments,
      status: initialStatus,
      accessProvisioningStatus: 'NOT_REQUESTED',
      approvalDetails: {
        submittedAt: new Date(),
        comments: employeeData.comments || ''
      },
      createdBy: actor.userId || 'SYSTEM',
      updatedBy: actor.userId || 'SYSTEM'
    });

    await newEmployee.save();

    // Create history event
    await EmployeeHistory.create({
      employeeId,
      eventType: 'CREATED',
      fromState: null,
      toState: {
        status: initialStatus,
        designation: newEmployee.designation,
        employeeType: newEmployee.employeeType,
        department: departmentAssignments[0]?.departmentName || 'None',
        role: roleAssignments[0]?.roleCode || 'None'
      },
      actor: actor.userId || 'SYSTEM',
      reason: 'New employee onboarded',
      notes: `Employee ${employeeId} (${newEmployee.displayName}) registered.`
    });

    // Audit log
    await AuditService.logEvent({
      userId: actor.userId || 'SYSTEM',
      role: actor.role || 'HR_MANAGER',
      action: 'EMPLOYEE_CREATED',
      module: 'STAFF_MANAGEMENT',
      entityType: 'EMPLOYEE',
      entityId: employeeId,
      newValue: { employeeId, displayName: newEmployee.displayName, status: initialStatus },
      details: `Created employee ${employeeId} (${newEmployee.displayName})`
    });

    // Notify HR / Admins
    await NotificationService.sendNotification({
      event: 'EMPLOYEE_CREATED',
      title: 'New Staff Registration Created',
      message: `Staff member ${newEmployee.displayName} (${employeeId}) has been registered and is pending approval.`,
      channel: 'IN_APP',
      entityType: 'EMPLOYEE',
      entityId: employeeId
    });

    return newEmployee;
  }

  /**
   * Get paginated and filtered list of employees
   */
  static async getEmployees(filter = {}) {
    const {
      page = 1,
      limit = 20,
      search = '',
      status = '',
      departmentId = '',
      employeeType = '',
      employmentType = '',
      roleCode = '',
      sortBy = 'createdAt',
      sortOrder = -1
    } = filter;

    const query = {};

    if (status) {
      query.status = status;
    }

    if (employeeType) {
      query.employeeType = employeeType;
    }

    if (employmentType) {
      query.employmentType = employmentType;
    }

    if (departmentId) {
      query['departmentAssignments.departmentId'] = departmentId;
    }

    if (roleCode) {
      query['roleAssignments.roleCode'] = roleCode.toUpperCase();
    }

    if (search) {
      const s = search.trim();
      query.$or = [
        { employeeId: new RegExp(s, 'i') },
        { firstName: new RegExp(s, 'i') },
        { lastName: new RegExp(s, 'i') },
        { displayName: new RegExp(s, 'i') },
        { email: new RegExp(s, 'i') },
        { phone: new RegExp(s, 'i') },
        { designation: new RegExp(s, 'i') }
      ];
    }

    const skip = (Math.max(1, parseInt(page, 10)) - 1) * Math.max(1, parseInt(limit, 10));
    const pageLimit = Math.max(1, parseInt(limit, 10));

    const [employees, total] = await Promise.all([
      Employee.find(query)
        .sort({ [sortBy]: parseInt(sortOrder, 10) })
        .skip(skip)
        .limit(pageLimit)
        .lean(),
      Employee.countDocuments(query)
    ]);

    return {
      employees,
      pagination: {
        page: parseInt(page, 10),
        limit: pageLimit,
        total,
        totalPages: Math.ceil(total / pageLimit)
      }
    };
  }

  /**
   * Get single employee by employeeId or ObjectId
   */
  static async getEmployeeById(id) {
    let employee = await Employee.findOne({ employeeId: id }).lean();
    if (!employee && id.match(/^[0-9a-fA-F]{24}$/)) {
      employee = await Employee.findById(id).lean();
    }
    return employee;
  }

  /**
   * Update employee details (prevent modifying permanent employeeId)
   */
  static async updateEmployee(id, updateData, actor = { userId: 'SYSTEM', role: 'ADMIN_MANAGER' }) {
    const employee = await Employee.findOne({
      $or: [{ employeeId: id }, ...(id.match(/^[0-9a-fA-F]{24}$/) ? [{ _id: id }] : [])]
    });

    if (!employee) {
      throw new Error(`Employee ${id} not found.`);
    }

    // Employee ID is permanent and cannot be modified
    delete updateData.employeeId;
    delete updateData._id;

    const fromState = {
      phone: employee.phone,
      email: employee.email,
      designation: employee.designation,
      employmentType: employee.employmentType,
      managerId: employee.managerId
    };

    Object.assign(employee, updateData);
    employee.updatedBy = actor.userId || 'SYSTEM';

    await employee.save();

    await EmployeeHistory.create({
      employeeId: employee.employeeId,
      eventType: 'DESIGNATION_CHANGE',
      fromState,
      toState: {
        phone: employee.phone,
        email: employee.email,
        designation: employee.designation,
        employmentType: employee.employmentType,
        managerId: employee.managerId
      },
      actor: actor.userId || 'SYSTEM',
      reason: updateData.reason || 'Employee profile updated',
      notes: 'Profile attributes updated by administrator'
    });

    await AuditService.logEvent({
      userId: actor.userId || 'SYSTEM',
      role: actor.role || 'HR_MANAGER',
      action: 'EMPLOYEE_UPDATED',
      module: 'STAFF_MANAGEMENT',
      entityType: 'EMPLOYEE',
      entityId: employee.employeeId,
      oldValue: fromState,
      newValue: updateData,
      details: `Updated details for ${employee.employeeId}`
    });

    return employee;
  }

  /**
   * Validate and update status according to allowed transitions
   */
  static async updateEmployeeStatus(id, newStatus, reason = '', actor = { userId: 'SYSTEM', role: 'ADMIN_MANAGER' }) {
    const employee = await Employee.findOne({
      $or: [{ employeeId: id }, ...(id.match(/^[0-9a-fA-F]{24}$/) ? [{ _id: id }] : [])]
    });

    if (!employee) {
      throw new Error(`Employee ${id} not found.`);
    }

    const currentStatus = employee.status;
    const allowedTransitions = {
      DRAFT: ['PENDING_APPROVAL'],
      PENDING_APPROVAL: ['ACTIVE', 'REJECTED', 'DRAFT'],
      ACTIVE: ['ON_LEAVE', 'SUSPENDED', 'INACTIVE', 'TERMINATED'],
      ON_LEAVE: ['ACTIVE'],
      SUSPENDED: ['ACTIVE', 'TERMINATED'],
      INACTIVE: ['ACTIVE'],
      TERMINATED: [] // Final state
    };

    const validNext = allowedTransitions[currentStatus] || [];
    if (!validNext.includes(newStatus)) {
      throw new Error(`Invalid status transition from ${currentStatus} to ${newStatus}. Allowed: ${validNext.join(', ')}`);
    }

    employee.status = newStatus;
    employee.updatedBy = actor.userId || 'SYSTEM';

    if (newStatus === 'SUSPENDED') {
      employee.suspensionDetails = {
        suspendedAt: new Date(),
        suspendedBy: actor.userId || 'SYSTEM',
        reason: reason || 'Administrative suspension',
        notes: reason
      };
    }

    await employee.save();

    await EmployeeHistory.create({
      employeeId: employee.employeeId,
      eventType: 'STATUS_CHANGE',
      fromState: { status: currentStatus },
      toState: { status: newStatus },
      actor: actor.userId || 'SYSTEM',
      reason: reason || `Status changed from ${currentStatus} to ${newStatus}`
    });

    await AuditService.logEvent({
      userId: actor.userId || 'SYSTEM',
      role: actor.role || 'HR_MANAGER',
      action: 'EMPLOYEE_STATUS_CHANGED',
      module: 'STAFF_MANAGEMENT',
      entityType: 'EMPLOYEE',
      entityId: employee.employeeId,
      oldValue: { status: currentStatus },
      newValue: { status: newStatus, reason },
      details: `Changed status to ${newStatus} for ${employee.employeeId}`
    });

    return employee;
  }

  /**
   * Get aggregate metrics for Staff Management dashboard
   */
  static async getDashboardMetrics() {
    const [
      totalEmployees,
      active,
      onLeave,
      pendingApproval,
      suspended,
      terminated,
      accessPending,
      syncFailures,
      byDepartment,
      byEmployeeType
    ] = await Promise.all([
      Employee.countDocuments(),
      Employee.countDocuments({ status: 'ACTIVE' }),
      Employee.countDocuments({ status: 'ON_LEAVE' }),
      Employee.countDocuments({ status: 'PENDING_APPROVAL' }),
      Employee.countDocuments({ status: 'SUSPENDED' }),
      Employee.countDocuments({ status: 'TERMINATED' }),
      AccessRequest.countDocuments({ status: { $in: ['REQUESTED', 'PENDING_APPROVAL', 'PROVISIONING'] } }),
      EmployeeExternalSync.countDocuments({ status: 'FAILED' }),
      Employee.aggregate([
        { $unwind: '$departmentAssignments' },
        { $match: { 'departmentAssignments.status': 'ACTIVE' } },
        { $group: { _id: '$departmentAssignments.departmentName', count: { $sum: 1 } } },
        { $sort: { count: -1 } }
      ]),
      Employee.aggregate([
        { $group: { _id: '$employeeType', count: { $sum: 1 } } },
        { $sort: { count: -1 } }
      ])
    ]);

    return {
      summary: {
        totalEmployees,
        active,
        onLeave,
        pendingApproval,
        suspended,
        terminated,
        accessPending,
        syncFailures
      },
      byDepartment: byDepartment.map(d => ({ department: d._id || 'Unassigned', count: d.count })),
      byEmployeeType: byEmployeeType.map(t => ({ employeeType: t._id || 'OTHER', count: t.count }))
    };
  }

  /**
   * Get employee event timeline/history
   */
  static async getEmployeeHistory(employeeId) {
    return await EmployeeHistory.find({ employeeId }).sort({ createdAt: -1 }).lean();
  }
}

module.exports = EmployeeService;
