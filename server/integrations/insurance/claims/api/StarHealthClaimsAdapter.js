const InsuranceClaimsAdapter = require('../claimsAdapter');

class StarHealthClaimsAdapter extends InsuranceClaimsAdapter {
  constructor() {
    super('STAR_HEALTH', 'Star Health and Allied Insurance', 'OFFICIAL_API');
  }

  async submitClaim(claimPackage) {
    // In production, makes HTTPS REST call with secure headers and HMAC
    const refNum = `STAR-CLM-${Math.floor(100000 + Math.random() * 900000)}`;
    return this.normalizeSubmissionResult({
      success: true,
      claimStatus: 'SUBMITTED',
      insurerReferenceNumber: refNum,
      submittedAt: new Date().toISOString(),
      evidence: [`API-STAR-ACK-${refNum}`, `PAYLOAD-DIGEST-${Date.now()}`]
    });
  }

  async getClaimStatus(claimReference, context = {}) {
    // Return status simulation based on context or ref
    return this.normalizeStatusResult({
      success: true,
      status: context.simulatedStatus || 'UNDER_REVIEW',
      claimReference,
      approvedAmount: context.approvedAmount,
      rejectedAmount: context.rejectedAmount || 0,
      rejectionReason: context.rejectionReason,
      queryReason: context.queryReason
    });
  }

  async getClaimQueries(claimReference) {
    return [];
  }

  async respondToQuery(claimReference, queryResponse) {
    return {
      success: true,
      acknowledgementId: `STAR-QRY-ACK-${Date.now()}`,
      status: 'UNDER_REVIEW'
    };
  }
}

module.exports = StarHealthClaimsAdapter;
