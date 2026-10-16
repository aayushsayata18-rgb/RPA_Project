const QuotationComparison = require('../../models/QuotationComparison');
const Quotation = require('../../models/Quotation');
const RFQ = require('../../models/RFQ');
const IdGeneratorService = require('../IdGeneratorService');
const AuditService = require('../AuditService');
const NotificationService = require('../NotificationService');

class ComparisonService {
  /**
   * Run objective quotation comparison on received quotations
   */
  static async createComparison(data, user = { userId: 'SYSTEM', role: 'PROCUREMENT_OFFICER' }) {
    if (!data.rfqId) throw new Error('RFQ ID is required');

    const rfq = await RFQ.findOne({ rfqId: data.rfqId }).lean();
    if (!rfq) throw new Error(`RFQ ${data.rfqId} not found`);

    let quotationIds = data.quotationIds;
    if (!quotationIds || quotationIds.length === 0) {
      const activeQuotes = await Quotation.find({
        rfqId: data.rfqId,
        status: { $in: ['RECEIVED', 'UNDER_REVIEW', 'SHORTLISTED', 'ACCEPTED'] }
      }).select('quotationId').lean();
      quotationIds = activeQuotes.map((q) => q.quotationId);
    }

    if (quotationIds.length === 0) {
      throw new Error('No valid quotations found to compare for this RFQ');
    }

    const quotes = await Quotation.find({ quotationId: { $in: quotationIds } }).lean();

    // Objective scoring calculation
    const prices = quotes.map((q) => q.grandTotal);
    const minPrice = Math.min(...prices);

    const deliveryDaysList = quotes.map((q) => {
      const maxItemDays = Math.max(...(q.items.map((i) => i.deliveryDays || 7)));
      return maxItemDays;
    });
    const minDelivery = Math.min(...deliveryDaysList);

    let recommendedVendorId = null;
    let recommendedQuotationId = null;
    let bestScore = -1;

    const matrix = quotes.map((q, idx) => {
      const grandTotal = q.grandTotal;
      const deliveryDays = deliveryDaysList[idx] || 7;

      // Price score: lowest gets 100, others scaled inversely
      const priceScore = grandTotal > 0 ? Math.round((minPrice / grandTotal) * 100) : 100;
      // Delivery score: fastest gets 100
      const deliveryScore = deliveryDays > 0 ? Math.round((minDelivery / deliveryDays) * 100) : 100;
      // Compliance check
      const compliantItems = q.items.filter((i) => i.compliance !== false).length;
      const complianceScore = Math.round((compliantItems / (q.items.length || 1)) * 100);

      // Weighted score: 50% Price, 30% Delivery, 20% Compliance
      const overallScore = Math.round(priceScore * 0.5 + deliveryScore * 0.3 + complianceScore * 0.2);

      if (overallScore > bestScore) {
        bestScore = overallScore;
        recommendedVendorId = q.vendorId;
        recommendedQuotationId = q.quotationId;
      }

      return {
        vendorId: q.vendorId,
        vendorName: q.vendorName,
        quotationId: q.quotationId,
        grandTotal,
        deliveryDays,
        warrantyPeriod: q.warrantyPeriod || '1 Year',
        paymentTerms: q.paymentTerms || 'Net 30',
        complianceScore,
        priceScore,
        deliveryScore,
        overallScore,
        isCompliant: complianceScore >= 100,
        notes: q.notes || ''
      };
    });

    const comparisonId = await IdGeneratorService.generateComparisonId();

    const comparison = new QuotationComparison({
      comparisonId,
      rfqId: data.rfqId,
      title: data.title || `Quotation Comparison for ${rfq.title}`,
      purchaseRequestIds: rfq.purchaseRequestIds || [],
      quotationIds,
      comparisonMatrix: matrix,
      recommendedVendorId,
      recommendedQuotationId,
      recommendationReason: `System objective recommendation based on combined pricing (₹${minPrice.toLocaleString()}), delivery, and compliance score (${bestScore}/100).`,
      approvalStatus: 'RECOMMENDED',
      notes: data.notes || ''
    });

    await comparison.save();

    await AuditService.logEvent({
      userId: user.userId,
      role: user.role,
      action: 'QUOTATION_COMPARISON_CREATED',
      module: 'PROCUREMENT',
      entityType: 'QuotationComparison',
      entityId: comparisonId,
      newValue: { quotationCount: quotes.length, recommendedVendorId, bestScore },
      details: `Generated Quotation Comparison ${comparisonId} for RFQ ${data.rfqId}.`
    });

    return comparison;
  }

  /**
   * Human Vendor Selection (Section 32 & 33)
   * System recommends, human makes the decision with mandatory selection reason
   */
  static async selectVendor(id, selectionData, user = { userId: 'SYSTEM', role: 'PROCUREMENT_MANAGER' }) {
    const { selectedVendorId, selectedQuotationId, selectionReason } = selectionData;

    if (!selectedVendorId) throw new Error('Selected Vendor ID is required');
    if (!selectedQuotationId) throw new Error('Selected Quotation ID is required');
    if (!selectionReason || selectionReason.trim() === '') {
      throw new Error('Mandatory requirement: Selection reason must be provided when choosing a vendor.');
    }

    const comparison = await QuotationComparison.findOne({ comparisonId: id });
    if (!comparison) throw new Error(`Comparison ${id} not found`);

    comparison.selectedVendorId = selectedVendorId;
    comparison.selectedQuotationId = selectedQuotationId;
    comparison.selectionReason = selectionReason;
    comparison.selectedBy = user.userId;
    comparison.selectedAt = new Date();
    comparison.approvalStatus = 'APPROVED';
    comparison.approvedBy = user.userId;
    comparison.approvedAt = new Date();

    await comparison.save();

    // Mark winning quotation as ACCEPTED, others as REJECTED or SHORTLISTED
    await Quotation.updateMany(
      { rfqId: comparison.rfqId, quotationId: { $ne: selectedQuotationId } },
      { $set: { status: 'REJECTED' } }
    );
    await Quotation.updateOne(
      { quotationId: selectedQuotationId },
      { $set: { status: 'ACCEPTED' } }
    );

    await AuditService.logEvent({
      userId: user.userId,
      role: user.role,
      action: 'VENDOR_SELECTED',
      module: 'PROCUREMENT',
      entityType: 'QuotationComparison',
      entityId: id,
      newValue: { selectedVendorId, selectedQuotationId, selectionReason },
      details: `Vendor ${selectedVendorId} selected for RFQ ${comparison.rfqId}. Reason: ${selectionReason}`
    });

    await NotificationService.sendNotification({
      channel: 'IN_APP',
      event: 'VENDOR_SELECTED',
      title: `Vendor Selected for RFQ ${comparison.rfqId}`,
      message: `Vendor ${selectedVendorId} was selected by ${user.name || user.userId}. Reason: ${selectionReason}. Ready for Purchase Order creation.`,
      entityType: 'QuotationComparison',
      entityId: id
    });

    return comparison;
  }

  /**
   * Get comparisons list
   */
  static async getComparisons(query = {}) {
    const filter = {};
    if (query.rfqId) filter.rfqId = query.rfqId;
    if (query.selectedVendorId) filter.selectedVendorId = query.selectedVendorId;
    if (query.approvalStatus) filter.approvalStatus = query.approvalStatus;

    const page = Math.max(1, parseInt(query.page, 10) || 1);
    const limit = Math.max(1, Math.min(100, parseInt(query.limit, 10) || 20));
    const skip = (page - 1) * limit;

    const [comparisons, total] = await Promise.all([
      QuotationComparison.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      QuotationComparison.countDocuments(filter)
    ]);

    return {
      comparisons,
      total,
      page,
      totalPages: Math.ceil(total / limit)
    };
  }

  static async getComparisonById(id) {
    const comparison = await QuotationComparison.findOne({ comparisonId: id }).lean();
    if (!comparison) throw new Error(`Quotation Comparison ${id} not found`);
    return comparison;
  }
}

module.exports = ComparisonService;
