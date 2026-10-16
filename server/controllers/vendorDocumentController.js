const VendorDocumentService = require('../services/vendor/vendorDocumentService');

class VendorDocumentController {
  /**
   * GET /api/vendors/:id/documents
   */
  static async getDocuments(req, res, next) {
    try {
      const docs = await VendorDocumentService.getVendorDocuments(req.params.id);
      res.json({
        success: true,
        data: docs
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/vendors/:id/documents
   */
  static async uploadDocument(req, res, next) {
    try {
      const uploadedBy = req.user ? `${req.user.firstName} ${req.user.lastName}` : 'SYSTEM';
      const doc = await VendorDocumentService.uploadDocument(req.params.id, req.body, uploadedBy);
      res.status(201).json({
        success: true,
        message: 'Document uploaded successfully',
        data: doc
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/vendors/:id/documents/:documentId/verify
   */
  static async verifyDocument(req, res, next) {
    try {
      const verifiedBy = req.user ? `${req.user.firstName} ${req.user.lastName}` : 'SYSTEM';
      const doc = await VendorDocumentService.verifyDocument(
        req.params.documentId,
        { status: 'VERIFIED', notes: req.body.notes },
        verifiedBy
      );
      res.json({
        success: true,
        message: 'Document verified successfully',
        data: doc
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/vendors/:id/documents/:documentId/reject
   */
  static async rejectDocument(req, res, next) {
    try {
      const rejectedBy = req.user ? `${req.user.firstName} ${req.user.lastName}` : 'SYSTEM';
      const doc = await VendorDocumentService.verifyDocument(
        req.params.documentId,
        {
          status: 'REJECTED',
          rejectionReason: req.body.rejectionReason || 'Document does not meet hospital verification guidelines',
          notes: req.body.notes
        },
        rejectedBy
      );
      res.json({
        success: true,
        message: 'Document rejected',
        data: doc
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/vendors/documents/check-expiry
   * Trigger expiry check / monitoring
   */
  static async checkExpiry(req, res, next) {
    try {
      const warningDays = req.query.warningDays || 30;
      const result = await VendorDocumentService.checkExpiringDocuments(warningDays);
      res.json({
        success: true,
        data: result
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = VendorDocumentController;
