const InsuranceClaim = require('../models/InsuranceClaim');
const InsuranceClaimSettlement = require('../models/InsuranceClaimSettlement');
const InsuranceClaimStatusHistory = require('../models/InsuranceClaimStatusHistory');
const Invoice = require('../models/Invoice');
const ExceptionCase = require('../models/ExceptionCase');
const AuditService = require('./AuditService');
const IdGeneratorService = require('./IdGeneratorService');
const InsuranceClaimNotificationService = require('./insuranceClaimNotificationService');

/**
 * InsuranceClaimSettlementService
 * Conforms to 10_INSURANCE_CLAIMS.md Section 12, 44, 45, 46, 47 & 57
 */
class InsuranceClaimSettlementService {
  /**
   * Get settlement details for a claim
   */
  static async getSettlement(claimId) {
    return InsuranceClaimSettlement.find({ claimId }).sort({ settlementDate: -1 }).lean();
  }

  /**
   * Record claim settlement and trigger billing reconciliation (Section 44 & 47)
   */
  static async recordSettlement(claimId, data, user = {}) {
    const claim = await InsuranceClaim.findOne({ claimId });
    if (!claim) {
      const err = new Error(`Claim ${claimId} not found`);
      err.statusCode = 404;
      throw err;
    }

    const {
      settledAmount: reqSettled,
      approvedAmount: reqApproved,
      paymentReference,
      settlementDate = new Date(),
      notes
    } = data;

    if (!paymentReference) {
      const err = new Error('Payment reference is required to record settlement.');
      err.statusCode = 400;
      throw err;
    }

    const settledAmount = Number(reqSettled !== undefined ? reqSettled : claim.approvedAmount);
    const approvedAmount = Number(reqApproved !== undefined ? reqApproved : (claim.approvedAmount || claim.totalClaimAmount));
    const differenceAmount = Math.max(0, approvedAmount - settledAmount);

    const settlementId = await IdGeneratorService.generateClaimSettlementId();
    const username = user.userId || user.username || 'STAFF';

    // 1. Create Settlement Entity
    const settlement = new InsuranceClaimSettlement({
      settlementId,
      claimId: claim.claimId,
      claimRef: claim._id,
      invoiceId: claim.invoiceId,
      insurerName: claim.insurerName,
      insurerReference: claim.insurerReferenceNumber || paymentReference,
      approvedAmount,
      settledAmount,
      differenceAmount,
      settlementDate,
      paymentReference,
      status: differenceAmount > 0 ? 'PARTIALLY_PAID' : 'PAID',
      notes,
      recordedBy: username
    });

    await settlement.save();

    // 2. Update Claim Entity (Section 44: approved does not mean paid; now marked PAID)
    const prevStatus = claim.status;
    claim.settlementAmount = settledAmount;
    claim.settledAmount = settledAmount;
    claim.status = 'PAID';
    claim.paidAt = settlementDate;
    claim.updatedBy = username;
    await claim.save();

    // 3. Record Status History
    await InsuranceClaimStatusHistory.create({
      claimId,
      previousStatus: prevStatus,
      newStatus: 'PAID',
      changedBy: username,
      source: 'MANUAL',
      reason: `Claim payment settlement recorded: ${claim.currency} ${settledAmount}. Ref: ${paymentReference}`,
      insurerReference: claim.insurerReferenceNumber,
      timestamp: new Date()
    });

    // 4. Record Audit Event
    await AuditService.logEvent({
      userId: username,
      action: 'CLAIM_PAYMENT_RECORDED',
      module: 'INSURANCE_CLAIMS',
      entityType: 'InsuranceClaimSettlement',
      entityId: settlementId,
      newValue: {
        claimId,
        settledAmount,
        approvedAmount,
        paymentReference,
        status: 'PAID'
      }
    });

    // 5. Billing Reconciliation (Section 47)
    await this.reconcileClaimWithBilling(claim, settlement, username);

    // 6. Notify
    await InsuranceClaimNotificationService.notifyClaimEvent('CLAIM_PAYMENT_RECEIVED', claim);

    return {
      success: true,
      settlement,
      claim
    };
  }

  /**
   * Reconcile claim payment with invoice and detect mismatches (Section 47)
   */
  static async reconcileClaimWithBilling(claim, settlement, username = 'SYSTEM') {
    try {
      const invoice = await Invoice.findOne({ invoiceId: claim.invoiceId });
      if (!invoice) {
        console.warn(`[InsuranceClaimSettlementService] Invoice ${claim.invoiceId} not found for claim ${claim.claimId}`);
        return;
      }

      // Check difference against invoice insurance covered amount
      const expectedAmount = settlement.approvedAmount;
      const receivedAmount = settlement.settledAmount;
      const difference = Math.abs(expectedAmount - receivedAmount);

      let exceptionCase = null;

      // Section 47: If amounts do not match, create ExceptionCase
      if (difference > 1) {
        exceptionCase = await ExceptionCase.create({
          exceptionId: `EXC-CLM-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
          module: 'INSURANCE_CLAIMS',
          exceptionType: 'PAYMENT_MISMATCH',
          category: 'PAYMENT_MISMATCH',
          title: `Claim Payment Discrepancy: ${claim.claimId}`,
          description: `Expected settlement: ${claim.currency} ${expectedAmount}, Received: ${claim.currency} ${receivedAmount}. Difference: ${claim.currency} ${difference}.`,
          severity: 'MEDIUM',
          source: 'SYSTEM',
          currentStatus: 'OPEN',
          status: 'OPEN',
          entityType: 'InsuranceClaim',
          entityId: claim.claimId,
          metadata: {
            claimId: claim.claimId,
            invoiceId: invoice.invoiceId,
            expectedAmount,
            receivedAmount,
            differenceAmount: difference,
            paymentReference: settlement.paymentReference,
            correlationId: claim.correlationId
          }
        });

        settlement.exceptionCaseId = exceptionCase._id.toString();

        await AuditService.logEvent({
          userId: username,
          action: 'CLAIM_EXCEPTION_CREATED',
          module: 'INSURANCE_CLAIMS',
          entityType: 'InsuranceClaim',
          entityId: claim.claimId,
          newValue: {
            category: 'PAYMENT_MISMATCH',
            difference,
            exceptionCaseId: exceptionCase._id
          }
        });

        await InsuranceClaimNotificationService.notifyClaimEvent('CLAIM_RECONCILIATION_EXCEPTION', claim);
      }

      // Update invoice covered/paid amount safely
      if (invoice.coveredAmount === undefined || invoice.coveredAmount === 0) {
        invoice.coveredAmount = receivedAmount;
        await invoice.save();
      }

      settlement.reconciledWithBilling = true;
      settlement.reconciledAt = new Date();
      settlement.reconciledBy = username;
      await settlement.save();

      await AuditService.logEvent({
        userId: username,
        action: 'CLAIM_RECONCILED',
        module: 'INSURANCE_CLAIMS',
        entityType: 'InsuranceClaim',
        entityId: claim.claimId,
        newValue: {
          invoiceId: invoice.invoiceId,
          settledAmount: receivedAmount,
          hasDiscrepancy: difference > 1
        }
      });
    } catch (err) {
      console.error('[InsuranceClaimSettlementService] Billing reconciliation error:', err);
    }
  }
}

module.exports = InsuranceClaimSettlementService;
