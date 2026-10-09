const Appointment = require('../models/Appointment');
const OPDToken = require('../models/OPDToken');
const AuditService = require('./AuditService');
const NotificationService = require('./NotificationService');
const ConfigService = require('./ConfigService');
const IdGeneratorService = require('./IdGeneratorService');

class OPDNoShowService {
  /**
   * Process and mark eligible no-show appointments past grace period
   */
  static async processNoShows({ dateStr = null, gracePeriodMinutes = null, actorUser = {} } = {}) {
    const correlationId = IdGeneratorService.generateCorrelationId();
    const targetDateStr = dateStr || new Date().toISOString().slice(0, 10);
    const configuredGrace = gracePeriodMinutes || (await ConfigService.get('noShowGraceMinutes', 15));

    const now = new Date();

    const candidateAppointments = await Appointment.find({
      appointmentDateStr: targetDateStr,
      status: { $in: ['CONFIRMED', 'SCHEDULED', 'REQUESTED'] },
      checkInStatus: { $ne: 'CHECKED_IN' }
    });

    const processedNoShows = [];
    const skippedAppointments = [];

    for (const appt of candidateAppointments) {
      const hasToken = await OPDToken.findOne({ appointmentId: appt.appointmentId });
      if (hasToken) {
        skippedAppointments.push({
          appointmentId: appt.appointmentId,
          reason: 'Token already exists in OPD Queue'
        });
        continue;
      }

      const [h, m] = (appt.startTime || '09:00').split(':').map(Number);
      const scheduledTime = new Date(`${targetDateStr}T${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:00`);

      const minutesPast = Math.round((now.getTime() - scheduledTime.getTime()) / (1000 * 60));

      if (minutesPast > Number(configuredGrace)) {
        appt.status = 'NO_SHOW';
        appt.checkInStatus = 'NO_SHOW';
        await appt.save();

        await AuditService.logEvent({
          userId: actorUser.userId || actorUser.id || 'RPA_BOT',
          role: actorUser.role || 'RPA_SYSTEM',
          action: 'OPD_NO_SHOW_PROCESSED',
          module: 'OPD_QUEUE_MANAGEMENT',
          entityType: 'Appointment',
          entityId: appt.appointmentId,
          correlationId,
          details: `Appointment ${appt.appointmentId} marked NO_SHOW (${minutesPast} mins past scheduled time, grace: ${configuredGrace} mins).`
        });

        await NotificationService.sendNotification({
          recipientId: appt.patientId,
          recipientPhone: appt.patientPhone,
          recipientEmail: appt.patientEmail,
          channel: 'SMS',
          event: 'APPOINTMENT_NO_SHOW',
          title: 'Appointment Marked as Missed',
          message: `Your scheduled appointment at ${appt.startTime} with ${appt.doctorName} was marked as No-Show as check-in grace period elapsed.`,
          entityType: 'Appointment',
          entityId: appt.appointmentId,
          correlationId
        });

        processedNoShows.push({
          appointmentId: appt.appointmentId,
          patientId: appt.patientId,
          patientName: appt.patientName,
          doctorName: appt.doctorName,
          scheduledTime: appt.startTime,
          minutesPast
        });
      } else {
        skippedAppointments.push({
          appointmentId: appt.appointmentId,
          reason: `Within grace period (scheduled: ${appt.startTime}, minutes past: ${minutesPast}, grace: ${configuredGrace})`
        });
      }
    }

    return {
      success: true,
      targetDate: targetDateStr,
      gracePeriodMinutes: configuredGrace,
      totalEvaluated: candidateAppointments.length,
      processedCount: processedNoShows.length,
      skippedCount: skippedAppointments.length,
      processedNoShows,
      skippedAppointments,
      correlationId
    };
  }
}

module.exports = OPDNoShowService;
