const Employee = require('../models/Employee');
const EmployeeHistory = require('../models/EmployeeHistory');
const AccessRequest = require('../models/AccessRequest');
const IdGeneratorService = require('./IdGeneratorService');
const AuditService = require('./AuditService');
const NotificationService = require('./NotificationService');

class EmployeeOnboardingService {
  /**
   * Submit employee for HR approval
   */
  static async submitForApproval(employeeId, actor = { userId: 'SYSTEM', role: 'HR_MANAGER' }) {
    const employee = await Employee.findOne({ employeeId });
    if (!employee) throw new Error(`Employee ${employeeId} not found.`);

    if (employee.status !== 'DRAFT') {
      throw new Error(`Employee ${employeeId} is in status ${employee.status}, cannot submit for approval.`);
    }

    employee.status = 'PENDING_APPROVAL';
    employee.approvalDetails = {
      submittedAt: new Date(),
      comments: 'Submitted for managerial onboarding approval.'
    };
    employee.updatedBy = actor.userId || 'SYSTEM';

    await employee.save();

    await EmployeeHistory.create({
      employeeId,
      eventType: 'APPROVAL_SUBMITTED',
      fromState: { status: 'DRAFT' },
      toState: { status: 'PENDING_APPROVAL' },
      actor: actor.userId || 'SYSTEM',
      reason: 'Onboarding submission'
    });

    await AuditService.logEvent({
      userId: actor.userId || 'SYSTEM',
      role: actor.role || 'HR_MANAGER',
      action: 'EMPLOYEE_APPROVAL_REQUESTED',
      module: 'STAFF_MANAGEMENT',
      entityType: 'EMPLOYEE',
      entityId: employeeId,
      details: `Employee ${employeeId} submitted for approval`
    });

    return employee;
  }

  /**
   * Approve employee onboarding
   */
  static async approveOnboarding(employeeId, actor = { userId: 'SYSTEM', role: 'ADMIN_MANAGER' }, comments = '') {
    const employee = await Employee.findOne({ employeeId });
    if (!employee) throw new Error(`Employee ${employeeId} not found.`);

    if (employee.status !== 'PENDING_APPROVAL') {
      throw new Error(`Employee ${employeeId} is not in PENDING_APPROVAL status (current: ${employee.status}).`);
    }

    employee.status = 'ACTIVE';
    employee.approvalDetails = {
      ...employee.approvalDetails,
      approvedAt: new Date(),
      approvedBy: actor.userId || 'SYSTEM',
      comments: comments || 'Onboarding approved by authorized administrator.'
    };
    employee.updatedBy = actor.userId || 'SYSTEM';

    // Automatically generate AccessRequest for assigned role if present
    const primaryRole = employee.roleAssignments?.find(r => r.status === 'ACTIVE');
    let accessRequest = null;
    if (primaryRole) {
      const requestId = await IdGeneratorService.generateAccessRequestId();
      accessRequest = new AccessRequest({
        requestId,
        employeeId: employee.employeeId,
        employeeObjectId: employee._id,
        requestedRoleId: primaryRole.roleId || null,
        requestedRoleCode: primaryRole.roleCode,
        requestedPermissions: [],
        source: 'ONBOARDING',
        status: 'PENDING_APPROVAL',
        requestedBy: actor.userId || 'SYSTEM',
        reason: `Initial application access for approved role ${primaryRole.roleCode}`
      });
      await accessRequest.save();

      employee.accessProvisioningStatus = 'REQUESTED';

      await EmployeeHistory.create({
        employeeId,
        eventType: 'ACCESS_REQUESTED',
        fromState: null,
        toState: { accessRequestId: requestId, role: primaryRole.roleCode },
        actor: actor.userId || 'SYSTEM',
        reason: 'Initial onboarding access request'
      });
    }

    await employee.save();

    await EmployeeHistory.create({
      employeeId,
      eventType: 'APPROVED',
      fromState: { status: 'PENDING_APPROVAL' },
      toState: { status: 'ACTIVE' },
      actor: actor.userId || 'SYSTEM',
      reason: comments || 'Onboarding approved'
    });

    await AuditService.logEvent({
      userId: actor.userId || 'SYSTEM',
      role: actor.role || 'ADMIN_MANAGER',
      action: 'EMPLOYEE_APPROVED',
      module: 'STAFF_MANAGEMENT',
      entityType: 'EMPLOYEE',
      entityId: employeeId,
      details: `Employee ${employeeId} (${employee.displayName}) approved and set to ACTIVE`
    });

    // Welcome Notification
    await NotificationService.sendNotification({
      event: 'EMPLOYEE_APPROVED',
      recipientPhone: employee.phone,
      recipientEmail: employee.email,
      title: 'Welcome to the Hospital Administrative Platform',
      message: `Welcome to the hospital, ${employee.displayName}. Your permanent Employee ID is ${employee.employeeId}. Application access request has been initiated.`,
      channel: 'IN_APP',
      entityType: 'EMPLOYEE',
      entityId: employeeId
    });

    return { employee, accessRequest };
  }

  /**
   * Reject employee onboarding (requires reason)
   */
  static async rejectOnboarding(employeeId, actor = { userId: 'SYSTEM', role: 'ADMIN_MANAGER' }, reason = '') {
    if (!reason || !reason.trim()) {
      throw new Error('Rejection reason is mandatory.');
    }

    const employee = await Employee.findOne({ employeeId });
    if (!employee) throw new Error(`Employee ${employeeId} not found.`);

    if (employee.status !== 'PENDING_APPROVAL') {
      throw new Error(`Employee ${employeeId} is not in PENDING_APPROVAL status.`);
    }

    employee.status = 'INACTIVE';
    employee.approvalDetails = {
      ...employee.approvalDetails,
      rejectedAt: new Date(),
      rejectedBy: actor.userId || 'SYSTEM',
      rejectionReason: reason.trim()
    };
    employee.updatedBy = actor.userId || 'SYSTEM';

    await employee.save();

    await EmployeeHistory.create({
      employeeId,
      eventType: 'REJECTED',
      fromState: { status: 'PENDING_APPROVAL' },
      toState: { status: 'INACTIVE', rejectionReason: reason.trim() },
      actor: actor.userId || 'SYSTEM',
      reason: reason.trim()
    });

    await AuditService.logEvent({
      userId: actor.userId || 'SYSTEM',
      role: actor.role || 'ADMIN_MANAGER',
      action: 'EMPLOYEE_REJECTED',
      module: 'STAFF_MANAGEMENT',
      entityType: 'EMPLOYEE',
      entityId: employeeId,
      details: `Onboarding rejected for ${employeeId}. Reason: ${reason}`
    });

    return employee;
  }

  /**
   * Return onboarding application for correction
   */
  static async returnForCorrection(employeeId, actor = { userId: 'SYSTEM', role: 'ADMIN_MANAGER' }, comments = '') {
    const employee = await Employee.findOne({ employeeId });
    if (!employee) throw new Error(`Employee ${employeeId} not found.`);

    employee.status = 'DRAFT';
    employee.approvalDetails = {
      ...employee.approvalDetails,
      comments: comments || 'Returned for correction by reviewer.'
    };
    employee.updatedBy = actor.userId || 'SYSTEM';

    await employee.save();

    await EmployeeHistory.create({
      employeeId,
      eventType: 'STATUS_CHANGE',
      fromState: { status: 'PENDING_APPROVAL' },
      toState: { status: 'DRAFT' },
      actor: actor.userId || 'SYSTEM',
      reason: comments || 'Returned for correction'
    });

    return employee;
  }
}

module.exports = EmployeeOnboardingService;
