const AppointmentReminder = require('../models/AppointmentReminder');
const HospitalConfiguration = require('../models/HospitalConfiguration');
const NotificationService = require('../services/NotificationService');
const AuditService = require('../services/AuditService');
const { v4: uuidv4 } = require('uuid');

class AppointmentReminderService {
  /**
   * Schedule 24-hour and optional 2-hour reminders for an appointment
   */
  static async scheduleRemindersForAppointment(appointment) {
    try {
      // 1. Get hospital configuration
      const reminderConfig = await HospitalConfiguration.findOne({
        configKey: 'APPOINTMENT_REMINDER_HOURS_BEFORE'
      });
      const hoursBefore = reminderConfig ? Number(reminderConfig.value) || 24 : 24;

      // Calculate appointment start date/time
      const [hours, minutes] = appointment.startTime.split(':').map(Number);
      const appointmentDateTime = new Date(appointment.appointmentDate);
      appointmentDateTime.setHours(hours, minutes, 0, 0);

      // Primary Reminder (e.g. 24 hours before)
      const primaryScheduledFor = new Date(appointmentDateTime.getTime() - hoursBefore * 60 * 60 * 1000);
      const primaryIdempotencyKey = `APPOINTMENT_REMINDER:${appointment.appointmentId}:${hoursBefore}H`;

      const existingPrimary = await AppointmentReminder.findOne({ idempotencyKey: primaryIdempotencyKey });
      if (!existingPrimary) {
        const reminderId = `REM-${Date.now()}-${uuidv4().substring(0, 6).toUpperCase()}`;
        await AppointmentReminder.create({
          reminderId,
          appointmentId: appointment.appointmentId,
          patientId: appointment.patientId,
          recipientPhone: appointment.patientPhone || '9876543210',
          recipientEmail: appointment.patientEmail || '',
          reminderType: 'PRIMARY_24H',
          scheduledFor: primaryScheduledFor,
          status: 'SCHEDULED',
          idempotencyKey: primaryIdempotencyKey,
          channel: 'ALL',
          correlationId: appointment.correlationId
        });
      }

      // Secondary Reminder (2 hours before)
      const secondaryScheduledFor = new Date(appointmentDateTime.getTime() - 2 * 60 * 60 * 1000);
      const secondaryIdempotencyKey = `APPOINTMENT_REMINDER:${appointment.appointmentId}:2H`;

      const existingSecondary = await AppointmentReminder.findOne({ idempotencyKey: secondaryIdempotencyKey });
      if (!existingSecondary) {
        const reminderId2 = `REM-${Date.now()}-${uuidv4().substring(0, 6).toUpperCase()}`;
        await AppointmentReminder.create({
          reminderId: reminderId2,
          appointmentId: appointment.appointmentId,
          patientId: appointment.patientId,
          recipientPhone: appointment.patientPhone || '9876543210',
          recipientEmail: appointment.patientEmail || '',
          reminderType: 'SECONDARY_2H',
          scheduledFor: secondaryScheduledFor,
          status: 'SCHEDULED',
          idempotencyKey: secondaryIdempotencyKey,
          channel: 'ALL',
          correlationId: appointment.correlationId
        });
      }

      return true;
    } catch (error) {
      console.error('[AppointmentReminderService Error]: Failed to schedule reminders:', error.message);
      return false;
    }
  }

  /**
   * Process all reminders that are due
   */
  static async processDueReminders() {
    const now = new Date();
    const dueReminders = await AppointmentReminder.find({
      scheduledFor: { $lte: now },
      status: 'SCHEDULED'
    }).limit(100);

    const results = {
      processed: 0,
      delivered: 0,
      failed: 0
    };

    const Appointment = require('../models/Appointment');

    for (const reminder of dueReminders) {
      results.processed += 1;
      try {
        const appointment = await Appointment.findOne({ appointmentId: reminder.appointmentId });
        if (!appointment || ['CANCELLED', 'RESCHEDULED', 'NO_SHOW', 'COMPLETED'].includes(appointment.status)) {
          reminder.status = 'CANCELLED';
          await reminder.save();
          continue;
        }

        // Send SMS/Email
        await NotificationService.sendNotification({
          recipientId: reminder.patientId,
          recipientPhone: reminder.recipientPhone,
          recipientEmail: reminder.recipientEmail,
          channel: 'SMS',
          event: 'APPOINTMENT_REMINDER_SMS',
          templateCode: 'APPOINTMENT_REMINDER_SMS',
          variables: {
            patientName: appointment.patientName || 'Patient',
            doctorName: appointment.doctorName,
            appointmentDateTime: `${appointment.appointmentDateStr} at ${appointment.startTime}`,
            appointmentId: appointment.appointmentId,
            roomNumber: appointment.roomNumber || 'OPD-101'
          },
          entityType: 'Appointment',
          entityId: appointment.appointmentId,
          correlationId: reminder.correlationId
        });

        if (reminder.recipientEmail) {
          await NotificationService.sendNotification({
            recipientId: reminder.patientId,
            recipientPhone: reminder.recipientPhone,
            recipientEmail: reminder.recipientEmail,
            channel: 'EMAIL',
            event: 'APPOINTMENT_REMINDER_EMAIL',
            templateCode: 'APPOINTMENT_REMINDER_EMAIL',
            variables: {
              patientName: appointment.patientName || 'Patient',
              doctorName: appointment.doctorName,
              appointmentDateTime: `${appointment.appointmentDateStr} at ${appointment.startTime}`,
              appointmentId: appointment.appointmentId,
              roomNumber: appointment.roomNumber || 'OPD-101'
            },
            entityType: 'Appointment',
            entityId: appointment.appointmentId,
            correlationId: reminder.correlationId
          });
        }

        reminder.status = 'DELIVERED';
        reminder.sentAt = new Date();
        await reminder.save();
        results.delivered += 1;

        await AuditService.logEvent({
          action: 'REMINDER_SENT',
          module: 'APPOINTMENT_MANAGEMENT',
          entityType: 'Appointment',
          entityId: reminder.appointmentId,
          correlationId: reminder.correlationId,
          details: `Automated ${reminder.reminderType} reminder sent for appointment ${reminder.appointmentId}`
        });
      } catch (err) {
        reminder.status = 'FAILED';
        reminder.failureReason = err.message;
        reminder.retryCount += 1;
        await reminder.save();
        results.failed += 1;
      }
    }

    return results;
  }

  /**
   * Cancel pending reminders when an appointment is cancelled or rescheduled
   */
  static async cancelRemindersForAppointment(appointmentId) {
    return await AppointmentReminder.updateMany(
      { appointmentId, status: 'SCHEDULED' },
      { $set: { status: 'CANCELLED' } }
    );
  }
}

module.exports = AppointmentReminderService;
