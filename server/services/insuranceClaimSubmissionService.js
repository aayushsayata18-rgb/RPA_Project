const InsuranceClaim = require('../models/InsuranceClaim');
const InsuranceClaimDocument = require('../models/InsuranceClaimDocument');
const InsuranceClaimStatusHistory = require('../models/InsuranceClaimStatusHistory');
const ExceptionCase = require('../models/ExceptionCase');
const AuditService = require('./AuditService');
const IdGeneratorService = require('./IdGeneratorService');
const providerRegistry = require('../integrations/insurance/claims/providerRegistry');
const InsuranceClaimValidationService = require('./insuranceClaimValidationService');
const InsuranceClaimNotificationService = require('./insuranceClaimNotificationService');

/**
 * InsuranceClaimSubmissionService
 * Conforms to 10_INSURANCE_CLAIMS.md Section 26, 27, 28, 30, 31, 56, 57, 69, 70 & 71
 */
class InsuranceClaimSubmissionService {
  /**
   * Submit claim package with Idempotency Protection (Section 69)
   */
  static async submitClaim(claimId, options = {}, user = {}) {
    const {
      source = 'API', // 'API' | 'INSURER_PORTAL_RPA' | 'MANUAL'
      integrationPreference = 'ANY',
      forceResubmit = false
    } = options;

    const username = user.userId || user.username || 'STAFF';

    // 1. Fetch Claim
    const claim = await InsuranceClaim.findOne({ claimId });
    if (!claim) {
      const err = new Error(`Claim ${claimId} not found`);
      err.statusCode = 404;
      throw err;
    }

    // 2. Idempotency Check (Section 69)
    if (!forceResubmit) {
      if (['SUBMITTED', 'UNDER_REVIEW', 'APPROVED', 'PARTIALLY_APPROVED', 'PAID'].includes(claim.status) && claim.insurerReferenceNumber) {
        console.log(`[InsuranceClaimSubmissionService] Idempotent return for already submitted claim ${claimId}`);
        return {
          success: true,
          isExisting: true,
          message: `Claim is already submitted with reference ${claim.insurerReferenceNumber}.`,
          claim
        };
      }
    }

    // 3. Ensure Claim is READY
    if (claim.status !== 'READY') {
      if (claim.status === 'DRAFT') {
        const val = await InsuranceClaimValidationService.validateClaim(claimId);
        if (!val.isValid) {
          const err = new Error(`Cannot submit DRAFT claim failing validation: ${val.errors.join('; ')}`);
          err.statusCode = 422;
          err.errors = val.errors;
          throw err;
        }
        claim.status = 'READY';
        await claim.save();
      } else {
        const err = new Error(`Cannot submit claim in status ${claim.status}. Claim must be READY.`);
        err.statusCode = 400;
        throw err;
      }
    }

    // 4. Resolve Provider Adapter
    const provider = providerRegistry.getProvider(
      claim.providerCode || claim.insurerName,
      source === 'INSURER_PORTAL_RPA' ? 'PORTAL' : integrationPreference
    );

    // 5. Build Comprehensive Claim Package (Section 19)
    const documents = await InsuranceClaimDocument.find({ claimId, isArchived: false }).lean();
    const claimPackage = {
      claimId: claim.claimId,
      claimNumber: claim.claimNumber,
      patientId: claim.patientId,
      patientName: claim.patientName,
      policyId: claim.policyId,
      policyNumber: claim.policyNumber,
      memberId: claim.memberId,
      insurerName: claim.insurerName,
      admissionId: claim.admissionId,
      dischargeId: claim.dischargeId,
      invoiceId: claim.invoiceId,
      claimType: claim.claimType,
      totalClaimAmount: claim.totalClaimAmount,
      currency: claim.currency,
      items: claim.items,
      documents,
      correlationId: claim.correlationId || IdGeneratorService.generateCorrelationId()
    };

    // 6. Record Audit Submission Started
    await AuditService.logEvent({
      userId: username,
      action: 'CLAIM_SUBMISSION_STARTED',
      module: 'INSURANCE_CLAIMS',
      entityType: 'InsuranceClaim',
      entityId: claimId,
      correlationId: claimPackage.correlationId,
      newValue: { source, providerCode: provider.providerCode }
    });

    try {
      // 7. Dispatch Submission
      const submissionResult = await provider.submitClaim(claimPackage);

      if (!submissionResult.success || !submissionResult.insurerReferenceNumber) {
        throw new Error(submissionResult.errorMessage || 'Insurer submission failed to return valid reference number');
      }

      // 8. Capture Insurer Reference & State (Section 72)
      const prevStatus = claim.status;
      claim.status = 'SUBMITTED';
      claim.submissionSource = source;
      claim.insurerReferenceNumber = submissionResult.insurerReferenceNumber;
      claim.submittedAt = submissionResult.submittedAt || new Date();
      claim.rawInsurerResponse = submissionResult.rawResponse || {};
      claim.updatedBy = username;

      if (submissionResult.rpaJobId) {
        claim.rpaJobId = submissionResult.rpaJobId;
      }

      // Mark documents submitted
      (claim.documentChecklist || []).forEach((c) => {
        if (c.available) c.submitted = true;
      });

      await claim.save();

      // 9. Create Submission Evidence Document (Section 56)
      const docId = await IdGeneratorService.generateClaimDocumentId();
      await InsuranceClaimDocument.create({
        documentId: docId,
        claimId,
        claimRef: claim._id,
        patientId: claim.patientId,
        documentType: 'CLAIM_SUBMISSION_EVIDENCE',
        fileName: `submission_ack_${claim.insurerReferenceNumber}.pdf`,
        fileUrl: `/uploads/evidence/${docId}_acknowledgement.pdf`,
        storageKey: `evidence/claims/${claimId}/${docId}`,
        fileSize: 2048,
        mimeType: 'application/pdf',
        version: 1,
        required: false,
        submittedToInsurer: false,
        uploadedBy: 'SYSTEM',
        verificationStatus: 'VALID',
        notes: `Electronic submission acknowledgement from ${claim.insurerName}`
      });

      // 10. Record Status History (Section 10)
      await InsuranceClaimStatusHistory.create({
        claimId,
        previousStatus: prevStatus,
        newStatus: 'SUBMITTED',
        changedBy: username,
        source: source === 'INSURER_PORTAL_RPA' ? 'INSURER_PORTAL_RPA' : 'API',
        reason: 'Claim successfully submitted to insurer',
        insurerReference: claim.insurerReferenceNumber,
        timestamp: new Date(),
        metadata: {
          submissionResult
        }
      });

      // 11. Record Audit Events
      await AuditService.logEvent({
        userId: username,
        action: 'CLAIM_SUBMITTED',
        module: 'INSURANCE_CLAIMS',
        entityType: 'InsuranceClaim',
        entityId: claimId,
        correlationId: claimPackage.correlationId,
        oldValue: { status: prevStatus },
        newValue: {
          status: 'SUBMITTED',
          insurerReferenceNumber: claim.insurerReferenceNumber,
          submittedAt: claim.submittedAt
        }
      });

      await AuditService.logEvent({
        userId: username,
        action: 'CLAIM_REFERENCE_CAPTURED',
        module: 'INSURANCE_CLAIMS',
        entityType: 'InsuranceClaim',
        entityId: claimId,
        newValue: { insurerReferenceNumber: claim.insurerReferenceNumber }
      });

      // 12. Send Notification
      await InsuranceClaimNotificationService.notifyClaimEvent('CLAIM_SUBMITTED', claim);

      return {
        success: true,
        claimStatus: 'SUBMITTED',
        insurerReferenceNumber: claim.insurerReferenceNumber,
        submittedAt: claim.submittedAt,
        evidence: submissionResult.evidence || [],
        claim
      };
    } catch (error) {
      console.error(`[InsuranceClaimSubmissionService] Claim submission failed for ${claimId}:`, error);

      // Section 70: Submission Failure Handling - Do NOT mark SUBMITTED!
      // Create ExceptionCase for human attention (Section 57)
      let exceptionCase = null;
      try {
        exceptionCase = await ExceptionCase.create({
          exceptionId: `EXC-CLM-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
          module: 'INSURANCE_CLAIMS',
          exceptionType: 'SUBMISSION_FAILURE',
          category: 'SUBMISSION_FAILURE',
          title: `Claim Submission Failure: ${claim.claimId}`,
          description: `Submission to ${claim.insurerName} failed: ${error.message}`,
          severity: 'HIGH',
          source: 'SYSTEM',
          currentStatus: 'OPEN',
          status: 'OPEN',
          entityType: 'InsuranceClaim',
          entityId: claim.claimId,
          metadata: {
            claimId: claim.claimId,
            insurerName: claim.insurerName,
            totalClaimAmount: claim.totalClaimAmount,
            error: error.message,
            correlationId: claimPackage.correlationId
          }
        });
      } catch (exErr) {
        console.warn('[InsuranceClaimSubmissionService] ExceptionCase logging warning:', exErr.message);
      }

      await AuditService.logEvent({
        userId: username,
        action: 'CLAIM_EXCEPTION_CREATED',
        module: 'INSURANCE_CLAIMS',
        entityType: 'InsuranceClaim',
        entityId: claimId,
        correlationId: claimPackage.correlationId,
        newValue: { error: error.message, exceptionCaseId: exceptionCase ? exceptionCase._id : null }
      });

      const err = new Error(`Claim submission failed: ${error.message}`);
      err.statusCode = 502;
      err.exceptionCaseId = exceptionCase ? exceptionCase._id : null;
      throw err;
    }
  }
}

module.exports = InsuranceClaimSubmissionService;
