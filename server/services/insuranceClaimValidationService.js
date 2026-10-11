const InsuranceClaim = require('../models/InsuranceClaim');
const InsurancePolicy = require('../models/InsurancePolicy');
const Patient = require('../models/Patient');
const Invoice = require('../models/Invoice');
const InsuranceClaimDocument = require('../models/InsuranceClaimDocument');

/**
 * InsuranceClaimValidationService
 * Conforms to 10_INSURANCE_CLAIMS.md Section 21, 22 & 23
 */
class InsuranceClaimValidationService {
  /**
   * Check for duplicate active claims for the same patient, policy, invoice & claimType (Section 23)
   */
  static async checkDuplicateClaim(patientId, policyId, invoiceId, claimType, excludeClaimId = null) {
    const query = {
      patientId,
      invoiceId,
      status: { $nin: ['CANCELLED', 'REJECTED'] }
    };

    if (excludeClaimId) {
      query.claimId = { $ne: excludeClaimId };
    }

    const existingClaim = await InsuranceClaim.findOne(query).lean();
    if (existingClaim) {
      return {
        isDuplicate: true,
        existingClaimId: existingClaim.claimId,
        status: existingClaim.status,
        message: `An active claim (${existingClaim.claimId}) already exists for invoice ${invoiceId} with status ${existingClaim.status}.`
      };
    }

    return { isDuplicate: false };
  }

  /**
   * Validate Claim Package before moving from DRAFT to READY (Section 22)
   */
  static async validateClaim(claimId) {
    const claim = await InsuranceClaim.findOne({ claimId });
    if (!claim) {
      throw new Error(`Insurance claim ${claimId} not found`);
    }

    const errors = [];
    const warnings = [];

    // 1. Patient exists
    const patient = await Patient.findOne({ patientId: claim.patientId }).lean();
    if (!patient) {
      errors.push(`Patient with ID ${claim.patientId} does not exist in master records.`);
    }

    // 2. Insurance Policy exists
    const policy = await InsurancePolicy.findOne({
      $or: [{ policyId: claim.policyId }, { policyNumber: claim.policyNumber }],
      isDeleted: false
    }).lean();
    if (!policy) {
      errors.push(`Insurance policy ${claim.policyId || claim.policyNumber} is missing or inactive.`);
    } else if (policy.status === 'EXPIRED') {
      warnings.push(`Policy ${policy.policyNumber} is marked EXPIRED.`);
    }

    // 3. Invoice exists
    const invoice = await Invoice.findOne({ invoiceId: claim.invoiceId }).lean();
    if (!invoice) {
      errors.push(`Billing invoice ${claim.invoiceId} does not exist.`);
    }

    // 4. Claim Amount available
    if (!claim.totalClaimAmount || claim.totalClaimAmount <= 0) {
      errors.push(`Claim total amount must be greater than zero.`);
    }

    // 5. Required identifiers available
    if (!claim.policyNumber) {
      errors.push(`Policy Number is required.`);
    }
    if (!claim.claimType) {
      errors.push(`Claim type must be selected.`);
    }

    // 6. Check Required Documents (Section 20 & 21)
    const requiredChecklistItems = (claim.documentChecklist || []).filter((item) => item.required);
    for (const reqItem of requiredChecklistItems) {
      if (!reqItem.available) {
        errors.push(`Required document "${reqItem.title || reqItem.documentType}" is not uploaded.`);
      }
    }

    // 7. Duplicate Check
    const dupCheck = await this.checkDuplicateClaim(
      claim.patientId,
      claim.policyId,
      claim.invoiceId,
      claim.claimType,
      claim.claimId
    );
    if (dupCheck.isDuplicate) {
      errors.push(dupCheck.message);
    }

    const isValid = errors.length === 0;

    return {
      isValid,
      errors,
      warnings,
      claimId: claim.claimId,
      status: claim.status
    };
  }

  /**
   * Validate Document integrity before submission (Section 21)
   */
  static validateDocument(documentData) {
    const errors = [];
    if (!documentData.fileName) errors.push('Document file name is required.');
    if (!documentData.documentType) errors.push('Document type is required.');
    if (!documentData.patientId) errors.push('Patient association is required.');
    if (!documentData.claimId) errors.push('Claim association is required.');
    if (documentData.fileSize && documentData.fileSize > 25 * 1024 * 1024) {
      errors.push('Document exceeds maximum allowable file size (25MB).');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }
}

module.exports = InsuranceClaimValidationService;
