const InsuranceClaim = require('../models/InsuranceClaim');
const InsuranceClaimQuery = require('../models/InsuranceClaimQuery');
const InsuranceClaimStatusHistory = require('../models/InsuranceClaimStatusHistory');
const AuditService = require('./AuditService');
const IdGeneratorService = require('./IdGeneratorService');
const providerRegistry = require('../integrations/insurance/claims/providerRegistry');
const InsuranceClaimNotificationService = require('./insuranceClaimNotificationService');

/**
 * InsuranceClaimQueryService
 * Conforms to 10_INSURANCE_CLAIMS.md Section 11, 35, 36, 37, 38 & 39
 */
class InsuranceClaimQueryService {
  /**
   * Get all queries for a claim
   */
  static async getQueries(claimId) {
    return InsuranceClaimQuery.find({ claimId }).sort({ receivedAt: -1 }).lean();
  }

  /**
   * Create query raised by insurer (or recorded by staff)
   */
  static async createQuery(claimId, queryData, user = {}) {
    const claim = await InsuranceClaim.findOne({ claimId });
    if (!claim) {
      const err = new Error(`Claim ${claimId} not found`);
      err.statusCode = 404;
      throw err;
    }

    const queryId = await IdGeneratorService.generateClaimQueryId();
    const username = user.userId || user.username || 'SYSTEM';

    const newQuery = new InsuranceClaimQuery({
      queryId,
      claimId: claim.claimId,
      queryReference: queryData.queryReference || `QRY-REF-${Date.now()}`,
      queryType: queryData.queryType || 'MISSING_DOCUMENT',
      queryText: queryData.queryText,
      requestedDocuments: queryData.requestedDocuments || [],
      receivedAt: queryData.receivedAt || new Date(),
      dueDate: queryData.dueDate,
      status: 'OPEN',
      responsibleDepartment: queryData.responsibleDepartment || 'BILLING',
      notes: queryData.notes
    });

    await newQuery.save();

    // Transition claim status to QUERY or MORE_INFORMATION_REQUIRED (Section 35 & 38)
    const prevStatus = claim.status;
    const targetStatus = queryData.queryType === 'MISSING_DOCUMENT' ? 'MORE_INFORMATION_REQUIRED' : 'QUERY';

    claim.status = targetStatus;
    claim.queryReason = queryData.queryText;
    claim.updatedBy = username;
    await claim.save();

    await InsuranceClaimStatusHistory.create({
      claimId,
      previousStatus: prevStatus,
      newStatus: targetStatus,
      changedBy: username,
      source: 'API',
      reason: `Query raised: ${queryData.queryText}`,
      timestamp: new Date()
    });

    await AuditService.logEvent({
      userId: username,
      action: 'CLAIM_QUERY_CREATED',
      module: 'INSURANCE_CLAIMS',
      entityType: 'InsuranceClaimQuery',
      entityId: queryId,
      newValue: { claimId, queryType: queryData.queryType, queryText: queryData.queryText }
    });

    await InsuranceClaimNotificationService.notifyClaimEvent('CLAIM_QUERY_RECEIVED', claim);

    return newQuery;
  }

  /**
   * Prepare and submit response to insurer query (Section 36 & 39)
   */
  static async respondToQuery(claimId, queryId, responseData, user = {}) {
    const query = await InsuranceClaimQuery.findOne({ claimId, queryId });
    if (!query) {
      const err = new Error(`Query ${queryId} for claim ${claimId} not found`);
      err.statusCode = 404;
      throw err;
    }

    const claim = await InsuranceClaim.findOne({ claimId });
    if (!claim) {
      const err = new Error(`Claim ${claimId} not found`);
      err.statusCode = 404;
      throw err;
    }

    const username = user.userId || user.username || 'STAFF';

    query.responseText = responseData.responseText;
    query.respondedDocuments = responseData.documentIds || [];
    query.respondedBy = username;
    query.respondedAt = new Date();
    query.status = 'SUBMITTED';
    await query.save();

    // Submit response via insurer adapter
    const provider = providerRegistry.getProvider(
      claim.providerCode || claim.insurerName,
      claim.submissionSource === 'INSURER_PORTAL_RPA' ? 'PORTAL' : 'API'
    );

    try {
      await provider.respondToQuery(claim.insurerReferenceNumber || claim.claimId, {
        queryId,
        responseText: responseData.responseText,
        documentIds: responseData.documentIds
      });
    } catch (adapterErr) {
      console.warn('[InsuranceClaimQueryService] Adapter query submission warning:', adapterErr.message);
    }

    // Move claim back to UNDER_REVIEW (Section 36 & 39)
    const prevStatus = claim.status;
    claim.status = 'UNDER_REVIEW';
    claim.updatedBy = username;
    await claim.save();

    await InsuranceClaimStatusHistory.create({
      claimId,
      previousStatus: prevStatus,
      newStatus: 'UNDER_REVIEW',
      changedBy: username,
      source: 'MANUAL',
      reason: `Response submitted to query ${queryId}`,
      timestamp: new Date()
    });

    await AuditService.logEvent({
      userId: username,
      action: 'CLAIM_QUERY_RESPONDED',
      module: 'INSURANCE_CLAIMS',
      entityType: 'InsuranceClaimQuery',
      entityId: queryId,
      newValue: {
        claimId,
        responseText: responseData.responseText,
        status: 'SUBMITTED'
      }
    });

    await InsuranceClaimNotificationService.notifyClaimEvent('CLAIM_UNDER_REVIEW', claim);

    return query;
  }

  /**
   * Mark query RESOLVED
   */
  static async resolveQuery(claimId, queryId, user = {}) {
    const query = await InsuranceClaimQuery.findOne({ claimId, queryId });
    if (!query) {
      const err = new Error(`Query ${queryId} not found`);
      err.statusCode = 404;
      throw err;
    }

    query.status = 'RESOLVED';
    await query.save();

    const username = user.userId || user.username || 'STAFF';

    await AuditService.logEvent({
      userId: username,
      action: 'CLAIM_QUERY_RESOLVED',
      module: 'INSURANCE_CLAIMS',
      entityType: 'InsuranceClaimQuery',
      entityId: queryId,
      newValue: { status: 'RESOLVED' }
    });

    return query;
  }
}

module.exports = InsuranceClaimQueryService;
