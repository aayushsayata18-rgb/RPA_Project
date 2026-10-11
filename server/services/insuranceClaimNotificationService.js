const Notification = require('../models/Notification');
const { v4: uuidv4 } = require('uuid');

/**
 * InsuranceClaimNotificationService
 * Conforms to 10_INSURANCE_CLAIMS.md Section 53
 */
class InsuranceClaimNotificationService {
  /**
   * Dispatch claim lifecycle notification
   * @param {string} event e.g. CLAIM_CREATED, CLAIM_SUBMITTED, CLAIM_APPROVED, CLAIM_REJECTED
   * @param {Object} claim
   * @param {Object} extra
   */
  static async notifyClaimEvent(event, claim, extra = {}) {
    try {
      const recipientId = extra.recipientId || claim.patientId || 'INSURANCE_DESK';
      const correlationId = claim.correlationId || `CORR-NOTIF-${Date.now()}`;

      let title = `Insurance Claim Update: ${event}`;
      let message = `Claim ${claim.claimId} has transitioned to ${claim.status}.`;

      switch (event) {
        case 'CLAIM_CREATED':
          title = `Claim Created: ${claim.claimId}`;
          message = `Insurance claim for ${claim.patientName || 'patient'} (${claim.claimId}) created in DRAFT status.`;
          break;
        case 'CLAIM_READY':
          title = `Claim Package Ready: ${claim.claimId}`;
          message = `Claim ${claim.claimId} passed validation and is ready for submission to ${claim.insurerName}.`;
          break;
        case 'CLAIM_SUBMITTED':
          title = `Claim Submitted: ${claim.claimId}`;
          message = `Claim ${claim.claimId} submitted to ${claim.insurerName}. Ref: ${claim.insurerReferenceNumber || 'Pending'}.`;
          break;
        case 'CLAIM_UNDER_REVIEW':
          title = `Claim Under Review: ${claim.claimId}`;
          message = `Insurer ${claim.insurerName} is actively reviewing claim ${claim.claimId}.`;
          break;
        case 'CLAIM_QUERY_RECEIVED':
          title = `Claim Query Raised: ${claim.claimId}`;
          message = `Action required: ${claim.insurerName} raised a query on claim ${claim.claimId}.`;
          break;
        case 'CLAIM_MORE_INFORMATION_REQUIRED':
          title = `Additional Documents Required: ${claim.claimId}`;
          message = `Insurer requested supplementary documents for claim ${claim.claimId}.`;
          break;
        case 'CLAIM_APPROVED':
          title = `Claim Approved: ${claim.claimId}`;
          message = `Claim ${claim.claimId} approved by ${claim.insurerName}. Approved Amount: ${claim.currency || 'INR'} ${claim.approvedAmount}.`;
          break;
        case 'CLAIM_PARTIALLY_APPROVED':
          title = `Claim Partially Approved: ${claim.claimId}`;
          message = `Claim ${claim.claimId} partially approved. Approved: ${claim.currency || 'INR'} ${claim.approvedAmount}, Rejected: ${claim.currency || 'INR'} ${claim.rejectedAmount}.`;
          break;
        case 'CLAIM_REJECTED':
          title = `Claim Rejected: ${claim.claimId}`;
          message = `Claim ${claim.claimId} was rejected by ${claim.insurerName}. Reason: ${claim.rejectionReason || 'See claim dossier'}.`;
          break;
        case 'CLAIM_PAYMENT_RECEIVED':
          title = `Claim Payment Settled: ${claim.claimId}`;
          message = `Settlement of ${claim.currency || 'INR'} ${claim.settlementAmount || claim.approvedAmount} recorded for claim ${claim.claimId}.`;
          break;
        case 'CLAIM_RECONCILIATION_EXCEPTION':
          title = `Billing Settlement Mismatch: ${claim.claimId}`;
          message = `Reconciliation discrepancy detected for claim ${claim.claimId}. Human review required.`;
          break;
        default:
          break;
      }

      const notif = new Notification({
        notificationId: `NOTIF-${uuidv4().substring(0, 8).toUpperCase()}`,
        recipientId,
        channel: 'IN_APP',
        event,
        title,
        message,
        status: 'SENT',
        entityType: 'InsuranceClaim',
        entityId: claim.claimId,
        correlationId,
        sentAt: new Date()
      });

      await notif.save();
      return notif;
    } catch (err) {
      console.warn('[InsuranceClaimNotificationService] Notification dispatch warning:', err.message);
      return null;
    }
  }
}

module.exports = InsuranceClaimNotificationService;
