const DoctorSchedule = require('../models/DoctorSchedule');
const Appointment = require('../models/Appointment');

class DoctorConflictService {
  /**
   * Helper: Convert "HH:MM" string to minutes from midnight
   */
  static timeToMinutes(timeStr) {
    if (!timeStr) return 0;
    const [h, m] = timeStr.split(':').map(Number);
    return (h || 0) * 60 + (m || 0);
  }

  /**
   * Check if two time ranges overlap
   */
  static isTimeOverlapping(startA, endA, startB, endB) {
    const minsAStart = this.timeToMinutes(startA);
    const minsAEnd = this.timeToMinutes(endA);
    const minsBStart = this.timeToMinutes(startB);
    const minsBEnd = this.timeToMinutes(endB);
    return minsAStart < minsBEnd && minsAEnd > minsBStart;
  }

  /**
   * Check if two date ranges overlap (considering open-ended bounds)
   */
  static isDateRangeOverlapping(fromA, toA, fromB, toB) {
    const startA = fromA ? new Date(fromA).getTime() : 0;
    const endA = toA ? new Date(toA).getTime() : Infinity;
    const startB = fromB ? new Date(fromB).getTime() : 0;
    const endB = toB ? new Date(toB).getTime() : Infinity;
    return startA <= endB && endA >= startB;
  }

  /**
   * Check schedule conflict for a candidate doctor schedule
   * @param {Object} candidate - { doctorId, dayOfWeek, startTime, endTime, effectiveFrom, effectiveTo, excludeScheduleId }
   */
  static async checkScheduleConflict(candidate) {
    const { doctorId, dayOfWeek, startTime, endTime, effectiveFrom, effectiveTo, excludeScheduleId } = candidate;

    // Validate basic logical parameters
    if (startTime && endTime) {
      if (this.timeToMinutes(startTime) >= this.timeToMinutes(endTime)) {
        return {
          hasConflict: true,
          conflictMessage: `Invalid schedule: startTime (${startTime}) must be earlier than endTime (${endTime}).`,
          conflictingSchedules: []
        };
      }
    }

    if (effectiveFrom && effectiveTo) {
      if (new Date(effectiveFrom) > new Date(effectiveTo)) {
        return {
          hasConflict: true,
          conflictMessage: `Invalid schedule: effectiveFrom (${effectiveFrom}) cannot be after effectiveTo (${effectiveTo}).`,
          conflictingSchedules: []
        };
      }
    }

    // Find all other active/pending schedules for this doctor on the same dayOfWeek
    const query = {
      doctorId,
      status: { $in: ['ACTIVE', 'PENDING_APPROVAL'] }
    };

    if (dayOfWeek !== undefined && dayOfWeek !== null) {
      query.dayOfWeek = dayOfWeek;
    }

    if (excludeScheduleId) {
      query._id = { $ne: excludeScheduleId };
    }

    const existingSchedules = await DoctorSchedule.find(query).lean();
    const conflictingSchedules = [];

    for (const sch of existingSchedules) {
      // 1. Check Date Range Overlap
      const dateOverlap = this.isDateRangeOverlapping(
        effectiveFrom,
        effectiveTo,
        sch.effectiveFrom,
        sch.effectiveTo
      );

      if (!dateOverlap) continue;

      // 2. Check Time Overlap
      if (sch.startTime && sch.endTime && startTime && endTime) {
        const timeOverlap = this.isTimeOverlapping(startTime, endTime, sch.startTime, sch.endTime);
        if (timeOverlap) {
          conflictingSchedules.push(sch);
        }
      }
    }

    if (conflictingSchedules.length > 0) {
      const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      const dayStr = dayNames[dayOfWeek] || `Day ${dayOfWeek}`;
      const conflictMsg = `Doctor ${doctorId} already has a schedule from ${conflictingSchedules[0].startTime} to ${conflictingSchedules[0].endTime} on ${dayStr}. Please review the overlapping schedule.`;

      return {
        hasConflict: true,
        conflictMessage: conflictMsg,
        conflictingSchedules
      };
    }

    return {
      hasConflict: false,
      conflictMessage: 'No schedule conflicts detected.',
      conflictingSchedules: []
    };
  }

  /**
   * Find booked appointments affected by schedule change, cancellation, or doctor unavailability
   */
  static async findAffectedAppointments(doctorId, startDate, endDate, startTime = null, endTime = null) {
    const sDate = new Date(startDate);
    sDate.setHours(0, 0, 0, 0);

    const eDate = new Date(endDate);
    eDate.setHours(23, 59, 59, 999);

    const query = {
      doctorId,
      appointmentDate: { $gte: sDate, $lte: eDate },
      status: { $in: ['REQUESTED', 'PENDING_REVIEW', 'SCHEDULED', 'CONFIRMED'] }
    };

    const appointments = await Appointment.find(query).lean();

    if (!startTime || !endTime) {
      return appointments;
    }

    // Filter by specific slot time overlap if provided
    return appointments.filter((apt) => {
      if (!apt.startTime || !apt.endTime) return true;
      return DoctorConflictService.isTimeOverlapping(apt.startTime, apt.endTime, startTime, endTime);
    });
  }
}

module.exports = DoctorConflictService;
