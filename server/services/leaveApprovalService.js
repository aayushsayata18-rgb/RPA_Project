const LeaveRequest = require('../models/LeaveRequest');
const LeaveCancellationRequest = require('../models/LeaveCancellationRequest');
const LeaveBalanceService = require('./leaveBalanceService');
const LeaveReconciliationService = require('./leaveReconciliationService');
const AuditService = require('./AuditService');
const NotificationService = require('./NotificationService');

class LeaveApprovalService {
  /**
   * Approve a pending leave request
   */
  static async approveLeaveRequest({ requestId, notes = '', actorUser }) {
    const request = await LeaveRequest.findById(requestId).populate('employeeId').populate('leaveTypeId');
    if (!request) {
      throw new Error(`Leave request not found: ${requestId}`);
    }

    // Double Approval Protection (Sec 76)
    if (request.status === 'APPROVED') {
      throw new Error('Request has already been processed and approved.');
    }
    if (request.status !== 'PENDING' && request.status !== 'UNDER_REVIEW') {
      throw new Error(`Cannot approve leave request in ${request.status} status.`);
    }

    // Requester Self-Approval Prevention Rule (Sec 35)
    const reviewerEmpId = actorUser?.employeeId || actorUser?.employeeRef || null;
    if (reviewerEmpId && request.employeeId && request.employeeId.employeeId === reviewerEmpId) {
      throw new Error('Self-approval violation: Requesters cannot approve their own leave.');
    }

    request.status = 'APPROVED';
    request.approvedBy = actorUser?.userId || actorUser?.name || 'SUPERVISOR';
    request.approvedAt = new Date();
    request.approvalNotes = notes;
    await request.save();

    // 1. Ledger Balance Deduction
    await LeaveBalanceService.applyLeaveUsed({
      employeeId: request.employeeId._id,
      leaveTypeId: request.leaveTypeId._id,
      amount: request.duration,
      year: request.startDate.getFullYear(),
      referenceId: request.requestNumber,
      actorUser
    });

    // 2. Reconcile with Shift Management
    try {
      await LeaveReconciliationService.reconcileLeaveWithShifts(request);
      request.shiftReconciled = true;
      await request.save();
    } catch (err) {
      console.warn('[LeaveApprovalService] Shift reconciliation warning:', err.message);
    }

    // 3. Reconcile with Attendance Management
    try {
      await LeaveReconciliationService.reconcileLeaveWithAttendance(request);
      request.attendanceReconciled = true;
      await request.save();
    } catch (err) {
      console.warn('[LeaveApprovalService] Attendance reconciliation warning:', err.message);
    }

    // 4. Send Notification
    await NotificationService.sendNotification({
      recipientId: request.employeeCode,
      recipientEmail: request.employeeId?.email,
      event: 'LEAVE_REQUEST_APPROVED',
      title: 'Leave Request Approved',
      message: `Your leave request ${request.requestNumber} for ${request.duration} day(s) (${request.startDate.toISOString().split('T')[0]} to ${request.endDate.toISOString().split('T')[0]}) has been approved.`,
      entityType: 'LeaveRequest',
      entityId: request.requestNumber,
      correlationId: request.correlationId
    });

    // 5. Audit Log
    await AuditService.logEvent({
      action: 'LEAVE_APPROVED',
      module: 'LEAVE',
      entityType: 'LeaveRequest',
      entityId: request.requestNumber,
      actorUserId: actorUser?.userId || actorUser?.id || 'SYSTEM',
      actorRole: actorUser?.role || 'SUPERVISOR',
      details: {
        requestNumber: request.requestNumber,
        employeeCode: request.employeeCode,
        duration: request.duration,
        notes
      },
      correlationId: request.correlationId
    });

    return request;
  }

  /**
   * Reject a pending leave request
   */
  static async rejectLeaveRequest({ requestId, reason, actorUser }) {
    if (!reason || reason.trim().length < 3) {
      throw new Error('Mandatory rejection reason must be provided.');
    }

    const request = await LeaveRequest.findById(requestId).populate('employeeId').populate('leaveTypeId');
    if (!request) {
      throw new Error(`Leave request not found: ${requestId}`);
    }

    if (request.status !== 'PENDING' && request.status !== 'UNDER_REVIEW') {
      throw new Error(`Cannot reject leave request in ${request.status} status.`);
    }

    // Self-Rejection prevention if applicable
    const reviewerEmpId = actorUser?.employeeId || null;
    if (reviewerEmpId && request.employeeId && request.employeeId.employeeId === reviewerEmpId) {
      throw new Error('Cannot review your own leave request.');
    }

    request.status = 'REJECTED';
    request.rejectedBy = actorUser?.userId || actorUser?.name || 'SUPERVISOR';
    request.rejectedAt = new Date();
    request.rejectionReason = reason;
    await request.save();

    // Release reserved pending balance
    await LeaveBalanceService.releasePending({
      employeeId: request.employeeId._id,
      leaveTypeId: request.leaveTypeId._id,
      amount: request.duration,
      year: request.startDate.getFullYear()
    });

    // Send Notification
    await NotificationService.sendNotification({
      recipientId: request.employeeCode,
      recipientEmail: request.employeeId?.email,
      event: 'LEAVE_REQUEST_REJECTED',
      title: 'Leave Request Rejected',
      message: `Your leave request ${request.requestNumber} has been rejected. Reason: ${reason}`,
      entityType: 'LeaveRequest',
      entityId: request.requestNumber,
      correlationId: request.correlationId
    });

    // Audit Log
    await AuditService.logEvent({
      action: 'LEAVE_REJECTED',
      module: 'LEAVE',
      entityType: 'LeaveRequest',
      entityId: request.requestNumber,
      actorUserId: actorUser?.userId || actorUser?.id || 'SYSTEM',
      actorRole: actorUser?.role || 'SUPERVISOR',
      details: {
        requestNumber: request.requestNumber,
        employeeCode: request.employeeCode,
        rejectionReason: reason
      },
      correlationId: request.correlationId
    });

    return request;
  }

  /**
   * Withdraw a pending leave request by employee
   */
  static async withdrawLeaveRequest({ requestId, actorUser }) {
    const request = await LeaveRequest.findById(requestId).populate('employeeId').populate('leaveTypeId');
    if (!request) {
      throw new Error(`Leave request not found: ${requestId}`);
    }

    if (request.status !== 'PENDING' && request.status !== 'UNDER_REVIEW') {
      throw new Error(`Only PENDING or UNDER_REVIEW requests can be withdrawn. Current status is ${request.status}.`);
    }

    request.status = 'WITHDRAWN';
    request.withdrawnAt = new Date();
    await request.save();

    // Release reserved balance
    await LeaveBalanceService.releasePending({
      employeeId: request.employeeId._id,
      leaveTypeId: request.leaveTypeId._id,
      amount: request.duration,
      year: request.startDate.getFullYear()
    });

    await AuditService.logEvent({
      action: 'LEAVE_WITHDRAWN',
      module: 'LEAVE',
      entityType: 'LeaveRequest',
      entityId: request.requestNumber,
      actorUserId: actorUser?.userId || actorUser?.id || 'EMPLOYEE',
      actorRole: actorUser?.role || 'EMPLOYEE',
      details: {
        requestNumber: request.requestNumber,
        employeeCode: request.employeeCode
      }
    });

    return request;
  }

  /**
   * Approve an approved-leave cancellation request
   */
  static async approveCancellation({ cancellationId, reviewerComments = '', actorUser }) {
    const cancelReq = await LeaveCancellationRequest.findOne({ cancellationId }).populate('employeeId');
    if (!cancelReq) {
      throw new Error(`Cancellation request not found: ${cancellationId}`);
    }

    if (cancelReq.status !== 'PENDING') {
      throw new Error(`Cancellation request already processed with status: ${cancelReq.status}`);
    }

    const leaveRequest = await LeaveRequest.findById(cancelReq.leaveRequestId).populate('leaveTypeId');
    if (!leaveRequest) {
      throw new Error(`Associated leave request not found.`);
    }

    cancelReq.status = 'APPROVED';
    cancelReq.reviewedBy = actorUser?.userId || actorUser?.name || 'HR_MANAGER';
    cancelReq.reviewedAt = new Date();
    cancelReq.reviewerComments = reviewerComments;
    await cancelReq.save();

    leaveRequest.status = 'CANCELLED';
    leaveRequest.cancelledAt = new Date();
    leaveRequest.cancellationReason = cancelReq.reason;
    await leaveRequest.save();

    // 1. Balance reversal ledger entry
    await LeaveBalanceService.reverseLeaveCancelled({
      employeeId: leaveRequest.employeeId,
      leaveTypeId: leaveRequest.leaveTypeId._id,
      amount: leaveRequest.duration,
      year: leaveRequest.startDate.getFullYear(),
      referenceId: cancelReq.cancellationId,
      actorUser
    });

    // 2. Reconcile Shift & Attendance Management
    try {
      await LeaveReconciliationService.reconcileCancellationWithShifts(leaveRequest);
      await LeaveReconciliationService.reconcileCancellationWithAttendance(leaveRequest);
    } catch (e) {
      console.warn('[LeaveApprovalService] Cancellation reconciliation warning:', e.message);
    }

    // 3. Notify employee
    await NotificationService.sendNotification({
      recipientId: leaveRequest.employeeCode,
      event: 'LEAVE_CANCELLATION_APPROVED',
      title: 'Leave Cancellation Approved',
      message: `Your cancellation request for leave ${leaveRequest.requestNumber} has been approved. Balance has been restored.`,
      entityType: 'LeaveCancellationRequest',
      entityId: cancelReq.cancellationId
    });

    // 4. Audit Log
    await AuditService.logEvent({
      action: 'LEAVE_CANCELLATION_APPROVED',
      module: 'LEAVE',
      entityType: 'LeaveCancellationRequest',
      entityId: cancelReq.cancellationId,
      actorUserId: actorUser?.userId || actorUser?.id || 'SYSTEM',
      actorRole: actorUser?.role || 'HR_MANAGER',
      details: {
        leaveRequestNumber: leaveRequest.requestNumber,
        cancellationId: cancelReq.cancellationId,
        reversedDays: leaveRequest.duration
      }
    });

    return { cancellationRequest: cancelReq, leaveRequest };
  }

  /**
   * Reject a leave cancellation request
   */
  static async rejectCancellation({ cancellationId, reason, actorUser }) {
    if (!reason || reason.trim().length < 3) {
      throw new Error('Mandatory rejection reason required.');
    }

    const cancelReq = await LeaveCancellationRequest.findOne({ cancellationId });
    if (!cancelReq) {
      throw new Error(`Cancellation request not found: ${cancellationId}`);
    }

    if (cancelReq.status !== 'PENDING') {
      throw new Error(`Cancellation request already processed.`);
    }

    cancelReq.status = 'REJECTED';
    cancelReq.reviewedBy = actorUser?.userId || actorUser?.name || 'HR_MANAGER';
    cancelReq.reviewedAt = new Date();
    cancelReq.reviewerComments = reason;
    await cancelReq.save();

    await AuditService.logEvent({
      action: 'LEAVE_CANCELLATION_REJECTED',
      module: 'LEAVE',
      entityType: 'LeaveCancellationRequest',
      entityId: cancelReq.cancellationId,
      actorUserId: actorUser?.userId || actorUser?.id || 'SYSTEM',
      actorRole: actorUser?.role || 'HR_MANAGER',
      details: {
        cancellationId: cancelReq.cancellationId,
        reason
      }
    });

    return cancelReq;
  }
}

module.exports = LeaveApprovalService;
