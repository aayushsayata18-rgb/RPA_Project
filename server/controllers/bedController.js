const BedManagementService = require('../services/BedManagementService');
const Ward = require('../models/Ward');
const Bed = require('../models/Bed');

class BedController {
  /**
   * GET /api/v1/wards
   */
  static async listWards(req, res) {
    try {
      const wards = await BedManagementService.listWards();
      return res.json({
        success: true,
        data: wards
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        error: { code: 'FETCH_ERROR', message: error.message }
      });
    }
  }

  /**
   * GET /api/v1/beds
   */
  static async listBeds(req, res) {
    try {
      const filters = {
        wardId: req.query.wardId,
        bedType: req.query.bedType,
        status: req.query.status
      };
      const beds = await BedManagementService.listBeds(filters);
      return res.json({
        success: true,
        data: beds
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        error: { code: 'FETCH_ERROR', message: error.message }
      });
    }
  }

  /**
   * POST /api/v1/beds/suitable
   */
  static async findSuitableBeds(req, res) {
    try {
      const { clinicalRequirementCategory, accommodationPreference, wardId } = req.body;
      const result = await BedManagementService.findSuitableBeds({
        clinicalRequirementCategory,
        accommodationPreference,
        wardId
      });
      return res.json({
        success: true,
        data: result
      });
    } catch (error) {
      return res.status(400).json({
        success: false,
        error: { code: 'BED_SEARCH_ERROR', message: error.message }
      });
    }
  }

  /**
   * POST /api/v1/beds/:bedId/reserve
   */
  static async reserveBed(req, res) {
    try {
      const { bedId } = req.params;
      const { patientId, admissionRequestId, durationMinutes } = req.body;
      const bed = await BedManagementService.reserveBed({
        bedId,
        patientId,
        admissionRequestId,
        reservationDurationMinutes: durationMinutes || 60,
        actorUser: req.user
      });
      return res.json({
        success: true,
        data: bed,
        message: `Bed ${bed.bedNumber} reserved.`
      });
    } catch (error) {
      return res.status(400).json({
        success: false,
        error: { code: 'RESERVATION_ERROR', message: error.message }
      });
    }
  }

  /**
   * POST /api/v1/beds/:bedId/release
   */
  static async releaseReservation(req, res) {
    try {
      const { bedId } = req.params;
      const { admissionRequestId } = req.body;
      const bed = await BedManagementService.releaseBedReservation({
        bedId,
        admissionRequestId,
        actorUser: req.user
      });
      return res.json({
        success: true,
        data: bed,
        message: `Bed reservation released.`
      });
    } catch (error) {
      return res.status(400).json({
        success: false,
        error: { code: 'RELEASE_ERROR', message: error.message }
      });
    }
  }

  /**
   * PUT /api/v1/beds/:bedId/status
   */
  static async updateStatus(req, res) {
    try {
      const { bedId } = req.params;
      const { status } = req.body;
      const bed = await Bed.findOneAndUpdate(
        { bedId },
        { status, lastStatusChange: new Date() },
        { new: true }
      );
      if (!bed) {
        return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Bed not found.' } });
      }
      await BedManagementService.refreshWardCounts(bed.wardId);
      return res.json({
        success: true,
        data: bed
      });
    } catch (error) {
      return res.status(400).json({
        success: false,
        error: { code: 'UPDATE_ERROR', message: error.message }
      });
    }
  }
}

module.exports = BedController;
