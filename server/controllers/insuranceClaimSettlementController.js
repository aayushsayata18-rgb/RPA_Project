const InsuranceClaimSettlementService = require('../services/insuranceClaimSettlementService');

class InsuranceClaimSettlementController {
  // GET /api/insurance/claims/:id/settlement
  static async getSettlement(req, res, next) {
    try {
      const settlement = await InsuranceClaimSettlementService.getSettlement(req.params.id);
      res.json({
        success: true,
        data: settlement
      });
    } catch (err) {
      next(err);
    }
  }

  // POST /api/insurance/claims/:id/settlement
  static async recordSettlement(req, res, next) {
    try {
      const result = await InsuranceClaimSettlementService.recordSettlement(
        req.params.id,
        req.body,
        req.user || {}
      );
      res.status(201).json({
        success: true,
        message: 'Settlement recorded and billing reconciled successfully',
        data: result
      });
    } catch (err) {
      next(err);
    }
  }

  // POST /api/insurance/claims/:id/reconcile
  static async reconcile(req, res, next) {
    try {
      const settlements = await InsuranceClaimSettlementService.getSettlement(req.params.id);
      const claim = await require('../models/InsuranceClaim').findOne({ claimId: req.params.id });
      if (!claim) {
        return res.status(404).json({ success: false, message: 'Claim not found' });
      }

      if (settlements.length > 0) {
        await InsuranceClaimSettlementService.reconcileClaimWithBilling(
          claim,
          settlements[0],
          req.user?.username || 'STAFF'
        );
      }

      res.json({
        success: true,
        message: 'Claim reconciled with billing invoice successfully'
      });
    } catch (err) {
      next(err);
    }
  }
}

module.exports = InsuranceClaimSettlementController;
