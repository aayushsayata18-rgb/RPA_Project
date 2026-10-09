const Appointment = require('../models/Appointment');
const AppointmentHistory = require('../models/AppointmentHistory');
const Patient = require('../models/Patient');
const Doctor = require('../models/Doctor');
const Department = require('../models/Department');
const HospitalConfiguration = require('../models/HospitalConfiguration');
const DoctorScheduleService = require('./DoctorScheduleService');
const AppointmentReminderService = require('./AppointmentReminderService');
const IdGeneratorService = require('./IdGeneratorService');
const NotificationService = require('./NotificationService');
const AuditService = require('./AuditService');
const RPAJobService = require('./RPAJobService');
const { v4: uuidv4 } = require('uuid');

class AppointmentService {
  /**
   * Create an Appointment with concurrency & slot validation
   */
  static async createAppointment({
    patientId,
    doctorId,
    departmentId = null,
    specialty = null,
    appointmentDate,
    startTime,
    endTime = null,
    appointmentType = 'NEW_CONSULTATION',
    source = 'PATIENT_PORTAL',
    referringDoctorId = null,
    referringDoctorName = null,
    referralReason = null,
    referralReference = null,
    reason = '',
    notes = '',
    idempotencyKey = null,
    actorUserId = 'SYSTEM',
    actorRole = 'PATIENT'
  }) {
    const correlationId = IdGeneratorService.generateCorrelationId();

    // 1. Idempotency Check
    if (idempotencyKey) {
      const existing = await Appointment.findOne({ idempotencyKey });
      if (existing) {
        console.log(`[AppointmentService] Idempotency match for key ${idempotencyKey}: ${existing.appointmentId}`);
        return existing;
      }
    }

    // 2. Resolve & Validate Patient
    const patient = await Patient.findOne({ patientId });
    if (!patient) {
      throw new Error(`Patient with ID ${patientId} does not exist in Patient Master.`);
    }
    if (patient.status !== 'ACTIVE') {
      throw new Error(`Patient ${patientId} is not in ACTIVE status.`);
    }

    // 3. Resolve & Validate Doctor
    const doctor = await Doctor.findOne({ doctorId });
    if (!doctor) {
      throw new Error(`Doctor with ID ${doctorId} does not exist.`);
    }
    if (doctor.status !== 'ACTIVE') {
      throw new Error(`Doctor ${doctor.fullName} is currently ${doctor.status} and not accepting appointments.`);
    }

    const resolvedDepartmentId = departmentId || doctor.departmentId;
    const resolvedSpecialty = specialty || doctor.specialty;

    // 4. Format & Validate Date/Time
    const dateObj = new Date(appointmentDate);
    if (isNaN(dateObj.getTime())) {
      throw new Error('Invalid appointment date provided.');
    }
    const appointmentDateStr = dateObj.toISOString().slice(0, 10);

    // Compute end time if not explicitly provided
    const slotDuration = doctor.slotDurationMinutes || 30;
    let computedEndTime = endTime;
    if (!computedEndTime) {
      const startMins = DoctorScheduleService.timeToMinutes(startTime);
      computedEndTime = DoctorScheduleService.minutesToTime(startMins + slotDuration);
    }

    // 5. Concurrency-Safe Slot & Availability Check
    const availabilityCheck = await DoctorScheduleService.checkDoctorAvailability(
      doctorId,
      appointmentDateStr,
      startTime,
      computedEndTime
    );

    if (!availabilityCheck.available) {
      const error = new Error(availabilityCheck.reason || 'The selected appointment slot is no longer available.');
      error.code = 'APPOINTMENT_SLOT_UNAVAILABLE';
      error.statusCode = 409;
      throw error;
    }

    // 6. Check Duplicate Active Booking for same Patient with same Doctor & Time
    const duplicateBooking = await Appointment.findOne({
      patientId,
      appointmentDateStr,
      startTime,
      status: { $nin: ['CANCELLED', 'RESCHEDULED', 'NO_SHOW'] }
    });

    if (duplicateBooking) {
      const error = new Error(`Patient already has an active appointment (${duplicateBooking.appointmentId}) at this time.`);
      error.code = 'DUPLICATE_APPOINTMENT';
      error.statusCode = 409;
      throw error;
    }

    // 7. Generate Appointment ID (A202610001)
    const appointmentId = await IdGeneratorService.generateAppointmentId();
    const bookingReference = `REF-${appointmentId}-${uuidv4().substring(0, 4).toUpperCase()}`;

    // 8. Create Appointment Entity
    const appointment = new Appointment({
      appointmentId,
      patientId,
      patientRef: patient._id,
      patientName: patient.fullName,
      patientPhone: patient.mobile,
      patientEmail: patient.email,
      doctorId,
      doctorRef: doctor._id,
      doctorName: doctor.fullName,
      departmentId: resolvedDepartmentId,
      departmentName: doctor.departmentName,
      specialty: resolvedSpecialty,
      referringDoctorId,
      referringDoctorName,
      referralReason,
      referralReference,
      appointmentDate: dateObj,
      appointmentDateStr,
      startTime,
      endTime: computedEndTime,
      slotDurationMinutes: slotDuration,
      appointmentType,
      source,
      status: 'CONFIRMED',
      bookingReference,
      reason: reason || 'Routine Consultation',
      notes,
      checkInStatus: 'NOT_CHECKED_IN',
      reminderStatus: 'SCHEDULED',
      confirmationStatus: 'CONFIRMED',
      consultationFee: doctor.consultationFee || 500,
      roomNumber: doctor.roomNumber || 'OPD-101',
      correlationId,
      idempotencyKey,
      createdBy: actorUserId,
      updatedBy: actorUserId
    });

    await appointment.save();

    // 9. Create Immutable Appointment History Record
    const historyId = `HIST-${Date.now()}-${uuidv4().substring(0, 6).toUpperCase()}`;
    await AppointmentHistory.create({
      historyId,
      appointmentId,
      action: 'CREATED',
      newStatus: 'CONFIRMED',
      newDate: appointmentDateStr,
      newStartTime: startTime,
      newDoctorId: doctorId,
      reason: 'Appointment Created & Confirmed',
      actorUserId,
      actorRole,
      correlationId,
      details: `Booked via ${source} with Dr. ${doctor.fullName} (${resolvedSpecialty})`
    });

    // 10. Trigger Confirmation Notifications (SMS & Email)
    await NotificationService.sendNotification({
      recipientId: patientId,
      recipientPhone: patient.mobile,
      recipientEmail: patient.email,
      channel: 'SMS',
      event: 'APPOINTMENT_CONFIRMED',
      templateCode: 'APPOINTMENT_CONFIRMATION',
      variables: {
        patientName: patient.fullName,
        doctorName: doctor.fullName,
        appointmentDateTime: `${appointmentDateStr} ${startTime}`,
        appointmentId
      },
      entityType: 'Appointment',
      entityId: appointmentId,
      correlationId
    });

    if (patient.email) {
      await NotificationService.sendNotification({
        recipientId: patientId,
        recipientPhone: patient.mobile,
        recipientEmail: patient.email,
        channel: 'EMAIL',
        event: 'APPOINTMENT_CONFIRMED',
        templateCode: 'APPOINTMENT_CONFIRMATION',
        variables: {
          patientName: patient.fullName,
          doctorName: doctor.fullName,
          appointmentDateTime: `${appointmentDateStr} ${startTime}`,
          appointmentId
        },
        entityType: 'Appointment',
        entityId: appointmentId,
        correlationId
      });
    }

    // 11. Schedule Reminders (24h and 2h before)
    await AppointmentReminderService.scheduleRemindersForAppointment(appointment);

    // 12. Audit Event
    await AuditService.logEvent({
      userId: actorUserId,
      role: actorRole,
      action: 'APPOINTMENT_CREATED',
      module: 'APPOINTMENT_MANAGEMENT',
      entityType: 'Appointment',
      entityId: appointmentId,
      correlationId,
      newValue: {
        appointmentId,
        patientId,
        doctorId,
        appointmentDateStr,
        startTime,
        status: 'CONFIRMED'
      },
      details: `Appointment created for ${patient.fullName} with ${doctor.fullName}`
    });

    // 13. Optional RPA Legacy Synchronization Job
    if (source === 'RPA' || process.env.RPA_EXTERNAL_SYNC_ENABLED === 'true') {
      await RPAJobService.createJob({
        jobName: 'SYNC_APPOINTMENT_LEGACY_EHR',
        module: 'APPOINTMENT_MANAGEMENT',
        targetSystem: 'LEGACY_HOSPITAL_HIS',
        action: 'CREATE_APPOINTMENT_ENTRY',
        entityType: 'Appointment',
        entityId: appointmentId,
        payload: {
          appointmentId,
          patientId,
          doctorName: doctor.fullName,
          appointmentDateStr,
          startTime
        },
        idempotencyKey: `RPA_APT_SYNC:${appointmentId}`,
        createdBy: actorUserId
      });
    }

    return appointment;
  }

  /**
   * Get paginated appointments with rich filtering
   */
  static async getAppointments(filters = {}, pagination = { page: 1, limit: 25 }) {
    const query = {};

    if (filters.patientId) query.patientId = filters.patientId;
    if (filters.doctorId) query.doctorId = filters.doctorId;
    if (filters.departmentId) query.departmentId = filters.departmentId;
    if (filters.status) {
      if (Array.isArray(filters.status)) {
        query.status = { $in: filters.status };
      } else {
        query.status = filters.status;
      }
    }
    if (filters.source) query.source = filters.source;
    if (filters.checkInStatus) query.checkInStatus = filters.checkInStatus;

    // Date filtering
    if (filters.date) {
      query.appointmentDateStr = filters.date;
    } else if (filters.startDate || filters.endDate) {
      query.appointmentDate = {};
      if (filters.startDate) query.appointmentDate.$gte = new Date(filters.startDate);
      if (filters.endDate) query.appointmentDate.$lte = new Date(filters.endDate);
    }

    // Search by patient name, ID, or appointment ID
    if (filters.search) {
      const searchRegex = new RegExp(filters.search, 'i');
      query.$or = [
        { appointmentId: searchRegex },
        { patientId: searchRegex },
        { patientName: searchRegex },
        { doctorName: searchRegex },
        { bookingReference: searchRegex }
      ];
    }

    const page = Math.max(1, parseInt(pagination.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(pagination.limit, 10) || 25));
    const skip = (page - 1) * limit;

    const [appointments, total] = await Promise.all([
      Appointment.find(query).sort({ appointmentDate: -1, startTime: 1 }).skip(skip).limit(limit).lean(),
      Appointment.countDocuments(query)
    ]);

    return {
      appointments,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    };
  }

  /**
   * Get single appointment by ID
   */
  static async getAppointmentById(appointmentId) {
    const appointment = await Appointment.findOne({ appointmentId }).lean();
    if (!appointment) {
      const error = new Error(`Appointment ${appointmentId} not found.`);
      error.statusCode = 404;
      throw error;
    }

    const history = await AppointmentHistory.find({ appointmentId }).sort({ createdAt: -1 }).lean();
    return { ...appointment, history };
  }

  /**
   * Cancel an appointment
   */
  static async cancelAppointment(appointmentId, { reason, notes = '', actorUserId = 'SYSTEM', actorRole = 'PATIENT' }) {
    const appointment = await Appointment.findOne({ appointmentId });
    if (!appointment) {
      const error = new Error(`Appointment ${appointmentId} not found.`);
      error.statusCode = 404;
      throw error;
    }

    // Check allowed cancellation states
    if (['COMPLETED', 'CANCELLED', 'RESCHEDULED'].includes(appointment.status)) {
      const error = new Error(`Appointment in status ${appointment.status} cannot be cancelled.`);
      error.statusCode = 400;
      throw error;
    }

    const previousStatus = appointment.status;
    const correlationId = IdGeneratorService.generateCorrelationId();

    appointment.status = 'CANCELLED';
    appointment.cancellationReason = reason || 'PATIENT_REQUEST';
    appointment.cancellationNotes = notes;
    appointment.cancelledAt = new Date();
    appointment.cancelledBy = actorUserId;
    appointment.updatedBy = actorUserId;
    await appointment.save();

    // Release reminders
    await AppointmentReminderService.cancelRemindersForAppointment(appointmentId);

    // Record History
    const historyId = `HIST-${Date.now()}-${uuidv4().substring(0, 6).toUpperCase()}`;
    await AppointmentHistory.create({
      historyId,
      appointmentId,
      action: 'CANCELLED',
      previousStatus,
      newStatus: 'CANCELLED',
      reason: reason || 'Patient Cancellation Request',
      actorUserId,
      actorRole,
      correlationId,
      details: notes || 'Appointment cancelled.'
    });

    // Send Cancellation Notification
    await NotificationService.sendNotification({
      recipientId: appointment.patientId,
      recipientPhone: appointment.patientPhone,
      recipientEmail: appointment.patientEmail,
      channel: 'SMS',
      event: 'APPOINTMENT_CANCELLED_SMS',
      templateCode: 'APPOINTMENT_CANCELLED_SMS',
      title: 'Appointment Cancelled',
      message: `Dear ${appointment.patientName}, your appointment ${appointmentId} with Dr. ${appointment.doctorName} on ${appointment.appointmentDateStr} at ${appointment.startTime} has been cancelled.`,
      variables: {
        patientName: appointment.patientName,
        doctorName: appointment.doctorName,
        appointmentDate: appointment.appointmentDateStr,
        appointmentTime: appointment.startTime,
        appointmentId
      },
      entityType: 'Appointment',
      entityId: appointmentId,
      correlationId
    });

    // Audit Event
    await AuditService.logEvent({
      userId: actorUserId,
      role: actorRole,
      action: 'APPOINTMENT_CANCELLED',
      module: 'APPOINTMENT_MANAGEMENT',
      entityType: 'Appointment',
      entityId: appointmentId,
      correlationId,
      oldValue: { status: previousStatus },
      newValue: { status: 'CANCELLED', cancellationReason: reason },
      details: `Appointment ${appointmentId} cancelled by ${actorRole} (${actorUserId})`
    });

    return appointment;
  }

  /**
   * Reschedule an appointment (Preserves old history, creates new appointment)
   */
  static async rescheduleAppointment(
    appointmentId,
    { newDate, newStartTime, reason = 'Patient Reschedule Request', actorUserId = 'SYSTEM', actorRole = 'PATIENT' }
  ) {
    const original = await Appointment.findOne({ appointmentId });
    if (!original) {
      const error = new Error(`Original appointment ${appointmentId} not found.`);
      error.statusCode = 404;
      throw error;
    }

    if (['COMPLETED', 'CANCELLED', 'RESCHEDULED', 'NO_SHOW'].includes(original.status)) {
      const error = new Error(`Appointment in status ${original.status} cannot be rescheduled.`);
      error.statusCode = 400;
      throw error;
    }

    const correlationId = IdGeneratorService.generateCorrelationId();

    // 1. Create New Appointment via createAppointment
    const newAppointment = await this.createAppointment({
      patientId: original.patientId,
      doctorId: original.doctorId,
      departmentId: original.departmentId,
      specialty: original.specialty,
      appointmentDate: newDate,
      startTime: newStartTime,
      appointmentType: original.appointmentType,
      source: original.source,
      referringDoctorId: original.referringDoctorId,
      referringDoctorName: original.referringDoctorName,
      referralReason: original.referralReason,
      reason: original.reason,
      notes: `Rescheduled from ${original.appointmentId}`,
      actorUserId,
      actorRole
    });

    // Link new appointment to original
    newAppointment.rescheduledFromAppointmentId = original.appointmentId;
    await newAppointment.save();

    // 2. Mark Original Appointment as RESCHEDULED
    const previousStatus = original.status;
    original.status = 'RESCHEDULED';
    original.rescheduledToAppointmentId = newAppointment.appointmentId;
    original.rescheduledAt = new Date();
    original.updatedBy = actorUserId;
    await original.save();

    // Cancel reminders of original appointment
    await AppointmentReminderService.cancelRemindersForAppointment(original.appointmentId);

    // 3. Record History for Original
    const histId1 = `HIST-${Date.now()}-${uuidv4().substring(0, 6).toUpperCase()}`;
    await AppointmentHistory.create({
      historyId: histId1,
      appointmentId: original.appointmentId,
      action: 'RESCHEDULED',
      previousStatus,
      newStatus: 'RESCHEDULED',
      previousDate: original.appointmentDateStr,
      newDate: newAppointment.appointmentDateStr,
      previousStartTime: original.startTime,
      newStartTime: newAppointment.startTime,
      reason,
      actorUserId,
      actorRole,
      correlationId,
      details: `Rescheduled to new appointment ${newAppointment.appointmentId}`
    });

    // 4. Send Reschedule Notifications
    await NotificationService.sendNotification({
      recipientId: original.patientId,
      recipientPhone: original.patientPhone,
      recipientEmail: original.patientEmail,
      channel: 'SMS',
      event: 'APPOINTMENT_RESCHEDULED_SMS',
      title: 'Appointment Rescheduled',
      message: `Dear ${original.patientName}, your appointment has been rescheduled. Previous ID: ${original.appointmentId}, New ID: ${newAppointment.appointmentId} with Dr. ${newAppointment.doctorName} on ${newAppointment.appointmentDateStr} at ${newAppointment.startTime}.`,
      variables: {
        patientName: original.patientName,
        doctorName: newAppointment.doctorName,
        appointmentDateTime: `${newAppointment.appointmentDateStr} ${newAppointment.startTime}`,
        appointmentId: newAppointment.appointmentId,
        previousAppointmentId: original.appointmentId
      },
      entityType: 'Appointment',
      entityId: newAppointment.appointmentId,
      correlationId
    });

    // Audit Event
    await AuditService.logEvent({
      userId: actorUserId,
      role: actorRole,
      action: 'APPOINTMENT_RESCHEDULED',
      module: 'APPOINTMENT_MANAGEMENT',
      entityType: 'Appointment',
      entityId: original.appointmentId,
      correlationId,
      oldValue: { appointmentId: original.appointmentId, date: original.appointmentDateStr, time: original.startTime },
      newValue: { appointmentId: newAppointment.appointmentId, date: newAppointment.appointmentDateStr, time: newAppointment.startTime },
      details: `Rescheduled from ${original.appointmentId} to ${newAppointment.appointmentId}`
    });

    return {
      originalAppointment: original,
      newAppointment
    };
  }

  /**
   * Process No-Show Appointments after configurable Grace Period
   */
  static async processNoShowAppointments({ dateStr = null, gracePeriodMinutes = null, actorUserId = 'SYSTEM' } = {}) {
    const targetDateStr = dateStr || new Date().toISOString().slice(0, 10);

    // Fetch configured grace period
    let grace = gracePeriodMinutes;
    if (grace == null) {
      const config = await HospitalConfiguration.findOne({ configKey: 'OPD_CHECKIN_GRACE_PERIOD_MINUTES' });
      grace = config ? Number(config.value) || 30 : 30;
    }

    const now = new Date();
    const currentMins = now.getHours() * 60 + now.getMinutes();

    // Find confirmed appointments for targetDate where patient is NOT checked in
    const candidates = await Appointment.find({
      appointmentDateStr: targetDateStr,
      status: 'CONFIRMED',
      checkInStatus: 'NOT_CHECKED_IN'
    });

    const processed = [];

    for (const apt of candidates) {
      const aptStartMins = DoctorScheduleService.timeToMinutes(apt.startTime);
      const isPastGrace = (currentMins >= aptStartMins + grace) || (targetDateStr < now.toISOString().slice(0, 10));

      if (isPastGrace) {
        const correlationId = IdGeneratorService.generateCorrelationId();
        apt.status = 'NO_SHOW';
        apt.checkInStatus = 'NO_SHOW';
        apt.updatedBy = actorUserId;
        await apt.save();

        const historyId = `HIST-${Date.now()}-${uuidv4().substring(0, 6).toUpperCase()}`;
        await AppointmentHistory.create({
          historyId,
          appointmentId: apt.appointmentId,
          action: 'NO_SHOW',
          previousStatus: 'CONFIRMED',
          newStatus: 'NO_SHOW',
          reason: `No check-in detected after ${grace} minute grace period.`,
          actorUserId,
          actorRole: 'RPA_SYSTEM',
          correlationId,
          details: 'Automated No-Show policy applied.'
        });

        // Send No-Show notice
        await NotificationService.sendNotification({
          recipientId: apt.patientId,
          recipientPhone: apt.patientPhone,
          recipientEmail: apt.patientEmail,
          channel: 'SMS',
          event: 'APPOINTMENT_NO_SHOW_SMS',
          title: 'Missed Appointment Notification',
          message: `Hello ${apt.patientName}, we noticed you missed your scheduled appointment (${apt.appointmentId}) with Dr. ${apt.doctorName} on ${apt.appointmentDateStr}. You may rebook via our patient portal.`,
          variables: {
            patientName: apt.patientName,
            doctorName: apt.doctorName,
            appointmentId: apt.appointmentId
          },
          entityType: 'Appointment',
          entityId: apt.appointmentId,
          correlationId
        });

        await AuditService.logEvent({
          userId: actorUserId,
          action: 'APPOINTMENT_NO_SHOW',
          module: 'APPOINTMENT_MANAGEMENT',
          entityType: 'Appointment',
          entityId: apt.appointmentId,
          correlationId,
          details: `Marked as NO_SHOW after ${grace}m grace period.`
        });

        processed.push(apt);
      }
    }

    return {
      date: targetDateStr,
      gracePeriodMinutes: grace,
      processedCount: processed.length,
      appointments: processed
    };
  }

  /**
   * Update check-in status (Invoked by OPD check-in workflow or staff)
   */
  static async updateCheckInStatus(appointmentId, checkInStatus = 'CHECKED_IN', actorUserId = 'SYSTEM') {
    const appointment = await Appointment.findOne({ appointmentId });
    if (!appointment) {
      throw new Error(`Appointment ${appointmentId} not found.`);
    }

    const previousCheckInStatus = appointment.checkInStatus;
    appointment.checkInStatus = checkInStatus;
    if (checkInStatus === 'CHECKED_IN') {
      appointment.checkedInAt = new Date();
      if (appointment.status === 'CONFIRMED') {
        appointment.status = 'CHECKED_IN';
      }
    }
    appointment.updatedBy = actorUserId;
    await appointment.save();

    const correlationId = IdGeneratorService.generateCorrelationId();
    const historyId = `HIST-${Date.now()}-${uuidv4().substring(0, 6).toUpperCase()}`;
    await AppointmentHistory.create({
      historyId,
      appointmentId,
      action: 'CHECKED_IN',
      previousStatus: appointment.status,
      newStatus: appointment.status,
      reason: `Patient arrival check-in (${checkInStatus})`,
      actorUserId,
      actorRole: 'OPERATIONS',
      correlationId,
      details: `Check-in updated from ${previousCheckInStatus} to ${checkInStatus}`
    });

    await AuditService.logEvent({
      userId: actorUserId,
      action: 'APPOINTMENT_CHECKED_IN',
      module: 'APPOINTMENT_MANAGEMENT',
      entityType: 'Appointment',
      entityId: appointmentId,
      correlationId,
      details: `Patient checked in for appointment ${appointmentId}`
    });

    return appointment;
  }

  /**
   * Get appointment dashboard statistics & KPIs
   */
  static async getAppointmentStats() {
    const todayStr = new Date().toISOString().slice(0, 10);

    const [
      totalToday,
      confirmedToday,
      checkedInToday,
      cancelledToday,
      rescheduledToday,
      noShowToday,
      completedToday,
      totalAllTime
    ] = await Promise.all([
      Appointment.countDocuments({ appointmentDateStr: todayStr }),
      Appointment.countDocuments({ appointmentDateStr: todayStr, status: 'CONFIRMED' }),
      Appointment.countDocuments({ appointmentDateStr: todayStr, checkInStatus: 'CHECKED_IN' }),
      Appointment.countDocuments({ appointmentDateStr: todayStr, status: 'CANCELLED' }),
      Appointment.countDocuments({ appointmentDateStr: todayStr, status: 'RESCHEDULED' }),
      Appointment.countDocuments({ appointmentDateStr: todayStr, status: 'NO_SHOW' }),
      Appointment.countDocuments({ appointmentDateStr: todayStr, status: 'COMPLETED' }),
      Appointment.countDocuments()
    ]);

    // Top departments aggregation
    const departmentDistribution = await Appointment.aggregate([
      { $group: { _id: '$specialty', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 5 }
    ]);

    return {
      todayDate: todayStr,
      today: {
        total: totalToday,
        confirmed: confirmedToday,
        checkedIn: checkedInToday,
        cancelled: cancelledToday,
        rescheduled: rescheduledToday,
        noShow: noShowToday,
        completed: completedToday
      },
      totalAllTime,
      topSpecialties: departmentDistribution.map((d) => ({ specialty: d._id || 'General', count: d.count }))
    };
  }
}

module.exports = AppointmentService;
