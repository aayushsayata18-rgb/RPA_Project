const VendorVerificationService = require('../services/vendor/vendorVerificationService');

class VendorVerificationController {
  /**
   * GET /api/vendors/:id/verification
   */
  static async getVerifications(req, res, next) {
    try {
      const verifications = await VendorVerificationService.getVerificationsByVendor(req.params.id);
      res.json({
        success: true,
        data: verifications
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/vendors/:id/verification
   */
  static async requestVerification(req, res, next) {
    try {
      const requestedBy = req.user ? `${req.user.firstName} ${req.user.lastName}` : 'SYSTEM';
      const verification = await VendorVerificationService.requestVerification(
        req.params.id,
        req.body.verificationType || 'IDENTITY',
        requestedBy,
        req.body.notes || ''
      );
      res.status(201).json({
        success: true,
        message: 'Verification initiated',
        data: verification
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/vendors/:id/verification/:verificationId/evidence
   */
  static async addEvidence(req, res, next) {
    try {
      const addedBy = req.user ? `${req.user.firstName} ${req.user.lastName}` : 'SYSTEM';
      const updated = await VendorVerificationService.addEvidence(
        req.params.verificationId,
        req.body,
        addedBy
      );
      res.json({
        success: true,
        message: 'Evidence added',
        data: updated
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/vendors/:id/verification/:verificationId/complete
   */
  static async completeVerification(req, res, next) {
    try {
      const completedBy = req.user ? `${req.user.firstName} ${req.user.lastName}` : 'SYSTEM';
      const outcome = await VendorVerificationService.completeVerification(
        req.params.verificationId,
        req.body,
        completedBy
      );
      res.json({
        success: true,
        message: 'Verification completed',
        data: outcome
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = VendorVerificationController;
