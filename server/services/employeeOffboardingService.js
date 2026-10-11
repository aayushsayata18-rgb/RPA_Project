const Employee = require('../models/Employee');
const EmployeeHistory = require('../models/EmployeeHistory');
const AccessRequest = require('../models/AccessRequest');
const AuditService = require('./AuditService');
const NotificationService = require('./NotificationService');

class EmployeeOffboardingService {
  /**
   * Initiate offboarding and termination workflow
   */
  static async initiateOffboarding(
    employeeId,
    {
      terminationDate = new Date(),
      reason = 'Resignation / Separation',
      noticePeriodServed = true,
      customChecklist = []
    },
    actor = { userId: 'SYSTEM', role: 'HR_MANAGER' }
  ) {
    const employee = await Employee.findOne({ employeeId });
    if (!employee) throw new Error(`Employee ${employeeId} not found.`);

    if (employee.status === 'TERMINATED') {
      throw new Error(`Employee ${employeeId} is already terminated.`);
    }

    const defaultChecklist = [
      { item: 'Termination Approval', status: 'COMPLETED', completedAt: new Date(), completedBy: actor.userId },
      { item: 'Access Revocation Request', status: 'PENDING' },
      { item: 'ID Card & Access Badges Return', status: 'PENDING' },
      { item: 'Hospital Asset / Equipment Handover', status: 'PENDING' },
      { item: 'Future Shift Roster Cancellation', status: 'PENDING' },
      { item: 'Pending Leave Balance Settlement', status: 'PENDING' },
      { item: 'Payroll Final Settlement Input', status: 'PENDING' },
      { item: 'External HIS / HR Systems Deactivation', status: 'PENDING' },
      { item: 'Final Clearance Certificate', status: 'PENDING' }
    ];

    const checklist = customChecklist.length > 0 ? customChecklist : defaultChecklist;

    employee.status = 'TERMINATED';
    employee.leavingDate = new Date(terminationDate);
    employee.terminationDetails = {
      terminatedAt: new Date(terminationDate),
      terminatedBy: actor.userId || 'SYSTEM',
      reason,
      noticePeriodServed,
      offboardingChecklist: checklist
    };

    // End active department assignments
    employee.departmentAssignments.forEach(d => {
      if (d.status === 'ACTIVE') {
        d.status = 'ENDED';
        d.endDate = new Date(terminationDate);
      }
    });

    // Revoke access status
    employee.accessProvisioningStatus = 'REVOKED';
    employee.updatedBy = actor.userId || 'SYSTEM';

    await employee.save();

    // Mark active access requests as REVOKED
    await AccessRequest.updateMany(
      { employeeId, status: { $in: ['APPROVED', 'PROVISIONED', 'REQUESTED', 'PENDING_APPROVAL'] } },
      {
        $set: {
          status: 'REVOKED',
          revokedAt: new Date(),
          revokedBy: actor.userId || 'SYSTEM',
          revokeReason: 'Employee Terminated / Offboarded'
        }
      }
    );

    // Create history entry
    await EmployeeHistory.create({
      employeeId,
      eventType: 'TERMINATION',
      fromState: { status: 'ACTIVE' },
      toState: { status: 'TERMINATED', leavingDate: employee.leavingDate },
      actor: actor.userId || 'SYSTEM',
      reason,
      notes: 'Offboarding workflow initiated. Access revoked and final tasks queued.'
    });

    // Audit log
    await AuditService.logEvent({
      userId: actor.userId || 'SYSTEM',
      role: actor.role || 'HR_MANAGER',
      action: 'EMPLOYEE_TERMINATED',
      module: 'STAFF_MANAGEMENT',
      entityType: 'EMPLOYEE',
      entityId: employeeId,
      details: `Employee ${employeeId} terminated. Reason: ${reason}`
    });

    // Notify Payroll and System Admins
    await NotificationService.sendNotification({
      event: 'EMPLOYEE_TERMINATED',
      title: 'Employee Offboarding Notice',
      message: `Employee ${employee.displayName} (${employeeId}) has been offboarded on ${new Date(terminationDate).toLocaleDateString()}. Final payroll review and asset return required.`,
      channel: 'IN_APP',
      entityType: 'EMPLOYEE',
      entityId: employeeId
    });

    return employee;
  }

  /**
   * Update checklist task item during offboarding
   */
  static async updateChecklistItem(employeeId, itemIndex, { status, notes = '' }, actor = { userId: 'SYSTEM', role: 'HR_MANAGER' }) {
    const employee = await Employee.findOne({ employeeId });
    if (!employee) throw new Error(`Employee ${employeeId} not found.`);

    if (!employee.terminationDetails || !employee.terminationDetails.offboardingChecklist) {
      throw new Error(`Employee ${employeeId} does not have an active offboarding checklist.`);
    }

    const item = employee.terminationDetails.offboardingChecklist[itemIndex];
    if (!item) throw new Error(`Checklist item index ${itemIndex} out of bounds.`);

    item.status = status;
    item.notes = notes || item.notes;
    if (status === 'COMPLETED') {
      item.completedAt = new Date();
      item.completedBy = actor.userId || 'SYSTEM';
    }

    employee.updatedBy = actor.userId || 'SYSTEM';
    await employee.save();

    await EmployeeHistory.create({
      employeeId,
      eventType: 'OFFBOARDING_UPDATE',
      fromState: null,
      toState: { item: item.item, status },
      actor: actor.userId || 'SYSTEM',
      reason: `Offboarding checklist item "${item.item}" marked as ${status}`
    });

    return employee;
  }
}

module.exports = EmployeeOffboardingService;
