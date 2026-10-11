const DoctorAvailabilityService = require('../services/doctorAvailabilityService');

class DoctorAvailabilityController {
  /**
   * GET /api/doctors/availability/dashboard
   */
  static async getAvailabilityDashboard(req, res, next) {
    try {
      const data = await DoctorAvailabilityService.getAvailabilityDashboard(req.query);
      return res.status(200).json({
        success: true,
        count: data.length,
        data
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/doctors/:doctorId/availability
   */
  static async getDoctorAvailability(req, res, next) {
    try {
      const { doctorId } = req.params;
      const records = await DoctorAvailabilityService.getDoctorAvailability(doctorId, req.query);
      return res.status(200).json({
        success: true,
        count: records.length,
        data: records
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/doctors/:doctorId/availability
   */
  static async recordAvailability(req, res, next) {
    try {
      const { doctorId } = req.params;
      const user = req.user || {};
      const result = await DoctorAvailabilityService.recordAvailability(
        { ...req.body, doctorId },
        user
      );
      return res.status(201).json({
        success: true,
        message: 'Availability recorded successfully.',
        data: result
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * PUT /api/doctors/:doctorId/availability/:availabilityId
   */
  static async updateAvailability(req, res, next) {
    try {
      const { availabilityId } = req.params;
      const user = req.user || {};
      const record = await DoctorAvailabilityService.updateAvailability(availabilityId, req.body, user);
      return res.status(200).json({
        success: true,
        message: 'Availability updated successfully.',
        data: record
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = DoctorAvailabilityController;
