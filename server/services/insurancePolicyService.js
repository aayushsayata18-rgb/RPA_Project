const InsurancePolicy = require('../models/InsurancePolicy');
const Patient = require('../models/Patient');
const AuditService = require('./AuditService');
const IdGeneratorService = require('./IdGeneratorService');

/**
 * InsurancePolicyService
 * Conforms to 09_INSURANCE_VERIFICATION.md Section 8, 13, 16 & 48
 */
class InsurancePolicyService {
  /**
   * Check for duplicate policy (Section 16)
   * patientId + provider + policyNumber + memberId
   */
  static async findDuplicatePolicy({ patientId, providerName, policyNumber, memberId }) {
    const query = {
      patientId,
      policyNumber: policyNumber.trim(),
      isDeleted: false
    };

    if (memberId && memberId.trim()) {
      query.memberId = memberId.trim();
    }
    if (providerName && providerName.trim()) {
      query.providerName = new RegExp(`^${providerName.trim()}$`, 'i');
    }

    return await InsurancePolicy.findOne(query);
  }

  /**
   * Create new Insurance Policy
   */
  static async createPolicy(policyData, user = {}) {
    const {
      patientId,
      providerName,
      policyNumber,
      memberId = '',
      groupNumber = '',
      planName = '',
      planType = 'COMPREHENSIVE',
      policyHolderName,
      relationshipToPatient = 'SELF',
      startDate,
      endDate,
      validFrom,
      validTo,
      isPrimary = true,
      priority = 1,
      networkStatus = 'UNKNOWN',
      coverageType = 'INPATIENT_AND_OUTPATIENT',
      notes = ''
    } = policyData;

    if (!patientId || !providerName || !policyNumber || !policyHolderName) {
      throw new Error('Required fields missing: patientId, providerName, policyNumber, policyHolderName are mandatory.');
    }

    // 1. Verify Patient exists
    const patient = await Patient.findOne({ patientId });
    if (!patient) {
      throw new Error(`Patient record not found for patientId: ${patientId}`);
    }

    // 2. Duplicate Check (Section 16)
    const duplicate = await this.findDuplicatePolicy({
      patientId,
      providerName,
      policyNumber,
      memberId
    });

    if (duplicate) {
      const err = new Error('Duplicate policy detected. A matching policy record already exists for this patient.');
      err.code = 'DUPLICATE_POLICY';
      err.existingPolicy = duplicate;
      throw err;
    }

    // 3. Generate unique policy ID
    const policyId = await IdGeneratorService.generatePolicyId();

    // 4. Handle Primary status if marked primary
    if (isPrimary) {
      await InsurancePolicy.updateMany(
        { patientId, isDeleted: false },
        { $set: { isPrimary: false } }
      );
    }

    const policy = new InsurancePolicy({
      policyId,
      patientId,
      patientRef: patient._id,
      patientName: patient.fullName || `${patient.firstName} ${patient.lastName}`.trim(),
      policyNumber: policyNumber.trim(),
      memberId: memberId.trim(),
      groupNumber: groupNumber.trim(),
      providerName: providerName.trim(),
      providerCode: providerName.toUpperCase().replace(/\s+/g, '_'),
      planName,
      planType,
      policyHolderName: policyHolderName.trim(),
      relationshipToPatient,
      startDate: startDate || validFrom || null,
      endDate: endDate || validTo || null,
      validFrom: validFrom || startDate || null,
      validTo: validTo || endDate || null,
      status: 'DRAFT',
      isPrimary: isPrimary ?? true,
      priority: priority || (isPrimary ? 1 : 2),
      networkStatus: networkStatus || 'UNKNOWN',
      coverageType,
      lastVerificationStatus: 'UNVERIFIED',
      verificationStatus: 'UNVERIFIED',
      source: user.role === 'PATIENT' ? 'SELF' : 'STAFF',
      notes,
      createdBy: user.userId || user.username || 'SYSTEM',
      updatedBy: user.userId || user.username || 'SYSTEM'
    });

    await policy.save();

    // 5. Audit Logging
    await AuditService.logEvent({
      userId: user.userId || 'SYSTEM',
      action: 'INSURANCE_POLICY_CREATED',
      module: 'INSURANCE_VERIFICATION',
      entityType: 'InsurancePolicy',
      entityId: policy.policyId,
      newValue: {
        policyId: policy.policyId,
        patientId,
        providerName,
        policyNumber
      },
      details: `Created insurance policy ${policy.policyId} for patient ${patientId}`
    });

    return policy;
  }

  /**
   * Update Insurance Policy
   */
  static async updatePolicy(policyId, updateData, user = {}) {
    const policy = await InsurancePolicy.findOne({
      $or: [{ policyId }, { _id: policyId.match(/^[0-9a-fA-F]{24}$/) ? policyId : null }],
      isDeleted: false
    });

    if (!policy) {
      throw new Error(`Insurance policy not found with ID ${policyId}`);
    }

    const previousState = policy.toObject();

    // Disallow overriding insurer verified coverage without authorization
    if (updateData.isPrimary && !policy.isPrimary) {
      await InsurancePolicy.updateMany(
        { patientId: policy.patientId, isDeleted: false },
        { $set: { isPrimary: false } }
      );
    }

    Object.assign(policy, updateData, {
      updatedBy: user.userId || user.username || 'SYSTEM'
    });

    await policy.save();

    await AuditService.logEvent({
      userId: user.userId || 'SYSTEM',
      action: 'INSURANCE_POLICY_UPDATED',
      module: 'INSURANCE_VERIFICATION',
      entityType: 'InsurancePolicy',
      entityId: policy.policyId,
      oldValue: previousState,
      newValue: policy.toObject(),
      details: `Updated insurance policy ${policy.policyId}`
    });

    return policy;
  }

  /**
   * Get single policy by ID
   */
  static async getPolicyById(policyId) {
    const policy = await InsurancePolicy.findOne({
      $or: [{ policyId }, { _id: policyId.match(/^[0-9a-fA-F]{24}$/) ? policyId : null }],
      isDeleted: false
    }).populate('patientRef', 'patientId fullName firstName lastName mobile dateOfBirth gender');

    if (!policy) {
      throw new Error(`Insurance policy ${policyId} not found`);
    }
    return policy;
  }

  /**
   * Get all policies for a patient ordered by priority
   */
  static async getPatientPolicies(patientId) {
    return await InsurancePolicy.find({ patientId, isDeleted: false })
      .sort({ isPrimary: -1, priority: 1, createdAt: -1 })
      .lean();
  }

  /**
   * Soft delete / archive policy (Section 52)
   */
  static async archivePolicy(policyId, user = {}) {
    const policy = await InsurancePolicy.findOne({
      $or: [{ policyId }, { _id: policyId.match(/^[0-9a-fA-F]{24}$/) ? policyId : null }],
      isDeleted: false
    });

    if (!policy) {
      throw new Error(`Insurance policy ${policyId} not found`);
    }

    policy.isDeleted = true;
    policy.status = 'CANCELLED';
    policy.updatedBy = user.userId || 'SYSTEM';
    await policy.save();

    await AuditService.logEvent({
      userId: user.userId || 'SYSTEM',
      action: 'INSURANCE_POLICY_ARCHIVED',
      module: 'INSURANCE_VERIFICATION',
      entityType: 'InsurancePolicy',
      entityId: policy.policyId,
      details: `Archived policy ${policy.policyId} for patient ${policy.patientId}`
    });

    return { success: true, message: 'Policy successfully archived', policyId };
  }

  /**
   * Integration endpoint for Billing, Admission & Discharge (Section 48, 49, 50)
   * GET /api/insurance/patients/:patientId/active
   */
  static async getActivePolicyForBilling(patientId) {
    const policy = await InsurancePolicy.findOne({
      patientId,
      isDeleted: false,
      status: { $in: ['ACTIVE', 'DRAFT'] }
    })
      .sort({ isPrimary: -1, lastVerifiedAt: -1, createdAt: -1 })
      .lean();

    if (!policy) {
      return {
        hasInsurance: false,
        policy: null,
        verification: null,
        freshness: { isFresh: false, hoursSinceVerification: null }
      };
    }

    const freshnessHours = 24; // Configurable freshness window (Section 35)
    let isFresh = false;
    let hoursSinceVerification = null;

    if (policy.lastVerifiedAt) {
      const diffMs = Date.now() - new Date(policy.lastVerifiedAt).getTime();
      hoursSinceVerification = Math.round(diffMs / (1000 * 60 * 60));
      isFresh = hoursSinceVerification <= freshnessHours;
    }

    return {
      hasInsurance: true,
      policy: {
        policyId: policy.policyId,
        providerName: policy.providerName,
        policyNumber: policy.policyNumber,
        memberId: policy.memberId,
        status: policy.status,
        isPrimary: policy.isPrimary,
        networkStatus: policy.networkStatus,
        coverageType: policy.coverageType,
        coverageLimit: policy.coverageLimit,
        coverageRemaining: policy.coverageRemaining,
        deductibleRemaining: policy.deductibleRemaining,
        copayAmount: policy.copayAmount,
        authorizationRequired: policy.authorizationRequired
      },
      verification: {
        lastVerifiedAt: policy.lastVerifiedAt,
        status: policy.lastVerificationStatus,
        eligibilityStatus: policy.lastVerificationStatus === 'VERIFIED' ? 'ELIGIBLE' : 'UNKNOWN',
        networkStatus: policy.networkStatus,
        lastVerificationId: policy.lastVerificationId
      },
      freshness: {
        isFresh,
        hoursSinceVerification,
        validityWindowHours: freshnessHours,
        warning: !isFresh ? 'Insurance verification may be stale. Re-verification advised.' : null
      }
    };
  }
}

module.exports = InsurancePolicyService;
