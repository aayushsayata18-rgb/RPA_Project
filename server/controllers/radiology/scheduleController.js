const ScheduleService = require('../../services/radiology/scheduleService');

class ScheduleController {
  static async listSchedules(req, res, next) {
    try {
      const filters = {
        status: req.query.status,
        modalityId: req.query.modalityId,
        patientId: req.query.patientId,
        date: req.query.date
      };
      const schedules = await ScheduleService.listSchedules(filters);
      res.json({
        success: true,
        data: schedules
      });
    } catch (err) {
      next(err);
    }
  }

  static async getAvailability(req, res, next) {
    try {
      const { modalityId, date, examId } = req.query;
      const result = await ScheduleService.getAvailableSlots({ modalityId, date, examId });
      res.json({
        success: true,
        data: result
      });
    } catch (err) {
      next(err);
    }
  }

  static async bookSchedule(req, res, next) {
    try {
      const schedule = await ScheduleService.bookSchedule({
        ...req.body,
        user: req.user
      });
      res.status(201).json({
        success: true,
        message: 'Appointment booked successfully.',
        data: schedule
      });
    } catch (err) {
      next(err);
    }
  }

  static async reschedule(req, res, next) {
    try {
      const schedule = await ScheduleService.reschedule({
        scheduleId: req.params.id,
        ...req.body,
        user: req.user
      });
      res.json({
        success: true,
        message: 'Appointment rescheduled successfully.',
        data: schedule
      });
    } catch (err) {
      next(err);
    }
  }

  static async cancelSchedule(req, res, next) {
    try {
      const { reason } = req.body;
      const schedule = await ScheduleService.cancelSchedule(req.params.id, reason, req.user);
      res.json({
        success: true,
        message: 'Appointment cancelled successfully.',
        data: schedule
      });
    } catch (err) {
      next(err);
    }
  }

  static async checkIn(req, res, next) {
    try {
      const { preparationConfirmed, notes } = req.body;
      const result = await ScheduleService.checkIn({
        scheduleId: req.params.id,
        preparationConfirmed,
        notes,
        user: req.user
      });
      res.json({
        success: true,
        message: 'Patient check-in recorded successfully.',
        data: result?.schedule ? {
          ...(typeof result.schedule.toObject === 'function' ? result.schedule.toObject() : result.schedule),
          status: result.schedule.status,
          order: result.order
        } : result
      });
    } catch (err) {
      next(err);
    }
  }
}

module.exports = ScheduleController;
