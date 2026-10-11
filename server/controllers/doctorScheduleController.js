const DoctorScheduleService = require('../services/DoctorScheduleService');
const DoctorConflictService = require('../services/doctorConflictService');

class DoctorScheduleController {
  /**
   * GET /api/doctors/:doctorId/schedules
   */
  static async getSchedules(req, res, next) {
    try {
      const { doctorId } = req.params;
      const { status } = req.query;
      const schedules = await DoctorScheduleService.getDoctorSchedules(doctorId, status);
      return res.status(200).json({
        success: true,
        count: schedules.length,
        data: schedules
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/doctors/:doctorId/schedules
   */
  static async createSchedule(req, res, next) {
    try {
      const { doctorId } = req.params;
      const user = req.user || {};
      const schedule = await DoctorScheduleService.createSchedule(
        { ...req.body, doctorId },
        user
      );
      return res.status(201).json({
        success: true,
        message: 'Doctor schedule created successfully.',
        data: schedule
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * PUT /api/doctors/:doctorId/schedules/:scheduleId
   */
  static async updateSchedule(req, res, next) {
    try {
      const { scheduleId } = req.params;
      const user = req.user || {};
      const schedule = await DoctorScheduleService.updateSchedule(scheduleId, req.body, user);
      return res.status(200).json({
        success: true,
        message: 'Doctor schedule updated successfully.',
        data: schedule
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * DELETE /api/doctors/:doctorId/schedules/:scheduleId
   */
  static async cancelSchedule(req, res, next) {
    try {
      const { scheduleId } = req.params;
      const user = req.user || {};
      const result = await DoctorScheduleService.cancelSchedule(scheduleId, user);
      return res.status(200).json({
        success: true,
        message: 'Doctor schedule cancelled successfully.',
        data: result
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/doctors/:doctorId/schedules/check-conflict
   */
  static async checkConflict(req, res, next) {
    try {
      const { doctorId } = req.params;
      const conflictCheck = await DoctorConflictService.checkScheduleConflict({
        ...req.body,
        doctorId
      });
      return res.status(200).json({
        success: true,
        data: conflictCheck
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = DoctorScheduleController;
