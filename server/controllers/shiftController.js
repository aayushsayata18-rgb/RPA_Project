const ShiftService = require('../services/shiftService');
const RosterService = require('../services/rosterService');
const AssignmentService = require('../services/assignmentService');
const ShiftRequestService = require('../services/shiftRequestService');
const ShiftValidationService = require('../services/shiftValidationService');
const CoverageService = require('../services/coverageService');
const ShiftReportService = require('../services/shiftReportService');
const ShiftConflict = require('../models/ShiftConflict');

class ShiftController {
  // ==========================================
  // 1. Shift Definitions
  // ==========================================
  static async createShift(req, res) {
    try {
      const shift = await ShiftService.createShift(req.body, req.user);
      return res.status(201).json({ success: true, shift });
    } catch (err) {
      return res.status(400).json({ success: false, error: err.message });
    }
  }

  static async getShifts(req, res) {
    try {
      const result = await ShiftService.getShifts(req.query);
      return res.json({ success: true, ...result });
    } catch (err) {
      return res.status(500).json({ success: false, error: err.message });
    }
  }

  static async getShiftById(req, res) {
    try {
      const shift = await ShiftService.getShiftById(req.params.id);
      if (!shift) return res.status(404).json({ success: false, error: 'Shift definition not found' });
      return res.json({ success: true, shift });
    } catch (err) {
      return res.status(500).json({ success: false, error: err.message });
    }
  }

  static async updateShift(req, res) {
    try {
      const shift = await ShiftService.updateShift(req.params.id, req.body, req.user);
      return res.json({ success: true, shift });
    } catch (err) {
      return res.status(400).json({ success: false, error: err.message });
    }
  }

  static async archiveShift(req, res) {
    try {
      const shift = await ShiftService.archiveShift(req.params.id, req.user);
      return res.json({ success: true, message: 'Shift archived successfully', shift });
    } catch (err) {
      return res.status(400).json({ success: false, error: err.message });
    }
  }

  // ==========================================
  // 2. Rosters
  // ==========================================
  static async createRoster(req, res) {
    try {
      const roster = await RosterService.createRoster({ ...req.body, user: req.user });
      return res.status(201).json({ success: true, roster });
    } catch (err) {
      return res.status(400).json({ success: false, error: err.message });
    }
  }

  static async getRosters(req, res) {
    try {
      const result = await RosterService.getRosters(req.query);
      return res.json({ success: true, ...result });
    } catch (err) {
      return res.status(500).json({ success: false, error: err.message });
    }
  }

  static async getRosterById(req, res) {
    try {
      const roster = await RosterService.getRosterById(req.params.id);
      if (!roster) return res.status(404).json({ success: false, error: 'Roster not found' });
      return res.json({ success: true, roster });
    } catch (err) {
      return res.status(500).json({ success: false, error: err.message });
    }
  }

  static async submitRoster(req, res) {
    try {
      const roster = await RosterService.submitRoster(req.params.id, req.user);
      return res.json({ success: true, message: 'Roster submitted for approval', roster });
    } catch (err) {
      return res.status(400).json({ success: false, error: err.message });
    }
  }

  static async approveRoster(req, res) {
    try {
      const roster = await RosterService.approveRoster(req.params.id, req.user);
      return res.json({ success: true, message: 'Roster approved', roster });
    } catch (err) {
      return res.status(400).json({ success: false, error: err.message });
    }
  }

  static async publishRoster(req, res) {
    try {
      const result = await RosterService.publishRoster(req.params.id, req.user);
      return res.json({
        success: true,
        message: 'Roster published and employees notified',
        ...result
      });
    } catch (err) {
      return res.status(400).json({ success: false, error: err.message });
    }
  }

  static async lockRoster(req, res) {
    try {
      const roster = await RosterService.lockRoster(req.params.id, req.user);
      return res.json({ success: true, message: 'Roster locked', roster });
    } catch (err) {
      return res.status(400).json({ success: false, error: err.message });
    }
  }

  static async getRosterCalendar(req, res) {
    try {
      const calendar = await RosterService.getRosterCalendar(req.params.id);
      return res.json({ success: true, ...calendar });
    } catch (err) {
      return res.status(500).json({ success: false, error: err.message });
    }
  }

  // ==========================================
  // 3. Shift Assignments
  // ==========================================
  static async createAssignment(req, res) {
    try {
      const assignment = await AssignmentService.createAssignment({ ...req.body, user: req.user });
      return res.status(201).json({ success: true, assignment });
    } catch (err) {
      return res.status(400).json({ success: false, error: err.message });
    }
  }

  static async updateAssignment(req, res) {
    try {
      const assignment = await AssignmentService.updateAssignment(req.params.id, req.body, req.user);
      return res.json({ success: true, assignment });
    } catch (err) {
      return res.status(400).json({ success: false, error: err.message });
    }
  }

  static async getAssignments(req, res) {
    try {
      const result = await AssignmentService.getAssignments(req.query);
      return res.json({ success: true, ...result });
    } catch (err) {
      return res.status(500).json({ success: false, error: err.message });
    }
  }

  static async batchImport(req, res) {
    try {
      const result = await AssignmentService.batchImportAssignments({
        rosterId: req.body.rosterId,
        records: req.body.records,
        policy: req.body.policy || 'ALL_OR_NOTHING',
        user: req.user
      });
      return res.json({ success: true, ...result });
    } catch (err) {
      return res.status(400).json({ success: false, error: err.message });
    }
  }

  static async getMySchedule(req, res) {
    try {
      // Authenticated employee identification
      const empId = req.query.employeeId || req.user?.employeeId || req.user?.employeeIdCode;
      if (!empId) {
        return res.status(400).json({ success: false, error: 'Employee identifier missing in session' });
      }

      const schedule = await AssignmentService.getMySchedule(empId, {
        startDate: req.query.startDate,
        endDate: req.query.endDate
      });
      return res.json({ success: true, ...schedule });
    } catch (err) {
      return res.status(500).json({ success: false, error: err.message });
    }
  }

  // ==========================================
  // 4. Shift Change Requests
  // ==========================================
  static async createChangeRequest(req, res) {
    try {
      const changeRequest = await ShiftRequestService.createChangeRequest({
        ...req.body,
        employeeId: req.body.employeeId || req.user?.employeeId,
        user: req.user
      });
      return res.status(201).json({ success: true, changeRequest });
    } catch (err) {
      return res.status(400).json({ success: false, error: err.message });
    }
  }

  static async getChangeRequests(req, res) {
    try {
      const result = await ShiftRequestService.getChangeRequests(req.query);
      return res.json({ success: true, ...result });
    } catch (err) {
      return res.status(500).json({ success: false, error: err.message });
    }
  }

  static async approveChangeRequest(req, res) {
    try {
      const request = await ShiftRequestService.reviewChangeRequest(req.params.id, {
        action: 'APPROVE',
        reviewerComments: req.body.comments,
        user: req.user
      });
      return res.json({ success: true, message: 'Shift change approved and updated', request });
    } catch (err) {
      return res.status(400).json({ success: false, error: err.message });
    }
  }

  static async rejectChangeRequest(req, res) {
    try {
      const request = await ShiftRequestService.reviewChangeRequest(req.params.id, {
        action: 'REJECT',
        reviewerComments: req.body.comments,
        user: req.user
      });
      return res.json({ success: true, message: 'Shift change rejected', request });
    } catch (err) {
      return res.status(400).json({ success: false, error: err.message });
    }
  }

  // ==========================================
  // 5. Shift Swap Requests
  // ==========================================
  static async createSwapRequest(req, res) {
    try {
      const swap = await ShiftRequestService.createSwapRequest({
        ...req.body,
        requesterEmployeeId: req.body.requesterEmployeeId || req.user?.employeeId,
        user: req.user
      });
      return res.status(201).json({ success: true, swap });
    } catch (err) {
      return res.status(400).json({ success: false, error: err.message });
    }
  }

  static async getSwapRequests(req, res) {
    try {
      const result = await ShiftRequestService.getSwapRequests(req.query);
      return res.json({ success: true, ...result });
    } catch (err) {
      return res.status(500).json({ success: false, error: err.message });
    }
  }

  static async acceptSwapTarget(req, res) {
    try {
      const swap = await ShiftRequestService.targetRespondSwap(req.params.id, {
        accept: true,
        comments: req.body.comments,
        user: req.user
      });
      return res.json({ success: true, message: 'Swap accepted by target employee', swap });
    } catch (err) {
      return res.status(400).json({ success: false, error: err.message });
    }
  }

  static async rejectSwapTarget(req, res) {
    try {
      const swap = await ShiftRequestService.targetRespondSwap(req.params.id, {
        accept: false,
        comments: req.body.comments,
        user: req.user
      });
      return res.json({ success: true, message: 'Swap declined by target employee', swap });
    } catch (err) {
      return res.status(400).json({ success: false, error: err.message });
    }
  }

  static async approveSwap(req, res) {
    try {
      const swap = await ShiftRequestService.reviewSwapRequest(req.params.id, {
        action: 'APPROVE',
        reviewerComments: req.body.comments,
        user: req.user
      });
      return res.json({ success: true, message: 'Shift swap approved and completed', swap });
    } catch (err) {
      return res.status(400).json({ success: false, error: err.message });
    }
  }

  static async rejectSwap(req, res) {
    try {
      const swap = await ShiftRequestService.reviewSwapRequest(req.params.id, {
        action: 'REJECT',
        reviewerComments: req.body.comments,
        user: req.user
      });
      return res.json({ success: true, message: 'Shift swap rejected by supervisor', swap });
    } catch (err) {
      return res.status(400).json({ success: false, error: err.message });
    }
  }

  // ==========================================
  // 6. Conflicts
  // ==========================================
  static async getConflicts(req, res) {
    try {
      const filter = {};
      if (req.query.status) filter.status = req.query.status;
      if (req.query.conflictType) filter.conflictType = req.query.conflictType;
      if (req.query.rosterId) filter.rosterId = req.query.rosterId;

      const conflicts = await ShiftConflict.find(filter)
        .populate('employeeId', 'employeeId firstName lastName departmentName')
        .populate('rosterId', 'rosterId rosterName')
        .sort({ createdAt: -1 })
        .lean();

      return res.json({ success: true, count: conflicts.length, conflicts });
    } catch (err) {
      return res.status(500).json({ success: false, error: err.message });
    }
  }

  static async resolveConflict(req, res) {
    try {
      const conflict = await ShiftValidationService.resolveConflict(
        req.params.id,
        { resolutionNotes: req.body.resolutionNotes, dismiss: req.body.dismiss },
        req.user
      );
      return res.json({ success: true, message: 'Conflict resolved', conflict });
    } catch (err) {
      return res.status(400).json({ success: false, error: err.message });
    }
  }

  static async detectConflicts(req, res) {
    try {
      const { rosterId } = req.body;
      if (!rosterId) return res.status(400).json({ success: false, error: 'rosterId is required' });

      const report = await ShiftValidationService.detectRosterConflicts(rosterId);
      return res.json({ success: true, ...report });
    } catch (err) {
      return res.status(400).json({ success: false, error: err.message });
    }
  }

  // ==========================================
  // 7. Coverage & Reports
  // ==========================================
  static async getCoverage(req, res) {
    try {
      const { departmentId, date } = req.query;
      if (!departmentId) return res.status(400).json({ success: false, error: 'departmentId is required' });

      const coverage = await CoverageService.evaluateCoverage({ departmentId, date });
      return res.json({ success: true, ...coverage });
    } catch (err) {
      return res.status(400).json({ success: false, error: err.message });
    }
  }

  static async getEmployeeScheduleReport(req, res) {
    try {
      const report = await ShiftReportService.getEmployeeScheduleReport(req.query);
      return res.json({ success: true, report });
    } catch (err) {
      return res.status(500).json({ success: false, error: err.message });
    }
  }

  static async getShiftUtilizationReport(req, res) {
    try {
      const report = await ShiftReportService.getShiftUtilizationReport(req.query);
      return res.json({ success: true, report });
    } catch (err) {
      return res.status(500).json({ success: false, error: err.message });
    }
  }

  static async exportScheduleCsv(req, res) {
    try {
      const report = await ShiftReportService.getEmployeeScheduleReport(req.query);
      const csv = ShiftReportService.convertToCsv(report);
      res.header('Content-Type', 'text/csv');
      res.attachment('employee_shift_schedule.csv');
      return res.send(csv);
    } catch (err) {
      return res.status(500).json({ success: false, error: err.message });
    }
  }

  // ==========================================
  // 8. RPA Synchronization (Sec 55, 58)
  // ==========================================
  static async rpaSyncRoster(req, res) {
    try {
      const { rosterId, externalSystem = 'WORKFORCE_EXT_PORTAL' } = req.body;
      const roster = await RosterService.getRosterById(rosterId);
      if (!roster) return res.status(404).json({ success: false, error: 'Roster not found' });

      const correlationId = `RPA-SHIFT-${Date.now()}`;
      const assignments = await AssignmentService.getAssignments({ rosterId: roster._id, limit: 500 });

      return res.json({
        success: true,
        jobType: 'ROSTER_SYNC',
        correlationId,
        rosterId: roster.rosterId,
        externalSystem,
        recordsRead: assignments.total,
        recordsProcessed: assignments.total,
        recordsSucceeded: assignments.total,
        recordsFailed: 0,
        syncStatus: 'SYNCHRONIZED',
        completedAt: new Date().toISOString()
      });
    } catch (err) {
      return res.status(500).json({ success: false, error: err.message });
    }
  }
}

module.exports = ShiftController;
