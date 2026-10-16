const VendorContractService = require('../services/vendor/vendorContractService');

class VendorContractController {
  /**
   * GET /api/vendors/:id/contracts
   */
  static async getContracts(req, res, next) {
    try {
      const contracts = await VendorContractService.getContractsByVendor(req.params.id);
      res.json({
        success: true,
        data: contracts
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/vendors/:id/contracts
   */
  static async createContract(req, res, next) {
    try {
      const createdBy = req.user ? `${req.user.firstName} ${req.user.lastName}` : 'SYSTEM';
      const contract = await VendorContractService.createContract(
        { ...req.body, vendorId: req.params.id },
        createdBy
      );
      res.status(201).json({
        success: true,
        message: 'Contract created successfully',
        data: contract
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * PUT /api/vendors/:id/contracts/:contractId
   */
  static async updateContract(req, res, next) {
    try {
      const updatedBy = req.user ? `${req.user.firstName} ${req.user.lastName}` : 'SYSTEM';
      const contract = await VendorContractService.updateContract(
        req.params.contractId,
        req.body,
        updatedBy
      );
      res.json({
        success: true,
        message: 'Contract updated successfully',
        data: contract
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/vendors/:id/contracts/:contractId/approve
   */
  static async approveContract(req, res, next) {
    try {
      const approvedBy = req.user ? `${req.user.firstName} ${req.user.lastName}` : 'SYSTEM';
      const contract = await VendorContractService.approveContract(req.params.contractId, approvedBy);
      res.json({
        success: true,
        message: 'Contract approved and activated',
        data: contract
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/vendors/:id/contracts/:contractId/renew
   */
  static async renewContract(req, res, next) {
    try {
      const renewedBy = req.user ? `${req.user.firstName} ${req.user.lastName}` : 'SYSTEM';
      const renewed = await VendorContractService.renewContract(req.params.contractId, req.body, renewedBy);
      res.json({
        success: true,
        message: 'Contract renewed successfully',
        data: renewed
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/vendors/:id/contracts/:contractId/terminate
   */
  static async terminateContract(req, res, next) {
    try {
      const terminatedBy = req.user ? `${req.user.firstName} ${req.user.lastName}` : 'SYSTEM';
      const contract = await VendorContractService.terminateContract(
        req.params.contractId,
        req.body.reason,
        terminatedBy
      );
      res.json({
        success: true,
        message: 'Contract terminated',
        data: contract
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/vendors/contracts/check-expiring
   */
  static async checkExpiring(req, res, next) {
    try {
      const result = await VendorContractService.checkExpiringContracts();
      res.json({
        success: true,
        data: result
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = VendorContractController;
