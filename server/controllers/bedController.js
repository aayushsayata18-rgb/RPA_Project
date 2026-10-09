const BedManagementService = require('../services/BedManagementService');
const HousekeepingTask = require('../models/HousekeepingTask');
const BedAssignment = require('../models/BedAssignment');
const BedReservation = require('../models/BedReservation');

class BedController {
  // ==========================================
  // ACCOMMODATION CATEGORIES
  // ==========================================

  static async listCategories(req, res) {
    try {
      const categories = await BedManagementService.listCategories();
      return res.json({ success: true, data: categories });
    } catch (error) {
      return res.status(500).json({ success: false, error: { code: 'FETCH_ERROR', message: error.message } });
    }
  }

  static async createCategory(req, res) {
    try {
      const category = await BedManagementService.createCategory(req.body, req.user);
      return res.status(201).json({ success: true, data: category, message: 'Accommodation category created.' });
    } catch (error) {
      return res.status(400).json({ success: false, error: { code: 'CREATE_ERROR', message: error.message } });
    }
  }

  static async updateCategory(req, res) {
    try {
      const category = await BedManagementService.updateCategory(req.params.id, req.body, req.user);
      return res.json({ success: true, data: category, message: 'Accommodation category updated.' });
    } catch (error) {
      return res.status(400).json({ success: false, error: { code: 'UPDATE_ERROR', message: error.message } });
    }
  }

  // ==========================================
  // WARDS & ROOMS
  // ==========================================

  static async listWards(req, res) {
    try {
      const filters = {};
      if (req.query.active !== undefined) filters.active = req.query.active === 'true';
      if (req.query.wardType) filters.wardType = req.query.wardType;
      const wards = await BedManagementService.listWards(filters);
      return res.json({ success: true, data: wards });
    } catch (error) {
      return res.status(500).json({ success: false, error: { code: 'FETCH_ERROR', message: error.message } });
    }
  }

  static async getWard(req, res) {
    try {
      const ward = await BedManagementService.getWardById(req.params.id);
      if (!ward) return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Ward not found.' } });
      return res.json({ success: true, data: ward });
    } catch (error) {
      return res.status(500).json({ success: false, error: { code: 'FETCH_ERROR', message: error.message } });
    }
  }

  static async createWard(req, res) {
    try {
      const ward = await BedManagementService.createWard(req.body, req.user);
      return res.status(201).json({ success: true, data: ward, message: 'Ward created successfully.' });
    } catch (error) {
      return res.status(400).json({ success: false, error: { code: 'CREATE_ERROR', message: error.message } });
    }
  }

  static async updateWard(req, res) {
    try {
      const ward = await BedManagementService.updateWard(req.params.id, req.body, req.user);
      return res.json({ success: true, data: ward, message: 'Ward updated successfully.' });
    } catch (error) {
      return res.status(400).json({ success: false, error: { code: 'UPDATE_ERROR', message: error.message } });
    }
  }

  static async listRooms(req, res) {
    try {
      const filters = {};
      if (req.query.wardId) filters.wardId = req.query.wardId;
      const rooms = await BedManagementService.listRooms(filters);
      return res.json({ success: true, data: rooms });
    } catch (error) {
      return res.status(500).json({ success: false, error: { code: 'FETCH_ERROR', message: error.message } });
    }
  }

  static async createRoom(req, res) {
    try {
      const room = await BedManagementService.createRoom(req.body, req.user);
      return res.status(201).json({ success: true, data: room, message: 'Room created successfully.' });
    } catch (error) {
      return res.status(400).json({ success: false, error: { code: 'CREATE_ERROR', message: error.message } });
    }
  }

  // ==========================================
  // PHYSICAL BEDS & INVENTORY
  // ==========================================

  static async listBeds(req, res) {
    try {
      const filters = {
        wardId: req.query.wardId,
        roomId: req.query.roomId,
        bedType: req.query.bedType,
        status: req.query.status,
        genderPolicy: req.query.genderPolicy,
        isIsolationCapable: req.query.isIsolationCapable,
        active: req.query.active
      };
      const beds = await BedManagementService.listBeds(filters);
      return res.json({ success: true, data: beds });
    } catch (error) {
      return res.status(500).json({ success: false, error: { code: 'FETCH_ERROR', message: error.message } });
    }
  }

  static async getBed(req, res) {
    try {
      const bed = await BedManagementService.getBedById(req.params.id || req.params.bedId);
      if (!bed) return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Bed not found.' } });
      return res.json({ success: true, data: bed });
    } catch (error) {
      return res.status(500).json({ success: false, error: { code: 'FETCH_ERROR', message: error.message } });
    }
  }

  static async createBed(req, res) {
    try {
      const bed = await BedManagementService.createBed(req.body, req.user);
      return res.status(201).json({ success: true, data: bed, message: 'Bed created successfully.' });
    } catch (error) {
      return res.status(400).json({ success: false, error: { code: 'CREATE_ERROR', message: error.message } });
    }
  }

  static async updateBed(req, res) {
    try {
      const bed = await BedManagementService.updateBed(req.params.id || req.params.bedId, req.body, req.user);
      return res.json({ success: true, data: bed, message: 'Bed updated successfully.' });
    } catch (error) {
      return res.status(400).json({ success: false, error: { code: 'UPDATE_ERROR', message: error.message } });
    }
  }

  /**
   * POST /api/beds/search & POST /api/beds/suitable
   */
  static async searchBeds(req, res) {
    try {
      const {
        patientId,
        admissionId,
        clinicalRequirement,
        accommodationPreference,
        clinicalRequirementCategory,
        wardId,
        gender
      } = req.body;

      const clinReq = clinicalRequirement || { requiredCategory: clinicalRequirementCategory };
      const accPref = accommodationPreference || {};

      const result = await BedManagementService.searchBeds({
        patientId,
        admissionId,
        clinicalRequirement: clinReq,
        accommodationPreference: accPref,
        wardId,
        gender
      });

      return res.json({
        success: true,
        ...result
      });
    } catch (error) {
      return res.status(400).json({
        success: false,
        error: { code: 'BED_SEARCH_ERROR', message: error.message }
      });
    }
  }

  // Backward compatibility alias
  static async findSuitableBeds(req, res) {
    return BedController.searchBeds(req, res);
  }

  /**
   * POST /api/bed-reservations & POST /api/beds/:bedId/reserve
   */
  static async reserveBed(req, res) {
    try {
      const bedId = req.params.bedId || req.body.bedId;
      const { patientId, patientName, admissionId, admissionRequestId, reservationReason, durationMinutes } = req.body;

      const result = await BedManagementService.reserveBed({
        bedId,
        patientId,
        patientName,
        admissionId,
        admissionRequestId,
        reservationReason,
        reservationDurationMinutes: durationMinutes || 60,
        actorUser: req.user
      });

      return res.status(201).json({
        success: true,
        data: result.bed,
        reservation: result.reservation,
        message: `Bed ${result.bed.bedNumber} reserved successfully.`
      });
    } catch (error) {
      return res.status(400).json({
        success: false,
        error: { code: 'RESERVATION_ERROR', message: error.message }
      });
    }
  }

  /**
   * POST /api/beds/:bedId/cancel-reservation or POST /api/beds/:bedId/release
   */
  static async releaseReservation(req, res) {
    try {
      const bedId = req.params.bedId || req.body.bedId;
      const { admissionRequestId, reservationId, cancellationReason } = req.body;

      const result = await BedManagementService.cancelReservation({
        reservationId,
        bedId,
        cancellationReason: cancellationReason || `Released for request ${admissionRequestId || 'staff action'}`,
        actorUser: req.user
      });

      return res.json({
        success: true,
        data: result.bed,
        message: 'Bed reservation cancelled.'
      });
    } catch (error) {
      return res.status(400).json({
        success: false,
        error: { code: 'RELEASE_ERROR', message: error.message }
      });
    }
  }

  /**
   * POST /api/bed-assignments
   */
  static async assignBed(req, res) {
    try {
      const idempotencyKey = req.headers['idempotency-key'] || req.body.idempotencyKey;
      const {
        bedId,
        patientId,
        patientName,
        admissionId,
        admissionRequestId,
        visitId,
        assignmentType
      } = req.body;

      const result = await BedManagementService.assignBed({
        bedId,
        patientId,
        patientName,
        admissionId,
        admissionRequestId,
        visitId,
        assignmentType: assignmentType || 'INITIAL_ADMISSION',
        idempotencyKey,
        actorUser: req.user
      });

      return res.status(201).json({
        success: true,
        data: result.bed,
        assignment: result.assignment,
        isIdempotentReplay: result.isIdempotentReplay || false,
        message: `Bed ${result.bed.bedNumber} assigned to patient ${patientName || patientId}.`
      });
    } catch (error) {
      const status = error.message.includes('already assigned') || error.message.includes('no longer available') ? 409 : 400;
      return res.status(status).json({
        success: false,
        error: { code: 'ASSIGNMENT_ERROR', message: error.message }
      });
    }
  }

  /**
   * POST /api/bed-transfers
   */
  static async transferBed(req, res) {
    try {
      const { patientId, admissionId, fromBedId, toBedId, reason } = req.body;
      const result = await BedManagementService.transferPatientBed({
        patientId,
        admissionId,
        fromBedId,
        toBedId,
        transferReason: reason || 'Bed transfer requested',
        actorUser: req.user
      });

      return res.json({
        success: true,
        data: result,
        message: `Patient ${patientId} successfully transferred from ${fromBedId} to ${toBedId}.`
      });
    } catch (error) {
      const status = error.message.includes('not available') || error.message.includes('locked') ? 409 : 400;
      return res.status(status).json({
        success: false,
        error: { code: 'TRANSFER_ERROR', message: error.message }
      });
    }
  }

  /**
   * POST /api/beds/:id/release (Discharge bed release)
   */
  static async releaseBed(req, res) {
    try {
      const bedId = req.params.id || req.params.bedId;
      const { admissionId, releaseReason } = req.body;

      const result = await BedManagementService.releaseBedOnDischarge({
        bedId,
        admissionId,
        releaseReason: releaseReason || 'Discharge release',
        actorUser: req.user
      });

      return res.json({
        success: true,
        status: result.status,
        housekeepingTaskCreated: result.housekeepingTaskCreated,
        housekeepingTaskId: result.housekeepingTaskId,
        data: result.bed,
        message: `Bed ${result.bed.bedNumber} released and flagged for housekeeping cleaning.`
      });
    } catch (error) {
      return res.status(400).json({
        success: false,
        error: { code: 'RELEASE_ERROR', message: error.message }
      });
    }
  }

  /**
   * PATCH /api/beds/:id/status
   */
  static async updateStatus(req, res) {
    try {
      const bedId = req.params.id || req.params.bedId;
      const { status, reason } = req.body;

      const bed = await BedManagementService.updateBedStatus({
        bedId,
        newStatus: status,
        reason: reason || 'Staff status update',
        actorUser: req.user
      });

      return res.json({
        success: true,
        data: bed,
        message: `Bed ${bed.bedNumber} status updated to ${status}.`
      });
    } catch (error) {
      return res.status(400).json({
        success: false,
        error: { code: 'STATUS_UPDATE_ERROR', message: error.message }
      });
    }
  }

  /**
   * GET /api/beds/availability
   */
  static async getAvailabilityDashboard(req, res) {
    try {
      const data = await BedManagementService.getAvailabilityDashboard();
      return res.json({ success: true, data });
    } catch (error) {
      return res.status(500).json({ success: false, error: { code: 'METRICS_ERROR', message: error.message } });
    }
  }

  /**
   * GET /api/beds/:id/history
   */
  static async getBedHistory(req, res) {
    try {
      const bedId = req.params.id || req.params.bedId;
      const history = await BedManagementService.getBedHistory(bedId);
      return res.json({ success: true, data: history });
    } catch (error) {
      return res.status(500).json({ success: false, error: { code: 'FETCH_ERROR', message: error.message } });
    }
  }

  /**
   * GET /api/bed-assignments
   */
  static async listAssignments(req, res) {
    try {
      const query = {};
      if (req.query.patientId) query.patientId = req.query.patientId;
      if (req.query.admissionId) query.admissionId = req.query.admissionId;
      if (req.query.bedId) query.bedId = req.query.bedId;
      if (req.query.status) query.status = req.query.status;

      const assignments = await BedAssignment.find(query).sort({ assignedAt: -1 }).lean();
      return res.json({ success: true, data: assignments });
    } catch (error) {
      return res.status(500).json({ success: false, error: { code: 'FETCH_ERROR', message: error.message } });
    }
  }

  /**
   * GET /api/bed-reservations
   */
  static async listReservations(req, res) {
    try {
      const query = {};
      if (req.query.patientId) query.patientId = req.query.patientId;
      if (req.query.bedId) query.bedId = req.query.bedId;
      if (req.query.status) query.status = req.query.status;

      const reservations = await BedReservation.find(query).sort({ reservedAt: -1 }).lean();
      return res.json({ success: true, data: reservations });
    } catch (error) {
      return res.status(500).json({ success: false, error: { code: 'FETCH_ERROR', message: error.message } });
    }
  }

  /**
   * Waiting List APIs
   */
  static async addToWaitingList(req, res) {
    try {
      const item = await BedManagementService.addToWaitingList({ ...req.body, actorUser: req.user });
      return res.status(201).json({ success: true, data: item, message: 'Added to bed waiting list.' });
    } catch (error) {
      return res.status(400).json({ success: false, error: { code: 'WAITING_LIST_ERROR', message: error.message } });
    }
  }

  static async listWaitingList(req, res) {
    try {
      const list = await BedManagementService.listWaitingList(req.query);
      return res.json({ success: true, data: list });
    } catch (error) {
      return res.status(500).json({ success: false, error: { code: 'FETCH_ERROR', message: error.message } });
    }
  }

  /**
   * Housekeeping APIs
   */
  static async listHousekeepingTasks(req, res) {
    try {
      const query = {};
      if (req.query.wardId) query.wardId = req.query.wardId;
      if (req.query.status) query.status = req.query.status;
      if (req.query.bedId) query.bedId = req.query.bedId;

      const tasks = await HousekeepingTask.find(query).sort({ createdAt: -1 }).lean();
      return res.json({ success: true, data: tasks });
    } catch (error) {
      return res.status(500).json({ success: false, error: { code: 'FETCH_ERROR', message: error.message } });
    }
  }

  static async completeCleaning(req, res) {
    try {
      const { taskId, bedId } = req.body;
      const result = await BedManagementService.completeHousekeepingCleaning({ taskId, bedId, actorUser: req.user });
      return res.json({ success: true, data: result.bed, task: result.task, message: 'Cleaning completed and bed is now AVAILABLE.' });
    } catch (error) {
      return res.status(400).json({ success: false, error: { code: 'CLEANING_ERROR', message: error.message } });
    }
  }

  /**
   * Reconciliation API (POST /api/beds/reconcile)
   */
  static async reconcileInventory(req, res) {
    try {
      const { legacyInventory } = req.body;
      const result = await BedManagementService.reconcileWithExternalSystem({
        legacyInventory: legacyInventory || [],
        actorUser: req.user
      });
      return res.json({ success: true, data: result });
    } catch (error) {
      return res.status(400).json({ success: false, error: { code: 'RECONCILIATION_ERROR', message: error.message } });
    }
  }
}

module.exports = BedController;
