const VendorVerification = require('../../models/VendorVerification');
const Vendor = require('../../models/Vendor');
const AuditEvent = require('../../models/AuditEvent');
const IdGeneratorService = require('../IdGeneratorService');

class VendorVerificationService {
  /**
   * Request a new verification
   */
  static async requestVerification(vendorId, verificationType, requestedBy, notes = '') {
    const vendor = await Vendor.findOne({ vendorId });
    if (!vendor) {
      throw new Error(`Vendor ${vendorId} not found`);
    }

    const verificationId = await IdGeneratorService.generateVendorVerificationId();
    const verification = new VendorVerification({
      verificationId,
      vendorId,
      verificationType,
      requestedAt: new Date(),
      status: 'IN_PROGRESS',
      startedAt: new Date(),
      notes
    });

    await verification.save();

    vendor.verificationStatus = 'IN_PROGRESS';
    await vendor.save();

    await AuditEvent.create({
      eventType: 'VENDOR_VERIFIED',
      entityId: vendorId,
      entityType: 'VendorVerification',
      userId: requestedBy || 'SYSTEM',
      description: `Verification requested [${verificationType}] for vendor ${vendor.displayName} (${vendorId})`,
      metadata: { verificationId, verificationType }
    }).catch(() => {});

    return verification;
  }

  /**
   * Add evidence to a verification
   */
  static async addEvidence(verificationId, evidenceData, addedBy) {
    const verification = await VendorVerification.findOne({ verificationId });
    if (!verification) {
      throw new Error(`Verification ${verificationId} not found`);
    }

    verification.evidence.push({
      type: evidenceData.type || 'DOCUMENT',
      source: evidenceData.source || 'INTERNAL',
      referenceId: evidenceData.referenceId || '',
      capturedAt: new Date(),
      notes: evidenceData.notes || '',
      data: evidenceData.data || null
    });

    await verification.save();
    return verification;
  }

  /**
   * Complete verification decision (PASSED, FAILED, PARTIAL, PENDING_HUMAN_REVIEW)
   */
  static async completeVerification(verificationId, outcomeData, completedBy) {
    const { status, result, notes } = outcomeData;
    const verification = await VendorVerification.findOne({ verificationId });
    if (!verification) {
      throw new Error(`Verification ${verificationId} not found`);
    }

    verification.status = status;
    verification.result = result || '';
    if (notes) verification.notes = notes;
    verification.completedAt = new Date();
    verification.verifiedBy = completedBy;
    await verification.save();

    // Check all verifications for vendor to compute overall verification status
    const allVerifs = await VendorVerification.find({ vendorId: verification.vendorId });
    const hasFailed = allVerifs.some((v) => v.status === 'FAILED');
    const hasPendingReview = allVerifs.some((v) => v.status === 'PENDING_HUMAN_REVIEW');
    const hasInProgress = allVerifs.some((v) => v.status === 'IN_PROGRESS' || v.status === 'NOT_STARTED');
    const allPassed = allVerifs.length > 0 && allVerifs.every((v) => v.status === 'PASSED');

    let overallStatus = 'PARTIAL';
    if (hasFailed) overallStatus = 'FAILED';
    else if (hasPendingReview) overallStatus = 'PENDING_HUMAN_REVIEW';
    else if (allPassed) overallStatus = 'PASSED';
    else if (hasInProgress) overallStatus = 'IN_PROGRESS';

    await Vendor.findOneAndUpdate(
      { vendorId: verification.vendorId },
      { verificationStatus: overallStatus, updatedBy: completedBy }
    );

    await AuditEvent.create({
      eventType: 'VENDOR_VERIFIED',
      entityId: verification.vendorId,
      entityType: 'VendorVerification',
      userId: completedBy || 'SYSTEM',
      description: `Verification ${verificationId} completed with status: ${status}`,
      metadata: { verificationId, status, overallStatus }
    }).catch(() => {});

    return { verification, overallStatus };
  }

  /**
   * List verifications for a vendor
   */
  static async getVerificationsByVendor(vendorId) {
    return await VendorVerification.find({ vendorId }).sort({ createdAt: -1 });
  }
}

module.exports = VendorVerificationService;
