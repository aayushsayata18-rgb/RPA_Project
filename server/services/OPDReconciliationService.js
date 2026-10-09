const Appointment = require('../models/Appointment');
const OPDToken = require('../models/OPDToken');
const CheckIn = require('../models/CheckIn');
const OPDQueue = require('../models/OPDQueue');
const ExceptionCase = require('../models/ExceptionCase');
const AuditService = require('./AuditService');
const IdGeneratorService = require('./IdGeneratorService');

class OPDReconciliationService {
  /**
   * Run daily or on-demand OPD Queue reconciliation
   */
  static async reconcileOPDQueue({ dateStr = null, actorUser = {} } = {}) {
    const correlationId = IdGeneratorService.generateCorrelationId();
    const targetDateStr = dateStr || new Date().toISOString().slice(0, 10);

    const appointments = await Appointment.find({ appointmentDateStr: targetDateStr });
    const tokens = await OPDToken.find({ createdAt: { $gte: new Date(`${targetDateStr}T00:00:00.000Z`) } });
    const checkIns = await CheckIn.find({ checkInTime: { $gte: new Date(`${targetDateStr}T00:00:00.000Z`) } });

    const discrepancies = [];

    // Check 1: Checked-in appointments without tokens
    for (const appt of appointments) {
      if (appt.checkInStatus === 'CHECKED_IN' || appt.status === 'CHECKED_IN') {
        const matchingToken = tokens.find((t) => t.appointmentId === appt.appointmentId);
        if (!matchingToken) {
          discrepancies.push({
            type: 'CHECKED_IN_APPOINTMENT_WITHOUT_TOKEN',
            appointmentId: appt.appointmentId,
            patientId: appt.patientId,
            message: `Appointment ${appt.appointmentId} marked CHECKED_IN but has no matching OPDToken.`
          });

          await ExceptionCase.create({
            exceptionCode: 'QUEUE_RECONCILIATION_EXCEPTION',
            title: `Missing OPD Token for Checked-In Appointment ${appt.appointmentId}`,
            description: `Appointment ${appt.appointmentId} has checkInStatus=CHECKED_IN but missing corresponding OPDToken record.`,
            patientId: appt.patientId,
            entityType: 'Appointment',
            entityId: appt.appointmentId,
            severity: 'HIGH',
            status: 'OPEN',
            correlationId
          });
        }
      }
    }

    // Check 2: Tokens with missing CheckIn records
    for (const token of tokens) {
      const matchingCheckin = checkIns.find((c) => c.tokenId === token.tokenId || c.appointmentId === token.appointmentId);
      if (!matchingCheckin) {
        discrepancies.push({
          type: 'TOKEN_WITHOUT_CHECKIN_RECORD',
          tokenId: token.tokenId,
          appointmentId: token.appointmentId,
          patientId: token.patientId,
          message: `Token ${token.tokenNumber} exists without a CheckIn transaction audit record.`
        });
      }
    }

    // Audit Event
    await AuditService.logEvent({
      userId: actorUser.userId || actorUser.id || 'RPA_RECONCILER',
      role: actorUser.role || 'SYSTEM',
      action: 'QUEUE_RECONCILIATION_PERFORMED',
      module: 'OPD_QUEUE_MANAGEMENT',
      entityType: 'OPDQueue',
      entityId: `DATE-${targetDateStr}`,
      correlationId,
      details: `Reconciliation completed for ${targetDateStr}. Total appointments: ${appointments.length}, Tokens: ${tokens.length}, Discrepancies: ${discrepancies.length}`
    });

    return {
      success: true,
      targetDate: targetDateStr,
      totalAppointments: appointments.length,
      totalTokens: tokens.length,
      totalCheckIns: checkIns.length,
      discrepanciesCount: discrepancies.length,
      discrepancies,
      correlationId
    };
  }
}

module.exports = OPDReconciliationService;
