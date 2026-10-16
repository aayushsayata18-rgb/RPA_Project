const VendorPerformanceService = require('../services/vendor/vendorPerformanceService');

class VendorPerformanceController {
  /**
   * GET /api/vendors/:id/performance
   */
  static async getPerformance(req, res, next) {
    try {
      const reviews = await VendorPerformanceService.getReviewsByVendor(req.params.id);
      const now = new Date();
      const past90Days = new Date();
      past90Days.setDate(now.getDate() - 90);

      const liveMetrics = await VendorPerformanceService.calculateMetrics(
        req.params.id,
        req.query.periodStart || past90Days,
        req.query.periodEnd || now
      );

      res.json({
        success: true,
        data: {
          liveMetrics,
          reviews
        }
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/vendors/:id/performance/reviews
   */
  static async createReview(req, res, next) {
    try {
      const createdBy = req.user ? `${req.user.firstName} ${req.user.lastName}` : 'SYSTEM';
      const review = await VendorPerformanceService.createReview(
        req.params.id,
        req.body,
        createdBy
      );
      res.status(201).json({
        success: true,
        message: 'Performance review drafted',
        data: review
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/vendors/:id/performance/reviews/:reviewId/complete
   */
  static async completeReview(req, res, next) {
    try {
      const completedBy = req.user ? `${req.user.firstName} ${req.user.lastName}` : 'SYSTEM';
      const review = await VendorPerformanceService.completeReview(req.params.reviewId, completedBy);
      res.json({
        success: true,
        message: 'Performance review finalized',
        data: review
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = VendorPerformanceController;
