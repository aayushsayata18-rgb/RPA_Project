const VendorService = require('../services/vendor/vendorService');
const VendorStatusService = require('../services/vendor/vendorStatusService');
const DuplicateDetectionService = require('../services/vendor/duplicateDetectionService');
const VendorChangeRequest = require('../models/VendorChangeRequest');
const IdGeneratorService = require('../services/IdGeneratorService');

class VendorController {
  /**
   * GET /api/vendors
   * List / query vendors
   */
  static async getVendors(req, res, next) {
    try {
      const filters = {
        status: req.query.status,
        vendorCategory: req.query.vendorCategory,
        vendorType: req.query.vendorType,
        riskLevel: req.query.riskLevel,
        verificationStatus: req.query.verificationStatus,
        preferredVendor: req.query.preferredVendor,
        search: req.query.search
      };

      const pagination = {
        page: req.query.page || 1,
        limit: req.query.limit || 20
      };

      const result = await VendorService.queryVendors(filters, pagination);
      res.json({
        success: true,
        data: result.vendors,
        pagination: result.pagination
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/vendors/stats
   * Dashboard KPIs
   */
  static async getDashboardKPIs(req, res, next) {
    try {
      const stats = await VendorService.getDashboardKPIs();
      res.json({
        success: true,
        data: stats
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/vendors/check-duplicate
   * Pre-flight deduplication check
   */
  static async checkDuplicate(req, res, next) {
    try {
      const result = await DuplicateDetectionService.checkDuplicate(req.body, req.body.excludeVendorId);
      res.json({
        success: true,
        data: result
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/vendors/:id
   * Get vendor by ID
   */
  static async getVendorById(req, res, next) {
    try {
      // If vendor user, ensure scoping to their linked entity
      if (req.user?.role === 'VENDOR') {
        const allowedId = req.user.linkedEntityId;
        if (req.params.id !== allowedId) {
          return res.status(403).json({
            success: false,
            message: 'Access denied. You may only view your own vendor profile.',
            errorCode: 'FORBIDDEN_VENDOR_RESOURCE'
          });
        }
      }

      const vendor = await VendorService.getVendorById(req.params.id);
      if (!vendor) {
        return res.status(404).json({
          success: false,
          message: `Vendor ${req.params.id} not found`,
          errorCode: 'VENDOR_NOT_FOUND'
        });
      }

      res.json({
        success: true,
        data: vendor
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/vendors
   * Create new vendor
   */
  static async createVendor(req, res, next) {
    try {
      const isVendorSelfRegistration = req.user?.role === 'VENDOR' || !req.user;
      const createdBy = req.user ? `${req.user.firstName} ${req.user.lastName} (${req.user.userId})` : 'SELF_REGISTERED';
      const bypassDuplicateCheck = req.body.confirmDuplicateBypass === true;

      const result = await VendorService.createVendor(req.body, createdBy, {
        bypassDuplicateCheck,
        isSelfRegistration: isVendorSelfRegistration
      });

      if (result.duplicateDetected) {
        return res.status(409).json({
          success: false,
          message: result.message,
          errorCode: 'POSSIBLE_DUPLICATE_VENDOR',
          matches: result.matches
        });
      }

      res.status(201).json({
        success: true,
        message: 'Vendor created successfully',
        data: result.vendor
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * PUT /api/vendors/:id
   * Update vendor details
   */
  static async updateVendor(req, res, next) {
    try {
      // If vendor user, create change request rather than directly modifying core master
      if (req.user?.role === 'VENDOR') {
        const allowedId = req.user.linkedEntityId;
        if (req.params.id !== allowedId) {
          return res.status(403).json({
            success: false,
            message: 'Access denied. You may only update your own vendor profile.',
            errorCode: 'FORBIDDEN_VENDOR_RESOURCE'
          });
        }

        const changeRequestId = await IdGeneratorService.generateVendorChangeRequestId();
        const cr = new VendorChangeRequest({
          changeRequestId,
          changeType: 'PROFILE_UPDATE',
          vendorId: allowedId,
          requestedBy: `${req.user.firstName} ${req.user.lastName} (${req.user.userId})`,
          after: req.body,
          reason: req.body.changeReason || 'Vendor self-service profile update request',
          status: 'SUBMITTED'
        });
        await cr.save();

        return res.json({
          success: true,
          message: 'Change request submitted for hospital review and approval.',
          data: cr,
          requiresApproval: true
        });
      }

      const updatedBy = req.user ? `${req.user.firstName} ${req.user.lastName} (${req.user.userId})` : 'SYSTEM';
      const updated = await VendorService.updateVendor(req.params.id, req.body, updatedBy);

      res.json({
        success: true,
        message: 'Vendor updated successfully',
        data: updated
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * PATCH /api/vendors/:id/status
   * Status lifecycle transition
   */
  static async updateStatus(req, res, next) {
    try {
      const { status, reason, holdData, reactivationData } = req.body;
      const performedBy = req.user ? `${req.user.firstName} ${req.user.lastName} (${req.user.userId})` : 'SYSTEM';
      const vendorId = req.params.id;

      let result;
      switch (status) {
        case 'PENDING_VERIFICATION':
          result = await VendorStatusService.submitForVerification(vendorId, performedBy);
          break;
        case 'PENDING_APPROVAL':
          result = await VendorStatusService.submitForApproval(vendorId, performedBy);
          break;
        case 'ACTIVE':
          // Check if releasing hold, reactivating, or regular approve
          const current = await VendorService.getVendorById(vendorId);
          if (current?.status === 'ON_HOLD') {
            result = await VendorStatusService.releaseHold(vendorId, performedBy);
          } else if (current?.status === 'SUSPENDED' || current?.status === 'INACTIVE') {
            result = await VendorStatusService.reactivateVendor(vendorId, reactivationData, performedBy);
          } else {
            result = await VendorStatusService.approveVendor(vendorId, { decisionReason: reason }, performedBy);
          }
          break;
        case 'ON_HOLD':
          result = await VendorStatusService.placeOnHold(vendorId, holdData || { holdReason: reason }, performedBy);
          break;
        case 'SUSPENDED':
          result = await VendorStatusService.suspendVendor(vendorId, reason, performedBy);
          break;
        case 'REJECTED':
          result = await VendorStatusService.rejectVendor(vendorId, reason, performedBy);
          break;
        case 'DEACTIVATED':
          result = await VendorStatusService.deactivateVendor(vendorId, reason, performedBy);
          break;
        default:
          return res.status(400).json({
            success: false,
            message: `Unsupported status transition: ${status}`,
            errorCode: 'INVALID_STATUS_TRANSITION'
          });
      }

      res.json({
        success: true,
        message: `Vendor status transition to ${status} completed`,
        data: result
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/vendors/:id/communications
   * Log communication
   */
  static async logCommunication(req, res, next) {
    try {
      const sender = req.user ? `${req.user.firstName} ${req.user.lastName}` : 'SYSTEM';
      const comm = await VendorService.logCommunication({ ...req.body, vendorId: req.params.id }, sender);
      res.status(201).json({
        success: true,
        data: comm
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/vendors/:id/change-requests
   * List vendor profile change requests
   */
  static async getChangeRequests(req, res, next) {
    try {
      const crs = await VendorChangeRequest.find({ vendorId: req.params.id }).sort({ createdAt: -1 });
      res.json({
        success: true,
        data: crs
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/vendors/change-requests/:id/review
   * Review change request (approve / reject)
   */
  static async reviewChangeRequest(req, res, next) {
    try {
      const { decision, notes } = req.body; // 'APPROVED' or 'REJECTED'
      const cr = await VendorChangeRequest.findOne({ changeRequestId: req.params.id });
      if (!cr) {
        return res.status(404).json({ success: false, message: 'Change request not found' });
      }

      cr.status = decision === 'APPROVED' ? 'APPROVED' : 'REJECTED';
      cr.reviewedBy = req.user ? `${req.user.firstName} ${req.user.lastName}` : 'ADMIN';
      cr.reviewedAt = new Date();
      cr.resolutionNotes = notes || '';
      await cr.save();

      // If approved and has profile changes, apply to vendor master
      if (decision === 'APPROVED' && cr.after) {
        await VendorService.updateVendor(cr.vendorId, cr.after, cr.reviewedBy);
      }

      res.json({
        success: true,
        message: `Change request ${decision.toLowerCase()} successfully`,
        data: cr
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = VendorController;
