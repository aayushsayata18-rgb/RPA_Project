const VendorIssueService = require('../services/vendor/vendorIssueService');

class VendorIssueController {
  /**
   * GET /api/vendors/:id/issues
   */
  static async getIssuesByVendor(req, res, next) {
    try {
      const issues = await VendorIssueService.getIssuesByVendor(req.params.id);
      res.json({
        success: true,
        data: issues
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/vendors/issues/all
   * List all issues across vendors
   */
  static async listAllIssues(req, res, next) {
    try {
      const filters = {
        status: req.query.status,
        severity: req.query.severity,
        vendorId: req.query.vendorId,
        category: req.query.category
      };
      const pagination = {
        page: req.query.page,
        limit: req.query.limit
      };
      const result = await VendorIssueService.listIssues(filters, pagination);
      res.json({
        success: true,
        data: result.issues,
        pagination: result.pagination
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/vendors/:id/issues
   */
  static async createIssue(req, res, next) {
    try {
      const reportedBy = req.user ? `${req.user.firstName} ${req.user.lastName}` : 'SYSTEM';
      const issue = await VendorIssueService.createIssue(
        { ...req.body, vendorId: req.params.id },
        reportedBy
      );
      res.status(201).json({
        success: true,
        message: 'Vendor issue registered',
        data: issue
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/vendors/issues/:issueId/respond
   * Vendor responds to an issue (vendor portal)
   */
  static async respondToIssue(req, res, next) {
    try {
      const respondedBy = req.user ? `${req.user.firstName} ${req.user.lastName} (${req.user.role})` : 'VENDOR';
      const issue = await VendorIssueService.recordVendorResponse(req.params.issueId, req.body, respondedBy);
      res.json({
        success: true,
        message: 'Vendor response submitted',
        data: issue
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/vendors/:id/issues/:issueId/resolve
   */
  static async resolveIssue(req, res, next) {
    try {
      const resolvedBy = req.user ? `${req.user.firstName} ${req.user.lastName}` : 'SYSTEM';
      const issue = await VendorIssueService.resolveIssue(
        req.params.issueId,
        req.body,
        resolvedBy
      );
      res.json({
        success: true,
        message: 'Issue marked as resolved',
        data: issue
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * PATCH /api/vendors/issues/:issueId/status
   */
  static async updateStatus(req, res, next) {
    try {
      const updatedBy = req.user ? `${req.user.firstName} ${req.user.lastName}` : 'SYSTEM';
      const issue = await VendorIssueService.updateStatus(
        req.params.issueId,
        req.body.status,
        req.body.notes,
        updatedBy
      );
      res.json({
        success: true,
        message: `Issue status updated to ${req.body.status}`,
        data: issue
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = VendorIssueController;
