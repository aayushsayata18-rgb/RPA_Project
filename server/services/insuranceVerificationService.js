const InsuranceVerification = require('../models/InsuranceVerification');
const InsuranceVerificationAttempt = require('../models/InsuranceVerificationAttempt');
const InsurancePolicy = require('../models/InsurancePolicy');
const Patient = require('../models/Patient');
const AuditService = require('./AuditService');
const IdGeneratorService = require('./IdGeneratorService');
const providerRegistry = require('../integrations/insurance/providerRegistry');
const InsuranceExceptionService = require('./insuranceExceptionService');
const InsuranceNotificationService = require('./insuranceNotificationService');

/**
 * InsuranceVerificationService
 * Conforms to 09_INSURANCE_VERIFICATION.md Section 7, 9, 17, 37, 38 & 65
 */
class InsuranceVerificationService {
  /**
   * Request insurance verification
   * Handles Idempotency (Section 37) and Concurrency Control (Section 65)
   */
  static async requestVerification(policyId, options = {}, user = {}) {
    const {
      source = 'API',
      integrationPreference = 'ANY',
      requestedBy = user.userId || user.username || 'STAFF',
      forceNew = false
    } = options;

    // 1. Fetch target policy
    const policy = await InsurancePolicy.findOne({
      $or: [{ policyId }, { _id: policyId.match(/^[0-9a-fA-F]{24}$/) ? policyId : null }],
      isDeleted: false
    });

    if (!policy) {
      throw new Error(`Insurance policy ${policyId} not found`);
    }

    // 2. Check Idempotency & Active Concurrency (Section 37 & 65)
    if (!forceNew) {
      const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000);
      const activeVerification = await InsuranceVerification.findOne({
        policyId: policy.policyId,
        status: { $in: ['REQUESTED', 'QUEUED', 'IN_PROGRESS'] },
        createdAt: { $gte: tenMinutesAgo }
      });

      if (activeVerification) {
        console.log(`[InsuranceVerificationService] Returning existing active verification ${activeVerification.verificationId}`);
        return {
          verificationId: activeVerification.verificationId,
          status: activeVerification.status,
          message: 'Active verification already running for this policy.',
          isExisting: true
        };
      }
    }

    // 3. Generate IDs
    const verificationId = await IdGeneratorService.generateVerificationId();
    const correlationId = options.correlationId || IdGeneratorService.generateCorrelationId();

    // 4. Resolve patient for demographic details
    const patient = await Patient.findOne({ patientId: policy.patientId });

    // 5. Create Verification Record (Status: QUEUED)
    const verification = new InsuranceVerification({
      verificationId,
      patientId: policy.patientId,
      patientRef: policy.patientRef,
      patientName: policy.patientName || (patient ? patient.fullName : ''),
      policyId: policy.policyId,
      policyRef: policy._id,
      requestedBy,
      verificationSource: source,
      integrationType: integrationPreference === 'PORTAL' ? 'BROWSER_AUTOMATION' : 'OFFICIAL_API',
      status: 'QUEUED',
      insurerName: policy.providerName,
      providerCode: policy.providerCode,
      policyNumber: policy.policyNumber,
      memberId: policy.memberId,
      correlationId,
      requestedAt: new Date()
    });

    await verification.save();

    // Update policy last status
    policy.lastVerificationStatus = 'QUEUED';
    policy.lastVerificationId = verificationId;
    await policy.save();

    // Audit Event
    await AuditService.logEvent({
      userId: requestedBy,
      action: 'INSURANCE_POLICY_VERIFICATION_REQUESTED',
      module: 'INSURANCE_VERIFICATION',
      entityType: 'InsuranceVerification',
      entityId: verificationId,
      correlationId,
      newValue: { policyId: policy.policyId, status: 'QUEUED', source },
      details: `Verification requested for policy ${policy.policyNumber}`
    });

    // Notify requested
    await InsuranceNotificationService.notifyVerificationOutcome({
      event: 'INSURANCE_VERIFICATION_REQUESTED',
      patientId: policy.patientId,
      patientPhone: patient ? patient.mobile : null,
      patientEmail: patient ? patient.email : null,
      policyNumber: policy.policyNumber,
      providerName: policy.providerName,
      verificationId,
      status: 'QUEUED'
    });

    // Execute verification pipeline (immediately trigger execution)
    this.executeVerification(verificationId, { integrationPreference, requestedBy, correlationId }).catch((err) => {
      console.error(`[InsuranceVerificationService] Execution error for ${verificationId}:`, err);
    });

    return {
      verificationId,
      status: 'QUEUED',
      policyId: policy.policyId,
      correlationId
    };
  }

  /**
   * Execute Verification Pipeline
   * Selects Adapter, runs verification, normalizes output, updates DB
   */
  static async executeVerification(verificationId, options = {}) {
    const verification = await InsuranceVerification.findOne({ verificationId });
    if (!verification) {
      throw new Error(`Verification ${verificationId} not found`);
    }

    const policy = await InsurancePolicy.findOne({ policyId: verification.policyId });
    if (!policy) {
      throw new Error(`Associated policy ${verification.policyId} not found`);
    }

    verification.status = 'IN_PROGRESS';
    verification.startedAt = new Date();
    await verification.save();

    await AuditService.logEvent({
      userId: options.requestedBy || 'SYSTEM',
      action: 'INSURANCE_VERIFICATION_STARTED',
      module: 'INSURANCE_VERIFICATION',
      entityType: 'InsuranceVerification',
      entityId: verificationId,
      correlationId: verification.correlationId,
      details: `Started verification execution for ${verificationId}`
    });

    // Create attempt
    const attemptNumber = (verification.retryCount || 0) + 1;
    const attempt = new InsuranceVerificationAttempt({
      verificationId,
      attemptNumber,
      source: verification.verificationSource,
      startedAt: new Date()
    });

    try {
      // 1. Select Adapter
      const adapter = providerRegistry.getProvider(
        policy.providerCode || policy.providerName,
        options.integrationPreference || verification.verificationSource
      );

      // 2. Perform Verification
      const result = await adapter.verify(
        {
          policyId: policy.policyId,
          policyNumber: policy.policyNumber,
          memberId: policy.memberId,
          patientId: policy.patientId,
          patientName: policy.patientName,
          providerName: policy.providerName,
          verificationId
        },
        {
          requestedBy: options.requestedBy || 'SYSTEM',
          correlationId: verification.correlationId
        }
      );

      // 3. Process Result
      verification.completedAt = new Date();
      verification.status = result.status;
      verification.eligibilityStatus = result.eligibilityStatus;
      verification.policyStatus = result.policyStatus;
      verification.networkStatus = result.networkStatus;
      verification.effectiveDate = result.effectiveDate;
      verification.expiryDate = result.expiryDate;
      verification.coverageType = result.coverageType || policy.coverageType;

      // Assign financial values ONLY if provided by insurer (Section 8 & 34)
      if (result.coverageLimit !== null && result.coverageLimit !== undefined) {
        verification.coverageLimit = result.coverageLimit;
        policy.coverageLimit = result.coverageLimit;
      }
      if (result.coverageUsed !== null && result.coverageUsed !== undefined) {
        verification.coverageUsed = result.coverageUsed;
        policy.coverageUsed = result.coverageUsed;
      }
      if (result.coverageRemaining !== null && result.coverageRemaining !== undefined) {
        verification.coverageRemaining = result.coverageRemaining;
        policy.coverageRemaining = result.coverageRemaining;
      }
      if (result.deductibleAmount !== null && result.deductibleAmount !== undefined) {
        verification.deductibleAmount = result.deductibleAmount;
        policy.deductibleAmount = result.deductibleAmount;
      }
      if (result.deductibleUsed !== null && result.deductibleUsed !== undefined) {
        verification.deductibleUsed = result.deductibleUsed;
        policy.deductibleUsed = result.deductibleUsed;
      }
      if (result.deductibleRemaining !== null && result.deductibleRemaining !== undefined) {
        verification.deductibleRemaining = result.deductibleRemaining;
        policy.deductibleRemaining = result.deductibleRemaining;
      }
      if (result.copayAmount !== null && result.copayAmount !== undefined) {
        verification.copayAmount = result.copayAmount;
        policy.copayAmount = result.copayAmount;
      }

      verification.authorizationRequired = result.authorizationRequired;
      verification.verificationReference = result.externalReference || '';
      verification.insurerResponseSummary = result.evidenceSummary || {};
      verification.rawResponse = result.raw || null;
      verification.errorCode = result.errorCode || null;
      verification.errorMessage = result.errorMessage || null;
      if (result.rpaJobId) verification.rpaJobId = result.rpaJobId;
      if (result.evidencePaths) verification.evidencePaths = result.evidencePaths;

      // 4. Update Policy Status according to result
      policy.lastVerifiedAt = new Date();
      policy.lastVerificationStatus = result.status;
      policy.verificationStatus = result.status;
      policy.lastVerificationId = verificationId;
      policy.networkStatus = result.networkStatus;
      policy.authorizationRequired = result.authorizationRequired;

      if (result.status === 'VERIFIED') {
        policy.status = 'ACTIVE';
      } else if (result.status === 'EXPIRED') {
        policy.status = 'EXPIRED';
      } else if (result.status === 'NOT_ELIGIBLE') {
        policy.status = 'SUSPENDED';
      }

      await policy.save();
      await verification.save();

      // 5. Complete Attempt
      attempt.completedAt = new Date();
      attempt.status = 'SUCCESS';
      attempt.externalReference = result.externalReference || '';
      await attempt.save();

      // 6. Handle Ambiguous Scenario (Section 29)
      if (result.status === 'AMBIGUOUS') {
        await InsuranceExceptionService.raiseVerificationException({
          verificationId,
          patientId: policy.patientId,
          policyId: policy.policyId,
          category: 'AMBIGUOUS_RESPONSE',
          reason: result.errorMessage || 'Multiple member records returned by insurer',
          severity: 'HIGH',
          correlationId: verification.correlationId,
          metadata: result.evidenceSummary
        });

        await InsuranceNotificationService.notifyVerificationOutcome({
          event: 'INSURANCE_VERIFICATION_REVIEW_REQUIRED',
          patientId: policy.patientId,
          policyNumber: policy.policyNumber,
          providerName: policy.providerName,
          verificationId,
          status: 'AMBIGUOUS',
          notes: 'Multiple member matches returned by insurer'
        });
      } else if (result.status === 'EXPIRED') {
        await InsuranceNotificationService.notifyVerificationOutcome({
          event: 'INSURANCE_POLICY_EXPIRED',
          patientId: policy.patientId,
          policyNumber: policy.policyNumber,
          providerName: policy.providerName,
          verificationId,
          status: 'EXPIRED'
        });
      } else if (result.status === 'NOT_FOUND') {
        await InsuranceNotificationService.notifyVerificationOutcome({
          event: 'INSURANCE_POLICY_NOT_FOUND',
          patientId: policy.patientId,
          policyNumber: policy.policyNumber,
          providerName: policy.providerName,
          verificationId,
          status: 'NOT_FOUND'
        });
      } else if (result.status === 'NOT_ELIGIBLE') {
        await InsuranceNotificationService.notifyVerificationOutcome({
          event: 'INSURANCE_POLICY_NOT_ELIGIBLE',
          patientId: policy.patientId,
          policyNumber: policy.policyNumber,
          providerName: policy.providerName,
          verificationId,
          status: 'NOT_ELIGIBLE'
        });
      } else {
        await InsuranceNotificationService.notifyVerificationOutcome({
          event: 'INSURANCE_VERIFICATION_COMPLETED',
          patientId: policy.patientId,
          policyNumber: policy.policyNumber,
          providerName: policy.providerName,
          verificationId,
          status: result.status
        });
      }

      await AuditService.logEvent({
        userId: options.requestedBy || 'SYSTEM',
        action: 'INSURANCE_VERIFICATION_COMPLETED',
        module: 'INSURANCE_VERIFICATION',
        entityType: 'InsuranceVerification',
        entityId: verificationId,
        correlationId: verification.correlationId,
        newValue: { status: result.status, policyStatus: result.policyStatus },
        details: `Verification finished with status ${result.status}`
      });

      return verification;
    } catch (err) {
      // Handle Technical or Execution Failures (Section 38 & 61)
      console.error(`[InsuranceVerificationService] Verification failed for ${verificationId}:`, err.message);

      verification.status = 'FAILED';
      verification.errorCode = err.code || 'TECHNICAL_FAILURE';
      verification.errorMessage = err.message;
      verification.completedAt = new Date();
      if (err.rpaJobId) verification.rpaJobId = err.rpaJobId;
      await verification.save();

      policy.lastVerificationStatus = 'FAILED';
      policy.verificationStatus = 'FAILED';
      await policy.save();

      attempt.completedAt = new Date();
      attempt.status = 'FAILED';
      attempt.errorCode = err.code || 'TECHNICAL_FAILURE';
      attempt.errorMessage = err.message;
      await attempt.save();

      // Raise Exception for staff manual review
      await InsuranceExceptionService.raiseVerificationException({
        verificationId,
        patientId: policy.patientId,
        policyId: policy.policyId,
        category: err.isTechnical ? 'PORTAL_UNAVAILABLE' : 'API_FAILURE',
        reason: `Verification failed: ${err.message}`,
        severity: 'MEDIUM',
        rpaJobId: err.rpaJobId || null,
        correlationId: verification.correlationId
      });

      await InsuranceNotificationService.notifyVerificationOutcome({
        event: 'INSURANCE_VERIFICATION_FAILED',
        patientId: policy.patientId,
        policyNumber: policy.policyNumber,
        providerName: policy.providerName,
        verificationId,
        status: 'FAILED',
        notes: err.message
      });

      await AuditService.logEvent({
        userId: options.requestedBy || 'SYSTEM',
        action: 'INSURANCE_VERIFICATION_FAILED',
        module: 'INSURANCE_VERIFICATION',
        entityType: 'InsuranceVerification',
        entityId: verificationId,
        correlationId: verification.correlationId,
        newValue: { error: err.message, status: 'FAILED' },
        details: `Insurance verification technical failure: ${err.message}`
      });

      return verification;
    }
  }

  /**
   * Retry failed verification (Section 38 & 52)
   */
  static async retryVerification(verificationId, user = {}) {
    const verification = await InsuranceVerification.findOne({ verificationId });
    if (!verification) throw new Error(`Verification ${verificationId} not found`);

    // Only permit retry on technical failures
    if (!['FAILED', 'TIMEOUT', 'MANUAL_REVIEW'].includes(verification.status)) {
      throw new Error(`Cannot retry verification in state ${verification.status}. Retry only allowed for technical failures.`);
    }

    if (verification.retryCount >= verification.maxRetries) {
      throw new Error(`Maximum retry limit (${verification.maxRetries}) reached. Manual review required.`);
    }

    verification.retryCount = (verification.retryCount || 0) + 1;
    verification.status = 'QUEUED';
    await verification.save();

    await AuditService.logEvent({
      userId: user.userId || 'SYSTEM',
      action: 'INSURANCE_VERIFICATION_RETRIED',
      module: 'INSURANCE_VERIFICATION',
      entityType: 'InsuranceVerification',
      entityId: verificationId,
      newValue: { retryCount: verification.retryCount },
      details: `Retrying verification ${verificationId} (Attempt #${verification.retryCount + 1})`
    });

    return await this.executeVerification(verificationId, {
      requestedBy: user.userId || 'STAFF',
      correlationId: verification.correlationId
    });
  }

  /**
   * Record Manual Verification by Authorized Staff (Section 40 & 71)
   */
  static async recordManualVerification(verificationId, manualData, user = {}) {
    const verification = await InsuranceVerification.findOne({ verificationId });
    if (!verification) throw new Error(`Verification ${verificationId} not found`);

    const {
      eligibilityStatus = 'ELIGIBLE',
      policyStatus = 'ACTIVE',
      networkStatus = 'IN_NETWORK',
      coverageLimit = null,
      coverageRemaining = null,
      deductibleAmount = null,
      copayAmount = null,
      authorizationRequired = 'NOT_REQUIRED',
      referenceNumber = '',
      evidenceFile = '',
      notes = ''
    } = manualData;

    verification.status = 'VERIFIED';
    verification.verificationSource = 'MANUAL';
    verification.eligibilityStatus = eligibilityStatus;
    verification.policyStatus = policyStatus;
    verification.networkStatus = networkStatus;
    verification.authorizationRequired = authorizationRequired;
    verification.verificationReference = referenceNumber;
    if (coverageLimit !== null) verification.coverageLimit = coverageLimit;
    if (coverageRemaining !== null) verification.coverageRemaining = coverageRemaining;
    if (deductibleAmount !== null) verification.deductibleAmount = deductibleAmount;
    if (copayAmount !== null) verification.copayAmount = copayAmount;

    verification.manualReview = {
      reviewedBy: user.username || user.userId || 'STAFF',
      reviewedAt: new Date(),
      decision: 'Manually verified by staff with insurer confirmation',
      notes,
      evidenceFile
    };
    verification.completedAt = new Date();
    await verification.save();

    // Update Policy
    const policy = await InsurancePolicy.findOne({ policyId: verification.policyId });
    if (policy) {
      policy.status = policyStatus;
      policy.lastVerificationStatus = 'VERIFIED';
      policy.verificationStatus = 'VERIFIED';
      policy.lastVerifiedAt = new Date();
      policy.networkStatus = networkStatus;
      policy.authorizationRequired = authorizationRequired;
      if (coverageLimit !== null) policy.coverageLimit = coverageLimit;
      if (coverageRemaining !== null) policy.coverageRemaining = coverageRemaining;
      if (deductibleAmount !== null) policy.deductibleAmount = deductibleAmount;
      if (copayAmount !== null) policy.copayAmount = copayAmount;
      await policy.save();
    }

    await AuditService.logEvent({
      userId: user.userId || 'STAFF',
      action: 'INSURANCE_VERIFICATION_COMPLETED',
      module: 'INSURANCE_VERIFICATION',
      entityType: 'InsuranceVerification',
      entityId: verificationId,
      newValue: { method: 'MANUAL', verifiedBy: user.username, status: 'VERIFIED' },
      details: `Manual verification completed for ${verificationId}`
    });

    return verification;
  }

  /**
   * Get single verification with attempts & policy
   */
  static async getVerificationById(verificationId) {
    const verification = await InsuranceVerification.findOne({ verificationId }).lean();
    if (!verification) throw new Error(`Verification ${verificationId} not found`);

    const attempts = await InsuranceVerificationAttempt.find({ verificationId }).sort({ attemptNumber: 1 }).lean();
    const policy = await InsurancePolicy.findOne({ policyId: verification.policyId }).lean();
    const patient = await Patient.findOne({ patientId: verification.patientId })
      .select('patientId fullName firstName lastName mobile dateOfBirth gender')
      .lean();

    return {
      ...verification,
      attempts,
      policy,
      patient
    };
  }

  /**
   * List verifications with filters and pagination
   */
  static async listVerifications(query = {}) {
    const {
      status,
      provider,
      source,
      patientId,
      policyId,
      dateFrom,
      dateTo,
      page = 1,
      limit = 20
    } = query;

    const filter = {};
    if (status) filter.status = status;
    if (provider) filter.insurerName = new RegExp(provider, 'i');
    if (source) filter.verificationSource = source;
    if (patientId) filter.patientId = patientId;
    if (policyId) filter.policyId = policyId;

    if (dateFrom || dateTo) {
      filter.createdAt = {};
      if (dateFrom) filter.createdAt.$gte = new Date(dateFrom);
      if (dateTo) filter.createdAt.$lte = new Date(dateTo);
    }

    const skip = (parseInt(page, 10) - 1) * parseInt(limit, 10);
    const [verifications, total] = await Promise.all([
      InsuranceVerification.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit, 10))
        .lean(),
      InsuranceVerification.countDocuments(filter)
    ]);

    return {
      verifications,
      total,
      page: parseInt(page, 10),
      pages: Math.ceil(total / parseInt(limit, 10))
    };
  }

  /**
   * Dashboard Statistics (Section 42 & 66)
   */
  static async getDashboardStats() {
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const [
      activePolicies,
      pendingVerification,
      verifiedToday,
      manualReviewRequired,
      expiredPolicies,
      failedVerifications,
      totalVerifications
    ] = await Promise.all([
      InsurancePolicy.countDocuments({ status: 'ACTIVE', isDeleted: false }),
      InsuranceVerification.countDocuments({ status: { $in: ['REQUESTED', 'QUEUED', 'IN_PROGRESS'] } }),
      InsuranceVerification.countDocuments({ status: 'VERIFIED', completedAt: { $gte: startOfToday } }),
      InsuranceVerification.countDocuments({ status: { $in: ['AMBIGUOUS', 'MANUAL_REVIEW'] } }),
      InsurancePolicy.countDocuments({ status: 'EXPIRED', isDeleted: false }),
      InsuranceVerification.countDocuments({ status: 'FAILED' }),
      InsuranceVerification.countDocuments()
    ]);

    const verifiedTotal = await InsuranceVerification.countDocuments({ status: 'VERIFIED' });
    const successRate = totalVerifications > 0 ? Math.round((verifiedTotal / totalVerifications) * 100) : 100;

    return {
      activePolicies,
      pendingVerification,
      verifiedToday,
      manualReviewRequired,
      expiredPolicies,
      failedVerifications,
      totalVerifications,
      successRate
    };
  }
}

module.exports = InsuranceVerificationService;
