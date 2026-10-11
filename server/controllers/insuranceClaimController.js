const InsuranceClaimService = require('../services/insuranceClaimService');
const InsuranceClaimValidationService = require('../services/insuranceClaimValidationService');
const InsuranceClaimSubmissionService = require('../services/insuranceClaimSubmissionService');
const InsuranceClaimStatusService = require('../services/insuranceClaimStatusService');

class InsuranceClaimController {
  // POST /api/insurance/claims
  static async createClaim(req, res, next) {
    try {
      const claim = await InsuranceClaimService.createClaim(req.body, req.user || {});
      res.status(201).json({
        success: true,
        message: 'Claim created successfully in DRAFT status',
        data: claim
      });
    } catch (err) {
      next(err);
    }
  }

  // GET /api/insurance/claims
  static async getClaims(req, res, next) {
    try {
      const result = await InsuranceClaimService.getClaims(req.query);
      res.json(result);
    } catch (err) {
      next(err);
    }
  }

  // GET /api/insurance/claims/:id
  static async getClaimById(req, res, next) {
    try {
      const claim = await InsuranceClaimService.getClaimById(req.params.id);
      res.json({
        success: true,
        data: claim
      });
    } catch (err) {
      next(err);
    }
  }

  // PUT /api/insurance/claims/:id
  static async updateClaim(req, res, next) {
    try {
      const claim = await InsuranceClaimService.updateClaim(req.params.id, req.body, req.user || {});
      res.json({
        success: true,
        message: 'Claim updated successfully',
        data: claim
      });
    } catch (err) {
      next(err);
    }
  }

  // POST /api/insurance/claims/:id/validate
  static async validateClaim(req, res, next) {
    try {
      const result = await InsuranceClaimValidationService.validateClaim(req.params.id);
      res.json({
        success: true,
        data: result
      });
    } catch (err) {
      next(err);
    }
  }

  // POST /api/insurance/claims/:id/ready
  static async markReady(req, res, next) {
    try {
      const claim = await InsuranceClaimService.markReady(req.params.id, req.user || {});
      res.json({
        success: true,
        message: 'Claim marked READY for submission',
        data: claim
      });
    } catch (err) {
      next(err);
    }
  }

  // POST /api/insurance/claims/:id/submit
  static async submitClaim(req, res, next) {
    try {
      const result = await InsuranceClaimSubmissionService.submitClaim(req.params.id, req.body, req.user || {});
      res.json({
        success: true,
        message: 'Claim submitted successfully',
        data: result
      });
    } catch (err) {
      next(err);
    }
  }

  // POST /api/insurance/claims/:id/cancel
  static async cancelClaim(req, res, next) {
    try {
      const claim = await InsuranceClaimService.cancelClaim(req.params.id, req.body.reason, req.user || {});
      res.json({
        success: true,
        message: 'Claim cancelled successfully',
        data: claim
      });
    } catch (err) {
      next(err);
    }
  }

  // POST /api/insurance/claims/:id/check-status
  static async checkStatus(req, res, next) {
    try {
      const result = await InsuranceClaimStatusService.checkClaimStatus(req.params.id, req.body, req.user || {});
      res.json({
        success: true,
        message: 'Claim status checked successfully',
        data: result
      });
    } catch (err) {
      next(err);
    }
  }

  // GET /api/insurance/claims/:id/status-history
  static async getStatusHistory(req, res, next) {
    try {
      const history = await InsuranceClaimStatusService.getStatusHistory(req.params.id);
      res.json({
        success: true,
        data: history
      });
    } catch (err) {
      next(err);
    }
  }

  // GET /api/insurance/claims/dashboard/stats
  static async getDashboardStats(req, res, next) {
    try {
      const stats = await InsuranceClaimService.getDashboardStats();
      res.json({
        success: true,
        data: stats
      });
    } catch (err) {
      next(err);
    }
  }

  // GET /api/insurance/claims/patient/:patientId
  static async getClaimsByPatient(req, res, next) {
    try {
      const claims = await InsuranceClaimService.getClaimsByPatient(req.params.patientId);
      res.json({
        success: true,
        data: claims
      });
    } catch (err) {
      next(err);
    }
  }

  // GET /api/insurance/claims/invoice/:invoiceId
  static async getClaimsByInvoice(req, res, next) {
    try {
      const claims = await InsuranceClaimService.getClaimsByInvoice(req.params.invoiceId);
      res.json({
        success: true,
        data: claims
      });
    } catch (err) {
      next(err);
    }
  }

  // POST /api/insurance/claims/:id/documents
  static async addDocument(req, res, next) {
    try {
      const doc = await InsuranceClaimService.addDocument(req.params.id, req.body, req.user || {});
      res.status(201).json({
        success: true,
        message: 'Document uploaded to claim successfully',
        data: doc
      });
    } catch (err) {
      next(err);
    }
  }

  // GET /api/insurance/claims/:id/documents
  static async getDocuments(req, res, next) {
    try {
      const claim = await InsuranceClaimService.getClaimById(req.params.id);
      res.json({
        success: true,
        data: claim.documents || []
      });
    } catch (err) {
      next(err);
    }
  }

  // DELETE /api/insurance/claims/:id/documents/:documentId
  static async deleteDocument(req, res, next) {
    try {
      const result = await InsuranceClaimService.deleteDocument(req.params.id, req.params.documentId, req.user || {});
      res.json({
        success: true,
        message: result.message
      });
    } catch (err) {
      next(err);
    }
  }
}

module.exports = InsuranceClaimController;
