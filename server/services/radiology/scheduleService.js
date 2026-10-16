const RadiologySchedule = require('../../models/RadiologySchedule');
const RadiologyOrder = require('../../models/RadiologyOrder');
const RadiologyModality = require('../../models/RadiologyModality');
const RadiologyExam = require('../../models/RadiologyExam');
const RadiologyException = require('../../models/RadiologyException');
const IdGeneratorService = require('../IdGeneratorService');
const AuditService = require('../AuditService');
const NotificationService = require('../NotificationService');

class ScheduleService {
  /**
   * Generate available appointment slots for a modality on a given date
   */
  static async getAvailableSlots({ modalityId, date, examId }) {
    if (!modalityId || !date) {
      throw new Error('modalityId and date are required to query availability.');
    }

    const modality = await RadiologyModality.findById(modalityId);
    if (!modality) {
      throw new Error('Modality not found.');
    }

    if (['MAINTENANCE', 'OUT_OF_SERVICE', 'DECOMMISSIONED'].includes(modality.status)) {
      return {
        available: false,
        reason: `Modality is currently in '${modality.status}' status.`,
        slots: []
      };
    }

    let durationMinutes = modality.operatingHours.slotDurationMinutes || 30;
    let bufferMinutes = modality.operatingHours.bufferMinutes || 10;

    if (examId) {
      const exam = await RadiologyExam.findById(examId);
      if (exam && exam.estimatedDurationMinutes) {
        durationMinutes = exam.estimatedDurationMinutes;
      }
    }

    const targetDate = new Date(date);
    const dayStart = new Date(targetDate);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(targetDate);
    dayEnd.setHours(23, 59, 59, 999);

    // Existing active bookings
    const existingBookings = await RadiologySchedule.find({
      modalityId: modality._id,
      scheduledStart: { $gte: dayStart, $lte: dayEnd },
      status: { $in: ['BOOKED', 'CONFIRMED', 'CHECKED_IN', 'IN_PROGRESS'] }
    }).lean();

    // Parse operating hours (e.g. "08:00" to "20:00")
    const [startHour, startMin] = (modality.operatingHours.start || '08:00').split(':').map(Number);
    const [endHour, endMin] = (modality.operatingHours.end || '20:00').split(':').map(Number);

    const openTime = new Date(targetDate);
    openTime.setHours(startHour, startMin, 0, 0);

    const closeTime = new Date(targetDate);
    closeTime.setHours(endHour, endMin, 0, 0);

    const slots = [];
    let currentSlotStart = new Date(openTime);

    while (currentSlotStart.getTime() + durationMinutes * 60000 <= closeTime.getTime()) {
      const currentSlotEnd = new Date(currentSlotStart.getTime() + durationMinutes * 60000);

      // Check conflict with existing bookings
      const isConflicting = existingBookings.some(b => {
        const bStart = new Date(b.scheduledStart).getTime();
        const bEnd = new Date(b.scheduledEnd).getTime();
        return (
          (currentSlotStart.getTime() >= bStart && currentSlotStart.getTime() < bEnd) ||
          (currentSlotEnd.getTime() > bStart && currentSlotEnd.getTime() <= bEnd) ||
          (currentSlotStart.getTime() <= bStart && currentSlotEnd.getTime() >= bEnd)
        );
      });

      slots.push({
        start: new Date(currentSlotStart),
        end: new Date(currentSlotEnd),
        available: !isConflicting,
        modalityId: modality._id,
        modalityName: modality.name,
        room: modality.room,
        durationMinutes
      });

      // Advance by duration + buffer
      currentSlotStart = new Date(currentSlotEnd.getTime() + bufferMinutes * 60000);
    }

    return {
      available: true,
      modality: {
        id: modality._id,
        name: modality.name,
        type: modality.type,
        room: modality.room,
        status: modality.status
      },
      date: targetDate.toISOString().split('T')[0],
      slots
    };
  }

  /**
   * Book appointment slot
   */
  static async bookSchedule({
    orderId,
    modalityId,
    scheduledStart,
    scheduledEnd,
    scheduledDate,
    startTime,
    endTime,
    prepInstructions = '',
    notes = '',
    user = null
  }) {
    if (!scheduledStart && scheduledDate) {
      const sTime = startTime || '09:00';
      scheduledStart = new Date(`${scheduledDate}T${sTime}:00Z`);
      if (!scheduledEnd && endTime) {
        scheduledEnd = new Date(`${scheduledDate}T${endTime}:00Z`);
      }
    }

    if (!orderId || !modalityId || !scheduledStart) {
      throw new Error('orderId, modalityId, and scheduledStart are mandatory.');
    }

    const order = await RadiologyOrder.findById(orderId).populate('examId');
    if (!order) {
      throw new Error('Radiology order not found.');
    }

    const modality = await RadiologyModality.findById(modalityId);
    if (!modality) {
      throw new Error('Radiology modality not found.');
    }

    if (['MAINTENANCE', 'OUT_OF_SERVICE', 'DECOMMISSIONED'].includes(modality.status)) {
      throw new Error(`Cannot schedule on modality in '${modality.status}' status.`);
    }

    const startDate = new Date(scheduledStart);
    let endDate = scheduledEnd ? new Date(scheduledEnd) : null;
    if (!endDate) {
      const dur = order.examId?.estimatedDurationMinutes || modality.operatingHours.slotDurationMinutes || 30;
      endDate = new Date(startDate.getTime() + dur * 60000);
    }

    // Concurrency / Conflict protection: check for overlap
    const conflict = await RadiologySchedule.findOne({
      modalityId: modality._id,
      status: { $in: ['BOOKED', 'CONFIRMED', 'CHECKED_IN', 'IN_PROGRESS'] },
      $or: [
        { scheduledStart: { $gte: startDate, $lt: endDate } },
        { scheduledEnd: { $gt: startDate, $lte: endDate } },
        {
          $and: [
            { scheduledStart: { $lte: startDate } },
            { scheduledEnd: { $gte: endDate } }
          ]
        }
      ]
    });

    if (conflict) {
      // Record scheduling conflict exception
      const exceptionId = await IdGeneratorService.generateRadiologyExceptionId();
      await RadiologyException.create({
        exceptionId,
        type: 'SCHEDULING_CONFLICT',
        severity: 'MEDIUM',
        patientId: order.patientId,
        patientName: order.patientName,
        orderId: order._id,
        description: `Selected slot ${startDate.toISOString()} on modality ${modality.name} is no longer available due to existing booking ${conflict.scheduleId}.`,
        source: 'MERN_SCHEDULING_ENGINE',
        status: 'OPEN'
      });

      const err = new Error('Slot no longer available. Please select another slot.');
      err.code = 'RAD_SLOT_CONFLICT';
      err.statusCode = 409;
      throw err;
    }

    const scheduleId = await IdGeneratorService.generateRadiologyScheduleId();

    const schedule = new RadiologySchedule({
      scheduleId,
      orderId: order._id,
      patientId: order.patientId,
      patientName: order.patientName,
      examId: order.examId._id,
      examName: order.examNameSnapshot,
      modalityId: modality._id,
      modalityName: modality.name,
      room: modality.room,
      scheduledStart: startDate,
      scheduledEnd: endDate,
      status: 'CONFIRMED',
      scheduledBy: user?._id || null,
      confirmedAt: new Date(),
      notes
    });

    await schedule.save();

    // Transition order status
    order.status = 'SCHEDULED';
    order.updatedBy = user?._id || null;
    await order.save();

    // Send Appointment Scheduled Notification
    try {
      await NotificationService.sendNotification({
        userId: user?._id || null,
        recipientType: 'PATIENT',
        channel: 'PORTAL',
        templateCode: 'RADIOLOGY_APPOINTMENT_SCHEDULED',
        variables: {
          patientName: order.patientName,
          orderId: order.orderId,
          examName: order.examNameSnapshot,
          date: startDate.toLocaleDateString(),
          time: startDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          room: modality.room,
          instructions: order.preparationInstructions || 'Please arrive 15 minutes before your scheduled appointment.'
        }
      });
    } catch (e) {
      console.warn('[Radiology Schedule Notification Warning]:', e.message);
    }

    await AuditService.logAction({
      user,
      action: 'BOOK_RADIOLOGY_SCHEDULE',
      entity: 'RadiologySchedule',
      entityId: schedule._id,
      description: `Booked appointment slot ${schedule.scheduleId} for ${order.patientName} at ${startDate.toISOString()} in ${modality.room}`
    });

    return schedule;
  }

  /**
   * Reschedule appointment
   */
  static async reschedule({
    scheduleId,
    newModalityId,
    newScheduledStart,
    newScheduledEnd,
    reason = '',
    user = null
  }) {
    const oldSchedule = await RadiologySchedule.findOne({
      $or: [{ _id: String(scheduleId).match(/^[0-9a-fA-F]{24}$/) ? scheduleId : null }, { scheduleId }]
    });

    if (!oldSchedule) {
      throw new Error('Appointment schedule not found.');
    }

    if (['COMPLETED', 'CANCELLED'].includes(oldSchedule.status)) {
      throw new Error(`Cannot reschedule appointment in status '${oldSchedule.status}'.`);
    }

    // Cancel old schedule
    oldSchedule.status = 'CANCELLED';
    oldSchedule.cancellationReason = `Rescheduled: ${reason || 'Change of appointment slot'}`;
    await oldSchedule.save();

    // Book new schedule with link to previous
    const targetModalityId = newModalityId || oldSchedule.modalityId;
    const newSchedule = await this.bookSchedule({
      orderId: oldSchedule.orderId,
      modalityId: targetModalityId,
      scheduledStart: newScheduledStart,
      scheduledEnd: newScheduledEnd,
      notes: `Rescheduled from ${oldSchedule.scheduleId}. Reason: ${reason || 'Patient/clinic request'}`,
      user
    });

    newSchedule.previousScheduleId = oldSchedule._id;
    await newSchedule.save();

    await AuditService.logAction({
      user,
      action: 'RESCHEDULE_RADIOLOGY_APPOINTMENT',
      entity: 'RadiologySchedule',
      entityId: newSchedule._id,
      previousState: { scheduleId: oldSchedule.scheduleId, status: 'CANCELLED' },
      newState: { scheduleId: newSchedule.scheduleId, status: 'CONFIRMED' },
      description: `Rescheduled appointment from ${oldSchedule.scheduleId} to ${newSchedule.scheduleId}`
    });

    return newSchedule;
  }

  /**
   * Cancel appointment schedule
   */
  static async cancelSchedule(scheduleId, reason = '', user = null) {
    const schedule = await RadiologySchedule.findOne({
      $or: [{ _id: String(scheduleId).match(/^[0-9a-fA-F]{24}$/) ? scheduleId : null }, { scheduleId }]
    });

    if (!schedule) {
      throw new Error('Schedule not found.');
    }

    schedule.status = 'CANCELLED';
    schedule.cancellationReason = reason || 'Cancelled by authorized user';
    await schedule.save();

    // Update order status back to PENDING_SCHEDULING
    await RadiologyOrder.findByIdAndUpdate(schedule.orderId, {
      status: 'PENDING_SCHEDULING'
    });

    await AuditService.logAction({
      user,
      action: 'CANCEL_RADIOLOGY_SCHEDULE',
      entity: 'RadiologySchedule',
      entityId: schedule._id,
      description: `Cancelled schedule ${schedule.scheduleId}. Reason: ${reason || 'N/A'}`
    });

    return schedule;
  }

  /**
   * Patient check-in verification and transition
   */
  static async checkIn({ scheduleId, preparationConfirmed = true, user = null, notes = '' }) {
    const schedule = await RadiologySchedule.findOne({
      $or: [{ _id: String(scheduleId).match(/^[0-9a-fA-F]{24}$/) ? scheduleId : null }, { scheduleId }]
    });

    if (!schedule) {
      throw new Error('Schedule not found.');
    }

    if (schedule.status === 'CHECKED_IN') {
      return schedule;
    }

    const order = await RadiologyOrder.findById(schedule.orderId);
    if (!order) {
      throw new Error('Associated order not found.');
    }

    // Check preparation requirement
    if (order.examId) {
      const exam = await RadiologyExam.findById(order.examId);
      if (exam && (exam.fastingRequired || exam.preparationInstructions)) {
        if (!preparationConfirmed) {
          // Record incomplete preparation exception
          const exceptionId = await IdGeneratorService.generateRadiologyExceptionId();
          await RadiologyException.create({
            exceptionId,
            type: 'PREPARATION_INCOMPLETE',
            severity: 'HIGH',
            patientId: order.patientId,
            patientName: order.patientName,
            orderId: order._id,
            scheduleId: schedule._id,
            description: `Patient indicated required preparation instructions were not completed for exam ${order.examNameSnapshot}. Clinician review required before scan.`,
            source: 'RECEPTION_CHECKIN',
            status: 'OPEN'
          });

          order.preparationStatus = 'NOT_COMPLETED';
          await order.save();
        } else {
          order.preparationStatus = 'COMPLETED';
        }
      }
    }

    schedule.status = 'CHECKED_IN';
    await schedule.save();

    order.status = 'CHECKED_IN';
    await order.save();

    await AuditService.logAction({
      user,
      action: 'CHECKIN_RADIOLOGY_PATIENT',
      entity: 'RadiologySchedule',
      entityId: schedule._id,
      description: `Patient ${schedule.patientName} checked in for appointment ${schedule.scheduleId}`
    });

    return { schedule, order };
  }

  /**
   * List schedules with filters
   */
  static async listSchedules(filters = {}) {
    const query = {};
    if (filters.status) query.status = filters.status;
    if (filters.modalityId) query.modalityId = filters.modalityId;
    if (filters.patientId) query.patientId = filters.patientId;

    if (filters.date) {
      const start = new Date(filters.date);
      start.setHours(0, 0, 0, 0);
      const end = new Date(filters.date);
      end.setHours(23, 59, 59, 999);
      query.scheduledStart = { $gte: start, $lte: end };
    }

    const schedules = await RadiologySchedule.find(query)
      .populate('orderId')
      .populate('modalityId')
      .sort({ scheduledStart: 1 })
      .lean();

    return schedules;
  }
}

module.exports = ScheduleService;
