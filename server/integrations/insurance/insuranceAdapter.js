/**
 * Base Insurance Provider Adapter
 * Conforms to 09_INSURANCE_VERIFICATION.md Section 19 & Section 20
 */
class InsuranceProviderAdapter {
  constructor(providerCode, providerName, supportedIntegrationType = 'OFFICIAL_API') {
    this.providerCode = providerCode;
    this.providerName = providerName;
    this.supportedIntegrationType = supportedIntegrationType;
  }

  /**
   * Verify whether a member/policy is currently eligible
   * @param {Object} policyData
   * @returns {Promise<Object>}
   */
  async verifyEligibility(policyData) {
    throw new Error(`verifyEligibility not implemented for ${this.providerCode}`);
  }

  /**
   * Retrieve coverage details (limit, used, remaining, deductible, copay)
   * @param {Object} policyData
   * @returns {Promise<Object>}
   */
  async getCoverage(policyData) {
    throw new Error(`getCoverage not implemented for ${this.providerCode}`);
  }

  /**
   * Determine prior authorization requirements
   * @param {Object} policyData
   * @returns {Promise<Object>}
   */
  async getAuthorizationRequirements(policyData) {
    throw new Error(`getAuthorizationRequirements not implemented for ${this.providerCode}`);
  }

  /**
   * Complete verification pipeline returning a normalized hospital schema
   * @param {Object} policyData
   * @returns {Promise<Object>}
   */
  async verify(policyData) {
    throw new Error(`verify not implemented for ${this.providerCode}`);
  }

  /**
   * Standard response normalizer
   */
  normalizeResponse(raw) {
    return {
      success: !!raw.success,
      status: raw.status || 'VERIFIED',
      policyStatus: raw.policyStatus || 'ACTIVE',
      eligibilityStatus: raw.eligibilityStatus || 'ELIGIBLE',
      networkStatus: raw.networkStatus || 'UNKNOWN',
      effectiveDate: raw.effectiveDate ? new Date(raw.effectiveDate) : null,
      expiryDate: raw.expiryDate ? new Date(raw.expiryDate) : null,
      coverageType: raw.coverageType || 'COMPREHENSIVE',
      deductibleAmount: raw.deductibleAmount !== undefined ? raw.deductibleAmount : null,
      deductibleUsed: raw.deductibleUsed !== undefined ? raw.deductibleUsed : null,
      deductibleRemaining: raw.deductibleRemaining !== undefined ? raw.deductibleRemaining : null,
      copayAmount: raw.copayAmount !== undefined ? raw.copayAmount : null,
      coverageLimit: raw.coverageLimit !== undefined ? raw.coverageLimit : null,
      coverageUsed: raw.coverageUsed !== undefined ? raw.coverageUsed : null,
      coverageRemaining: raw.coverageRemaining !== undefined ? raw.coverageRemaining : null,
      authorizationRequired: raw.authorizationRequired || 'UNKNOWN',
      externalReference: raw.externalReference || `EXT-${Date.now()}`,
      evidenceSummary: raw.evidenceSummary || {},
      errorCode: raw.errorCode || null,
      errorMessage: raw.errorMessage || null,
      raw
    };
  }
}

module.exports = InsuranceProviderAdapter;
