const ShiftAssignment = require('../models/ShiftAssignment');
const Roster = require('../models/Roster');
const RosterVersion = require('../models/RosterVersion');
const Shift = require('../models/Shift');
const Employee = require('../models/Employee');
const Department = require('../models/Department');
const IdGeneratorService = require('./IdGeneratorService');
const AuditService = require('./AuditService');
const NotificationService = require('./NotificationService');
const ShiftValidationService = require('./shiftValidationService');

class AssignmentService {
  /**
   * Create a single Shift Assignment (Sec 10, 16, 30)
   */
  static async createAssignment({
    employeeId,
    shiftId,
    assignmentDate,
    departmentId = null,
    rosterId = null,
    notes = '',
    user = null
  }) {
    if (!employeeId || !shiftId || !assignmentDate) {
      throw new Error('employeeId, shiftId, and assignmentDate are required.');
    }

    // Run validation & conflict detection
    const validation = await ShiftValidationService.validateAssignment({
      employeeId,
      shiftId,
      assignmentDate,
      departmentId,
      rosterId
    });

    if (!validation.isValid) {
      const msgs = validation.conflicts.map(c => c.description).join('; ');
      throw new Error(`Assignment validation failed: ${msgs}`);
    }

    const { employee, shift } = validation;
    const normalizedDate = ShiftValidationService.normalizeDate(assignmentDate);

    // If attached to a roster, check roster status
    let roster = null;
    let assignmentStatus = 'DRAFT';
    if (rosterId) {
      roster = await Roster.findOne({
        $or: [
          ...(rosterId.match(/^[0-9a-fA-F]{24}$/) ? [{ _id: rosterId }] : []),
          { rosterId: rosterId }
        ]
      });
      if (roster) {
        if (roster.status === 'PUBLISHED') {
          assignmentStatus = 'PUBLISHED';
        } else if (roster.status === 'PENDING_APPROVAL') {
          assignmentStatus = 'PENDING_APPROVAL';
        } else if (roster.status === 'APPROVED') {
          assignmentStatus = 'APPROVED';
        }
      }
    }

    const assignmentId = await IdGeneratorService.generateShiftAssignmentId();

    const assignment = new ShiftAssignment({
      assignmentId,
      employeeId: employee._id,
      employeeIdCode: employee.employeeId,
      shiftId: shift._id,
      shiftCode: shift.shiftCode,
      departmentId: departmentId || roster?.departmentId || shift.departmentIds?.[0] || null,
      departmentCode: roster?.departmentCode || shift.departmentCodes?.[0] || '',
      assignmentDate: normalizedDate,
      assignmentType: roster ? 'ROSTER' : 'ADHOC',
      status: assignmentStatus,
      rosterId: roster?._id || null,
      publishedAt: assignmentStatus === 'PUBLISHED' ? new Date() : null,
      notes,
      createdBy: user?._id || null,
      updatedBy: user?._id || null
    });

    await assignment.save();

    // If added to a published roster, bump roster version and record snapshot (Sec 30, 31)
    if (roster && roster.status === 'PUBLISHED') {
      roster.currentVersion = (roster.currentVersion || 1) + 1;
      await roster.save();

      const versionId = await IdGeneratorService.generateRosterVersionId();
      await RosterVersion.create({
        versionId,
        rosterId: roster._id,
        versionNumber: roster.currentVersion,
        snapshot: [{
          action: 'ASSIGNMENT_ADDED',
          assignmentId: assignment.assignmentId,
          employeeIdCode: employee.employeeId,
          shiftCode: shift.shiftCode,
          assignmentDate: normalizedDate
        }],
        changeReason: `New assignment added to published roster`,
        changedBy: user?._id || null,
        changedAt: new Date()
      });
    }

    await AuditService.logEvent({
      userId: user?.userId || 'SYSTEM',
      actorRole: user?.role || 'SUPERVISOR',
      action: 'SHIFT_ASSIGNMENT_CREATED',
      module: 'SHIFT_MANAGEMENT',
      entityType: 'ShiftAssignment',
      entityId: assignment.assignmentId,
      newValue: {
        employee: employee.employeeId,
        shift: shift.shiftCode,
        date: normalizedDate,
        status: assignmentStatus
      },
      details: `Employee ${employee.employeeId} assigned to '${shift.shiftCode}' on ${normalizedDate.toISOString().split('T')[0]}.`
    });

    return assignment;
  }

  /**
   * Update an Assignment
   * Protects published assignments by preserving previous versions (Sec 30)
   */
  static async updateAssignment(id, updateData, user = null) {
    const query = id.match(/^[0-9a-fA-F]{24}$/) ? { _id: id } : { assignmentId: id };
    const assignment = await ShiftAssignment.findOne(query)
      .populate('employeeId')
      .populate('shiftId')
      .populate('rosterId');

    if (!assignment) throw new Error(`Shift assignment not found: ${id}`);

    // If changing shift, validate
    let targetShift = assignment.shiftId;
    if (updateData.shiftId) {
      targetShift = await Shift.findOne({
        $or: [
          ...(updateData.shiftId.match(/^[0-9a-fA-F]{24}$/) ? [{ _id: updateData.shiftId }] : []),
          { shiftId: updateData.shiftId },
          { shiftCode: updateData.shiftId.toUpperCase() }
        ]
      });
      if (!targetShift) throw new Error(`Shift not found: ${updateData.shiftId}`);
    }

    const targetDate = updateData.assignmentDate
      ? ShiftValidationService.normalizeDate(updateData.assignmentDate)
      : assignment.assignmentDate;

    const valResult = await ShiftValidationService.validateAssignment({
      employeeId: assignment.employeeId,
      shiftId: targetShift,
      assignmentDate: targetDate,
      departmentId: updateData.departmentId || assignment.departmentId,
      rosterId: assignment.rosterId?._id,
      excludeAssignmentId: assignment._id
    });

    if (!valResult.isValid) {
      const msgs = valResult.conflicts.map(c => c.description).join('; ');
      throw new Error(`Assignment update validation failed: ${msgs}`);
    }

    // Published assignment protection: do not silently overwrite historical records!
    if (assignment.status === 'PUBLISHED') {
      const oldAssignmentId = assignment._id;
      assignment.status = 'CANCELLED';
      assignment.notes = `${assignment.notes || ''} [Replaced by version update]`;
      await assignment.save();

      const newAssignmentId = await IdGeneratorService.generateShiftAssignmentId();
      const newAssignment = new ShiftAssignment({
        assignmentId: newAssignmentId,
        employeeId: assignment.employeeId._id,
        employeeIdCode: assignment.employeeIdCode,
        shiftId: targetShift._id,
        shiftCode: targetShift.shiftCode,
        departmentId: assignment.departmentId,
        departmentCode: assignment.departmentCode,
        assignmentDate: targetDate,
        assignmentType: assignment.assignmentType,
        status: 'PUBLISHED',
        rosterId: assignment.rosterId?._id || null,
        publishedAt: new Date(),
        version: (assignment.version || 1) + 1,
        previousAssignmentId: oldAssignmentId,
        notes: updateData.notes || 'Updated published assignment',
        createdBy: user?._id || null,
        updatedBy: user?._id || null
      });
      await newAssignment.save();

      // Update Roster version if exists
      if (assignment.rosterId) {
        const roster = await Roster.findById(assignment.rosterId._id);
        if (roster) {
          roster.currentVersion = (roster.currentVersion || 1) + 1;
          await roster.save();

          const versionId = await IdGeneratorService.generateRosterVersionId();
          await RosterVersion.create({
            versionId,
            rosterId: roster._id,
            versionNumber: roster.currentVersion,
            snapshot: [{
              action: 'ASSIGNMENT_MODIFIED',
              oldAssignmentId: assignment.assignmentId,
              newAssignmentId: newAssignment.assignmentId,
              employeeIdCode: assignment.employeeIdCode,
              newShiftCode: targetShift.shiftCode,
              assignmentDate: targetDate
            }],
            changeReason: `Published assignment updated for ${assignment.employeeIdCode}`,
            changedBy: user?._id || null,
            changedAt: new Date()
          });
        }
      }

      await AuditService.logEvent({
        userId: user?.userId || 'SYSTEM',
        actorRole: user?.role || 'HR_MANAGER',
        action: 'SHIFT_ASSIGNMENT_VERSIONED',
        module: 'SHIFT_MANAGEMENT',
        entityType: 'ShiftAssignment',
        entityId: newAssignment.assignmentId,
        oldValue: { shiftCode: assignment.shiftCode },
        newValue: { shiftCode: targetShift.shiftCode },
        details: `Published shift assignment versioned: ${assignment.assignmentId} -> ${newAssignment.assignmentId}.`
      });

      return newAssignment;
    }

    // Otherwise draft or pending: direct update
    assignment.shiftId = targetShift._id;
    assignment.shiftCode = targetShift.shiftCode;
    assignment.assignmentDate = targetDate;
    if (updateData.notes !== undefined) assignment.notes = updateData.notes;
    if (updateData.status) assignment.status = updateData.status;
    if (user?._id) assignment.updatedBy = user._id;

    await assignment.save();

    await AuditService.logEvent({
      userId: user?.userId || 'SYSTEM',
      actorRole: user?.role || 'SUPERVISOR',
      action: 'SHIFT_ASSIGNMENT_UPDATED',
      module: 'SHIFT_MANAGEMENT',
      entityType: 'ShiftAssignment',
      entityId: assignment.assignmentId,
      newValue: { shiftCode: assignment.shiftCode, date: assignment.assignmentDate },
      details: `Assignment ${assignment.assignmentId} updated.`
    });

    return assignment;
  }

  /**
   * Get Assignments with filtering & pagination
   */
  static async getAssignments({
    rosterId = null,
    employeeId = null,
    shiftId = null,
    departmentId = null,
    date = null,
    startDate = null,
    endDate = null,
    status = null,
    page = 1,
    limit = 50
  } = {}) {
    const filter = {};
    if (rosterId) {
      filter.$or = [
        ...(rosterId.match(/^[0-9a-fA-F]{24}$/) ? [{ rosterId: rosterId }] : []),
        { 'rosterId.rosterId': rosterId }
      ];
    }
    if (employeeId) {
      filter.$or = [
        ...(employeeId.match(/^[0-9a-fA-F]{24}$/) ? [{ employeeId: employeeId }] : []),
        { employeeIdCode: employeeId }
      ];
    }
    if (shiftId) {
      filter.$or = [
        ...(shiftId.match(/^[0-9a-fA-F]{24}$/) ? [{ shiftId: shiftId }] : []),
        { shiftCode: shiftId.toUpperCase() }
      ];
    }
    if (departmentId) {
      filter.$or = [
        ...(departmentId.match(/^[0-9a-fA-F]{24}$/) ? [{ departmentId: departmentId }] : []),
        { departmentCode: departmentId }
      ];
    }
    if (status) filter.status = status;

    if (date) {
      const d = ShiftValidationService.normalizeDate(date);
      filter.assignmentDate = d;
    } else if (startDate || endDate) {
      filter.assignmentDate = {};
      if (startDate) filter.assignmentDate.$gte = ShiftValidationService.normalizeDate(startDate);
      if (endDate) filter.assignmentDate.$lte = ShiftValidationService.normalizeDate(endDate);
    }

    const skip = (Math.max(1, page) - 1) * Math.max(1, limit);
    const [assignments, total] = await Promise.all([
      ShiftAssignment.find(filter)
        .populate('shiftId')
        .populate('employeeId', 'employeeId firstName lastName email designation departmentName')
        .populate('departmentId', 'departmentId name code')
        .sort({ assignmentDate: 1, shiftCode: 1 })
        .skip(skip)
        .limit(Number(limit))
        .lean(),
      ShiftAssignment.countDocuments(filter)
    ]);

    return {
      assignments,
      total,
      page: Number(page),
      limit: Number(limit),
      pages: Math.ceil(total / limit)
    };
  }

  /**
   * Get Employee Schedule for Self-Service (Sec 47, 78)
   */
  static async getMySchedule(employeeId, { startDate = null, endDate = null } = {}) {
    const employee = await Employee.findOne({
      $or: [
        ...(employeeId.match(/^[0-9a-fA-F]{24}$/) ? [{ _id: employeeId }] : []),
        { employeeId: employeeId }
      ]
    });
    if (!employee) throw new Error(`Employee not found: ${employeeId}`);

    const today = ShiftValidationService.normalizeDate(new Date());

    const start = startDate ? ShiftValidationService.normalizeDate(startDate) : today;
    const end = endDate ? ShiftValidationService.normalizeDate(endDate) : new Date(today.getTime() + 30 * 86400000);

    const filter = {
      employeeId: employee._id,
      assignmentDate: { $gte: start, $lte: end },
      status: { $in: ['APPROVED', 'PUBLISHED'] }
    };

    const assignments = await ShiftAssignment.find(filter)
      .populate('shiftId')
      .populate('departmentId', 'departmentId name code')
      .sort({ assignmentDate: 1 });

    const todayAssignment = assignments.find(
      a => ShiftValidationService.normalizeDate(a.assignmentDate).getTime() === today.getTime()
    );

    const upcoming = assignments.filter(
      a => ShiftValidationService.normalizeDate(a.assignmentDate).getTime() > today.getTime()
    );

    return {
      employee: {
        employeeId: employee.employeeId,
        name: `${employee.firstName} ${employee.lastName}`,
        designation: employee.designation,
        departmentName: employee.departmentName
      },
      today: todayAssignment || null,
      upcoming,
      allAssignments: assignments
    };
  }

  /**
   * Batch Create / Import Roster Assignments (Sec 75, 76, 77)
   */
  static async batchImportAssignments({
    rosterId,
    records = [],
    policy = 'ALL_OR_NOTHING', // 'ALL_OR_NOTHING' or 'ALLOW_VALID_ROWS_WITH_ERROR_REPORT'
    user = null
  }) {
    if (!Array.isArray(records) || records.length === 0) {
      throw new Error('Records array must contain at least 1 shift assignment row.');
    }

    const preview = {
      totalRows: records.length,
      validRows: 0,
      invalidRows: 0,
      conflictRows: 0,
      errors: [],
      processedAssignments: []
    };

    const validItems = [];

    for (let i = 0; i < records.length; i++) {
      const row = records[i];
      const rowNum = i + 1;

      try {
        const valResult = await ShiftValidationService.validateAssignment({
          employeeId: row.employeeId || row.employeeIdCode,
          shiftId: row.shiftId || row.shiftCode,
          assignmentDate: row.date || row.assignmentDate,
          departmentId: row.departmentId,
          rosterId
        });

        if (!valResult.isValid) {
          preview.invalidRows++;
          preview.conflictRows++;
          preview.errors.push({
            row: rowNum,
            employeeId: row.employeeId || row.employeeIdCode,
            error: valResult.conflicts.map(c => c.description).join('; ')
          });
        } else {
          preview.validRows++;
          validItems.push({
            rowNum,
            employee: valResult.employee,
            shift: valResult.shift,
            date: ShiftValidationService.normalizeDate(row.date || row.assignmentDate),
            departmentId: row.departmentId,
            notes: row.notes || ''
          });
        }
      } catch (err) {
        preview.invalidRows++;
        preview.errors.push({
          row: rowNum,
          error: err.message
        });
      }
    }

    if (policy === 'ALL_OR_NOTHING' && preview.invalidRows > 0) {
      throw new Error(`Batch import failed safety check. ${preview.invalidRows} errors detected under ALL_OR_NOTHING policy.`);
    }

    // Commit valid rows
    for (const item of validItems) {
      const assignmentId = await IdGeneratorService.generateShiftAssignmentId();
      const assignment = new ShiftAssignment({
        assignmentId,
        employeeId: item.employee._id,
        employeeIdCode: item.employee.employeeId,
        shiftId: item.shift._id,
        shiftCode: item.shift.shiftCode,
        assignmentDate: item.date,
        rosterId: rosterId || null,
        status: 'DRAFT',
        notes: item.notes,
        createdBy: user?._id || null
      });
      await assignment.save();
      preview.processedAssignments.push(assignment);
    }

    await AuditService.logEvent({
      userId: user?.userId || 'SYSTEM',
      actorRole: user?.role || 'SUPERVISOR',
      action: 'BATCH_ASSIGNMENTS_IMPORTED',
      module: 'SHIFT_MANAGEMENT',
      entityType: 'ShiftAssignment',
      entityId: rosterId || 'BATCH',
      newValue: { count: preview.processedAssignments.length, policy },
      details: `Batch imported ${preview.processedAssignments.length} assignments.`
    });

    return preview;
  }
}

module.exports = AssignmentService;
