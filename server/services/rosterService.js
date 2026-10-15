const Roster = require('../models/Roster');
const RosterVersion = require('../models/RosterVersion');
const ShiftAssignment = require('../models/ShiftAssignment');
const Department = require('../models/Department');
const Employee = require('../models/Employee');
const Shift = require('../models/Shift');
const IdGeneratorService = require('./IdGeneratorService');
const AuditService = require('./AuditService');
const NotificationService = require('./NotificationService');
const ShiftValidationService = require('./shiftValidationService');

class RosterService {
  /**
   * Create Roster (Sec 12, 14)
   */
  static async createRoster({
    rosterName,
    departmentId,
    periodStart,
    periodEnd,
    notes = '',
    user = null
  }) {
    if (!rosterName || !departmentId || !periodStart || !periodEnd) {
      throw new Error('rosterName, departmentId, periodStart, and periodEnd are required.');
    }

    const start = new Date(periodStart);
    start.setHours(0, 0, 0, 0);
    const end = new Date(periodEnd);
    end.setHours(23, 59, 59, 999);

    if (end < start) {
      throw new Error('periodEnd cannot be earlier than periodStart.');
    }

    // Resolve Department
    const department = await Department.findOne({
      $or: [
        ...(departmentId.match(/^[0-9a-fA-F]{24}$/) ? [{ _id: departmentId }] : []),
        { departmentId: departmentId },
        { code: departmentId.toUpperCase() }
      ]
    });
    if (!department) throw new Error(`Department not found: ${departmentId}`);

    const rosterId = await IdGeneratorService.generateRosterId();

    const roster = new Roster({
      rosterId,
      rosterName: rosterName.trim(),
      departmentId: department._id,
      departmentCode: department.code || department.departmentId,
      periodStart: start,
      periodEnd: end,
      status: 'DRAFT',
      currentVersion: 1,
      notes,
      createdBy: user?._id || null,
      updatedBy: user?._id || null
    });

    await roster.save();

    await AuditService.logEvent({
      userId: user?.userId || 'SYSTEM',
      actorRole: user?.role || 'HR_MANAGER',
      action: 'ROSTER_CREATED',
      module: 'SHIFT_MANAGEMENT',
      entityType: 'Roster',
      entityId: roster.rosterId,
      newValue: { rosterName: roster.rosterName, periodStart: start, periodEnd: end, status: 'DRAFT' },
      details: `Roster '${roster.rosterName}' created for department ${department.name}.`
    });

    return roster;
  }

  /**
   * Get Rosters with filters & pagination
   */
  static async getRosters({
    departmentId = null,
    status = null,
    periodStart = null,
    periodEnd = null,
    search = '',
    page = 1,
    limit = 20
  } = {}) {
    const filter = {};
    if (departmentId) {
      filter.$or = [
        ...(departmentId.match(/^[0-9a-fA-F]{24}$/) ? [{ departmentId: departmentId }] : []),
        { departmentCode: departmentId }
      ];
    }
    if (status) filter.status = status;
    if (periodStart) filter.periodStart = { $gte: new Date(periodStart) };
    if (periodEnd) filter.periodEnd = { $lte: new Date(periodEnd) };
    if (search) filter.rosterName = new RegExp(search, 'i');

    const skip = (Math.max(1, page) - 1) * Math.max(1, limit);
    const [rosters, total] = await Promise.all([
      Roster.find(filter)
        .populate('departmentId', 'departmentId name code')
        .populate('createdBy', 'name email role')
        .populate('approvedBy', 'name email role')
        .sort({ periodStart: -1, createdAt: -1 })
        .skip(skip)
        .limit(Number(limit))
        .lean(),
      Roster.countDocuments(filter)
    ]);

    // Attach real-time assignment count
    for (const r of rosters) {
      r.assignmentCount = await ShiftAssignment.countDocuments({
        rosterId: r._id,
        status: { $ne: 'CANCELLED' }
      });
    }

    return {
      rosters,
      total,
      page: Number(page),
      limit: Number(limit),
      pages: Math.ceil(total / limit)
    };
  }

  /**
   * Get Roster By ID
   */
  static async getRosterById(id) {
    const query = id.match(/^[0-9a-fA-F]{24}$/) ? { _id: id } : { rosterId: id };
    const roster = await Roster.findOne(query)
      .populate('departmentId', 'departmentId name code')
      .populate('createdBy', 'name email role')
      .populate('approvedBy', 'name email role');

    if (!roster) return null;

    const assignmentCount = await ShiftAssignment.countDocuments({
      rosterId: roster._id,
      status: { $ne: 'CANCELLED' }
    });

    const rosterObj = roster.toObject();
    rosterObj.assignmentCount = assignmentCount;
    return rosterObj;
  }

  /**
   * Submit Roster for Approval (Sec 13, 16)
   */
  static async submitRoster(id, user = null) {
    const query = id.match(/^[0-9a-fA-F]{24}$/) ? { _id: id } : { rosterId: id };
    const roster = await Roster.findOne(query);
    if (!roster) throw new Error(`Roster not found: ${id}`);

    if (roster.status !== 'DRAFT') {
      throw new Error(`Only DRAFT rosters can be submitted for approval (current status: ${roster.status}).`);
    }

    // Verify there are assignments
    const count = await ShiftAssignment.countDocuments({ rosterId: roster._id, status: { $ne: 'CANCELLED' } });
    if (count === 0) {
      throw new Error('Cannot submit an empty roster. Please add at least one shift assignment.');
    }

    roster.status = 'PENDING_APPROVAL';
    roster.submittedBy = user?._id || null;
    roster.submittedAt = new Date();
    if (user?._id) roster.updatedBy = user._id;

    await roster.save();

    // Mark assignments as PENDING_APPROVAL
    await ShiftAssignment.updateMany(
      { rosterId: roster._id, status: 'DRAFT' },
      { $set: { status: 'PENDING_APPROVAL' } }
    );

    await AuditService.logEvent({
      userId: user?.userId || 'SYSTEM',
      actorRole: user?.role || 'SUPERVISOR',
      action: 'ROSTER_SUBMITTED_FOR_APPROVAL',
      module: 'SHIFT_MANAGEMENT',
      entityType: 'Roster',
      entityId: roster.rosterId,
      details: `Roster '${roster.rosterName}' submitted for approval.`
    });

    return roster;
  }

  /**
   * Approve Roster (Sec 13, 4.3)
   */
  static async approveRoster(id, user = null) {
    const query = id.match(/^[0-9a-fA-F]{24}$/) ? { _id: id } : { rosterId: id };
    const roster = await Roster.findOne(query);
    if (!roster) throw new Error(`Roster not found: ${id}`);

    if (roster.status !== 'PENDING_APPROVAL') {
      throw new Error(`Roster must be PENDING_APPROVAL to approve (current status: ${roster.status}).`);
    }

    roster.status = 'APPROVED';
    roster.approvedBy = user?._id || null;
    roster.approvedAt = new Date();
    if (user?._id) roster.updatedBy = user._id;

    await roster.save();

    await ShiftAssignment.updateMany(
      { rosterId: roster._id, status: 'PENDING_APPROVAL' },
      { $set: { status: 'APPROVED', approvedBy: user?._id || null, approvedAt: new Date() } }
    );

    await AuditService.logEvent({
      userId: user?.userId || 'SYSTEM',
      actorRole: user?.role || 'HR_MANAGER',
      action: 'ROSTER_APPROVED',
      module: 'SHIFT_MANAGEMENT',
      entityType: 'Roster',
      entityId: roster.rosterId,
      details: `Roster '${roster.rosterName}' approved.`
    });

    return roster;
  }

  /**
   * Publish Roster (Sec 30, 31, 32, 33, 34)
   * Validates conflicts, generates version snapshot, updates assignments to PUBLISHED, and notifies staff.
   */
  static async publishRoster(id, user = null) {
    const query = id.match(/^[0-9a-fA-F]{24}$/) ? { _id: id } : { rosterId: id };
    const roster = await Roster.findOne(query);
    if (!roster) throw new Error(`Roster not found: ${id}`);

    if (roster.status !== 'APPROVED' && roster.status !== 'DRAFT') {
      throw new Error(`Cannot publish roster with status '${roster.status}'. Must be APPROVED or DRAFT.`);
    }

    // 1. Full Conflict Validation before Publish (Sec 32, 33)
    const conflictReport = await ShiftValidationService.detectRosterConflicts(roster._id);
    if (!conflictReport.canPublish) {
      throw new Error(`Cannot publish roster. ${conflictReport.criticalCount} critical conflicts require resolution.`);
    }

    // 2. Fetch all current assignments for version snapshot (Sec 31)
    const assignments = await ShiftAssignment.find({
      rosterId: roster._id,
      status: { $ne: 'CANCELLED' }
    }).populate('shiftId').populate('employeeId');

    const versionNumber = (roster.currentVersion || 1);
    const versionId = await IdGeneratorService.generateRosterVersionId();

    const snapshotData = assignments.map(a => ({
      assignmentId: a.assignmentId,
      employeeIdCode: a.employeeIdCode,
      employeeName: a.employeeId ? `${a.employeeId.firstName} ${a.employeeId.lastName}` : '',
      shiftCode: a.shiftCode,
      startTime: a.shiftId?.startTime,
      endTime: a.shiftId?.endTime,
      assignmentDate: a.assignmentDate,
      status: 'PUBLISHED'
    }));

    const rosterVersion = new RosterVersion({
      versionId,
      rosterId: roster._id,
      versionNumber,
      snapshot: snapshotData,
      changeReason: `Roster V${versionNumber} Published`,
      changedBy: user?._id || null,
      changedAt: new Date()
    });
    await rosterVersion.save();

    // 3. Mark Roster as PUBLISHED
    roster.status = 'PUBLISHED';
    roster.publishedAt = new Date();
    if (user?._id) roster.updatedBy = user._id;
    await roster.save();

    // 4. Update all assignments to PUBLISHED
    await ShiftAssignment.updateMany(
      { rosterId: roster._id, status: { $ne: 'CANCELLED' } },
      { $set: { status: 'PUBLISHED', publishedAt: new Date() } }
    );

    // 5. Notify Assigned Employees (Sec 34)
    const uniqueEmployees = [...new Set(assignments.map(a => a.employeeId).filter(Boolean))];
    for (const emp of uniqueEmployees) {
      await NotificationService.sendNotification({
        recipientId: emp._id?.toString(),
        recipientEmail: emp.email,
        channel: 'IN_APP',
        event: 'ROSTER_PUBLISHED',
        title: 'Work Schedule Published',
        message: `Your work schedule for roster '${roster.rosterName}' has been published. Check your schedule calendar.`,
        entityType: 'Roster',
        entityId: roster.rosterId
      }).catch(err => {
        console.warn(`[Notification] Failed to send publish notification: ${err.message}`);
      });
    }

    await AuditService.logEvent({
      userId: user?.userId || 'SYSTEM',
      actorRole: user?.role || 'HR_MANAGER',
      action: 'ROSTER_PUBLISHED',
      module: 'SHIFT_MANAGEMENT',
      entityType: 'Roster',
      entityId: roster.rosterId,
      newValue: { versionNumber, status: 'PUBLISHED', assignmentsCount: assignments.length },
      details: `Roster '${roster.rosterName}' published (Version ${versionNumber}) with ${assignments.length} assignments.`
    });

    return {
      roster,
      version: rosterVersion,
      assignmentsCount: assignments.length,
      conflictsResolved: conflictReport.conflicts.length
    };
  }

  /**
   * Lock Roster (Sec 13)
   */
  static async lockRoster(id, user = null) {
    const query = id.match(/^[0-9a-fA-F]{24}$/) ? { _id: id } : { rosterId: id };
    const roster = await Roster.findOne(query);
    if (!roster) throw new Error(`Roster not found: ${id}`);

    roster.status = 'LOCKED';
    roster.lockedAt = new Date();
    if (user?._id) roster.updatedBy = user._id;
    await roster.save();

    await AuditService.logEvent({
      userId: user?.userId || 'SYSTEM',
      actorRole: user?.role || 'HR_MANAGER',
      action: 'ROSTER_LOCKED',
      module: 'SHIFT_MANAGEMENT',
      entityType: 'Roster',
      entityId: roster.rosterId,
      details: `Roster '${roster.rosterName}' locked.`
    });

    return roster;
  }

  /**
   * Get Roster Calendar Grid (Sec 15, 46)
   * Builds an employee x days matrix with shift codes and details
   */
  static async getRosterCalendar(id) {
    const query = id.match(/^[0-9a-fA-F]{24}$/) ? { _id: id } : { rosterId: id };
    const roster = await Roster.findOne(query).populate('departmentId');
    if (!roster) throw new Error(`Roster not found: ${id}`);

    const assignments = await ShiftAssignment.find({
      rosterId: roster._id,
      status: { $ne: 'CANCELLED' }
    }).populate('shiftId').populate('employeeId').sort({ assignmentDate: 1 });

    // Generate date array from periodStart to periodEnd
    const dates = [];
    const curr = new Date(roster.periodStart);
    curr.setHours(0, 0, 0, 0);
    const end = new Date(roster.periodEnd);
    end.setHours(0, 0, 0, 0);

    while (curr <= end) {
      dates.push(new Date(curr));
      curr.setDate(curr.getDate() + 1);
    }

    // Group assignments by Employee
    const employeeMap = {};
    for (const a of assignments) {
      if (!a.employeeId) continue;
      const empId = a.employeeId._id.toString();
      if (!employeeMap[empId]) {
        employeeMap[empId] = {
          employeeId: a.employeeId.employeeId,
          name: `${a.employeeId.firstName} ${a.employeeId.lastName}`,
          designation: a.employeeId.designation || '',
          assignments: {}
        };
      }
      const dateKey = a.assignmentDate.toISOString().split('T')[0];
      employeeMap[empId].assignments[dateKey] = {
        assignmentId: a.assignmentId,
        id: a._id,
        shiftCode: a.shiftCode,
        shiftName: a.shiftId?.shiftName || a.shiftCode,
        startTime: a.shiftId?.startTime || '',
        endTime: a.shiftId?.endTime || '',
        status: a.status
      };
    }

    return {
      roster: {
        rosterId: roster.rosterId,
        rosterName: roster.rosterName,
        status: roster.status,
        departmentName: roster.departmentId?.name || '',
        periodStart: roster.periodStart,
        periodEnd: roster.periodEnd,
        currentVersion: roster.currentVersion
      },
      dates: dates.map(d => d.toISOString().split('T')[0]),
      grid: Object.values(employeeMap)
    };
  }
}

module.exports = RosterService;
