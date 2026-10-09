const Doctor = require('../models/Doctor');
const Department = require('../models/Department');
const DoctorSchedule = require('../models/DoctorSchedule');
const DoctorScheduleService = require('../services/DoctorScheduleService');
const AuditService = require('../services/AuditService');

class DoctorController {
  /**
   * GET /api/doctors/departments
   */
  static async getDepartments(req, res, next) {
    try {
      const departments = await DoctorScheduleService.getDepartments();
      return res.status(200).json({
        success: true,
        data: departments
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/doctors
   */
  static async getDoctors(req, res, next) {
    try {
      const doctors = await DoctorScheduleService.getDoctors(req.query);
      return res.status(200).json({
        success: true,
        data: doctors
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/doctors/:doctorId
   */
  static async getDoctorById(req, res, next) {
    try {
      const { doctorId } = req.params;
      const doctor = await DoctorScheduleService.getDoctorById(doctorId);
      return res.status(200).json({
        success: true,
        data: doctor
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/doctors/:doctorId/schedule
   */
  static async getDoctorSchedule(req, res, next) {
    try {
      const { doctorId } = req.params;
      const schedule = await DoctorSchedule.findOne({ doctorId }).lean();
      if (!schedule) {
        return res.status(404).json({
          success: false,
          message: `Schedule for doctor ${doctorId} not found.`,
          errorCode: 'SCHEDULE_NOT_FOUND'
        });
      }
      return res.status(200).json({
        success: true,
        data: schedule
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/doctors/:doctorId/leave
   * Record doctor leave and find affected appointments
   */
  static async recordLeave(req, res, next) {
    try {
      const { doctorId } = req.params;
      const { startDate, endDate, reason } = req.body;
      const user = req.user || {};

      if (!startDate || !endDate) {
        return res.status(400).json({
          success: false,
          message: 'startDate and endDate are required.',
          errorCode: 'MISSING_DATE_RANGE'
        });
      }

      const schedule = await DoctorSchedule.findOne({ doctorId });
      if (!schedule) {
        return res.status(404).json({
          success: false,
          message: `Schedule for doctor ${doctorId} not found.`,
          errorCode: 'SCHEDULE_NOT_FOUND'
        });
      }

      schedule.leaves.push({
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        reason: reason || 'Approved Leave',
        status: 'APPROVED'
      });
      await schedule.save();

      // Check affected appointments
      const affectedAppointments = await DoctorScheduleService.detectDoctorScheduleExceptions(
        doctorId,
        startDate,
        endDate,
        reason
      );

      await AuditService.logEvent({
        userId: user.userId || 'SYSTEM',
        role: user.role || 'ADMIN_MANAGER',
        action: 'DOCTOR_LEAVE_RECORDED',
        module: 'APPOINTMENT_MANAGEMENT',
        entityType: 'Doctor',
        entityId: doctorId,
        details: `Leave recorded from ${startDate} to ${endDate}. ${affectedAppointments.length} appointments affected.`
      });

      return res.status(200).json({
        success: true,
        message: 'Leave recorded successfully.',
        data: {
          doctorId,
          leave: { startDate, endDate, reason },
          affectedAppointmentsCount: affectedAppointments.length,
          affectedAppointments
        }
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = DoctorController;
