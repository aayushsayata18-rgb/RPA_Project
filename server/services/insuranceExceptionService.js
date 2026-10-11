const ExceptionCase = require('../models/ExceptionCase');
const ExceptionService = require('./ExceptionService');
const InsuranceVerification = require('../models/InsuranceVerification');
const InsurancePolicy = require('../models/InsurancePolicy');
const AuditService = require('./AuditService');

/**
 * InsuranceExceptionService
 * Conforms to 09_INSURANCE_VERIFICATION.md Section 39 & Section 40
 */
class InsuranceExceptionService {
  /**
   * Create verification exception case
   */
  static async raiseVerificationException({
    verificationId,
    patientId,
    policyId,
    category = 'AMBIGUOUS_RESPONSE',
    reason,
    severity = 'MEDIUM',
    rpaJobId = null,
    correlationId = null,
    metadata = {}
  }) {
    const exc = await ExceptionService.raiseException({
      module: 'INSURANCE_VERIFICATION',
      entityType: 'InsuranceVerification',
      entityId: verificationId,
      exceptionType: category,
      description: reason,
      severity,
      source: rpaJobId ? 'RPA' : 'API',
      assignedRole: 'INSURANCE_REPRESENTATIVE',
      rpaJobId,
      correlationId,
      metadata: {
        ...metadata,
        verificationId,
        patientId,
        policyId
      }
    });

    if (exc && exc.exceptionId) {
      await InsuranceVerification.findOneAndUpdate(
        { verificationId },
        { $set: { exceptionCaseId: exc.exceptionId, status: 'MANUAL_REVIEW' } }
      );
    }

    return exc;
  }

  /**
   * List insurance exception cases
   */
  static async listExceptions(filters = {}) {
    const query = { module: 'INSURANCE_VERIFICATION' };
    if (filters.status) query.currentStatus = filters.status;
    if (filters.severity) query.severity = filters.severity;
    if (filters.assignedTo) query.assignedTo = filters.assignedTo;

    return await ExceptionCase.find(query).sort({ createdAt: -1 }).lean();
  }

  /**
   * Assign exception to an insurance staff user
   */
  static async assignException(exceptionId, assignedTo, user = {}) {
    const exc = await ExceptionCase.findOne({ exceptionId });
    if (!exc) throw new Error(`Exception case ${exceptionId} not found`);

    exc.assignedTo = assignedTo;
    exc.currentStatus = 'IN_REVIEW';
    await exc.save();

    await AuditService.logEvent({
      userId: user.userId || 'SYSTEM',
      action: 'INSURANCE_EXCEPTION_ASSIGNED',
      module: 'INSURANCE_VERIFICATION',
      entityType: 'ExceptionCase',
      entityId: exceptionId,
      newValue: { assignedTo },
      details: `Exception ${exceptionId} assigned to ${assignedTo}`
    });

    return exc;
  }

  /**
   * Human review workflow to resolve exception (Section 40)
   */
  static async resolveException(exceptionId, resolutionData, user = {}) {
    const { decision, notes = '', evidenceFile = '', confirmedStatus = 'VERIFIED' } = resolutionData;

    const exc = await ExceptionCase.findOne({ exceptionId });
    if (!exc) throw new Error(`Exception case ${exceptionId} not found`);

    const verificationId = exc.metadata?.verificationId || exc.entityId;
    const verification = await InsuranceVerification.findOne({ verificationId });

    if (verification) {
      verification.status = confirmedStatus;
      verification.manualReview = {
        reviewedBy: user.username || user.userId || 'INSURANCE_OFFICER',
        reviewedAt: new Date(),
        decision,
        notes,
        evidenceFile
      };
      verification.completedAt = new Date();
      await verification.save();

      // Also update policy if verified
      if (confirmedStatus === 'VERIFIED') {
        await InsurancePolicy.findOneAndUpdate(
          { policyId: verification.policyId },
          {
            $set: {
              status: 'ACTIVE',
              lastVerificationStatus: 'VERIFIED',
              verificationStatus: 'VERIFIED',
              lastVerifiedAt: new Date(),
              lastVerificationId: verification.verificationId
            }
          }
        );
      }
    }

    // Resolve in central ExceptionService
    await ExceptionService.resolveException({
      exceptionId,
      resolvedBy: user.userId || 'INSURANCE_OFFICER',
      resolutionNotes: `${decision}: ${notes}`
    });

    await AuditService.logEvent({
      userId: user.userId || 'SYSTEM',
      action: 'INSURANCE_EXCEPTION_RESOLVED',
      module: 'INSURANCE_VERIFICATION',
      entityType: 'ExceptionCase',
      entityId: exceptionId,
      newValue: { decision, confirmedStatus, verificationId },
      details: `Insurance exception ${exceptionId} resolved by ${user.username || 'staff'}`
    });

    return { success: true, exceptionId, verificationId, status: 'RESOLVED' };
  }
}

module.exports = InsuranceExceptionService;
