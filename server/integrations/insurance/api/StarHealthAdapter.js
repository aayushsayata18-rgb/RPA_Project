const InsuranceProviderAdapter = require('../insuranceAdapter');

/**
 * StarHealthAdapter - Official API integration adapter
 * Conforms to 09_INSURANCE_VERIFICATION.md Section 19, 20 & 67
 */
class StarHealthAdapter extends InsuranceProviderAdapter {
  constructor() {
    super('STAR_HEALTH', 'Star Health Insurance', 'OFFICIAL_API');
  }

  async verifyEligibility(policyData) {
    const { policyNumber } = policyData;
    if (policyNumber.includes('INELIGIBLE')) {
      return { eligible: false, status: 'NOT_ELIGIBLE', reason: 'Member terminated from corporate plan' };
    }
    if (policyNumber.includes('NOTFOUND')) {
      return { eligible: false, status: 'NOT_FOUND', reason: 'Policy record not found in national registry' };
    }
    if (policyNumber.includes('EXPIRED')) {
      return { eligible: false, status: 'EXPIRED', reason: 'Policy expired on previous cycle' };
    }
    return { eligible: true, status: 'ELIGIBLE' };
  }

  async getCoverage(policyData) {
    const { policyNumber } = policyData;
    if (policyNumber.includes('PARTIAL') || policyNumber.includes('UNKNOWN_COV')) {
      return {
        available: false,
        coverageLimit: null,
        coverageRemaining: null,
        deductibleAmount: null,
        copayAmount: null
      };
    }
    return {
      available: true,
      coverageType: 'COMPREHENSIVE_GOLD',
      coverageLimit: 500000,
      coverageUsed: 75000,
      coverageRemaining: 425000,
      deductibleAmount: 5000,
      deductibleUsed: 2000,
      deductibleRemaining: 3000,
      copayAmount: 500
    };
  }

  async getAuthorizationRequirements(policyData) {
    const { policyNumber } = policyData;
    if (policyNumber.includes('NO_AUTH')) {
      return { authorizationRequired: 'NOT_REQUIRED' };
    }
    if (policyNumber.includes('PARTIAL')) {
      return { authorizationRequired: 'UNKNOWN' };
    }
    return { authorizationRequired: 'REQUIRED', note: 'Pre-auth required for IPD admissions' };
  }

  async verify(policyData) {
    const { policyNumber, memberId, patientName } = policyData;

    // Simulate Technical Failure
    if (policyNumber.includes('FAIL') || policyNumber.includes('TIMEOUT')) {
      const error = new Error('Star Health Gateway 504 Gateway Timeout: API unresponsive');
      error.code = 'GATEWAY_TIMEOUT';
      error.isTechnical = true;
      throw error;
    }

    // Simulate Ambiguous match (Section 29)
    if (policyNumber.includes('AMBIGUOUS')) {
      return this.normalizeResponse({
        success: false,
        status: 'AMBIGUOUS',
        policyStatus: 'UNKNOWN',
        eligibilityStatus: 'UNKNOWN',
        networkStatus: 'UNKNOWN',
        errorCode: 'AMBIGUOUS_MATCH',
        errorMessage: 'Multiple member records matched submitted policy and member ID',
        evidenceSummary: {
          matches: [
            { name: patientName || 'Rahul Shah', dob: '2001-05-14', memberId: memberId || 'MEM-78291' },
            { name: `${patientName || 'Rahul'} S Shah`, dob: '2001-05-14', memberId: `${memberId || 'MEM-782'}-ALT` }
          ]
        },
        externalReference: `STAR-AMB-${Date.now()}`
      });
    }

    // Simulate Not Found (Section 30)
    if (policyNumber.includes('NOTFOUND')) {
      return this.normalizeResponse({
        success: false,
        status: 'NOT_FOUND',
        policyStatus: 'UNKNOWN',
        eligibilityStatus: 'NOT_ELIGIBLE',
        networkStatus: 'UNKNOWN',
        errorCode: 'POLICY_NOT_FOUND',
        errorMessage: 'Policy number or member ID was not located in insurer registry',
        externalReference: `STAR-NF-${Date.now()}`
      });
    }

    // Simulate Expired (Section 31)
    if (policyNumber.includes('EXPIRED')) {
      return this.normalizeResponse({
        success: true,
        status: 'EXPIRED',
        policyStatus: 'EXPIRED',
        eligibilityStatus: 'NOT_ELIGIBLE',
        networkStatus: 'OUT_OF_NETWORK',
        effectiveDate: '2025-01-01',
        expiryDate: '2025-12-31',
        externalReference: `STAR-EXP-${Date.now()}`
      });
    }

    // Simulate Not Eligible
    if (policyNumber.includes('INELIGIBLE')) {
      return this.normalizeResponse({
        success: true,
        status: 'NOT_ELIGIBLE',
        policyStatus: 'SUSPENDED',
        eligibilityStatus: 'NOT_ELIGIBLE',
        networkStatus: 'OUT_OF_NETWORK',
        externalReference: `STAR-INEL-${Date.now()}`
      });
    }

    // Simulate Partially Verified (Section 7)
    if (policyNumber.includes('PARTIAL')) {
      return this.normalizeResponse({
        success: true,
        status: 'PARTIALLY_VERIFIED',
        policyStatus: 'ACTIVE',
        eligibilityStatus: 'ELIGIBLE',
        networkStatus: 'IN_NETWORK',
        effectiveDate: '2026-01-01',
        expiryDate: '2026-12-31',
        coverageType: 'STANDARD_HEALTH',
        deductibleAmount: null,
        copayAmount: null,
        coverageLimit: null,
        authorizationRequired: 'UNKNOWN',
        externalReference: `STAR-PART-${Date.now()}`
      });
    }

    // Normal Successful Verification (Section 27)
    const cov = await this.getCoverage(policyData);
    const auth = await this.getAuthorizationRequirements(policyData);

    return this.normalizeResponse({
      success: true,
      status: 'VERIFIED',
      policyStatus: 'ACTIVE',
      eligibilityStatus: 'ELIGIBLE',
      networkStatus: 'IN_NETWORK',
      effectiveDate: '2026-01-01',
      expiryDate: '2026-12-31',
      coverageType: cov.coverageType,
      deductibleAmount: cov.deductibleAmount,
      deductibleUsed: cov.deductibleUsed,
      deductibleRemaining: cov.deductibleRemaining,
      copayAmount: cov.copayAmount,
      coverageLimit: cov.coverageLimit,
      coverageUsed: cov.coverageUsed,
      coverageRemaining: cov.coverageRemaining,
      authorizationRequired: auth.authorizationRequired,
      externalReference: `STAR-VER-${Date.now().toString().slice(-6)}`,
      evidenceSummary: {
        verificationToken: `STAR-TKN-${Date.now()}`,
        networkTier: 'TIER-1-HOSPITAL'
      }
    });
  }
}

module.exports = StarHealthAdapter;
