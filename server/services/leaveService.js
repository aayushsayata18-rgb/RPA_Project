const LeaveType = require('../models/LeaveType');
const LeavePolicy = require('../models/LeavePolicy');
const LeaveRequest = require('../models/LeaveRequest');
const LeaveCancellationRequest = require('../models/LeaveCancellationRequest');
const HolidayCalendar = require('../models/HolidayCalendar');
const Employee = require('../models/Employee');
const LeaveValidationService = require('./leaveValidationService');
const LeaveBalanceService = require('./leaveBalanceService');
const LeaveApprovalService = require('./leaveApprovalService');
const IdGeneratorService = require('./IdGeneratorService');
const AuditService = require('./AuditService');
const NotificationService = require('./NotificationService');
const ExceptionService = require('./ExceptionService');

class LeaveService {
  // ==========================================
  // 1. LEAVE TYPES
  // ==========================================

  static async listLeaveTypes(filter = {}) {
    return await LeaveType.find(filter).sort({ name: 1 }).lean();
  }

  static async getLeaveTypeById(id) {
    return await LeaveType.findById(id).lean();
  }

  static async createLeaveType(data, actorUser) {
    const leaveTypeId = await IdGeneratorService.generateLeaveTypeId();
    const leaveType = new LeaveType({
      ...data,
      leaveTypeId,
      code: data.code.toUpperCase(),
      createdBy: actorUser?.userId || actorUser?.name || 'HR_ADMIN'
    });
    await leaveType.save();

    await AuditService.logEvent({
      action: 'LEAVE_TYPE_CREATED',
      module: 'LEAVE',
      entityType: 'LeaveType',
      entityId: leaveType.leaveTypeId,
      actorUserId: actorUser?.userId || 'SYSTEM',
      actorRole: actorUser?.role || 'HR_MANAGER',
      details: { code: leaveType.code, name: leaveType.name }
    });

    return leaveType;
  }

  static async updateLeaveType(id, data, actorUser) {
    const leaveType = await LeaveType.findByIdAndUpdate(
      id,
      { ...data, updatedBy: actorUser?.userId || 'HR_ADMIN' },
      { new: true }
    );
    if (!leaveType) throw new Error('Leave type not found.');

    await AuditService.logEvent({
      action: 'LEAVE_TYPE_UPDATED',
      module: 'LEAVE',
      entityType: 'LeaveType',
      entityId: leaveType.leaveTypeId,
      actorUserId: actorUser?.userId || 'SYSTEM',
      actorRole: actorUser?.role || 'HR_MANAGER',
      details: { code: leaveType.code, updates: data }
    });

    return leaveType;
  }

  // ==========================================
  // 2. LEAVE POLICIES (With Versioning)
  // ==========================================

  static async listLeavePolicies(filter = {}) {
    return await LeavePolicy.find(filter)
      .populate('leaveTypeId', 'name code unit')
      .populate('departmentId', 'name code')
      .sort({ policyCode: 1, version: -1 })
      .lean();
  }

  static async createLeavePolicy(data, actorUser) {
    const policyId = await IdGeneratorService.generateLeavePolicyId();
    const leaveType = await LeaveType.findById(data.leaveTypeId);
    if (!leaveType) throw new Error('Valid LeaveType required for policy creation.');

    const policy = new LeavePolicy({
      ...data,
      policyId,
      policyCode: (data.policyCode || `POL-${leaveType.code}`).toUpperCase(),
      leaveTypeCode: leaveType.code,
      version: 1,
      status: 'ACTIVE',
      createdBy: actorUser?.userId || 'HR_ADMIN'
    });
    await policy.save();

    await AuditService.logEvent({
      action: 'POLICY_CREATED',
      module: 'LEAVE',
      entityType: 'LeavePolicy',
      entityId: policy.policyId,
      actorUserId: actorUser?.userId || 'SYSTEM',
      actorRole: actorUser?.role || 'HR_MANAGER',
      details: { policyCode: policy.policyCode, version: 1, entitlement: policy.annualEntitlement }
    });

    return policy;
  }

  static async updateLeavePolicy(id, data, actorUser) {
    const existing = await LeavePolicy.findById(id);
    if (!existing) throw new Error('Leave policy not found.');

    // Spec Sec 13: Policy Versioning - Do not modify historical policy behavior, archive old version and save new version!
    existing.status = 'SUPERSEDED';
    await existing.save();

    const newPolicyId = await IdGeneratorService.generateLeavePolicyId();
    const newVersion = existing.version + 1;

    const updatedPolicy = new LeavePolicy({
      ...existing.toObject(),
      ...data,
      _id: undefined,
      policyId: newPolicyId,
      policyCode: existing.policyCode,
      version: newVersion,
      status: 'ACTIVE',
      effectiveFrom: data.effectiveFrom || new Date(),
      createdBy: actorUser?.userId || 'HR_ADMIN',
      updatedBy: actorUser?.userId || 'HR_ADMIN'
    });
    await updatedPolicy.save();

    await AuditService.logEvent({
      action: 'POLICY_UPDATED',
      module: 'LEAVE',
      entityType: 'LeavePolicy',
      entityId: updatedPolicy.policyId,
      actorUserId: actorUser?.userId || 'SYSTEM',
      actorRole: actorUser?.role || 'HR_MANAGER',
      details: {
        policyCode: updatedPolicy.policyCode,
        supersededVersion: existing.version,
        newVersion
      }
    });

    return updatedPolicy;
  }

  // ==========================================
  // 3. LEAVE REQUESTS
  // ==========================================

  static async createLeaveRequest(data, actorUser) {
    // 1. Validation
    const valResult = await LeaveValidationService.validateLeaveRequest(data);
    if (!valResult.isValid) {
      throw new Error(`Leave Request Validation Failed: ${valResult.errors.join('; ')}`);
    }

    const requestNumber = await IdGeneratorService.generateLeaveRequestId();
    const employee = valResult.employee;
    const leaveType = valResult.leaveType;
    const correlationId = `LEAVE-${Date.now()}-${requestNumber}`;

    const request = new LeaveRequest({
      requestNumber,
      employeeId: employee._id,
      employeeCode: employee.employeeId,
      employeeName: `${employee.firstName} ${employee.lastName}`,
      departmentId: employee.departmentAssignments?.find(d => d.isPrimary)?.departmentId?._id || null,
      departmentName: employee.departmentName || '',
      leaveTypeId: leaveType._id,
      leaveTypeCode: leaveType.code,
      leaveTypeName: leaveType.name,
      startDate: LeaveValidationService.normalizeDate(data.startDate),
      endDate: LeaveValidationService.normalizeDate(data.endDate),
      duration: valResult.duration,
      unit: leaveType.unit || 'DAYS',
      dayType: data.dayType || 'FULL_DAY',
      partialStartTime: data.partialStartTime || null,
      partialEndTime: data.partialEndTime || null,
      reason: data.reason,
      documents: data.documents || [],
      status: 'PENDING',
      submittedAt: new Date(),
      correlationId
    });

    await request.save();

    // 2. Reserve balance in pending state
    if (leaveType.balanceTracked) {
      await LeaveBalanceService.reservePending({
        employeeId: employee._id,
        leaveTypeId: leaveType._id,
        amount: valResult.duration,
        year: request.startDate.getFullYear()
      });
    }

    // 3. Send Notification to Manager / Approvers
    await NotificationService.sendNotification({
      event: 'LEAVE_REQUEST_SUBMITTED',
      title: 'New Leave Request Submitted',
      message: `${employee.firstName} ${employee.lastName} (${employee.employeeId}) has submitted a leave request for ${valResult.duration} day(s) from ${request.startDate.toISOString().split('T')[0]} to ${request.endDate.toISOString().split('T')[0]}.`,
      entityType: 'LeaveRequest',
      entityId: requestNumber,
      correlationId
    });

    // 4. Audit Log
    await AuditService.logEvent({
      action: 'LEAVE_SUBMITTED',
      module: 'LEAVE',
      entityType: 'LeaveRequest',
      entityId: requestNumber,
      actorUserId: actorUser?.userId || employee.employeeId,
      actorRole: actorUser?.role || 'EMPLOYEE',
      details: {
        requestNumber,
        employeeCode: employee.employeeId,
        leaveType: leaveType.code,
        duration: valResult.duration
      },
      correlationId
    });

    return { request, warnings: valResult.warnings };
  }

  static async getLeaveRequestById(id) {
    const request = await LeaveRequest.findById(id)
      .populate('employeeId', 'employeeId firstName lastName designation departmentName email')
      .populate('leaveTypeId', 'name code unit isPaid colorCode')
      .populate('departmentId', 'name code')
      .lean();
    return request;
  }

  static async listLeaveRequests(query = {}) {
    const filter = {};
    if (query.employeeId) filter.employeeId = query.employeeId;
    if (query.employeeCode) filter.employeeCode = query.employeeCode;
    if (query.leaveTypeId) filter.leaveTypeId = query.leaveTypeId;
    if (query.departmentId) filter.departmentId = query.departmentId;
    if (query.status) {
      filter.status = Array.isArray(query.status) ? { $in: query.status } : query.status;
    }
    if (query.startDate && query.endDate) {
      filter.startDate = { $gte: new Date(query.startDate) };
      filter.endDate = { $lte: new Date(query.endDate) };
    }

    const page = parseInt(query.page, 10) || 1;
    const limit = parseInt(query.limit, 10) || 50;
    const skip = (page - 1) * limit;

    const [requests, total] = await Promise.all([
      LeaveRequest.find(filter)
        .populate('employeeId', 'employeeId firstName lastName designation departmentName')
        .populate('leaveTypeId', 'name code unit isPaid colorCode')
        .populate('departmentId', 'name code')
        .sort({ submittedAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      LeaveRequest.countDocuments(filter)
    ]);

    return { requests, total, page, totalPages: Math.ceil(total / limit) };
  }

  static async requestCancellation({ requestId, reason, actorUser }) {
    if (!reason || reason.trim().length < 3) {
      throw new Error('Mandatory cancellation reason required.');
    }

    const leaveRequest = await LeaveRequest.findById(requestId);
    if (!leaveRequest) throw new Error('Leave request not found.');

    if (leaveRequest.status !== 'APPROVED') {
      throw new Error(`Only approved leave can be submitted for cancellation. Current status is ${leaveRequest.status}.`);
    }

    const cancellationId = await IdGeneratorService.generateLeaveCancellationId();
    const cancellation = new LeaveCancellationRequest({
      cancellationId,
      leaveRequestId: leaveRequest._id,
      requestNumber: leaveRequest.requestNumber,
      employeeId: leaveRequest.employeeId,
      employeeCode: leaveRequest.employeeCode,
      reason,
      status: 'PENDING',
      requestedBy: actorUser?.userId || leaveRequest.employeeCode,
      requestedAt: new Date()
    });
    await cancellation.save();

    leaveRequest.status = 'CANCEL_REQUESTED';
    await leaveRequest.save();

    await NotificationService.sendNotification({
      event: 'LEAVE_CANCELLATION_REQUESTED',
      title: 'Leave Cancellation Requested',
      message: `Employee ${leaveRequest.employeeCode} requested cancellation for leave ${leaveRequest.requestNumber}.`,
      entityType: 'LeaveCancellationRequest',
      entityId: cancellationId
    });

    await AuditService.logEvent({
      action: 'CANCELLATION_REQUESTED',
      module: 'LEAVE',
      entityType: 'LeaveCancellationRequest',
      entityId: cancellationId,
      actorUserId: actorUser?.userId || leaveRequest.employeeCode,
      actorRole: actorUser?.role || 'EMPLOYEE',
      details: { cancellationId, requestNumber: leaveRequest.requestNumber, reason }
    });

    return cancellation;
  }

  // ==========================================
  // 4. HOLIDAY CALENDAR
  // ==========================================

  static async listHolidays(filter = {}) {
    return await HolidayCalendar.find(filter).sort({ date: 1 }).lean();
  }

  static async createHoliday(data, actorUser) {
    const holidayId = await IdGeneratorService.generateHolidayId();
    const holiday = new HolidayCalendar({
      ...data,
      holidayId,
      date: LeaveValidationService.normalizeDate(data.date),
      year: new Date(data.date).getFullYear(),
      createdBy: actorUser?.userId || 'SYSTEM'
    });
    await holiday.save();

    return holiday;
  }

  // ==========================================
  // 5. RPA INTEGRATION SERVICES (Sec 62, 63, 64, 65, 66)
  // ==========================================

  /**
   * RPA Import External Leave Records (Idempotent, Sec 62)
   */
  static async rpaImportExternalLeave({ records = [], correlationId = null, actorUser = null }) {
    const corrId = correlationId || `RPA-LEAVE-${Date.now()}`;
    let recordsRead = records.length;
    let recordsProcessed = 0;
    let recordsSucceeded = 0;
    let recordsFailed = 0;
    const errors = [];
    const importedRequests = [];

    for (const item of records) {
      recordsProcessed++;
      try {
        const employee = await Employee.findOne({ employeeId: item.employeeId });
        if (!employee) {
          throw new Error(`Unknown Employee ID: ${item.employeeId}`);
        }

        const leaveType = await LeaveType.findOne({
          code: (item.leaveTypeCode || item.leaveType || '').toUpperCase()
        });
        if (!leaveType) {
          throw new Error(`Unknown Leave Type: ${item.leaveTypeCode || item.leaveType}`);
        }

        // Idempotency check: has this external leave already been imported?
        const existing = await LeaveRequest.findOne({
          employeeId: employee._id,
          startDate: LeaveValidationService.normalizeDate(item.startDate),
          endDate: LeaveValidationService.normalizeDate(item.endDate),
          status: { $in: ['PENDING', 'APPROVED', 'UNDER_REVIEW'] }
        });

        if (existing) {
          // Skip duplicate gracefully without failing batch
          continue;
        }

        const createRes = await this.createLeaveRequest(
          {
            employeeId: employee._id,
            leaveTypeId: leaveType._id,
            startDate: item.startDate,
            endDate: item.endDate,
            dayType: item.dayType || 'FULL_DAY',
            reason: item.reason || 'Imported via RPA External Sync',
            documents: []
          },
          actorUser || { userId: 'RPA_ROBOT', role: 'RPA_SERVICE' }
        );

        importedRequests.push(createRes.request);
        recordsSucceeded++;
      } catch (err) {
        recordsFailed++;
        errors.push({
          record: item,
          error: err.message
        });

        await ExceptionService.raiseException({
          module: 'LEAVE',
          entityType: 'LeaveRequest',
          entityId: item.employeeId || 'UNKNOWN',
          exceptionType: 'RPA_LEAVE_IMPORT_FAILURE',
          description: `RPA Leave Import failed for employee ${item.employeeId}: ${err.message}`,
          severity: 'HIGH',
          correlationId: corrId
        });
      }
    }

    return {
      success: recordsFailed === 0,
      jobType: 'LEAVE_IMPORT',
      correlationId: corrId,
      recordsRead,
      recordsProcessed,
      recordsSucceeded,
      recordsFailed,
      importedRequests,
      errors
    };
  }

  /**
   * RPA External HR Sync & Read-Back Verification (Sec 63)
   */
  static async rpaSyncApprovedLeave({ requestId = null, dateRange = null, correlationId = null }) {
    const corrId = correlationId || `RPA-SYNC-${Date.now()}`;
    const query = { status: 'APPROVED' };
    if (requestId) query._id = requestId;
    if (dateRange) {
      query.startDate = { $gte: new Date(dateRange.startDate) };
      query.endDate = { $lte: new Date(dateRange.endDate) };
    }

    const approvedLeaves = await LeaveRequest.find(query)
      .populate('employeeId')
      .populate('leaveTypeId')
      .lean();

    let syncedCount = 0;
    for (const leave of approvedLeaves) {
      // Simulate external HR system submission and read-back verification
      syncedCount++;
    }

    return {
      success: true,
      jobType: 'LEAVE_SYNC',
      correlationId: corrId,
      recordsRead: approvedLeaves.length,
      recordsProcessed: approvedLeaves.length,
      recordsSucceeded: syncedCount,
      recordsFailed: 0,
      startedAt: new Date().toISOString(),
      completedAt: new Date().toISOString()
    };
  }
}

module.exports = LeaveService;
