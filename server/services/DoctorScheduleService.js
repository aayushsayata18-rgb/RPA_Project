const Doctor = require('../models/Doctor');
const Department = require('../models/Department');
const DoctorSchedule = require('../models/DoctorSchedule');
const Appointment = require('../models/Appointment');

class DoctorScheduleService {
  /**
   * Helper: Parse "HH:MM" to minutes since midnight
   */
  static timeToMinutes(timeStr) {
    if (!timeStr) return 0;
    const [h, m] = timeStr.split(':').map(Number);
    return h * 60 + m;
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
    const departments = await Department.find({ isActive: true }).lean();
    return departments;
  }

  /**
   * Get doctors with filters
   */
  static async getDoctors(filters = {}) {
    const query = { status: { $ne: 'INACTIVE' } };
    if (filters.departmentId) query.departmentId = filters.departmentId;
    if (filters.specialty) query.specialty = new RegExp(filters.specialty, 'i');
    if (filters.status) query.status = filters.status;
    if (filters.search) {
      query.$or = [
        { fullName: new RegExp(filters.search, 'i') },
        { specialty: new RegExp(filters.search, 'i') },
        { doctorId: new RegExp(filters.search, 'i') }
      ];
    }
    return await Doctor.find(query).sort({ fullName: 1 }).lean();
  }

  /**
   * Get doctor by doctorId
   */
  static async getDoctorById(doctorId) {
    const doctor = await Doctor.findOne({ doctorId }).lean();
    if (!doctor) {
      throw new Error(`Doctor with ID ${doctorId} not found.`);
    }
    const schedule = await DoctorSchedule.findOne({ doctorId }).lean();
    return { ...doctor, schedule };
  }

  /**
   * Check if doctor is available at a given date and time window
   */
  static async checkDoctorAvailability(doctorId, dateStr, startTime, endTime) {
    const doctor = await Doctor.findOne({ doctorId });
    if (!doctor || doctor.status !== 'ACTIVE') {
      return { available: false, reason: 'Doctor is inactive or not found.' };
    }

    const schedule = await DoctorSchedule.findOne({ doctorId });
    if (!schedule || !schedule.isActive) {
      return { available: false, reason: 'Doctor has no active schedule configured.' };
    }

    const targetDate = new Date(dateStr);
    const dayOfWeek = this.getDayOfWeekName(targetDate);

    // 1. Check Approved Leaves
    if (schedule.leaves && schedule.leaves.length > 0) {
      for (const leave of schedule.leaves) {
        if (leave.status === 'APPROVED') {
          const lStart = new Date(leave.startDate);
          const lEnd = new Date(leave.endDate);
          // Zero time for full date comparison
          lStart.setHours(0, 0, 0, 0);
          lEnd.setHours(23, 59, 59, 999);
          if (targetDate >= lStart && targetDate <= lEnd) {
            return { available: false, reason: `Doctor is on approved leave (${leave.reason || 'Leave'}).` };
          }
        }
      }
    }

    // 2. Check Blocked Slots
    const reqStartMins = this.timeToMinutes(startTime);
    const reqEndMins = this.timeToMinutes(endTime);

    if (schedule.blockedSlots && schedule.blockedSlots.length > 0) {
      for (const blocked of schedule.blockedSlots) {
        if (blocked.date === dateStr) {
          const bStartMins = this.timeToMinutes(blocked.startTime);
          const bEndMins = this.timeToMinutes(blocked.endTime);
          if (reqStartMins < bEndMins && reqEndMins > bStartMins) {
            return { available: false, reason: `Slot is blocked by clinic: ${blocked.reason}` };
          }
        }
      }
    }

    // 3. Check Weekly Availability & Shifts
    const dayAvailability = (schedule.weeklyAvailability || []).find((d) => d.dayOfWeek === dayOfWeek);
    if (!dayAvailability || !dayAvailability.isAvailable) {
      return { available: false, reason: `Doctor is not scheduled to work on ${dayOfWeek}.` };
    }

    // Check if slot falls inside at least one shift
    const insideShift = (dayAvailability.shifts || []).some((shift) => {
      const sStart = this.timeToMinutes(shift.startTime);
      const sEnd = this.timeToMinutes(shift.endTime);
      return reqStartMins >= sStart && reqEndMins <= sEnd;
    });

    if (!insideShift) {
      return { available: false, reason: `Requested time ${startTime}-${endTime} is outside doctor working shifts.` };
    }

    // Check if slot overlaps with a break
    const insideBreak = (dayAvailability.breaks || []).some((brk) => {
      const bStart = this.timeToMinutes(brk.startTime);
      const bEnd = this.timeToMinutes(brk.endTime);
      return reqStartMins < bEnd && reqEndMins > bStart;
    });

    if (insideBreak) {
      return { available: false, reason: 'Requested time overlaps with doctor break.' };
    }

    // 4. Check Slot Capacity vs Existing Booked Appointments
    const maxCapacity = dayAvailability.maxCapacityPerSlot || schedule.defaultMaxCapacityPerSlot || doctor.maxCapacityPerSlot || 1;

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
  static async generateAvailableSlots(doctorId, dateStr, appointmentType = 'NEW_CONSULTATION') {
    const doctor = await Doctor.findOne({ doctorId }).lean();
    if (!doctor || doctor.status !== 'ACTIVE') {
      return {
        date: dateStr,
        doctorId,
        doctorName: doctor ? doctor.fullName : 'Unknown Doctor',
        isAvailable: false,
        message: 'Doctor is inactive or unavailable.',
        slots: []
      };
    }

    const schedule = await DoctorSchedule.findOne({ doctorId }).lean();
    if (!schedule || !schedule.isActive) {
      return {
        date: dateStr,
        doctorId,
        doctorName: doctor.fullName,
        isAvailable: false,
        message: 'No active schedule found for doctor.',
        slots: []
      };
    }

    const targetDate = new Date(dateStr);
    const dayOfWeek = this.getDayOfWeekName(targetDate);

    // Check Leave
    if (schedule.leaves && schedule.leaves.length > 0) {
      for (const leave of schedule.leaves) {
        if (leave.status === 'APPROVED') {
          const lStart = new Date(leave.startDate);
          const lEnd = new Date(leave.endDate);
          lStart.setHours(0, 0, 0, 0);
          lEnd.setHours(23, 59, 59, 999);
          if (targetDate >= lStart && targetDate <= lEnd) {
            return {
              date: dateStr,
              doctorId,
              doctorName: doctor.fullName,
              isAvailable: false,
              message: `Doctor is on approved leave on this date (${leave.reason || 'Leave'}).`,
              slots: []
            };
          }
        }
      }
    }

    const dayAvailability = (schedule.weeklyAvailability || []).find((d) => d.dayOfWeek === dayOfWeek);
    if (!dayAvailability || !dayAvailability.isAvailable) {
      return {
        date: dateStr,
        doctorId,
        doctorName: doctor.fullName,
        isAvailable: false,
        message: `Doctor does not have scheduled hours on ${dayOfWeek}.`,
        slots: []
      };
    }

    const slotDuration = schedule.slotDurationMinutes || doctor.slotDurationMinutes || 30;
    const maxCapacity = dayAvailability.maxCapacityPerSlot || schedule.defaultMaxCapacityPerSlot || doctor.maxCapacityPerSlot || 1;

    // Fetch existing active appointments on that date for this doctor
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

    // Loop through shifts
    for (const shift of dayAvailability.shifts || []) {
      let currentMins = this.timeToMinutes(shift.startTime);
      const shiftEndMins = this.timeToMinutes(shift.endTime);

      while (currentMins + slotDuration <= shiftEndMins) {
        const slotStartMins = currentMins;
        const slotEndMins = currentMins + slotDuration;
        const startTime = this.minutesToTime(slotStartMins);
        const endTime = this.minutesToTime(slotEndMins);

        // Check if inside break
        const isBreak = (dayAvailability.breaks || []).some((brk) => {
          const bStart = this.timeToMinutes(brk.startTime);
          const bEnd = this.timeToMinutes(brk.endTime);
          return slotStartMins < bEnd && slotEndMins > bStart;
        });

        // Check if inside blocked slot
        const isBlocked = (schedule.blockedSlots || []).some((blk) => {
          if (blk.date !== dateStr) return false;
          const blkStart = this.timeToMinutes(blk.startTime);
          const blkEnd = this.timeToMinutes(blk.endTime);
          return slotStartMins < blkEnd && slotEndMins > blkStart;
        });

        if (!isBreak && !isBlocked) {
          const bookedCount = bookingMap[startTime] || 0;
          const available = bookedCount < maxCapacity;

          slots.push({
            startTime,
            endTime,
            durationMinutes: slotDuration,
            capacity: maxCapacity,
            bookedCount,
            remainingCapacity: Math.max(0, maxCapacity - bookedCount),
            available
          });
        }

        currentMins += slotDuration;
      }
    }

    return {
      date: dateStr,
      doctorId,
      doctorName: doctor.fullName,
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
   * Find affected booked appointments when a doctor takes leave or becomes unavailable
   */
  static async detectDoctorScheduleExceptions(doctorId, startDateStr, endDateStr, reason = 'Doctor Unavailability') {
    const startDate = new Date(startDateStr);
    const endDate = new Date(endDateStr);
    startDate.setHours(0, 0, 0, 0);
    endDate.setHours(23, 59, 59, 999);

    const affectedAppointments = await Appointment.find({
      doctorId,
      appointmentDate: { $gte: startDate, $lte: endDate },
      status: { $in: ['REQUESTED', 'PENDING_REVIEW', 'SCHEDULED', 'CONFIRMED'] }
    }).lean();

    return affectedAppointments;
  }
}

module.exports = DoctorScheduleService;
