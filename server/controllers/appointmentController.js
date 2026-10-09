const AppointmentService = require('../services/AppointmentService');
const DoctorScheduleService = require('../services/DoctorScheduleService');
const AppointmentReminderService = require('../services/AppointmentReminderService');

class AppointmentController {
  /**
   * GET /api/v1/appointments/available-slots
   * Query available slots for a doctor on a specific date
   */
  static async getAvailableSlots(req, res, next) {
    try {
      const { doctorId, date, appointmentType } = req.query;
      if (!doctorId || !date) {
        return res.status(400).json({
          success: false,
          message: 'Both doctorId and date (YYYY-MM-DD) query parameters are required.',
          errorCode: 'INVALID_QUERY_PARAMS'
        });
      }

      const result = await DoctorScheduleService.generateAvailableSlots(doctorId, date, appointmentType);
      return res.status(200).json({
        success: true,
        data: result
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/v1/appointments
   * Book a new appointment
   */
  static async createAppointment(req, res, next) {
    try {
      const user = req.user || {};
      let patientId = req.body.patientId;

      // If logged in as patient, enforce own patient ID
      if (user.role === 'PATIENT' && user.linkedEntityId) {
        patientId = user.linkedEntityId;
      }

      if (!patientId) {
        return res.status(400).json({
          success: false,
          message: 'Patient ID is required to book an appointment.',
          errorCode: 'MISSING_PATIENT_ID'
        });
      }

      const appointmentData = {
        ...req.body,
        patientId,
        actorUserId: user.userId || user.email || 'SYSTEM',
        actorRole: user.role || 'PATIENT'
      };

      const appointment = await AppointmentService.createAppointment(appointmentData);

      return res.status(201).json({
        success: true,
        message: 'Appointment successfully booked and confirmed.',
        data: appointment
      });
    } catch (error) {
      if (error.code === 'APPOINTMENT_SLOT_UNAVAILABLE' || error.code === 'DUPLICATE_APPOINTMENT') {
        return res.status(error.statusCode || 409).json({
          success: false,
          message: error.message,
          errorCode: error.code
        });
      }
      next(error);
    }
  }

  /**
   * GET /api/v1/appointments
   * List / Search appointments with pagination
   */
  static async getAppointments(req, res, next) {
    try {
      const user = req.user || {};
      const filters = { ...req.query };

      // RBAC: If PATIENT, force patientId to own linkedEntityId
      if (user.role === 'PATIENT') {
        filters.patientId = user.linkedEntityId || user.userId;
      }

      // RBAC: If DOCTOR, default/force to own doctorId unless admin
      if (user.role === 'DOCTOR' && user.linkedEntityId && !req.query.allDoctors) {
        filters.doctorId = user.linkedEntityId;
      }

      const pagination = {
        page: req.query.page,
        limit: req.query.limit
      };

      const result = await AppointmentService.getAppointments(filters, pagination);

      return res.status(200).json({
        success: true,
        data: result
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/v1/appointments/:appointmentId
   * Get single appointment with history
   */
  static async getAppointmentById(req, res, next) {
    try {
      const { appointmentId } = req.params;
      const user = req.user || {};

      const appointment = await AppointmentService.getAppointmentById(appointmentId);

      // RBAC: Patients can only view their own appointments
      if (user.role === 'PATIENT' && user.linkedEntityId && appointment.patientId !== user.linkedEntityId) {
        return res.status(403).json({
          success: false,
          message: 'Forbidden: You do not have permission to view another patient’s appointment.',
          errorCode: 'FORBIDDEN_RESOURCE_ACCESS'
        });
      }

      return res.status(200).json({
        success: true,
        data: appointment
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/v1/appointments/:appointmentId/cancel
   * Cancel an appointment
   */
  static async cancelAppointment(req, res, next) {
    try {
      const { appointmentId } = req.params;
      const { reason, notes } = req.body;
      const user = req.user || {};

      // RBAC Check
      const existing = await AppointmentService.getAppointmentById(appointmentId);
      if (user.role === 'PATIENT' && user.linkedEntityId && existing.patientId !== user.linkedEntityId) {
        return res.status(403).json({
          success: false,
          message: 'Forbidden: You cannot cancel another patient’s appointment.',
          errorCode: 'FORBIDDEN_CANCELLATION'
        });
      }

      const appointment = await AppointmentService.cancelAppointment(appointmentId, {
        reason: reason || 'PATIENT_REQUEST',
        notes: notes || '',
        actorUserId: user.userId || 'SYSTEM',
        actorRole: user.role || 'PATIENT'
      });

      return res.status(200).json({
        success: true,
        message: 'Appointment successfully cancelled.',
        data: appointment
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/v1/appointments/:appointmentId/reschedule
   * Reschedule an appointment
   */
  static async rescheduleAppointment(req, res, next) {
    try {
      const { appointmentId } = req.params;
      const { newDate, newStartTime, reason } = req.body;
      const user = req.user || {};

      if (!newDate || !newStartTime) {
        return res.status(400).json({
          success: false,
          message: 'newDate and newStartTime are required to reschedule.',
          errorCode: 'MISSING_RESCHEDULE_PARAMS'
        });
      }

      // RBAC Check
      const existing = await AppointmentService.getAppointmentById(appointmentId);
      if (user.role === 'PATIENT' && user.linkedEntityId && existing.patientId !== user.linkedEntityId) {
        return res.status(403).json({
          success: false,
          message: 'Forbidden: You cannot reschedule another patient’s appointment.',
          errorCode: 'FORBIDDEN_RESCHEDULE'
        });
      }

      const result = await AppointmentService.rescheduleAppointment(appointmentId, {
        newDate,
        newStartTime,
        reason: reason || 'Patient Reschedule Request',
        actorUserId: user.userId || 'SYSTEM',
        actorRole: user.role || 'PATIENT'
      });

      return res.status(200).json({
        success: true,
        message: 'Appointment successfully rescheduled.',
        data: result
      });
    } catch (error) {
      if (error.code === 'APPOINTMENT_SLOT_UNAVAILABLE' || error.code === 'DUPLICATE_APPOINTMENT') {
        return res.status(error.statusCode || 409).json({
          success: false,
          message: error.message,
          errorCode: error.code
        });
      }
      next(error);
    }
  }

  /**
   * POST /api/v1/appointments/:appointmentId/check-in
   * Patient arrival check-in
   */
  static async checkInAppointment(req, res, next) {
    try {
      const { appointmentId } = req.params;
      const user = req.user || {};

      const appointment = await AppointmentService.updateCheckInStatus(
        appointmentId,
        'CHECKED_IN',
        user.userId || 'SYSTEM'
      );

      return res.status(200).json({
        success: true,
        message: 'Patient check-in recorded successfully.',
        data: appointment
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/v1/appointments/process-no-shows
   * Automation trigger to scan and apply No-Show policy
   */
  static async triggerNoShowProcessing(req, res, next) {
    try {
      const { date, gracePeriodMinutes } = req.body;
      const user = req.user || {};

      const result = await AppointmentService.processNoShowAppointments({
        dateStr: date,
        gracePeriodMinutes,
        actorUserId: user.userId || 'RPA_SYSTEM'
      });

      return res.status(200).json({
        success: true,
        message: `Processed ${result.processedCount} appointments for No-Show policy.`,
        data: result
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/v1/appointments/trigger-reminders
   * Trigger delivery for due scheduled reminders
   */
  static async triggerReminders(req, res, next) {
    try {
      const result = await AppointmentReminderService.processDueReminders();
      return res.status(200).json({
        success: true,
        message: `Processed ${result.processed} due reminders (${result.delivered} delivered, ${result.failed} failed).`,
        data: result
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/v1/appointments/stats
   * Dashboard statistics & metrics
   */
  static async getStats(req, res, next) {
    try {
      const stats = await AppointmentService.getAppointmentStats();
      return res.status(200).json({
        success: true,
        data: stats
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = AppointmentController;
