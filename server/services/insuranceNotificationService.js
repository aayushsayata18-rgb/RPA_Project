const NotificationService = require('./NotificationService');

/**
 * InsuranceNotificationService
 * Conforms to 09_INSURANCE_VERIFICATION.md Section 51 & Section 73
 */
class InsuranceNotificationService {
  /**
   * Send notification on verification outcome
   */
  static async notifyVerificationOutcome({
    event,
    patientId,
    patientPhone,
    patientEmail,
    policyNumber,
    providerName,
    verificationId,
    status,
    notes = ''
  }) {
    let title = 'Insurance Verification Update';
    let message = 'Your insurance verification has been processed.';

    switch (event) {
      case 'INSURANCE_VERIFICATION_REQUESTED':
        title = 'Insurance Verification Requested';
        message = `Verification has been submitted for policy ${policyNumber} with ${providerName}. Status: QUEUED.`;
        break;
      case 'INSURANCE_VERIFICATION_COMPLETED':
        title = 'Insurance Verification Completed';
        message = `Insurance verification (Ref: ${verificationId}) for policy ${policyNumber} has been verified successfully.`;
        break;
      case 'INSURANCE_VERIFICATION_FAILED':
        title = 'Insurance Verification Attention Required';
        message = `Verification for policy ${policyNumber} could not be completed automatically. Staff will review.`;
        break;
      case 'INSURANCE_VERIFICATION_REVIEW_REQUIRED':
        title = 'Insurance Manual Review Required';
        message = `Policy verification ${verificationId} flagged for human review: ${notes || 'Ambiguous insurer match'}.`;
        break;
      case 'INSURANCE_POLICY_EXPIRED':
        title = 'Insurance Policy Expired';
        message = `Insurer reported policy ${policyNumber} is expired. Please update policy information.`;
        break;
      case 'INSURANCE_POLICY_NOT_FOUND':
        title = 'Insurance Policy Not Located';
        message = `Policy ${policyNumber} was not found in the insurer directory. Please verify policy details.`;
        break;
      case 'INSURANCE_POLICY_NOT_ELIGIBLE':
        title = 'Insurance Eligibility Notice';
        message = `Insurer reported non-eligible status for policy ${policyNumber}.`;
        break;
    }

    try {
      await NotificationService.sendNotification({
        recipientId: patientId,
        recipientPhone: patientPhone,
        recipientEmail: patientEmail,
        channel: 'IN_APP',
        event,
        title,
        message,
        entityType: 'InsuranceVerification',
        entityId: verificationId,
        variables: { policyNumber, providerName, verificationId, status }
      });
    } catch (err) {
      console.warn(`[InsuranceNotificationService] Failed to send notification:`, err.message);
    }
  }
}

module.exports = InsuranceNotificationService;
