const InsuranceClaim = require('../models/InsuranceClaim');
const InsuranceClaimDocument = require('../models/InsuranceClaimDocument');
const InsuranceClaimStatusHistory = require('../models/InsuranceClaimStatusHistory');
const InsurancePolicy = require('../models/InsurancePolicy');
const InsuranceVerification = require('../models/InsuranceVerification');
const Patient = require('../models/Patient');
const Invoice = require('../models/Invoice');
const AuditService = require('./AuditService');
const IdGeneratorService = require('./IdGeneratorService');
const InsuranceClaimValidationService = require('./insuranceClaimValidationService');
const InsuranceClaimNotificationService = require('./insuranceClaimNotificationService');

/**
 * InsuranceClaimService
 * Conforms to 10_INSURANCE_CLAIMS.md Section 7, 14, 15, 20, 22, 23, 24, 25, 67 & 74
 */
class InsuranceClaimService {
  /**
   * Create new claim in DRAFT status
   */
  static async createClaim(data, user = {}) {
    const {
      patientId,
      policyId,
      invoiceId,
      claimType = 'INPATIENT',
      admissionId,
      visitId,
      dischargeId,
      notes,
      totalClaimAmount: reqAmount
    } = data;

    const username = user.userId || user.username || 'STAFF';

    // 1. Resolve Patient
    const patient = await Patient.findOne({ patientId }).lean();
    if (!patient) {
      const err = new Error(`Patient ${patientId} not found`);
      err.statusCode = 404;
      throw err;
    }

    // 2. Resolve Policy
    const policy = await InsurancePolicy.findOne({
      $or: [{ policyId }, { policyNumber: policyId }],
      isDeleted: false
    }).lean();
    if (!policy) {
      const err = new Error(`Insurance policy ${policyId} not found`);
      err.statusCode = 404;
      throw err;
    }

    // 3. Resolve Invoice
    const invoice = await Invoice.findOne({ invoiceId }).lean();
    if (!invoice) {
      const err = new Error(`Invoice ${invoiceId} not found`);
      err.statusCode = 404;
      throw err;
    }

    // 4. Check Duplicate Claim (Section 23)
    const dupCheck = await InsuranceClaimValidationService.checkDuplicateClaim(
      patientId,
      policy.policyId,
      invoiceId,
      claimType
    );
    if (dupCheck.isDuplicate) {
      const err = new Error(dupCheck.message);
      err.statusCode = 409;
      err.code = 'DUPLICATE_CLAIM';
      throw err;
    }

    // 5. Resolve Latest Verification if present
    const latestVerification = await InsuranceVerification.findOne({
      policyId: policy.policyId,
      status: { $in: ['VERIFIED', 'PARTIALLY_VERIFIED'] }
    })
      .sort({ createdAt: -1 })
      .lean();

    // 6. Calculate Claim Amount & Items
    const finalAmount = reqAmount !== undefined ? Number(reqAmount) : Number(invoice.grossTotal || invoice.netTotal || 0);

    const items = (data.items && data.items.length > 0)
      ? data.items
      : (invoice.items || []).map((invItem) => ({
          serviceType: invItem.category || 'OTHER',
          serviceId: invItem.sourceId || invItem._id?.toString(),
          description: invItem.description || 'Medical Service Charge',
          serviceDate: invItem.serviceDate || new Date(),
          quantity: invItem.quantity || 1,
          unitAmount: invItem.unitPrice || 0,
          claimedAmount: invItem.totalPrice || invItem.grossAmount || 0,
          approvedAmount: 0,
          rejectedAmount: 0
        }));

    // 7. Generate IDs
    const claimId = await IdGeneratorService.generateClaimId();
    const correlationId = data.correlationId || IdGeneratorService.generateCorrelationId();

    // 8. Build Standard Document Checklist (Section 20)
    const documentChecklist = [
      {
        documentType: 'FINAL_INVOICE',
        title: 'Final Hospital Invoice',
        required: true,
        available: true,
        validated: true,
        submitted: false
      },
      {
        documentType: 'DISCHARGE_DOCUMENT',
        title: 'Discharge Summary / Clinical Notes',
        required: true,
        available: !!dischargeId || !!invoice.dischargeId,
        validated: !!dischargeId || !!invoice.dischargeId,
        submitted: false
      },
      {
        documentType: 'INSURANCE_CARD',
        title: 'Patient Insurance Card',
        required: true,
        available: true,
        validated: true,
        submitted: false
      },
      {
        documentType: 'LAB_REPORT',
        title: 'Diagnostic Lab Reports',
        required: false,
        available: false,
        validated: false,
        submitted: false
      },
      {
        documentType: 'RADIOLOGY_REPORT',
        title: 'Radiology / Imaging Reports',
        required: false,
        available: false,
        validated: false,
        submitted: false
      }
    ];

    // 9. Instantiate Claim Entity
    const newClaim = new InsuranceClaim({
      claimId,
      claimNumber: claimId,
      patientId: patient.patientId,
      patientRef: patient._id,
      patientName: patient.fullName || `${patient.firstName} ${patient.lastName}`,
      policyId: policy.policyId,
      policyRef: policy._id,
      policyNumber: policy.policyNumber,
      memberId: policy.memberId || '',
      insurerName: policy.providerName,
      providerName: policy.providerName,
      providerCode: policy.providerCode || 'GENERIC_INSURER',
      verificationId: latestVerification ? latestVerification.verificationId : undefined,
      verificationRef: latestVerification ? latestVerification._id : undefined,
      admissionId: admissionId || invoice.admissionId,
      visitId: visitId || invoice.visitId,
      dischargeId: dischargeId || invoice.dischargeId,
      invoiceId: invoice.invoiceId,
      invoiceRef: invoice._id,
      claimType,
      admissionDate: data.admissionDate || invoice.admissionDate,
      dischargeDate: data.dischargeDate || invoice.dischargeDate,
      totalClaimAmount: finalAmount,
      claimAmount: finalAmount,
      approvedAmount: 0,
      rejectedAmount: 0,
      patientResponsibilityAmount: 0,
      settlementAmount: 0,
      settledAmount: 0,
      currency: invoice.currency || 'INR',
      status: 'DRAFT',
      submissionSource: data.submissionSource || 'API',
      notes,
      correlationId,
      submissionIdempotencyKey: `CLAIM-SUBMIT-${claimId}`,
      items,
      documentChecklist,
      createdBy: username,
      updatedBy: username
    });

    await newClaim.save();

    // 10. Record Initial Status History (Section 10)
    await InsuranceClaimStatusHistory.create({
      claimId,
      previousStatus: 'NONE',
      newStatus: 'DRAFT',
      changedBy: username,
      source: 'SYSTEM',
      reason: 'Claim record created in DRAFT',
      timestamp: new Date()
    });

    // 11. Audit Event (Section 67)
    await AuditService.logEvent({
      userId: username,
      action: 'CLAIM_CREATED',
      module: 'INSURANCE_CLAIMS',
      entityType: 'InsuranceClaim',
      entityId: claimId,
      correlationId,
      newValue: {
        claimId,
        patientId,
        invoiceId,
        totalClaimAmount: finalAmount,
        status: 'DRAFT'
      }
    });

    // 12. Notification (Section 53)
    await InsuranceClaimNotificationService.notifyClaimEvent('CLAIM_CREATED', newClaim);

    return newClaim;
  }

  /**
   * List claims with filtering, pagination and sorting
   */
  static async getClaims(query = {}) {
    const {
      page = 1,
      limit = 20,
      status,
      patientId,
      policyId,
      invoiceId,
      insurerName,
      claimType,
      search,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = query;

    const filter = {};

    if (status) {
      if (Array.isArray(status)) {
        filter.status = { $in: status };
      } else {
        filter.status = status;
      }
    }

    if (patientId) filter.patientId = patientId;
    if (policyId) filter.policyId = policyId;
    if (invoiceId) filter.invoiceId = invoiceId;
    if (insurerName) filter.insurerName = new RegExp(insurerName, 'i');
    if (claimType) filter.claimType = claimType;

    if (search) {
      filter.$or = [
        { claimId: new RegExp(search, 'i') },
        { claimNumber: new RegExp(search, 'i') },
        { patientName: new RegExp(search, 'i') },
        { patientId: new RegExp(search, 'i') },
        { policyNumber: new RegExp(search, 'i') },
        { insurerReferenceNumber: new RegExp(search, 'i') }
      ];
    }

    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const skip = (pageNum - 1) * limitNum;
    const sort = { [sortBy]: sortOrder === 'asc' ? 1 : -1 };

    const [claims, total] = await Promise.all([
      InsuranceClaim.find(filter).sort(sort).skip(skip).limit(limitNum).lean(),
      InsuranceClaim.countDocuments(filter)
    ]);

    return {
      success: true,
      data: claims,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(total / limitNum)
      }
    };
  }

  /**
   * Get single claim by ID (or claimNumber)
   */
  static async getClaimById(id) {
    const claim = await InsuranceClaim.findOne({
      $or: [{ claimId: id }, { claimNumber: id }, { _id: id.match(/^[0-9a-fA-F]{24}$/) ? id : null }]
    }).lean();

    if (!claim) {
      const err = new Error(`Claim ${id} not found`);
      err.statusCode = 404;
      throw err;
    }

    // Attach documents and status history
    const [documents, statusHistory] = await Promise.all([
      InsuranceClaimDocument.find({ claimId: claim.claimId }).sort({ createdAt: -1 }).lean(),
      InsuranceClaimStatusHistory.find({ claimId: claim.claimId }).sort({ timestamp: -1 }).lean()
    ]);

    return {
      ...claim,
      documents,
      statusHistory
    };
  }

  /**
   * Update claim details
   */
  static async updateClaim(claimId, updateData, user = {}) {
    const claim = await InsuranceClaim.findOne({ claimId });
    if (!claim) {
      const err = new Error(`Claim ${claimId} not found`);
      err.statusCode = 404;
      throw err;
    }

    if (['SUBMITTED', 'UNDER_REVIEW', 'APPROVED', 'PAID'].includes(claim.status)) {
      if (updateData.totalClaimAmount && updateData.totalClaimAmount !== claim.totalClaimAmount) {
        const err = new Error(`Cannot modify claim amount for claim in status ${claim.status}`);
        err.statusCode = 400;
        throw err;
      }
    }

    const previousValue = claim.toObject();
    const username = user.userId || user.username || 'STAFF';

    const allowedUpdates = [
      'notes',
      'items',
      'claimType',
      'totalClaimAmount',
      'admissionDate',
      'dischargeDate',
      'documentChecklist'
    ];

    allowedUpdates.forEach((field) => {
      if (updateData[field] !== undefined) {
        claim[field] = updateData[field];
      }
    });

    claim.updatedBy = username;
    await claim.save();

    await AuditService.logEvent({
      userId: username,
      action: 'CLAIM_UPDATED',
      module: 'INSURANCE_CLAIMS',
      entityType: 'InsuranceClaim',
      entityId: claimId,
      oldValue: previousValue,
      newValue: claim.toObject()
    });

    return claim;
  }

  /**
   * Transition claim from DRAFT to READY (Section 22 & 25)
   */
  static async markReady(claimId, user = {}) {
    const validation = await InsuranceClaimValidationService.validateClaim(claimId);
    if (!validation.isValid) {
      const err = new Error(`Claim validation failed: ${validation.errors.join('; ')}`);
      err.statusCode = 422;
      err.errors = validation.errors;
      throw err;
    }

    const claim = await InsuranceClaim.findOne({ claimId });
    if (!claim) {
      const err = new Error(`Claim ${claimId} not found`);
      err.statusCode = 404;
      throw err;
    }

    if (claim.status !== 'DRAFT') {
      const err = new Error(`Only DRAFT claims can be marked READY. Current status: ${claim.status}`);
      err.statusCode = 400;
      throw err;
    }

    const prevStatus = claim.status;
    claim.status = 'READY';
    const username = user.userId || user.username || 'STAFF';
    claim.updatedBy = username;
    await claim.save();

    await InsuranceClaimStatusHistory.create({
      claimId,
      previousStatus: prevStatus,
      newStatus: 'READY',
      changedBy: username,
      source: 'MANUAL',
      reason: 'Claim validated and approved for submission',
      timestamp: new Date()
    });

    await AuditService.logEvent({
      userId: username,
      action: 'CLAIM_MARKED_READY',
      module: 'INSURANCE_CLAIMS',
      entityType: 'InsuranceClaim',
      entityId: claimId,
      oldValue: { status: prevStatus },
      newValue: { status: 'READY' }
    });

    await InsuranceClaimNotificationService.notifyClaimEvent('CLAIM_READY', claim);

    return claim;
  }

  /**
   * Cancel claim (Section 6 & 25)
   */
  static async cancelClaim(claimId, reason = 'Cancelled by staff', user = {}) {
    const claim = await InsuranceClaim.findOne({ claimId });
    if (!claim) {
      const err = new Error(`Claim ${claimId} not found`);
      err.statusCode = 404;
      throw err;
    }

    if (!['DRAFT', 'READY'].includes(claim.status)) {
      const err = new Error(`Cannot cancel claim in status ${claim.status}. Submitted claims cannot be silently cancelled.`);
      err.statusCode = 400;
      throw err;
    }

    const prevStatus = claim.status;
    claim.status = 'CANCELLED';
    claim.cancellationReason = reason;
    const username = user.userId || user.username || 'STAFF';
    claim.updatedBy = username;
    await claim.save();

    await InsuranceClaimStatusHistory.create({
      claimId,
      previousStatus: prevStatus,
      newStatus: 'CANCELLED',
      changedBy: username,
      source: 'MANUAL',
      reason,
      timestamp: new Date()
    });

    await AuditService.logEvent({
      userId: username,
      action: 'CLAIM_CANCELLED',
      module: 'INSURANCE_CLAIMS',
      entityType: 'InsuranceClaim',
      entityId: claimId,
      oldValue: { status: prevStatus },
      newValue: { status: 'CANCELLED', cancellationReason: reason }
    });

    return claim;
  }

  /**
   * Integration endpoints for Billing (Section 46)
   */
  static async getClaimsByPatient(patientId) {
    return InsuranceClaim.find({ patientId }).sort({ createdAt: -1 }).lean();
  }

  static async getClaimsByInvoice(invoiceId) {
    return InsuranceClaim.find({ invoiceId }).sort({ createdAt: -1 }).lean();
  }

  /**
   * Add supporting document to claim (Section 9, 20 & 54)
   */
  static async addDocument(claimId, documentData, user = {}) {
    const claim = await InsuranceClaim.findOne({ claimId });
    if (!claim) {
      const err = new Error(`Claim ${claimId} not found`);
      err.statusCode = 404;
      throw err;
    }

    const val = InsuranceClaimValidationService.validateDocument({
      ...documentData,
      claimId,
      patientId: claim.patientId
    });
    if (!val.isValid) {
      const err = new Error(val.errors.join('; '));
      err.statusCode = 400;
      throw err;
    }

    const documentId = await IdGeneratorService.generateClaimDocumentId();
    const username = user.userId || user.username || 'STAFF';

    const doc = new InsuranceClaimDocument({
      documentId,
      claimId,
      claimRef: claim._id,
      patientId: claim.patientId,
      documentType: documentData.documentType,
      fileName: documentData.fileName,
      fileUrl: documentData.fileUrl || `/uploads/claims/${documentId}_${documentData.fileName}`,
      storageKey: documentData.storageKey || `claims/${claimId}/${documentId}`,
      fileSize: documentData.fileSize || 1024,
      mimeType: documentData.mimeType || 'application/pdf',
      version: documentData.version || 1,
      required: documentData.required || false,
      uploadedBy: username,
      verificationStatus: 'VALID',
      notes: documentData.notes
    });

    await doc.save();

    // Update claim checklist
    const checklist = claim.documentChecklist || [];
    const item = checklist.find((c) => c.documentType === documentData.documentType);
    if (item) {
      item.available = true;
      item.validated = true;
      item.documentId = documentId;
    } else {
      checklist.push({
        documentType: documentData.documentType,
        title: documentData.fileName,
        required: false,
        available: true,
        validated: true,
        submitted: false,
        documentId
      });
    }

    claim.documentChecklist = checklist;
    if (!claim.documentIds.includes(documentId)) {
      claim.documentIds.push(documentId);
    }
    await claim.save();

    await AuditService.logEvent({
      userId: username,
      action: 'CLAIM_DOCUMENT_ADDED',
      module: 'INSURANCE_CLAIMS',
      entityType: 'InsuranceClaimDocument',
      entityId: documentId,
      newValue: { claimId, documentType: documentData.documentType, fileName: documentData.fileName }
    });

    return doc;
  }

  /**
   * Delete supporting document from claim (Section 63)
   */
  static async deleteDocument(claimId, documentId, user = {}) {
    const doc = await InsuranceClaimDocument.findOne({ claimId, documentId });
    if (!doc) {
      const err = new Error(`Document ${documentId} for claim ${claimId} not found`);
      err.statusCode = 404;
      throw err;
    }

    if (doc.submittedToInsurer) {
      const err = new Error('Cannot delete document that has already been submitted to insurer');
      err.statusCode = 400;
      throw err;
    }

    doc.isArchived = true;
    await doc.save();

    const username = user.userId || user.username || 'STAFF';

    await AuditService.logEvent({
      userId: username,
      action: 'CLAIM_DOCUMENT_DELETED',
      module: 'INSURANCE_CLAIMS',
      entityType: 'InsuranceClaimDocument',
      entityId: documentId,
      oldValue: { documentId, fileName: doc.fileName }
    });

    return { success: true, message: 'Document archived successfully' };
  }

  /**
   * Aggregated Dashboard Statistics (Section 74 & 75)
   */
  static async getDashboardStats() {
    const claims = await InsuranceClaim.find().lean();

    const stats = {
      totalClaims: claims.length,
      draft: 0,
      ready: 0,
      submitted: 0,
      underReview: 0,
      query: 0,
      moreInfoRequired: 0,
      approved: 0,
      partiallyApproved: 0,
      rejected: 0,
      paid: 0,
      cancelled: 0,
      totalClaimedAmount: 0,
      totalApprovedAmount: 0,
      totalSettledAmount: 0,
      totalRejectedAmount: 0,
      pendingPaymentAmount: 0,
      agingBuckets: {
        '0-7 Days': 0,
        '8-15 Days': 0,
        '16-30 Days': 0,
        '31-60 Days': 0,
        '60+ Days': 0
      },
      providerStats: {}
    };

    const now = Date.now();

    claims.forEach((clm) => {
      const st = clm.status;
      if (st === 'DRAFT') stats.draft++;
      else if (st === 'READY') stats.ready++;
      else if (st === 'SUBMITTED') stats.submitted++;
      else if (st === 'UNDER_REVIEW') stats.underReview++;
      else if (st === 'QUERY') stats.query++;
      else if (st === 'MORE_INFORMATION_REQUIRED') stats.moreInfoRequired++;
      else if (st === 'APPROVED') stats.approved++;
      else if (st === 'PARTIALLY_APPROVED') stats.partiallyApproved++;
      else if (st === 'REJECTED') stats.rejected++;
      else if (st === 'PAID') stats.paid++;
      else if (st === 'CANCELLED') stats.cancelled++;

      stats.totalClaimedAmount += clm.totalClaimAmount || clm.claimAmount || 0;
      stats.totalApprovedAmount += clm.approvedAmount || 0;
      stats.totalSettledAmount += clm.settlementAmount || clm.settledAmount || 0;
      stats.totalRejectedAmount += clm.rejectedAmount || 0;

      if (['APPROVED', 'PARTIALLY_APPROVED'].includes(st)) {
        const approved = clm.approvedAmount || 0;
        const settled = clm.settlementAmount || clm.settledAmount || 0;
        stats.pendingPaymentAmount += Math.max(0, approved - settled);
      }

      // Aging
      if (['SUBMITTED', 'UNDER_REVIEW', 'QUERY', 'MORE_INFORMATION_REQUIRED'].includes(st) && clm.submittedAt) {
        const days = Math.floor((now - new Date(clm.submittedAt).getTime()) / (1000 * 60 * 60 * 24));
        if (days <= 7) stats.agingBuckets['0-7 Days']++;
        else if (days <= 15) stats.agingBuckets['8-15 Days']++;
        else if (days <= 30) stats.agingBuckets['16-30 Days']++;
        else if (days <= 60) stats.agingBuckets['31-60 Days']++;
        else stats.agingBuckets['60+ Days']++;
      }

      // Provider Stats
      const prov = clm.insurerName || 'Other';
      if (!stats.providerStats[prov]) {
        stats.providerStats[prov] = {
          total: 0,
          approved: 0,
          rejected: 0,
          pending: 0,
          paid: 0,
          totalAmount: 0
        };
      }
      stats.providerStats[prov].total++;
      stats.providerStats[prov].totalAmount += clm.totalClaimAmount || 0;
      if (clm.status === 'APPROVED') stats.providerStats[prov].approved++;
      else if (clm.status === 'REJECTED') stats.providerStats[prov].rejected++;
      else if (clm.status === 'PAID') stats.providerStats[prov].paid++;
      else if (['SUBMITTED', 'UNDER_REVIEW', 'QUERY', 'MORE_INFORMATION_REQUIRED'].includes(clm.status)) {
        stats.providerStats[prov].pending++;
      }
    });

    return stats;
  }
}

module.exports = InsuranceClaimService;
