const Doctor = require('../models/Doctor');
const Department = require('../models/Department');
const DoctorSchedule = require('../models/DoctorSchedule');
const Appointment = require('../models/Appointment');
const DoctorConflictService = require('./doctorConflictService');
const AuditService = require('./AuditService');

class DoctorScheduleService {
  /**
   * Helper: Parse "HH:MM" to minutes since midnight
   */
  static timeToMinutes(timeStr) {
    if (!timeStr) return 0;
    const [h, m] = timeStr.split(':').map(Number);
    return (h || 0) * 60 + (m || 0);
  }

  /**
   * Helper: Format minutes since midnight to "HH:MM"
   */
  static minutesToTime(mins) {
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
  }

  /**
   * Helper: Get day of week name in uppercase
   */
  static getDayOfWeekName(dateObj) {
    const days = ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'];
    return days[dateObj.getDay()];
  }

  /**
   * Get all active departments with doctor counts & specialties
   */
  static async getDepartments() {
    return await Department.find({ isActive: true }).lean();
  }

  /**
   * Get doctors with filters
   */
  static async getDoctors(filters = {}) {
    const query = { status: { $ne: 'TERMINATED' } };
    if (filters.departmentId) {
      query.$or = [
        { departmentId: filters.departmentId },
        { 'departments.departmentId': filters.departmentId }
      ];
    }
    if (filters.specialty) {
      query.$or = [
        { specialty: new RegExp(filters.specialty, 'i') },
        { 'specializations.name': new RegExp(filters.specialty, 'i') }
      ];
    }
    if (filters.status) query.status = filters.status;
    if (filters.search) {
      query.$or = [
        { displayName: new RegExp(filters.search, 'i') },
        { fullName: new RegExp(filters.search, 'i') },
        { firstName: new RegExp(filters.search, 'i') },
        { lastName: new RegExp(filters.search, 'i') },
        { specialty: new RegExp(filters.search, 'i') },
        { doctorId: new RegExp(filters.search, 'i') },
        { email: new RegExp(filters.search, 'i') },
        { phone: new RegExp(filters.search, 'i') }
      ];
    }
    return await Doctor.find(query).sort({ displayName: 1, fullName: 1 }).lean();
  }

  /**
   * Get doctor by doctorId
   */
  static async getDoctorById(doctorId) {
    const doctor = await Doctor.findOne({ doctorId }).lean();
    if (!doctor) {
      throw new Error(`Doctor with ID ${doctorId} not found.`);
    }
    const schedules = await DoctorSchedule.find({ doctorId, status: { $ne: 'CANCELLED' } }).lean();
    return { ...doctor, schedules, schedule: schedules[0] || null };
  }

  /**
   * Create a new doctor schedule with conflict detection (Section 25 & 34)
   */
  static async createSchedule(scheduleData, user = {}) {
    const { doctorId, dayOfWeek, startTime, endTime, effectiveFrom, effectiveTo } = scheduleData;

    const doctor = await Doctor.findOne({ doctorId });
    if (!doctor) throw new Error(`Doctor ${doctorId} not found.`);

    // 1. Check conflicts
    const conflictCheck = await DoctorConflictService.checkScheduleConflict({
      doctorId,
      dayOfWeek,
      startTime,
      endTime,
      effectiveFrom,
      effectiveTo
    });

    if (conflictCheck.hasConflict) {
      const err = new Error(conflictCheck.conflictMessage);
      err.status = 409;
      err.errorCode = 'SCHEDULE_CONFLICT';
      err.conflictingSchedules = conflictCheck.conflictingSchedules;
      throw err;
    }

    const dayNames = ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'];
    const dayName = dayOfWeek !== undefined && dayOfWeek !== null ? dayNames[dayOfWeek] : '';

    const newSchedule = new DoctorSchedule({
      scheduleId: `SCH-${Date.now().toString(36).toUpperCase()}-${Math.floor(Math.random() * 1000)}`,
      doctorId,
      departmentId: scheduleData.departmentId || doctor.departmentId,
      departmentName: scheduleData.departmentName || doctor.departmentName,
      dayOfWeek,
      dayOfWeekName: dayName,
      startTime,
      endTime,
      slotDurationMinutes: scheduleData.slotDurationMinutes || doctor.slotDurationMinutes || 30,
      maxCapacityPerSlot: scheduleData.maxCapacityPerSlot || 1,
      roomNumber: scheduleData.roomNumber || doctor.roomNumber || 'OPD-101',
      locationId: scheduleData.locationId || '',
      effectiveFrom: effectiveFrom ? new Date(effectiveFrom) : new Date(),
      effectiveTo: effectiveTo ? new Date(effectiveTo) : null,
      status: scheduleData.status || 'ACTIVE',
      notes: scheduleData.notes || '',
      createdBy: user.userId || 'SYSTEM'
    });

    await newSchedule.save();

    await AuditService.logEvent({
      userId: user.userId || 'SYSTEM',
      role: user.role || 'ADMIN_MANAGER',
      action: 'DOCTOR_SCHEDULE_CREATED',
      module: 'DOCTOR_MANAGEMENT',
      entityType: 'DoctorSchedule',
      entityId: newSchedule.scheduleId,
      details: `Created schedule for ${doctorId} on ${dayName} (${startTime} - ${endTime}). Status: ${newSchedule.status}`
    });

    return newSchedule;
  }

  /**
   * Update doctor schedule with conflict check & versioning
   */
  static async updateSchedule(scheduleId, updateData, user = {}) {
    const schedule = await DoctorSchedule.findOne({
      $or: [{ _id: scheduleId }, { scheduleId }]
    });
    if (!schedule) throw new Error(`Schedule ${scheduleId} not found.`);

    const doctorId = schedule.doctorId;
    const dayOfWeek = updateData.dayOfWeek !== undefined ? updateData.dayOfWeek : schedule.dayOfWeek;
    const startTime = updateData.startTime || schedule.startTime;
    const endTime = updateData.endTime || schedule.endTime;
    const effectiveFrom = updateData.effectiveFrom || schedule.effectiveFrom;
    const effectiveTo = updateData.effectiveTo || schedule.effectiveTo;

    // Check conflict excluding current schedule
    const conflictCheck = await DoctorConflictService.checkScheduleConflict({
      doctorId,
      dayOfWeek,
      startTime,
      endTime,
      effectiveFrom,
      effectiveTo,
      excludeScheduleId: schedule._id
    });

    if (conflictCheck.hasConflict) {
      const err = new Error(conflictCheck.conflictMessage);
      err.status = 409;
      err.errorCode = 'SCHEDULE_CONFLICT';
      err.conflictingSchedules = conflictCheck.conflictingSchedules;
      throw err;
    }

    if (updateData.dayOfWeek !== undefined) {
      schedule.dayOfWeek = updateData.dayOfWeek;
      const dayNames = ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'];
      schedule.dayOfWeekName = dayNames[schedule.dayOfWeek] || '';
    }
    if (updateData.startTime) schedule.startTime = updateData.startTime;
    if (updateData.endTime) schedule.endTime = updateData.endTime;
    if (updateData.slotDurationMinutes) schedule.slotDurationMinutes = updateData.slotDurationMinutes;
    if (updateData.maxCapacityPerSlot) schedule.maxCapacityPerSlot = updateData.maxCapacityPerSlot;
    if (updateData.roomNumber) schedule.roomNumber = updateData.roomNumber;
    if (updateData.effectiveFrom) schedule.effectiveFrom = new Date(updateData.effectiveFrom);
    if (updateData.effectiveTo !== undefined) schedule.effectiveTo = updateData.effectiveTo ? new Date(updateData.effectiveTo) : null;
    if (updateData.status) schedule.status = updateData.status;
    if (updateData.notes !== undefined) schedule.notes = updateData.notes;
    schedule.updatedBy = user.userId || 'SYSTEM';

    await schedule.save();

    await AuditService.logEvent({
      userId: user.userId || 'SYSTEM',
      role: user.role || 'ADMIN_MANAGER',
      action: 'DOCTOR_SCHEDULE_UPDATED',
      module: 'DOCTOR_MANAGEMENT',
      entityType: 'DoctorSchedule',
      entityId: schedule.scheduleId,
      details: `Updated schedule for ${doctorId}. Day: ${schedule.dayOfWeekName}, Time: ${schedule.startTime} - ${schedule.endTime}`
    });

    return schedule;
  }

  /**
   * Cancel/delete schedule and identify affected appointments
   */
  static async cancelSchedule(scheduleId, user = {}) {
    const schedule = await DoctorSchedule.findOne({
      $or: [{ _id: scheduleId }, { scheduleId }]
    });
    if (!schedule) throw new Error(`Schedule ${scheduleId} not found.`);

    schedule.status = 'CANCELLED';
    schedule.updatedBy = user.userId || 'SYSTEM';
    await schedule.save();

    const now = new Date();
    const affectedAppointments = await DoctorConflictService.findAffectedAppointments(
      schedule.doctorId,
      schedule.effectiveFrom > now ? schedule.effectiveFrom : now,
      schedule.effectiveTo || new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000),
      schedule.startTime,
      schedule.endTime
    );

    await AuditService.logEvent({
      userId: user.userId || 'SYSTEM',
      role: user.role || 'ADMIN_MANAGER',
      action: 'DOCTOR_SCHEDULE_CANCELLED',
      module: 'DOCTOR_MANAGEMENT',
      entityType: 'DoctorSchedule',
      entityId: schedule.scheduleId,
      details: `Cancelled schedule for ${schedule.doctorId}. ${affectedAppointments.length} future appointments may require review.`
    });

    return {
      schedule,
      affectedAppointmentsCount: affectedAppointments.length,
      affectedAppointments
    };
  }

  /**
   * Get all schedules for a doctor
   */
  static async getDoctorSchedules(doctorId, status = null) {
    const filter = { doctorId };
    if (status) {
      filter.status = status;
    } else {
      filter.status = { $ne: 'CANCELLED' };
    }
    return await DoctorSchedule.find(filter).sort({ dayOfWeek: 1, startTime: 1 }).lean();
  }

  /**
   * Check if doctor is available at a given date and time window
   */
  static async checkDoctorAvailability(doctorId, dateStr, startTime, endTime) {
    const doctor = await Doctor.findOne({ doctorId });
    if (!doctor || doctor.status !== 'ACTIVE') {
      return { available: false, reason: 'Doctor is inactive or not found.' };
    }

    const targetDate = new Date(dateStr);
    const dayOfWeek = targetDate.getDay();
    const dayOfWeekName = this.getDayOfWeekName(targetDate);

    const activeSchedules = await DoctorSchedule.find({
      doctorId,
      dayOfWeek,
      status: 'ACTIVE',
      $and: [
        { $or: [{ effectiveFrom: { $lte: targetDate } }, { effectiveFrom: null }] },
        { $or: [{ effectiveTo: { $gte: targetDate } }, { effectiveTo: null }] }
      ]
    }).lean();

    const legacySchedule = await DoctorSchedule.findOne({ doctorId, weeklyAvailability: { $exists: true, $ne: [] } }).lean();

    const reqStartMins = this.timeToMinutes(startTime);
    const reqEndMins = this.timeToMinutes(endTime);

    let insideShift = false;
    let maxCapacity = doctor.maxCapacityPerSlot || 1;

    if (activeSchedules.length > 0) {
      insideShift = activeSchedules.some((sch) => {
        const sStart = this.timeToMinutes(sch.startTime);
        const sEnd = this.timeToMinutes(sch.endTime);
        return reqStartMins >= sStart && reqEndMins <= sEnd;
      });
      maxCapacity = activeSchedules[0].maxCapacityPerSlot || maxCapacity;
    } else if (legacySchedule && legacySchedule.isActive) {
      const dayAvailability = (legacySchedule.weeklyAvailability || []).find((d) => d.dayOfWeek === dayOfWeekName);
      if (dayAvailability && dayAvailability.isAvailable) {
        insideShift = (dayAvailability.shifts || []).some((shift) => {
          const sStart = this.timeToMinutes(shift.startTime);
          const sEnd = this.timeToMinutes(shift.endTime);
          return reqStartMins >= sStart && reqEndMins <= sEnd;
        });
        maxCapacity = dayAvailability.maxCapacityPerSlot || legacySchedule.defaultMaxCapacityPerSlot || maxCapacity;
      }
    }

    if (!insideShift) {
      return { available: false, reason: `Doctor is not scheduled to work at ${startTime}-${endTime} on ${dayOfWeekName}.` };
    }

    const bookedCount = await Appointment.countDocuments({
      doctorId,
      appointmentDateStr: dateStr,
      startTime,
      status: { $nin: ['CANCELLED', 'RESCHEDULED', 'NO_SHOW'] }
    });

    if (bookedCount >= maxCapacity) {
      return {
        available: false,
        reason: 'Selected slot capacity has already been fully booked.',
        bookedCount,
        maxCapacity
      };
    }

    return {
      available: true,
      remainingCapacity: maxCapacity - bookedCount,
      maxCapacity,
      bookedCount
    };
  }

  /**
   * Generate All Available Slots for a Doctor on a Given Date
   */
  static async generateAvailableSlots(doctorId, dateStr) {
    const doctor = await Doctor.findOne({ doctorId }).lean();
    if (!doctor || doctor.status !== 'ACTIVE') {
      return {
        date: dateStr,
        doctorId,
        doctorName: doctor ? doctor.displayName || doctor.fullName : 'Unknown Doctor',
        isAvailable: false,
        message: 'Doctor is inactive or unavailable.',
        slots: []
      };
    }

    const targetDate = new Date(dateStr);
    const dayOfWeek = targetDate.getDay();
    const dayOfWeekName = this.getDayOfWeekName(targetDate);

    const activeSchedules = await DoctorSchedule.find({
      doctorId,
      dayOfWeek,
      status: 'ACTIVE',
      $and: [
        { $or: [{ effectiveFrom: { $lte: targetDate } }, { effectiveFrom: null }] },
        { $or: [{ effectiveTo: { $gte: targetDate } }, { effectiveTo: null }] }
      ]
    }).lean();

    const legacySchedule = await DoctorSchedule.findOne({ doctorId, weeklyAvailability: { $exists: true, $ne: [] } }).lean();

    const bookedAppointments = await Appointment.find({
      doctorId,
      appointmentDateStr: dateStr,
      status: { $nin: ['CANCELLED', 'RESCHEDULED', 'NO_SHOW'] }
    }).select('startTime endTime status').lean();

    const bookingMap = {};
    for (const apt of bookedAppointments) {
      bookingMap[apt.startTime] = (bookingMap[apt.startTime] || 0) + 1;
    }

    const slots = [];
    const slotDuration = doctor.slotDurationMinutes || (doctor.consultationSettings && doctor.consultationSettings.consultationDurationMinutes) || 30;

    if (activeSchedules.length > 0) {
      for (const sch of activeSchedules) {
        let currentMins = this.timeToMinutes(sch.startTime);
        const shiftEndMins = this.timeToMinutes(sch.endTime);
        const capacity = sch.maxCapacityPerSlot || 1;
        const duration = sch.slotDurationMinutes || slotDuration;

        while (currentMins + duration <= shiftEndMins) {
          const startTime = this.minutesToTime(currentMins);
          const endTime = this.minutesToTime(currentMins + duration);
          const bookedCount = bookingMap[startTime] || 0;
          const available = bookedCount < capacity;

          slots.push({
            startTime,
            endTime,
            durationMinutes: duration,
            capacity,
            bookedCount,
            remainingCapacity: Math.max(0, capacity - bookedCount),
            available
          });

          currentMins += duration;
        }
      }
    } else if (legacySchedule && legacySchedule.isActive) {
      const dayAvailability = (legacySchedule.weeklyAvailability || []).find((d) => d.dayOfWeek === dayOfWeekName);
      if (dayAvailability && dayAvailability.isAvailable) {
        const capacity = dayAvailability.maxCapacityPerSlot || legacySchedule.defaultMaxCapacityPerSlot || 1;
        for (const shift of dayAvailability.shifts || []) {
          let currentMins = this.timeToMinutes(shift.startTime);
          const shiftEndMins = this.timeToMinutes(shift.endTime);

          while (currentMins + slotDuration <= shiftEndMins) {
            const startTime = this.minutesToTime(currentMins);
            const endTime = this.minutesToTime(currentMins + slotDuration);
            const bookedCount = bookingMap[startTime] || 0;
            const available = bookedCount < capacity;

            slots.push({
              startTime,
              endTime,
              durationMinutes: slotDuration,
              capacity,
              bookedCount,
              remainingCapacity: Math.max(0, capacity - bookedCount),
              available
            });

            currentMins += slotDuration;
          }
        }
      }
    }

    return {
      date: dateStr,
      doctorId,
      doctorName: doctor.displayName || doctor.fullName,
      specialty: doctor.specialty,
      departmentId: doctor.departmentId,
      departmentName: doctor.departmentName,
      consultationFee: doctor.consultationFee,
      roomNumber: doctor.roomNumber,
      isAvailable: slots.length > 0,
      slots
    };
  }

  /**
   * Find affected booked appointments
   */
  static async detectDoctorScheduleExceptions(doctorId, startDateStr, endDateStr, reason = 'Doctor Unavailability') {
    return await DoctorConflictService.findAffectedAppointments(doctorId, startDateStr, endDateStr);
  }
}

module.exports = DoctorScheduleService;
