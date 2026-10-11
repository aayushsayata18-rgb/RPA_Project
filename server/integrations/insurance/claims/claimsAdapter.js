/**
 * Base Insurance Claims Adapter Interface
 * Conforms to 10_INSURANCE_CLAIMS.md Section 27, 31, 34 & 65
 */
class InsuranceClaimsAdapter {
  constructor(providerCode, providerName, supportedIntegrationType = 'OFFICIAL_API') {
    this.providerCode = providerCode;
    this.providerName = providerName;
    this.supportedIntegrationType = supportedIntegrationType;
  }

  /**
   * Submit claim package to insurer
   * @param {Object} claimPackage
   * @returns {Promise<Object>}
   */
  async submitClaim(claimPackage) {
    throw new Error(`submitClaim not implemented for ${this.providerCode}`);
  }

  /**
   * Check status of a submitted claim
   * @param {string} claimReference
   * @param {Object} context
   * @returns {Promise<Object>}
   */
  async getClaimStatus(claimReference, context = {}) {
    throw new Error(`getClaimStatus not implemented for ${this.providerCode}`);
  }

  /**
   * Retrieve active queries or info requests
   * @param {string} claimReference
   * @returns {Promise<Array>}
   */
  async getClaimQueries(claimReference) {
    throw new Error(`getClaimQueries not implemented for ${this.providerCode}`);
  }

  /**
   * Submit response to a query
   * @param {string} claimReference
   * @param {Object} queryResponse
   * @returns {Promise<Object>}
   */
  async respondToQuery(claimReference, queryResponse) {
    throw new Error(`respondToQuery not implemented for ${this.providerCode}`);
  }

  /**
   * Normalize claim submission result (Section 31)
   */
  normalizeSubmissionResult(raw) {
    return {
      success: !!raw.success,
      claimStatus: raw.claimStatus || 'SUBMITTED',
      insurerReferenceNumber: raw.insurerReferenceNumber || `INS-REF-${Date.now()}`,
      submittedAt: raw.submittedAt ? new Date(raw.submittedAt) : new Date(),
      evidence: raw.evidence || ['API-ELECTRONIC-ACKNOWLEDGEMENT'],
      rawResponse: raw,
      errorCode: raw.errorCode || null,
      errorMessage: raw.errorMessage || null
    };
  }

  /**
   * Normalize status polling result (Section 34)
   * Hospital statuses: DRAFT, READY, SUBMITTED, UNDER_REVIEW, QUERY, MORE_INFORMATION_REQUIRED, APPROVED, PARTIALLY_APPROVED, REJECTED, PAID, CANCELLED
   */
  normalizeStatusResult(raw) {
    let normalizedStatus = 'UNDER_REVIEW';
    const statusUpper = (raw.status || raw.claimStatus || '').toUpperCase().trim();

    if (['APPROVED', 'CLAIM_APPROVED', 'PASSED'].includes(statusUpper)) {
      normalizedStatus = 'APPROVED';
    } else if (['PARTIALLY_APPROVED', 'PARTIAL_PAYMENT'].includes(statusUpper)) {
      normalizedStatus = 'PARTIALLY_APPROVED';
    } else if (['REJECTED', 'DENIED', 'DECLINED'].includes(statusUpper)) {
      normalizedStatus = 'REJECTED';
    } else if (['QUERY', 'QUERIED', 'ACTION_REQUIRED'].includes(statusUpper)) {
      normalizedStatus = 'QUERY';
    } else if (['ADDITIONAL_DOCUMENTS', 'MORE_INFORMATION_REQUIRED', 'MORE_DOCS_NEEDED'].includes(statusUpper)) {
      normalizedStatus = 'MORE_INFORMATION_REQUIRED';
    } else if (['PAID', 'SETTLED'].includes(statusUpper)) {
      normalizedStatus = 'PAID';
    } else if (['SUBMITTED', 'RECEIVED'].includes(statusUpper)) {
      normalizedStatus = 'SUBMITTED';
    } else if (['PROCESSING', 'IN_REVIEW', 'ADJUDICATION', 'UNDER_REVIEW'].includes(statusUpper)) {
      normalizedStatus = 'UNDER_REVIEW';
    }

    return {
      success: !!raw.success,
      status: normalizedStatus,
      rawStatus: raw.status || raw.claimStatus || 'PROCESSING',
      approvedAmount: raw.approvedAmount !== undefined ? Number(raw.approvedAmount) : null,
      rejectedAmount: raw.rejectedAmount !== undefined ? Number(raw.rejectedAmount) : 0,
      patientResponsibilityAmount: raw.patientResponsibilityAmount !== undefined ? Number(raw.patientResponsibilityAmount) : 0,
      decisionDate: raw.decisionDate ? new Date(raw.decisionDate) : (['APPROVED', 'PARTIALLY_APPROVED', 'REJECTED'].includes(normalizedStatus) ? new Date() : null),
      rejectionReason: raw.rejectionReason || null,
      queryReason: raw.queryReason || null,
      insurerReferenceNumber: raw.insurerReferenceNumber || raw.claimReference || null,
      rawResponse: raw
    };
  }
}

module.exports = InsuranceClaimsAdapter;
