const ShiftChangeRequest = require('../models/ShiftChangeRequest');
const ShiftSwapRequest = require('../models/ShiftSwapRequest');
const ShiftAssignment = require('../models/ShiftAssignment');
const Shift = require('../models/Shift');
const Employee = require('../models/Employee');
const IdGeneratorService = require('./IdGeneratorService');
const AuditService = require('./AuditService');
const NotificationService = require('./NotificationService');
const ShiftValidationService = require('./shiftValidationService');
const AssignmentService = require('./assignmentService');

class ShiftRequestService {
  /**
   * Submit Shift Change Request (Sec 28, 29, 79, 83)
   */
  static async createChangeRequest({
    employeeId,
    assignmentId,
    requestedShiftId,
    reason,
    user = null
  }) {
    if (!employeeId || !assignmentId || !requestedShiftId || !reason) {
      throw new Error('employeeId, assignmentId, requestedShiftId, and reason are required.');
    }

    const employee = await Employee.findOne({
      $or: [
        ...(employeeId.match(/^[0-9a-fA-F]{24}$/) ? [{ _id: employeeId }] : []),
        { employeeId: employeeId }
      ]
    });
    if (!employee) throw new Error(`Employee not found: ${employeeId}`);

    // Sec 79: Shift Request Security — Verify requester owns the assignment
    if (user && user.role === 'EMPLOYEE' && user.employeeId && user.employeeId !== employee.employeeId) {
      throw new Error('Unauthorized: Employees can only request shift changes for their own assignments.');
    }

    const assignment = await ShiftAssignment.findById(assignmentId).populate('shiftId');
    if (!assignment) throw new Error(`Shift assignment not found: ${assignmentId}`);

    if (assignment.employeeId.toString() !== employee._id.toString()) {
      throw new Error('Assignment does not belong to the specified employee.');
    }

    const requestedShift = await Shift.findOne({
      $or: [
        ...(requestedShiftId.match(/^[0-9a-fA-F]{24}$/) ? [{ _id: requestedShiftId }] : []),
        { shiftId: requestedShiftId },
        { shiftCode: requestedShiftId.toUpperCase() }
      ]
    });
    if (!requestedShift) throw new Error(`Requested shift not found: ${requestedShiftId}`);

    // Pre-validate conflicts
    const valResult = await ShiftValidationService.validateAssignment({
      employeeId: employee,
      shiftId: requestedShift,
      assignmentDate: assignment.assignmentDate,
      departmentId: assignment.departmentId,
      excludeAssignmentId: assignment._id
    });
    if (!valResult.isValid) {
      const msgs = valResult.conflicts.map(c => c.description).join('; ');
      throw new Error(`Cannot request shift change due to conflicts: ${msgs}`);
    }

    const requestId = await IdGeneratorService.generateShiftChangeRequestId();

    const changeRequest = new ShiftChangeRequest({
      requestId,
      employeeId: employee._id,
      employeeIdCode: employee.employeeId,
      assignmentId: assignment._id,
      currentShiftId: assignment.shiftId?._id || null,
      currentShiftCode: assignment.shiftCode,
      requestedShiftId: requestedShift._id,
      requestedShiftCode: requestedShift.shiftCode,
      effectiveDate: assignment.assignmentDate,
      reason: reason.trim(),
      status: 'PENDING_APPROVAL',
      requestedBy: user?._id || null
    });

    await changeRequest.save();

    await AuditService.logEvent({
      userId: user?.userId || 'SYSTEM',
      actorRole: user?.role || 'EMPLOYEE',
      action: 'SHIFT_CHANGE_REQUESTED',
      module: 'SHIFT_MANAGEMENT',
      entityType: 'ShiftChangeRequest',
      entityId: changeRequest.requestId,
      newValue: {
        employee: employee.employeeId,
        from: assignment.shiftCode,
        to: requestedShift.shiftCode,
        date: assignment.assignmentDate
      },
      details: `Shift change requested by ${employee.employeeId} for ${assignment.assignmentDate.toISOString().split('T')[0]}.`
    });

    return changeRequest;
  }

  /**
   * Manager Review Shift Change Request (Sec 28, 29, 68, 83)
   */
  static async reviewChangeRequest(requestId, { action, reviewerComments = '', user = null }) {
    const query = requestId.match(/^[0-9a-fA-F]{24}$/) ? { _id: requestId } : { requestId };
    const request = await ShiftChangeRequest.findOne(query)
      .populate('employeeId')
      .populate('assignmentId')
      .populate('requestedShiftId');

    if (!request) throw new Error(`Change request not found: ${requestId}`);
    if (request.status !== 'PENDING_APPROVAL') {
      throw new Error(`Request has already been processed (status: ${request.status}).`);
    }

    if (action === 'REJECT') {
      request.status = 'REJECTED';
      request.reviewedBy = user?._id || null;
      request.reviewedAt = new Date();
      request.reviewerComments = reviewerComments;
      await request.save();

      await NotificationService.sendNotification({
        recipientId: request.employeeId?._id?.toString(),
        recipientEmail: request.employeeId?.email,
        channel: 'IN_APP',
        event: 'SHIFT_CHANGE_REJECTED',
        title: 'Shift Change Request Rejected',
        message: `Your shift change request (${request.requestId}) was rejected. Reason: ${reviewerComments || 'Operational constraints'}.`
      }).catch(() => {});

      await AuditService.logEvent({
        userId: user?.userId || 'SYSTEM',
        actorRole: user?.role || 'SUPERVISOR',
        action: 'SHIFT_CHANGE_REJECTED',
        module: 'SHIFT_MANAGEMENT',
        entityType: 'ShiftChangeRequest',
        entityId: request.requestId,
        details: `Shift change request ${request.requestId} rejected.`
      });

      return request;
    }

    if (action === 'APPROVE') {
      // Re-validate conflict before approval
      const valResult = await ShiftValidationService.validateAssignment({
        employeeId: request.employeeId,
        shiftId: request.requestedShiftId,
        assignmentDate: request.effectiveDate,
        departmentId: request.assignmentId?.departmentId,
        excludeAssignmentId: request.assignmentId?._id
      });
      if (!valResult.isValid) {
        throw new Error(`Cannot approve shift change: conflicts exist (${valResult.conflicts.map(c => c.description).join('; ')})`);
      }

      // Update assignment via versioned update
      await AssignmentService.updateAssignment(
        request.assignmentId._id.toString(),
        {
          shiftId: request.requestedShiftId._id.toString(),
          notes: `Shift changed per approved request ${request.requestId}`
        },
        user
      );

      request.status = 'APPROVED';
      request.reviewedBy = user?._id || null;
      request.reviewedAt = new Date();
      request.reviewerComments = reviewerComments;
      await request.save();

      await NotificationService.sendNotification({
        recipientId: request.employeeId?._id?.toString(),
        recipientEmail: request.employeeId?.email,
        channel: 'IN_APP',
        event: 'SHIFT_CHANGE_APPROVED',
        title: 'Shift Change Request Approved',
        message: `Your shift change request (${request.requestId}) to '${request.requestedShiftCode}' has been approved.`
      }).catch(() => {});

      await AuditService.logEvent({
        userId: user?.userId || 'SYSTEM',
        actorRole: user?.role || 'SUPERVISOR',
        action: 'SHIFT_CHANGE_APPROVED',
        module: 'SHIFT_MANAGEMENT',
        entityType: 'ShiftChangeRequest',
        entityId: request.requestId,
        details: `Shift change request ${request.requestId} approved.`
      });

      return request;
    }

    throw new Error(`Invalid review action: ${action}. Must be APPROVE or REJECT.`);
  }

  /**
   * Submit Shift Swap Request (Sec 25, 26, 27, 84)
   */
  static async createSwapRequest({
    requesterEmployeeId,
    requesterAssignmentId,
    targetEmployeeId,
    targetAssignmentId,
    reason,
    user = null
  }) {
    if (!requesterEmployeeId || !requesterAssignmentId || !targetEmployeeId || !targetAssignmentId || !reason) {
      throw new Error('requesterEmployeeId, requesterAssignmentId, targetEmployeeId, targetAssignmentId, and reason are required.');
    }

    const [requester, target] = await Promise.all([
      Employee.findOne({
        $or: [
          ...(requesterEmployeeId.match(/^[0-9a-fA-F]{24}$/) ? [{ _id: requesterEmployeeId }] : []),
          { employeeId: requesterEmployeeId }
        ]
      }),
      Employee.findOne({
        $or: [
          ...(targetEmployeeId.match(/^[0-9a-fA-F]{24}$/) ? [{ _id: targetEmployeeId }] : []),
          { employeeId: targetEmployeeId }
        ]
      })
    ]);

    if (!requester) throw new Error(`Requester employee not found: ${requesterEmployeeId}`);
    if (!target) throw new Error(`Target employee not found: ${targetEmployeeId}`);

    if (requester._id.toString() === target._id.toString()) {
      throw new Error('Cannot swap shifts with yourself.');
    }

    const [reqAssign, targetAssign] = await Promise.all([
      ShiftAssignment.findById(requesterAssignmentId).populate('shiftId'),
      ShiftAssignment.findById(targetAssignmentId).populate('shiftId')
    ]);

    if (!reqAssign) throw new Error('Requester assignment not found.');
    if (!targetAssign) throw new Error('Target assignment not found.');

    if (reqAssign.employeeId.toString() !== requester._id.toString()) {
      throw new Error('Requester assignment does not belong to requester employee.');
    }
    if (targetAssign.employeeId.toString() !== target._id.toString()) {
      throw new Error('Target assignment does not belong to target employee.');
    }

    // Validate that swapping doesn't violate conflicts for either employee
    const [valRequester, valTarget] = await Promise.all([
      ShiftValidationService.validateAssignment({
        employeeId: requester,
        shiftId: targetAssign.shiftId,
        assignmentDate: targetAssign.assignmentDate,
        excludeAssignmentId: reqAssign._id
      }),
      ShiftValidationService.validateAssignment({
        employeeId: target,
        shiftId: reqAssign.shiftId,
        assignmentDate: reqAssign.assignmentDate,
        excludeAssignmentId: targetAssign._id
      })
    ]);

    if (!valRequester.isValid) {
      throw new Error(`Requester cannot take target shift: ${valRequester.conflicts.map(c => c.description).join('; ')}`);
    }
    if (!valTarget.isValid) {
      throw new Error(`Target cannot take requester shift: ${valTarget.conflicts.map(c => c.description).join('; ')}`);
    }

    const swapId = await IdGeneratorService.generateShiftSwapRequestId();

    const swapRequest = new ShiftSwapRequest({
      swapId,
      requesterEmployeeId: requester._id,
      requesterEmployeeCode: requester.employeeId,
      requesterAssignmentId: reqAssign._id,
      targetEmployeeId: target._id,
      targetEmployeeCode: target.employeeId,
      targetAssignmentId: targetAssign._id,
      reason: reason.trim(),
      status: 'PENDING_TARGET_ACCEPTANCE'
    });

    await swapRequest.save();

    // Notify Target Employee to accept/reject
    await NotificationService.sendNotification({
      recipientId: target._id?.toString(),
      recipientEmail: target.email,
      channel: 'IN_APP',
      event: 'SHIFT_SWAP_REQUESTED',
      title: 'Shift Swap Request Received',
      message: `${requester.firstName} ${requester.lastName} requested to swap shifts with you (${swapRequest.swapId}). Please review and accept or decline.`
    }).catch(() => {});

    await AuditService.logEvent({
      userId: user?.userId || 'SYSTEM',
      actorRole: user?.role || 'EMPLOYEE',
      action: 'SHIFT_SWAP_REQUESTED',
      module: 'SHIFT_MANAGEMENT',
      entityType: 'ShiftSwapRequest',
      entityId: swapRequest.swapId,
      details: `Shift swap requested between ${requester.employeeId} and ${target.employeeId}.`
    });

    return swapRequest;
  }

  /**
   * Target Employee Accepts or Rejects Swap (Sec 25, 27)
   */
  static async targetRespondSwap(swapId, { accept = true, comments = '', user = null }) {
    const query = swapId.match(/^[0-9a-fA-F]{24}$/) ? { _id: swapId } : { swapId };
    const swap = await ShiftSwapRequest.findOne(query)
      .populate('requesterEmployeeId')
      .populate('targetEmployeeId');

    if (!swap) throw new Error(`Swap request not found: ${swapId}`);
    if (swap.status !== 'PENDING_TARGET_ACCEPTANCE') {
      throw new Error(`Swap is not pending target acceptance (status: ${swap.status}).`);
    }

    swap.targetResponseAt = new Date();
    swap.targetResponseComments = comments;

    if (!accept) {
      swap.status = 'REJECTED';
      await swap.save();

      await NotificationService.sendNotification({
        recipientId: swap.requesterEmployeeId?._id?.toString(),
        recipientEmail: swap.requesterEmployeeId?.email,
        channel: 'IN_APP',
        event: 'SHIFT_SWAP_DECLINED_BY_PEER',
        title: 'Shift Swap Declined',
        message: `Your shift swap request ${swap.swapId} was declined by ${swap.targetEmployeeCode}.`
      }).catch(() => {});

      return swap;
    }

    // Target accepted -> now moves to PENDING_APPROVAL by manager
    swap.status = 'PENDING_APPROVAL';
    await swap.save();

    await NotificationService.sendNotification({
      recipientId: swap.requesterEmployeeId?._id?.toString(),
      recipientEmail: swap.requesterEmployeeId?.email,
      channel: 'IN_APP',
      event: 'SHIFT_SWAP_PEER_ACCEPTED',
      title: 'Shift Swap Peer-Accepted',
      message: `${swap.targetEmployeeCode} accepted your swap request. Awaiting supervisor approval.`
    }).catch(() => {});

    await AuditService.logEvent({
      userId: user?.userId || 'SYSTEM',
      actorRole: user?.role || 'EMPLOYEE',
      action: 'SHIFT_SWAP_TARGET_ACCEPTED',
      module: 'SHIFT_MANAGEMENT',
      entityType: 'ShiftSwapRequest',
      entityId: swap.swapId,
      details: `Peer ${swap.targetEmployeeCode} accepted shift swap ${swap.swapId}. Now pending supervisor approval.`
    });

    return swap;
  }

  /**
   * Manager Approves or Rejects Shift Swap (Sec 25, 27, 84)
   */
  static async reviewSwapRequest(swapId, { action, reviewerComments = '', user = null }) {
    const query = swapId.match(/^[0-9a-fA-F]{24}$/) ? { _id: swapId } : { swapId };
    const swap = await ShiftSwapRequest.findOne(query)
      .populate('requesterEmployeeId')
      .populate('targetEmployeeId')
      .populate({
        path: 'requesterAssignmentId',
        populate: { path: 'shiftId' }
      })
      .populate({
        path: 'targetAssignmentId',
        populate: { path: 'shiftId' }
      });

    if (!swap) throw new Error(`Swap request not found: ${swapId}`);
    if (swap.status !== 'PENDING_APPROVAL') {
      throw new Error(`Swap request is not pending supervisor approval (status: ${swap.status}).`);
    }

    if (action === 'REJECT') {
      swap.status = 'REJECTED';
      swap.reviewedBy = user?._id || null;
      swap.reviewedAt = new Date();
      swap.reviewerComments = reviewerComments;
      await swap.save();

      await NotificationService.sendNotification({
        recipientId: swap.requesterEmployeeId?._id?.toString(),
        recipientEmail: swap.requesterEmployeeId?.email,
        channel: 'IN_APP',
        event: 'SHIFT_SWAP_REJECTED',
        title: 'Shift Swap Rejected',
        message: `Shift swap ${swap.swapId} was rejected by supervisor.`
      }).catch(() => {});

      return swap;
    }

    if (action === 'APPROVE') {
      const reqAssign = swap.requesterAssignmentId;
      const targetAssign = swap.targetAssignmentId;

      // Swap the shifts between the two assignments:
      // Employee A gets targetAssign's shift on targetAssign's date
      // Employee B gets reqAssign's shift on reqAssign's date
      const shiftForA = targetAssign.shiftId._id.toString();
      const dateForA = targetAssign.assignmentDate;

      const shiftForB = reqAssign.shiftId._id.toString();
      const dateForB = reqAssign.assignmentDate;

      await AssignmentService.updateAssignment(
        reqAssign._id.toString(),
        {
          shiftId: shiftForA,
          assignmentDate: dateForA,
          notes: `Swapped with ${swap.targetEmployeeCode} (Swap ID: ${swap.swapId})`
        },
        user
      );

      await AssignmentService.updateAssignment(
        targetAssign._id.toString(),
        {
          shiftId: shiftForB,
          assignmentDate: dateForB,
          notes: `Swapped with ${swap.requesterEmployeeCode} (Swap ID: ${swap.swapId})`
        },
        user
      );

      swap.status = 'COMPLETED';
      swap.reviewedBy = user?._id || null;
      swap.reviewedAt = new Date();
      swap.reviewerComments = reviewerComments;
      await swap.save();

      // Notify both employees
      const notifyMsg = `Shift swap ${swap.swapId} has been approved by management. Your schedule has been updated.`;
      await Promise.all([
        NotificationService.sendNotification({
          recipientId: swap.requesterEmployeeId?._id?.toString(),
          recipientEmail: swap.requesterEmployeeId?.email,
          channel: 'IN_APP',
          event: 'SHIFT_SWAP_COMPLETED',
          title: 'Shift Swap Approved & Completed',
          message: notifyMsg
        }).catch(() => {}),
        NotificationService.sendNotification({
          recipientId: swap.targetEmployeeId?._id?.toString(),
          recipientEmail: swap.targetEmployeeId?.email,
          channel: 'IN_APP',
          event: 'SHIFT_SWAP_COMPLETED',
          title: 'Shift Swap Approved & Completed',
          message: notifyMsg
        }).catch(() => {})
      ]);

      await AuditService.logEvent({
        userId: user?.userId || 'SYSTEM',
        actorRole: user?.role || 'SUPERVISOR',
        action: 'SHIFT_SWAP_APPROVED',
        module: 'SHIFT_MANAGEMENT',
        entityType: 'ShiftSwapRequest',
        entityId: swap.swapId,
        details: `Shift swap ${swap.swapId} approved and completed.`
      });

      return swap;
    }

    throw new Error(`Invalid action: ${action}. Must be APPROVE or REJECT.`);
  }

  /**
   * Get Change Requests with filters
   */
  static async getChangeRequests({ employeeId = null, status = null, page = 1, limit = 20 } = {}) {
    const filter = {};
    if (employeeId) {
      filter.$or = [
        ...(employeeId.match(/^[0-9a-fA-F]{24}$/) ? [{ employeeId: employeeId }] : []),
        { employeeIdCode: employeeId }
      ];
    }
    if (status) filter.status = status;

    const skip = (Math.max(1, page) - 1) * Math.max(1, limit);
    const [requests, total] = await Promise.all([
      ShiftChangeRequest.find(filter)
        .populate('employeeId', 'employeeId firstName lastName email designation departmentName')
        .populate('currentShiftId')
        .populate('requestedShiftId')
        .populate('reviewedBy', 'name email role')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit))
        .lean(),
      ShiftChangeRequest.countDocuments(filter)
    ]);

    return { requests, total, page: Number(page), limit: Number(limit), pages: Math.ceil(total / limit) };
  }

  /**
   * Get Swap Requests with filters
   */
  static async getSwapRequests({ employeeId = null, status = null, page = 1, limit = 20 } = {}) {
    const filter = {};
    if (employeeId) {
      filter.$or = [
        { requesterEmployeeCode: employeeId },
        { targetEmployeeCode: employeeId }
      ];
    }
    if (status) filter.status = status;

    const skip = (Math.max(1, page) - 1) * Math.max(1, limit);
    const [swaps, total] = await Promise.all([
      ShiftSwapRequest.find(filter)
        .populate('requesterEmployeeId', 'employeeId firstName lastName email designation')
        .populate('targetEmployeeId', 'employeeId firstName lastName email designation')
        .populate({
          path: 'requesterAssignmentId',
          populate: { path: 'shiftId' }
        })
        .populate({
          path: 'targetAssignmentId',
          populate: { path: 'shiftId' }
        })
        .populate('reviewedBy', 'name email role')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit))
        .lean(),
      ShiftSwapRequest.countDocuments(filter)
    ]);

    return { swaps, total, page: Number(page), limit: Number(limit), pages: Math.ceil(total / limit) };
  }
}

module.exports = ShiftRequestService;
