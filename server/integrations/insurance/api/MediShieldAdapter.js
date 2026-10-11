const InsuranceProviderAdapter = require('../insuranceAdapter');

/**
 * MediShieldAdapter - API adapter for MediShield Insurance
 */
class MediShieldAdapter extends InsuranceProviderAdapter {
  constructor() {
    super('MEDI_SHIELD', 'MediShield Health Care', 'OFFICIAL_API');
  }

  async verify(policyData) {
    const { policyNumber } = policyData;

    if (policyNumber.includes('FAIL')) {
      const error = new Error('MediShield Core Endpoint 500 Internal Error');
      error.code = 'INTERNAL_ERROR';
      error.isTechnical = true;
      throw error;
    }

    return this.normalizeResponse({
      success: true,
      status: 'VERIFIED',
      policyStatus: 'ACTIVE',
      eligibilityStatus: 'ELIGIBLE',
      networkStatus: 'IN_NETWORK',
      effectiveDate: '2026-01-01',
      expiryDate: '2026-12-31',
      coverageType: 'SHIELD_PLATINUM',
      deductibleAmount: 10000,
      deductibleUsed: 4000,
      deductibleRemaining: 6000,
      copayAmount: 1000,
      coverageLimit: 1000000,
      coverageUsed: 120000,
      coverageRemaining: 880000,
      authorizationRequired: 'REQUIRED',
      externalReference: `MS-VER-${Date.now().toString().slice(-6)}`,
      evidenceSummary: {
        verificationSource: 'MEDISHIELD_REST_V2'
      }
    });
  }
}

module.exports = MediShieldAdapter;
