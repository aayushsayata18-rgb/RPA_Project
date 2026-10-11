const InsuranceClaimQueryService = require('../services/insuranceClaimQueryService');

class InsuranceClaimQueryController {
  // GET /api/insurance/claims/:id/queries
  static async getQueries(req, res, next) {
    try {
      const queries = await InsuranceClaimQueryService.getQueries(req.params.id);
      res.json({
        success: true,
        data: queries
      });
    } catch (err) {
      next(err);
    }
  }

  // POST /api/insurance/claims/:id/queries
  static async createQuery(req, res, next) {
    try {
      const query = await InsuranceClaimQueryService.createQuery(req.params.id, req.body, req.user || {});
      res.status(201).json({
        success: true,
        message: 'Query recorded successfully',
        data: query
      });
    } catch (err) {
      next(err);
    }
  }

  // POST /api/insurance/claims/:id/queries/:queryId/respond
  static async respondToQuery(req, res, next) {
    try {
      const query = await InsuranceClaimQueryService.respondToQuery(
        req.params.id,
        req.params.queryId,
        req.body,
        req.user || {}
      );
      res.json({
        success: true,
        message: 'Response prepared and submitted to insurer',
        data: query
      });
    } catch (err) {
      next(err);
    }
  }

  // POST /api/insurance/claims/:id/queries/:queryId/resolve
  static async resolveQuery(req, res, next) {
    try {
      const query = await InsuranceClaimQueryService.resolveQuery(
        req.params.id,
        req.params.queryId,
        req.user || {}
      );
      res.json({
        success: true,
        message: 'Query marked resolved',
        data: query
      });
    } catch (err) {
      next(err);
    }
  }
}

module.exports = InsuranceClaimQueryController;
