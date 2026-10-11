const Doctor = require('../models/Doctor');
const DoctorSchedule = require('../models/DoctorSchedule');
const DoctorAvailability = require('../models/DoctorAvailability');
const Appointment = require('../models/Appointment');
const AuditService = require('./AuditService');
const DoctorConflictService = require('./doctorConflictService');

class DoctorAvailabilityService {
  /**
   * Helper: Format date to "YYYY-MM-DD"
   */
  static formatDateStr(d) {
    const date = new Date(d);
    return date.toISOString().split('T')[0];
  }

  /**
   * Get day of week number (0 = Sunday, 1 = Monday ... 6 = Saturday)
   */
  static getDayOfWeek(d) {
    return new Date(d).getDay();
  }

  /**
   * Record manual temporary unavailability or special availability
   */
  static async recordAvailability(data, user = {}) {
    const { doctorId, date, startTime, endTime, status = 'UNAVAILABLE', reason = '', source = 'MANUAL' } = data;

    const doctor = await Doctor.findOne({ doctorId });
    if (!doctor) throw new Error(`Doctor ${doctorId} not found.`);

    const dateObj = new Date(date);
    const dateStr = this.formatDateStr(dateObj);

    const availabilityRecord = new DoctorAvailability({
      doctorId,
      date: dateObj,
      dateStr,
      startTime: startTime || '00:00',
      endTime: endTime || '23:59',
      status,
      reason,
      source,
      createdBy: user.userId || 'SYSTEM'
    });

    await availabilityRecord.save();

    // If marked UNAVAILABLE or LEAVE, find affected appointments
    let affectedAppointments = [];
    if (status === 'UNAVAILABLE' || status === 'LEAVE') {
      affectedAppointments = await DoctorConflictService.findAffectedAppointments(
        doctorId,
        dateObj,
        dateObj,
        startTime,
        endTime
      );
    }

    await AuditService.logEvent({
      userId: user.userId || 'SYSTEM',
      role: user.role || 'ADMIN_MANAGER',
      action: 'DOCTOR_AVAILABILITY_CHANGED',
      module: 'DOCTOR_MANAGEMENT',
      entityType: 'DoctorAvailability',
      entityId: availabilityRecord.availabilityId,
      details: `Availability set to ${status} for doctor ${doctorId} on ${dateStr} (${startTime || '00:00'} - ${endTime || '23:59'}). ${affectedAppointments.length} appointments affected.`
    });

    return {
      availabilityRecord,
      affectedAppointmentsCount: affectedAppointments.length,
      affectedAppointments
    };
  }

  /**
   * Update existing availability record
   */
  static async updateAvailability(availabilityId, data, user = {}) {
    const record = await DoctorAvailability.findOne({ availabilityId });
    if (!record) throw new Error(`Availability record ${availabilityId} not found.`);

    if (data.status) record.status = data.status;
    if (data.reason !== undefined) record.reason = data.reason;
    if (data.startTime) record.startTime = data.startTime;
    if (data.endTime) record.endTime = data.endTime;
    if (data.notes !== undefined) record.notes = data.notes;

    await record.save();

    await AuditService.logEvent({
      userId: user.userId || 'SYSTEM',
      role: user.role || 'ADMIN_MANAGER',
      action: 'DOCTOR_AVAILABILITY_CHANGED',
      module: 'DOCTOR_MANAGEMENT',
      entityType: 'DoctorAvailability',
      entityId: record.availabilityId,
      details: `Updated availability ${availabilityId} to status ${record.status}.`
    });

    return record;
  }

  /**
   * Get availability exceptions for a doctor
   */
  static async getDoctorAvailability(doctorId, query = {}) {
    const filter = { doctorId };
    if (query.startDate && query.endDate) {
      filter.date = {
        $gte: new Date(query.startDate),
        $lte: new Date(query.endDate)
      };
    } else if (query.date) {
      const s = new Date(query.date);
      s.setHours(0, 0, 0, 0);
      const e = new Date(query.date);
      e.setHours(23, 59, 59, 999);
      filter.date = { $gte: s, $lte: e };
    }

    return await DoctorAvailability.find(filter).sort({ date: 1, startTime: 1 }).lean();
  }

  /**
   * Consume approved leave from Leave Management (Section 30)
   */
  static async processApprovedLeave(leaveData, user = {}) {
    const { doctorId, startDate, endDate, reason = 'Approved Leave' } = leaveData;

    const doctor = await Doctor.findOne({ doctorId });
    if (!doctor) throw new Error(`Doctor ${doctorId} not found.`);

    const s = new Date(startDate);
    const e = new Date(endDate);

    const recordsCreated = [];
    const curr = new Date(s);
    while (curr <= e) {
      const avl = new DoctorAvailability({
        doctorId,
        date: new Date(curr),
        dateStr: this.formatDateStr(curr),
        startTime: '00:00',
        endTime: '23:59',
        status: 'LEAVE',
        reason,
        source: 'LEAVE_MANAGEMENT',
        createdBy: user.userId || 'SYSTEM'
      });
      await avl.save();
      recordsCreated.push(avl);

      curr.setDate(curr.getDate() + 1);
    }

    // Check affected booked appointments
    const affectedAppointments = await DoctorConflictService.findAffectedAppointments(
      doctorId,
      s,
      e
    );

    // Update doctor's active status if currently on leave
    const now = new Date();
    if (now >= s && now <= e && doctor.status === 'ACTIVE') {
      doctor.status = 'ON_LEAVE';
      doctor.availabilityStatus = 'ON_LEAVE';
      await doctor.save();
    }

    await AuditService.logEvent({
      userId: user.userId || 'SYSTEM',
      role: user.role || 'HR_MANAGER',
      action: 'DOCTOR_LEAVE_APPROVED',
      module: 'DOCTOR_MANAGEMENT',
      entityType: 'Doctor',
      entityId: doctorId,
      details: `Approved leave processed from ${startDate} to ${endDate}. ${affectedAppointments.length} appointments affected.`
    });

    return {
      recordsCreatedCount: recordsCreated.length,
      affectedAppointmentsCount: affectedAppointments.length,
      affectedAppointments
    };
  }

  /**
   * Get availability dashboard overview for all doctors on a specific date (Section 46)
   */
  static async getAvailabilityDashboard(query = {}) {
    const targetDate = query.date ? new Date(query.date) : new Date();
    const dateStr = this.formatDateStr(targetDate);
    const dayOfWeek = this.getDayOfWeek(targetDate);

    const docFilter = { status: { $ne: 'TERMINATED' } };
    if (query.departmentId) {
      docFilter.$or = [
        { departmentId: query.departmentId },
        { 'departments.departmentId': query.departmentId }
      ];
    }
    if (query.specialty) {
      docFilter.$or = [
        { specialty: new RegExp(query.specialty, 'i') },
        { 'specializations.name': new RegExp(query.specialty, 'i') }
      ];
    }
    if (query.status) {
      docFilter.status = query.status;
    }

    const doctors = await Doctor.find(docFilter).sort({ displayName: 1 }).lean();
    const results = [];

    for (const doc of doctors) {
      // 1. Check if doctor is explicitly unavailable/on leave for this date
      const sDay = new Date(targetDate);
      sDay.setHours(0, 0, 0, 0);
      const eDay = new Date(targetDate);
      eDay.setHours(23, 59, 59, 999);

      const exception = await DoctorAvailability.findOne({
        doctorId: doc.doctorId,
        date: { $gte: sDay, $lte: eDay }
      }).lean();

      // 2. Check doctor's schedules for this dayOfWeek
      const activeSchedules = await DoctorSchedule.find({
        doctorId: doc.doctorId,
        dayOfWeek,
        status: 'ACTIVE',
        $and: [
          { $or: [{ effectiveFrom: { $lte: targetDate } }, { effectiveFrom: null }] },
          { $or: [{ effectiveTo: { $gte: targetDate } }, { effectiveTo: null }] }
        ]
      }).lean();

      // 3. Count appointments on this date
      const aptCount = await Appointment.countDocuments({
        doctorId: doc.doctorId,
        appointmentDateStr: dateStr,
        status: { $nin: ['CANCELLED', 'RESCHEDULED', 'NO_SHOW'] }
      });

      let calculatedStatus = 'AVAILABLE';
      let statusReason = '';

      if (doc.status === 'INACTIVE' || doc.status === 'SUSPENDED') {
        calculatedStatus = doc.status;
        statusReason = `Doctor is administratively ${doc.status}`;
      } else if (exception) {
        calculatedStatus = exception.status;
        statusReason = exception.reason || exception.status;
      } else if (activeSchedules.length === 0) {
        calculatedStatus = 'NOT_SCHEDULED';
        statusReason = 'No active schedule for this day of week';
      }

      results.push({
        doctorId: doc.doctorId,
        doctorName: doc.displayName || doc.fullName,
        departmentId: doc.departmentId,
        departmentName: doc.departmentName,
        specialty: doc.specialty,
        status: calculatedStatus,
        reason: statusReason,
        schedules: activeSchedules,
        appointmentCount: aptCount,
        availableFrom: activeSchedules.length > 0 ? activeSchedules[0].startTime : null,
        availableTo: activeSchedules.length > 0 ? activeSchedules[activeSchedules.length - 1].endTime : null
      });
    }

    return results;
  }
}

module.exports = DoctorAvailabilityService;
