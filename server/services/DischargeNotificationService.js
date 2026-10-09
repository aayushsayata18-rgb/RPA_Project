const NotificationService = require('./NotificationService');
const ExceptionService = require('./ExceptionService');

class DischargeNotificationService {
  /**
   * Send notification for discharge events
   */
  static async notifyDischargeEvent({
    event, // DISCHARGE_REQUESTED, DISCHARGE_READY, DISCHARGE_COMPLETED, PAYMENT_SUCCESS, PAYMENT_FAILED
    patientId,
    patientName,
    dischargeId,
    admissionId,
    details = {},
    actorUser,
    correlationId
  }) {
    try {
      let title = 'Hospital Discharge Update';
      let message = 'Your hospital discharge update is available in the patient portal.';

      switch (event) {
        case 'DISCHARGE_REQUESTED':
          title = 'Discharge Initiated';
          message = `Dear ${patientName || 'Patient'}, your discharge process has been requested and is currently being prepared.`;
          break;
        case 'DISCHARGE_READY':
          title = 'Discharge Bill & Clearance Ready';
          message = `Dear ${patientName || 'Patient'}, your discharge bill (Payable: ₹${details.payableAmount || 0}) is ready for settlement.`;
          break;
        case 'DISCHARGE_COMPLETED':
          title = 'Discharge Process Completed';
          message = `Dear ${patientName || 'Patient'}, your discharge process is complete. Final documents and receipts are available in your portal. Wishing you a swift recovery!`;
          break;
        case 'PAYMENT_SUCCESS':
          title = 'Payment Received';
          message = `Payment of ₹${details.amount || 0} for Discharge #${dischargeId} was received successfully.`;
          break;
        case 'PAYMENT_FAILED':
          title = 'Payment Failed';
          message = `Payment attempt for Discharge #${dischargeId} failed. Please retry online or at the hospital billing desk.`;
          break;
        default:
          message = `Discharge update for #${dischargeId}`;
      }

      await NotificationService.sendNotification({
        recipientId: patientId,
        channel: 'SMS',
        event,
        title,
        message,
        entityType: 'Discharge',
        entityId: dischargeId,
        correlationId
      });

      return { success: true };
    } catch (error) {
      console.error('[DischargeNotificationService Error]:', error.message);
      // Non-blocking failure record
      try {
        await ExceptionService.createException({
          code: 'NOTIFICATION_FAILED',
          module: 'DISCHARGE_NOTIFICATION',
          severity: 'LOW',
          message: `Discharge notification (${event}) failed for patient ${patientId}: ${error.message}`,
          referenceType: 'Discharge',
          referenceId: dischargeId,
          correlationId,
          reportedBy: actorUser?.userId || 'SYSTEM'
        });
      } catch (e) {
        // ignore exception creation failure
      }
      return { success: false, error: error.message };
    }
  }
}

module.exports = DischargeNotificationService;
