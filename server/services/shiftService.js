const Shift = require('../models/Shift');
const ShiftAssignment = require('../models/ShiftAssignment');
const Department = require('../models/Department');
const IdGeneratorService = require('./IdGeneratorService');
const AuditService = require('./AuditService');

class ShiftService {
  /**
   * Helper to parse "HH:mm" into minutes since midnight
   */
  static timeToMinutes(timeStr) {
    if (!timeStr || typeof timeStr !== 'string') return 0;
    const [h, m] = timeStr.split(':').map(Number);
    return (h || 0) * 60 + (m || 0);
  }

  /**
   * Calculate absolute Start and End DateTimes for a shift on a specific calendar date
   * Handles crossMidnight by setting end date to next calendar day
   */
  static calculateShiftWindow(shift, dateInput) {
    const baseDate = new Date(dateInput);
    baseDate.setHours(0, 0, 0, 0);

    const [startH, startM] = (shift.startTime || '09:00').split(':').map(Number);
    const [endH, endM] = (shift.endTime || '18:00').split(':').map(Number);

    const startDateTime = new Date(baseDate);
    startDateTime.setHours(startH, startM, 0, 0);

    const endDateTime = new Date(baseDate);
    if (shift.crossesMidnight || (endH < startH) || (endH === startH && endM <= startM)) {
      endDateTime.setDate(endDateTime.getDate() + 1);
    }
    endDateTime.setHours(endH, endM, 0, 0);

    const durationMinutes = Math.round((endDateTime.getTime() - startDateTime.getTime()) / 60000);

    return {
      startDateTime,
      endDateTime,
      durationMinutes,
      breakMinutes: shift.breakMinutes || 0,
      netWorkingMinutes: Math.max(0, durationMinutes - (shift.breakMinutes || 0))
    };
  }

  /**
   * Create a new Shift Definition (01_SHIFT_MANAGEMENT.md Sec 5, 6, 8, 45)
   */
  static async createShift(shiftData, user = null) {
    const {
      shiftCode,
      shiftName,
      shiftType = 'GENERAL',
      startTime,
      endTime,
      crossesMidnight = false,
      breakMinutes = 60,
      graceBeforeMinutes = 30,
      graceAfterMinutes = 30,
      departmentIds = [],
      shiftCategory = 'STANDARD',
      compensationCategory = 'STANDARD',
      description = ''
    } = shiftData;

    const codeUpper = (shiftCode || '').trim().toUpperCase();
    if (!codeUpper) {
      throw new Error('Shift code is required.');
    }
    if (!shiftName || !startTime || !endTime) {
      throw new Error('Shift name, startTime, and endTime are required.');
    }

    // Check duplicate code
    const existing = await Shift.findOne({ shiftCode: codeUpper });
    if (existing) {
      throw new Error(`Shift code '${codeUpper}' is already in use.`);
    }

    // Automatically check crossesMidnight if end time is before start time
    const startM = this.timeToMinutes(startTime);
    const endM = this.timeToMinutes(endTime);
    const computedCrossesMidnight = crossesMidnight || (endM < startM);

    // Resolve departments
    let resolvedDepIds = [];
    let resolvedDepCodes = [];
    if (Array.isArray(departmentIds) && departmentIds.length > 0) {
      const deps = await Department.find({
        $or: [{ _id: { $in: departmentIds } }, { departmentId: { $in: departmentIds } }]
      });
      resolvedDepIds = deps.map(d => d._id);
      resolvedDepCodes = deps.map(d => d.code || d.departmentId);
    }

    const shiftId = await IdGeneratorService.generateShiftId();

    const shift = new Shift({
      shiftId,
      shiftCode: codeUpper,
      shiftName: shiftName.trim(),
      shiftType,
      startTime,
      endTime,
      crossesMidnight: computedCrossesMidnight,
      breakMinutes: Number(breakMinutes) || 0,
      graceBeforeMinutes: Number(graceBeforeMinutes) || 0,
      graceAfterMinutes: Number(graceAfterMinutes) || 0,
      departmentIds: resolvedDepIds,
      departmentCodes: resolvedDepCodes,
      status: 'ACTIVE',
      shiftCategory,
      compensationCategory,
      description,
      createdBy: user?._id || null,
      updatedBy: user?._id || null
    });

    await shift.save();

    await AuditService.logEvent({
      userId: user?.userId || 'SYSTEM',
      actorRole: user?.role || 'HR_MANAGER',
      action: 'SHIFT_DEFINITION_CREATED',
      module: 'SHIFT_MANAGEMENT',
      entityType: 'Shift',
      entityId: shift.shiftId,
      newValue: { shiftCode: shift.shiftCode, startTime, endTime, crossesMidnight: computedCrossesMidnight },
      details: `Shift definition '${shift.shiftName}' (${shift.shiftCode}) created.`
    });

    return shift;
  }

  /**
   * Get paginated shift definitions
   */
  static async getShifts({
    status = null,
    shiftType = null,
    departmentId = null,
    search = '',
    page = 1,
    limit = 50
  } = {}) {
    const filter = {};
    if (status) filter.status = status;
    if (shiftType) filter.shiftType = shiftType;
    if (departmentId) {
      filter.$or = [
        { departmentIds: departmentId },
        { departmentCodes: departmentId }
      ];
    }
    if (search) {
      filter.$or = [
        { shiftCode: new RegExp(search, 'i') },
        { shiftName: new RegExp(search, 'i') }
      ];
    }

    const skip = (Math.max(1, page) - 1) * Math.max(1, limit);
    const [shifts, total] = await Promise.all([
      Shift.find(filter)
        .populate('departmentIds', 'departmentId name code')
        .sort({ shiftCode: 1 })
        .skip(skip)
        .limit(Number(limit))
        .lean(),
      Shift.countDocuments(filter)
    ]);

    return {
      shifts,
      total,
      page: Number(page),
      limit: Number(limit),
      pages: Math.ceil(total / limit)
    };
  }

  /**
   * Get shift by ID or Code
   */
  static async getShiftById(identifier) {
    let query = { shiftId: identifier };
    if (identifier.match(/^[0-9a-fA-F]{24}$/)) {
      query = { $or: [{ _id: identifier }, { shiftId: identifier }] };
    } else if (!identifier.startsWith('SHF')) {
      query = { shiftCode: identifier.toUpperCase() };
    }
    return await Shift.findOne(query).populate('departmentIds', 'departmentId name code');
  }

  /**
   * Update Shift definition
   */
  static async updateShift(id, updateData, user = null) {
    const shift = await this.getShiftById(id);
    if (!shift) {
      throw new Error(`Shift not found: ${id}`);
    }

    const oldValues = { ...shift.toObject() };

    if (updateData.shiftName) shift.shiftName = updateData.shiftName.trim();
    if (updateData.startTime) shift.startTime = updateData.startTime;
    if (updateData.endTime) shift.endTime = updateData.endTime;
    if (updateData.shiftType) shift.shiftType = updateData.shiftType;
    if (updateData.breakMinutes !== undefined) shift.breakMinutes = Number(updateData.breakMinutes);
    if (updateData.graceBeforeMinutes !== undefined) shift.graceBeforeMinutes = Number(updateData.graceBeforeMinutes);
    if (updateData.graceAfterMinutes !== undefined) shift.graceAfterMinutes = Number(updateData.graceAfterMinutes);
    if (updateData.status) shift.status = updateData.status;
    if (updateData.description !== undefined) shift.description = updateData.description;

    const startM = this.timeToMinutes(shift.startTime);
    const endM = this.timeToMinutes(shift.endTime);
    shift.crossesMidnight = updateData.crossesMidnight !== undefined
      ? Boolean(updateData.crossesMidnight)
      : (endM < startM);

    if (user?._id) shift.updatedBy = user._id;

    await shift.save();

    await AuditService.logEvent({
      userId: user?.userId || 'SYSTEM',
      actorRole: user?.role || 'HR_MANAGER',
      action: 'SHIFT_DEFINITION_UPDATED',
      module: 'SHIFT_MANAGEMENT',
      entityType: 'Shift',
      entityId: shift.shiftId,
      oldValue: oldValues,
      newValue: shift.toObject(),
      details: `Shift definition '${shift.shiftCode}' updated.`
    });

    return shift;
  }

  /**
   * Archive shift definition (Sec 7: Never delete a shift definition that has historical assignments)
   */
  static async archiveShift(id, user = null) {
    const shift = await this.getShiftById(id);
    if (!shift) {
      throw new Error(`Shift not found: ${id}`);
    }

    shift.status = 'ARCHIVED';
    if (user?._id) shift.updatedBy = user._id;
    await shift.save();

    await AuditService.logEvent({
      userId: user?.userId || 'SYSTEM',
      actorRole: user?.role || 'HR_MANAGER',
      action: 'SHIFT_DEFINITION_ARCHIVED',
      module: 'SHIFT_MANAGEMENT',
      entityType: 'Shift',
      entityId: shift.shiftId,
      details: `Shift '${shift.shiftCode}' archived.`
    });

    return shift;
  }
}

module.exports = ShiftService;
