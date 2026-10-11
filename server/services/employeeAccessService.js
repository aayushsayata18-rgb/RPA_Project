const AccessRequest = require('../models/AccessRequest');
const Employee = require('../models/Employee');
const User = require('../models/User');
const Role = require('../models/Role');
const ExceptionCase = require('../models/ExceptionCase');
const IdGeneratorService = require('./IdGeneratorService');
const AuditService = require('./AuditService');
const NotificationService = require('./NotificationService');

class EmployeeAccessService {
  /**
   * Request system access for an employee
   */
  static async requestAccess(
    { employeeId, requestedRoleCode, requestedPermissions = [], source = 'MANUAL', reason = '' },
    actor = { userId: 'SYSTEM', role: 'ADMIN_MANAGER' }
  ) {
    const employee = await Employee.findOne({ employeeId });
    if (!employee) throw new Error(`Employee ${employeeId} not found.`);

    if (employee.status === 'TERMINATED') {
      throw new Error(`Cannot request access for terminated employee ${employeeId}.`);
    }

    const roleDoc = await Role.findOne({ roleCode: requestedRoleCode.toUpperCase() }).lean();
    const requestId = await IdGeneratorService.generateAccessRequestId();

    const accessRequest = new AccessRequest({
      requestId,
      employeeId: employee.employeeId,
      employeeObjectId: employee._id,
      requestedRoleId: roleDoc?._id || null,
      requestedRoleCode: requestedRoleCode.toUpperCase(),
      requestedPermissions,
      source,
      status: 'PENDING_APPROVAL',
      requestedBy: actor.userId || 'SYSTEM',
      reason: reason || `Application access requested for ${requestedRoleCode}`
    });

    await accessRequest.save();

    employee.accessProvisioningStatus = 'PENDING_APPROVAL';
    await employee.save();

    await AuditService.logEvent({
      userId: actor.userId || 'SYSTEM',
      role: actor.role || 'ADMIN_MANAGER',
      action: 'EMPLOYEE_ACCESS_REQUESTED',
      module: 'STAFF_MANAGEMENT',
      entityType: 'ACCESS_REQUEST',
      entityId: requestId,
      details: `Access request ${requestId} created for ${employeeId} (${requestedRoleCode})`
    });

    return accessRequest;
  }

  /**
   * Approve access request with strict Separation of Duties check
   */
  static async approveAccess(requestId, actor = { userId: 'SYSTEM', role: 'SYSTEM_ADMIN' }) {
    const accessRequest = await AccessRequest.findOne({ requestId });
    if (!accessRequest) throw new Error(`Access request ${requestId} not found.`);

    if (accessRequest.status !== 'PENDING_APPROVAL' && accessRequest.status !== 'REQUESTED') {
      throw new Error(`Access request is in status ${accessRequest.status}, cannot approve.`);
    }

    // SECURITY CHECK: Employee cannot approve own access
    if (
      accessRequest.employeeId === actor.userId ||
      accessRequest.employeeId === actor.linkedEntityId ||
      accessRequest.requestedBy === actor.userId
    ) {
      throw new Error('Separation of Duties violation: An employee or requester cannot approve their own privileged access.');
    }

    accessRequest.status = 'APPROVED';
    accessRequest.approvedBy = actor.userId || 'SYSTEM';
    accessRequest.approvedAt = new Date();
    await accessRequest.save();

    // Update Employee status
    await Employee.updateOne(
      { employeeId: accessRequest.employeeId },
      { $set: { accessProvisioningStatus: 'PENDING_APPROVAL' } }
    );

    await AuditService.logEvent({
      userId: actor.userId || 'SYSTEM',
      role: actor.role || 'SYSTEM_ADMIN',
      action: 'EMPLOYEE_ACCESS_APPROVED',
      module: 'STAFF_MANAGEMENT',
      entityType: 'ACCESS_REQUEST',
      entityId: requestId,
      details: `Access request ${requestId} approved by ${actor.userId}`
    });

    return accessRequest;
  }

  /**
   * Reject access request (requires reason)
   */
  static async rejectAccess(requestId, actor = { userId: 'SYSTEM', role: 'SYSTEM_ADMIN' }, reason = '') {
    if (!reason || !reason.trim()) {
      throw new Error('Rejection reason is required.');
    }

    const accessRequest = await AccessRequest.findOne({ requestId });
    if (!accessRequest) throw new Error(`Access request ${requestId} not found.`);

    accessRequest.status = 'REJECTED';
    accessRequest.rejectedBy = actor.userId || 'SYSTEM';
    accessRequest.rejectedAt = new Date();
    accessRequest.rejectionReason = reason.trim();
    await accessRequest.save();

    await Employee.updateOne(
      { employeeId: accessRequest.employeeId },
      { $set: { accessProvisioningStatus: 'NOT_REQUESTED' } }
    );

    await AuditService.logEvent({
      userId: actor.userId || 'SYSTEM',
      role: actor.role || 'SYSTEM_ADMIN',
      action: 'EMPLOYEE_ACCESS_REJECTED',
      module: 'STAFF_MANAGEMENT',
      entityType: 'ACCESS_REQUEST',
      entityId: requestId,
      details: `Access request ${requestId} rejected. Reason: ${reason}`
    });

    return accessRequest;
  }

  /**
   * Provision approved access into User master / accounts
   */
  static async provisionAccess(requestId, actor = { userId: 'SYSTEM', role: 'SYSTEM_ADMIN' }) {
    const accessRequest = await AccessRequest.findOne({ requestId });
    if (!accessRequest) throw new Error(`Access request ${requestId} not found.`);

    if (accessRequest.status !== 'APPROVED') {
      throw new Error(`Cannot provision access with status ${accessRequest.status}. Request must be APPROVED first.`);
    }

    const employee = await Employee.findOne({ employeeId: accessRequest.employeeId });
    if (!employee) throw new Error(`Employee ${accessRequest.employeeId} not found.`);

    try {
      accessRequest.status = 'PROVISIONING';
      await accessRequest.save();

      // Check if user exists by email or linkedEntityId
      let user = await User.findOne({
        $or: [{ email: employee.email.toLowerCase() }, { linkedEntityId: employee.employeeId }]
      });

      if (user) {
        user.role = accessRequest.requestedRoleCode;
        user.linkedEntityId = employee.employeeId;
        user.isActive = true;
        if (accessRequest.requestedPermissions && accessRequest.requestedPermissions.length > 0) {
          user.customPermissions = accessRequest.requestedPermissions;
        }
        await user.save();
      } else {
        // Create new user account for staff
        const userId = `USR-${employee.employeeId}`;
        user = new User({
          userId,
          email: employee.email.toLowerCase(),
          password: 'ChangeMe@123', // Initial temporary password
          firstName: employee.firstName,
          lastName: employee.lastName,
          phoneNumber: employee.phone,
          role: accessRequest.requestedRoleCode,
          linkedEntityId: employee.employeeId,
          isActive: true,
          isVerified: true
        });
        await user.save();
      }

      // Link User in Employee record
      employee.userId = user._id;
      employee.accessProvisioningStatus = 'PROVISIONED';
      await employee.save();

      accessRequest.status = 'PROVISIONED';
      accessRequest.provisionedAt = new Date();
      accessRequest.provisionedBy = actor.userId || 'SYSTEM';
      await accessRequest.save();

      await AuditService.logEvent({
        userId: actor.userId || 'SYSTEM',
        role: actor.role || 'SYSTEM_ADMIN',
        action: 'EMPLOYEE_ACCESS_PROVISIONED',
        module: 'STAFF_MANAGEMENT',
        entityType: 'ACCESS_REQUEST',
        entityId: requestId,
        details: `Access provisioned for ${employee.employeeId} with role ${accessRequest.requestedRoleCode}`
      });

      await NotificationService.sendNotification({
        event: 'EMPLOYEE_ACCESS_PROVISIONED',
        recipientPhone: employee.phone,
        recipientEmail: employee.email,
        title: 'System Access Provisioned',
        message: `Your hospital system account (${accessRequest.requestedRoleCode}) is active. Please log in using your registered credentials.`,
        channel: 'IN_APP',
        entityType: 'EMPLOYEE',
        entityId: employee.employeeId
      });

      return { accessRequest, user };
    } catch (err) {
      accessRequest.status = 'FAILED';
      accessRequest.notes = `Provisioning failure: ${err.message}`;
      await accessRequest.save();

      employee.accessProvisioningStatus = 'FAILED';
      await employee.save();

      // Log ExceptionCase
      await ExceptionCase.create({
        caseId: `EXC-ACC-${Date.now()}`,
        module: 'STAFF_MANAGEMENT',
        category: 'ACCESS_PROVISIONING_FAILED',
        severity: 'HIGH',
        status: 'OPEN',
        title: `Access Provisioning Failed for ${employee.employeeId}`,
        description: err.message,
        payload: { requestId, employeeId: employee.employeeId, role: accessRequest.requestedRoleCode }
      });

      throw err;
    }
  }

  /**
   * Revoke access for an employee
   */
  static async revokeAccess(requestId, actor = { userId: 'SYSTEM', role: 'SYSTEM_ADMIN' }, reason = 'Administrative Access Revocation') {
    const accessRequest = await AccessRequest.findOne({ requestId });
    if (!accessRequest) throw new Error(`Access request ${requestId} not found.`);

    accessRequest.status = 'REVOKED';
    accessRequest.revokedAt = new Date();
    accessRequest.revokedBy = actor.userId || 'SYSTEM';
    accessRequest.revokeReason = reason;
    await accessRequest.save();

    const employee = await Employee.findOne({ employeeId: accessRequest.employeeId });
    if (employee) {
      employee.accessProvisioningStatus = 'REVOKED';
      await employee.save();

      // Deactivate associated User
      if (employee.userId) {
        await User.findByIdAndUpdate(employee.userId, { $set: { isActive: false } });
      }
    }

    await AuditService.logEvent({
      userId: actor.userId || 'SYSTEM',
      role: actor.role || 'SYSTEM_ADMIN',
      action: 'EMPLOYEE_ACCESS_REVOKED',
      module: 'STAFF_MANAGEMENT',
      entityType: 'ACCESS_REQUEST',
      entityId: requestId,
      details: `Access revoked for ${accessRequest.employeeId}. Reason: ${reason}`
    });

    return accessRequest;
  }

  /**
   * Get all access requests
   */
  static async getAccessRequests(filter = {}) {
    const { status, employeeId, page = 1, limit = 50 } = filter;
    const query = {};
    if (status) query.status = status;
    if (employeeId) query.employeeId = employeeId;

    const skip = (Math.max(1, parseInt(page, 10)) - 1) * Math.max(1, parseInt(limit, 10));
    const [requests, total] = await Promise.all([
      AccessRequest.find(query).sort({ createdAt: -1 }).skip(skip).limit(parseInt(limit, 10)).lean(),
      AccessRequest.countDocuments(query)
    ]);

    return { requests, total };
  }
}

module.exports = EmployeeAccessService;
