const ShiftCoverage = require('../models/ShiftCoverage');
const ShiftAssignment = require('../models/ShiftAssignment');
const Shift = require('../models/Shift');
const Department = require('../models/Department');
const ShiftValidationService = require('./shiftValidationService');

class CoverageService {
  /**
   * Get or evaluate Department Shift Coverage (Sec 51, 52)
   */
  static async evaluateCoverage({ departmentId, date = new Date() }) {
    const normalizedDate = ShiftValidationService.normalizeDate(date);

    const department = await Department.findOne({
      $or: [
        ...(departmentId.match(/^[0-9a-fA-F]{24}$/) ? [{ _id: departmentId }] : []),
        { departmentId: departmentId },
        { code: departmentId.toUpperCase() }
      ]
    });
    if (!department) throw new Error(`Department not found: ${departmentId}`);

    const shifts = await Shift.find({ status: 'ACTIVE' });
    const coverageReport = [];

    for (const shift of shifts) {
      // Find count of scheduled employees for this department and shift on this date
      const scheduledCount = await ShiftAssignment.countDocuments({
        departmentId: department._id,
        shiftId: shift._id,
        assignmentDate: normalizedDate,
        status: { $in: ['APPROVED', 'PUBLISHED'] }
      });

      // Default required staffing baseline: 2 for active departments or configured in ShiftCoverage
      let existingCov = await ShiftCoverage.findOne({
        departmentId: department._id,
        shiftId: shift._id,
        date: normalizedDate
      });

      const requiredCount = existingCov ? existingCov.requiredCount : 2;

      let status = 'ADEQUATE';
      if (scheduledCount < requiredCount) {
        status = 'UNDERSTAFFED';
      } else if (scheduledCount > requiredCount + 2) {
        status = 'OVERSTAFFED';
      }

      coverageReport.push({
        shiftCode: shift.shiftCode,
        shiftName: shift.shiftName,
        startTime: shift.startTime,
        endTime: shift.endTime,
        requiredCount,
        scheduledCount,
        gap: requiredCount - scheduledCount,
        status
      });
    }

    return {
      department: {
        departmentId: department.departmentId,
        name: department.name,
        code: department.code
      },
      date: normalizedDate.toISOString().split('T')[0],
      coverage: coverageReport,
      summary: {
        totalShifts: coverageReport.length,
        understaffedShifts: coverageReport.filter(c => c.status === 'UNDERSTAFFED').length,
        adequateShifts: coverageReport.filter(c => c.status === 'ADEQUATE').length
      }
    };
  }
}

module.exports = CoverageService;
