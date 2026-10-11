const InsuranceClaim = require('../models/InsuranceClaim');
const InsuranceClaimStatusHistory = require('../models/InsuranceClaimStatusHistory');
const InsuranceClaimQuery = require('../models/InsuranceClaimQuery');
const AuditService = require('./AuditService');
const IdGeneratorService = require('./IdGeneratorService');
const providerRegistry = require('../integrations/insurance/claims/providerRegistry');
const InsuranceClaimNotificationService = require('./insuranceClaimNotificationService');

/**
 * InsuranceClaimStatusService
 * Conforms to 10_INSURANCE_CLAIMS.md Section 32, 33, 34, 40, 41, 42, 60 & 67
 */
class InsuranceClaimStatusService {
  /**
   * Check/Poll status of a claim
   */
  static async checkClaimStatus(claimId, options = {}, user = {}) {
    const claim = await InsuranceClaim.findOne({ claimId });
    if (!claim) {
      const err = new Error(`Claim ${claimId} not found`);
      err.statusCode = 404;
      throw err;
    }

    const username = user.userId || user.username || 'SYSTEM';

    // Terminal state protection (Section 33)
    if (['PAID', 'CANCELLED'].includes(claim.status) && !options.force) {
      return {
        success: true,
        isTerminal: true,
        message: `Claim is in terminal status ${claim.status}. No polling required.`,
        claim
      };
    }

    // Manual status override if authorized staff explicitly provides status (Section 32)
    if (options.manualStatus) {
      return this.updateClaimStatus(
        claimId,
        options.manualStatus,
        {
          reason: options.reason || 'Manual status update recorded by staff',
          approvedAmount: options.approvedAmount,
          rejectedAmount: options.rejectedAmount,
          patientResponsibilityAmount: options.patientResponsibilityAmount,
          rejectionReason: options.rejectionReason,
          queryReason: options.queryReason,
          source: 'MANUAL'
        },
        user
      );
    }

    // Resolve Provider Adapter
    const provider = providerRegistry.getProvider(
      claim.providerCode || claim.insurerName,
      claim.submissionSource === 'INSURER_PORTAL_RPA' ? 'PORTAL' : 'API'
    );

    // Call insurer status check
    const statusResult = await provider.getClaimStatus(
      claim.insurerReferenceNumber || claim.claimId,
      {
        ...options,
        correlationId: claim.correlationId
      }
    );

    claim.lastStatusCheckedAt = new Date();
    claim.rawInsurerResponse = statusResult.rawResponse || {};

    const prevStatus = claim.status;
    const newStatus = statusResult.status || prevStatus;

    let hasChanged = prevStatus !== newStatus;

    if (hasChanged || statusResult.approvedAmount !== null || statusResult.rejectionReason) {
      claim.status = newStatus;

      if (statusResult.approvedAmount !== null && statusResult.approvedAmount !== undefined) {
        claim.approvedAmount = statusResult.approvedAmount;
      }
      if (statusResult.rejectedAmount) {
        claim.rejectedAmount = statusResult.rejectedAmount;
      }
      if (statusResult.patientResponsibilityAmount) {
        claim.patientResponsibilityAmount = statusResult.patientResponsibilityAmount;
      }
      if (statusResult.decisionDate) {
        claim.insurerDecisionDate = statusResult.decisionDate;
      }
      if (statusResult.rejectionReason) {
        claim.rejectionReason = statusResult.rejectionReason;
      }
      if (statusResult.queryReason) {
        claim.queryReason = statusResult.queryReason;
      }

      claim.updatedBy = username;
      await claim.save();

      // If status changed, record status history & audit
      if (hasChanged) {
        await InsuranceClaimStatusHistory.create({
          claimId: claim.claimId,
          previousStatus: prevStatus,
          newStatus,
          changedBy: username,
          source: claim.submissionSource === 'INSURER_PORTAL_RPA' ? 'INSURER_PORTAL_RPA' : 'API',
          reason: statusResult.rejectionReason || statusResult.queryReason || `Status check polled from ${claim.insurerName}`,
          insurerReference: claim.insurerReferenceNumber,
          timestamp: new Date(),
          metadata: statusResult
        });

        await AuditService.logEvent({
          userId: username,
          action: 'CLAIM_STATUS_CHANGED',
          module: 'INSURANCE_CLAIMS',
          entityType: 'InsuranceClaim',
          entityId: claim.claimId,
          oldValue: { status: prevStatus },
          newValue: {
            status: newStatus,
            approvedAmount: claim.approvedAmount,
            rejectedAmount: claim.rejectedAmount
          }
        });

        // Trigger notifications per status event (Section 53)
        if (newStatus === 'APPROVED') {
          await InsuranceClaimNotificationService.notifyClaimEvent('CLAIM_APPROVED', claim);
        } else if (newStatus === 'PARTIALLY_APPROVED') {
          await InsuranceClaimNotificationService.notifyClaimEvent('CLAIM_PARTIALLY_APPROVED', claim);
        } else if (newStatus === 'REJECTED') {
          await InsuranceClaimNotificationService.notifyClaimEvent('CLAIM_REJECTED', claim);
        } else if (newStatus === 'QUERY') {
          await InsuranceClaimNotificationService.notifyClaimEvent('CLAIM_QUERY_RECEIVED', claim);
        } else if (newStatus === 'MORE_INFORMATION_REQUIRED') {
          await InsuranceClaimNotificationService.notifyClaimEvent('CLAIM_MORE_INFORMATION_REQUIRED', claim);
        } else if (newStatus === 'UNDER_REVIEW') {
          await InsuranceClaimNotificationService.notifyClaimEvent('CLAIM_UNDER_REVIEW', claim);
        }
      }
    } else {
      await claim.save();
    }

    return {
      success: true,
      hasChanged,
      status: claim.status,
      approvedAmount: claim.approvedAmount,
      rejectedAmount: claim.rejectedAmount,
      claim
    };
  }

  /**
   * Internal / Manual status transition helper
   */
  static async updateClaimStatus(claimId, newStatus, details = {}, user = {}) {
    const claim = await InsuranceClaim.findOne({ claimId });
    if (!claim) {
      const err = new Error(`Claim ${claimId} not found`);
      err.statusCode = 404;
      throw err;
    }

    const prevStatus = claim.status;
    const username = user.userId || user.username || 'STAFF';

    claim.status = newStatus;
    if (details.approvedAmount !== undefined) claim.approvedAmount = details.approvedAmount;
    if (details.rejectedAmount !== undefined) claim.rejectedAmount = details.rejectedAmount;
    if (details.patientResponsibilityAmount !== undefined) claim.patientResponsibilityAmount = details.patientResponsibilityAmount;
    if (details.rejectionReason) claim.rejectionReason = details.rejectionReason;
    if (details.queryReason) claim.queryReason = details.queryReason;
    if (['APPROVED', 'PARTIALLY_APPROVED', 'REJECTED'].includes(newStatus)) {
      claim.insurerDecisionDate = new Date();
    }

    claim.lastStatusCheckedAt = new Date();
    claim.updatedBy = username;
    await claim.save();

    await InsuranceClaimStatusHistory.create({
      claimId,
      previousStatus: prevStatus,
      newStatus,
      changedBy: username,
      source: details.source || 'MANUAL',
      reason: details.reason || 'Status updated by authorized staff',
      insurerReference: claim.insurerReferenceNumber,
      timestamp: new Date()
    });

    await AuditService.logEvent({
      userId: username,
      action: 'CLAIM_STATUS_CHANGED',
      module: 'INSURANCE_CLAIMS',
      entityType: 'InsuranceClaim',
      entityId: claimId,
      oldValue: { status: prevStatus },
      newValue: { status: newStatus, details }
    });

    return claim;
  }

  /**
   * Get complete status history for a claim (Section 10 & 63)
   */
  static async getStatusHistory(claimId) {
    return InsuranceClaimStatusHistory.find({ claimId }).sort({ timestamp: -1 }).lean();
  }

  /**
   * Periodic batch status polling for non-terminal claims (Section 33)
   */
  static async pollEligibleClaims() {
    const eligibleClaims = await InsuranceClaim.find({
      status: { $in: ['SUBMITTED', 'UNDER_REVIEW', 'QUERY', 'MORE_INFORMATION_REQUIRED'] }
    }).limit(50);

    const results = [];
    for (const claim of eligibleClaims) {
      try {
        const res = await this.checkClaimStatus(claim.claimId, {}, { username: 'STATUS_SCHEDULER' });
        results.push({ claimId: claim.claimId, success: true, status: res.status });
      } catch (err) {
        results.push({ claimId: claim.claimId, success: false, error: err.message });
      }
    }

    return results;
  }
}

module.exports = InsuranceClaimStatusService;
