const VendorPerformanceReview = require('../../models/VendorPerformanceReview');
const PurchaseOrder = require('../../models/PurchaseOrder');
const Delivery = require('../../models/Delivery');
const SupplierInvoice = require('../../models/SupplierInvoice');
const VendorIssue = require('../../models/VendorIssue');
const Vendor = require('../../models/Vendor');
const AuditEvent = require('../../models/AuditEvent');
const IdGeneratorService = require('../IdGeneratorService');

class VendorPerformanceService {
  /**
   * Calculate live performance metrics for a vendor in a given date window
   */
  static async calculateMetrics(vendorId, periodStart, periodEnd) {
    const start = new Date(periodStart);
    const end = new Date(periodEnd);

    // 1. Purchase Orders
    const pos = await PurchaseOrder.find({
      vendorId,
      createdAt: { $gte: start, $lte: end },
      status: { $ne: 'CANCELLED' }
    }).lean();

    const totalPurchaseOrders = pos.length;
    const totalSpend = pos.reduce((sum, p) => sum + (p.grandTotal || 0), 0);

    // 2. Deliveries (On-time delivery %)
    const deliveries = await Delivery.find({
      vendorId,
      createdAt: { $gte: start, $lte: end }
    }).lean();

    let onTimeCount = 0;
    deliveries.forEach((d) => {
      if (d.status === 'DELIVERED') {
        const actual = d.actualDeliveryDate ? new Date(d.actualDeliveryDate) : new Date(d.updatedAt);
        const expected = new Date(d.expectedDeliveryDate);
        if (actual <= expected) onTimeCount++;
      }
    });

    const onTimeDeliveryPercent = deliveries.length > 0 ? Math.round((onTimeCount / deliveries.length) * 100) : 100;

    // 3. Invoice match accuracy
    const invoices = await SupplierInvoice.find({
      vendorId,
      createdAt: { $gte: start, $lte: end }
    }).lean();

    const matchedInvoices = invoices.filter((i) => ['MATCHED', 'APPROVED'].includes(i.status)).length;
    const invoiceAccuracyPercent = invoices.length > 0 ? Math.round((matchedInvoices / invoices.length) * 100) : 100;

    // 4. Vendor Issues
    const issues = await VendorIssue.find({
      vendorId,
      createdAt: { $gte: start, $lte: end }
    }).lean();

    const issueCount = issues.length;
    const resolvedIssuesCount = issues.filter((i) => ['RESOLVED', 'CLOSED'].includes(i.status)).length;

    // Quantity accuracy heuristic
    let totalItems = 0;
    let accurateItems = 0;
    pos.forEach((p) => {
      (p.items || []).forEach((item) => {
        totalItems++;
        if (item.receivedQuantity >= item.quantity) accurateItems++;
      });
    });
    const quantityAccuracyPercent = totalItems > 0 ? Math.round((accurateItems / totalItems) * 100) : 100;

    // Overall Score Calculation (Weighted blend):
    // 35% On-Time Delivery + 25% Quantity Accuracy + 20% Invoice Accuracy + 20% Issue Resolution Ratio
    const issueResolutionRatio = issueCount > 0 ? (resolvedIssuesCount / issueCount) * 100 : 100;
    const overallScore = Math.round(
      onTimeDeliveryPercent * 0.35 +
      quantityAccuracyPercent * 0.25 +
      invoiceAccuracyPercent * 0.2 +
      issueResolutionRatio * 0.2
    );

    let ratingGrade = 'EXCELLENT';
    if (overallScore >= 90) ratingGrade = 'EXCELLENT';
    else if (overallScore >= 75) ratingGrade = 'GOOD';
    else if (overallScore >= 60) ratingGrade = 'SATISFACTORY';
    else if (overallScore >= 40) ratingGrade = 'POOR';
    else ratingGrade = 'CRITICAL';

    return {
      metrics: {
        onTimeDeliveryPercent,
        quantityAccuracyPercent,
        qualityRating: Math.min(5, Math.max(1, Math.round((overallScore / 100) * 5))),
        responseTimeHours: 24,
        invoiceAccuracyPercent,
        issueCount,
        resolvedIssuesCount,
        totalPurchaseOrders,
        totalSpend
      },
      overallScore,
      ratingGrade
    };
  }

  /**
   * Create a formal performance review
   */
  static async createReview(vendorId, reviewData, createdBy) {
    const { periodStart, periodEnd, comments, actionPlan } = reviewData;
    const vendor = await Vendor.findOne({ vendorId });
    if (!vendor) {
      throw new Error(`Vendor ${vendorId} not found`);
    }

    const calculated = await this.calculateMetrics(vendorId, periodStart, periodEnd);
    const reviewId = await IdGeneratorService.generateVendorReviewId();

    const review = new VendorPerformanceReview({
      reviewId,
      vendorId,
      periodStart: new Date(periodStart),
      periodEnd: new Date(periodEnd),
      metrics: calculated.metrics,
      overallScore: calculated.overallScore,
      ratingGrade: calculated.ratingGrade,
      reviewStatus: 'DRAFT',
      reviewedBy: createdBy,
      reviewedAt: new Date(),
      comments: comments || '',
      actionPlan: actionPlan || ''
    });

    await review.save();

    await AuditEvent.create({
      eventType: 'PERFORMANCE_REVIEW_CREATED',
      entityId: vendorId,
      entityType: 'VendorPerformanceReview',
      userId: createdBy || 'SYSTEM',
      description: `Performance review ${reviewId} drafted for ${vendor.displayName} (Score: ${calculated.overallScore})`,
      metadata: { reviewId, overallScore: calculated.overallScore, ratingGrade: calculated.ratingGrade }
    }).catch(() => {});

    return review;
  }

  /**
   * Finalize and complete a performance review
   */
  static async completeReview(reviewId, completedBy) {
    const review = await VendorPerformanceReview.findOne({ reviewId });
    if (!review) {
      throw new Error(`Review ${reviewId} not found`);
    }

    review.reviewStatus = 'COMPLETED';
    review.reviewedBy = completedBy;
    review.reviewedAt = new Date();
    await review.save();

    await AuditEvent.create({
      eventType: 'PERFORMANCE_REVIEW_COMPLETED',
      entityId: review.vendorId,
      entityType: 'VendorPerformanceReview',
      userId: completedBy || 'SYSTEM',
      description: `Performance review ${reviewId} completed by ${completedBy}`,
      metadata: { reviewId, overallScore: review.overallScore }
    }).catch(() => {});

    return review;
  }

  /**
   * Get reviews by vendor
   */
  static async getReviewsByVendor(vendorId) {
    return await VendorPerformanceReview.find({ vendorId }).sort({ createdAt: -1 });
  }
}

module.exports = VendorPerformanceService;
