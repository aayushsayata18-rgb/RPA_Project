const MaintenanceContract = require('../../models/MaintenanceContract');
const Vendor = require('../../models/Vendor');
const Asset = require('../../models/Asset');
const IdGeneratorService = require('../IdGeneratorService');
const AuditService = require('../AuditService');

class ContractService {
  /**
   * Create AMC/Service Contract
   */
  static async createContract(data, userId) {
    if (!data.vendorId) {
      const defaultVendor = await Vendor.findOne();
      if (defaultVendor) {
        data.vendorId = defaultVendor._id;
      } else {
        const err = new Error('Vendor ID is required for a maintenance contract');
        err.statusCode = 400;
        throw err;
      }
    }

    if (!data.contractId) {
      data.contractId = await IdGeneratorService.generateMaintenanceContractId();
    }

    if (!data.renewalReminderDate && data.endDate) {
      // 30 days before end date
      const rem = new Date(data.endDate);
      rem.setDate(rem.getDate() - 30);
      data.renewalReminderDate = rem;
    }

    data.createdBy = userId;
    data.updatedBy = userId;

    const contract = new MaintenanceContract(data);
    await contract.save();

    await AuditService.logEvent({
      action: 'MAINTENANCE_CONTRACT_CREATED',
      module: 'MAINTENANCE',
      entityId: contract.contractId,
      performedBy: userId,
      details: { contractId: contract.contractId, vendorId: contract.vendorId }
    });

    return contract;
  }

  /**
   * Get all contracts
   */
  static async getContracts(query = {}) {
    const { vendorId, status, page = 1, limit = 20 } = query;
    const filter = {};
    if (vendorId) filter.vendorId = vendorId;
    if (status) filter.status = status;

    const skip = (Math.max(1, parseInt(page, 10)) - 1) * parseInt(limit, 10);
    const take = parseInt(limit, 10);

    const [items, total] = await Promise.all([
      MaintenanceContract.find(filter)
        .populate('vendorId', 'name vendorCode contactPerson phone email')
        .populate('coveredAssets', 'name assetTag criticality status')
        .sort({ endDate: 1 })
        .skip(skip)
        .limit(take)
        .lean(),
      MaintenanceContract.countDocuments(filter)
    ]);

    return {
      items,
      total,
      page: parseInt(page, 10),
      totalPages: Math.ceil(total / take) || 1
    };
  }

  /**
   * Get single contract
   */
  static async getContractById(id) {
    const isMongoId = id.match(/^[0-9a-fA-F]{24}$/);
    const query = isMongoId ? { _id: id } : { contractId: id };

    const contract = await MaintenanceContract.findOne(query)
      .populate('vendorId')
      .populate('coveredAssets')
      .lean();

    if (!contract) {
      const err = new Error('Contract not found');
      err.statusCode = 404;
      throw err;
    }

    return contract;
  }

  /**
   * Update contract
   */
  static async updateContract(id, updateData, userId) {
    const isMongoId = id.match(/^[0-9a-fA-F]{24}$/);
    const query = isMongoId ? { _id: id } : { contractId: id };

    updateData.updatedBy = userId;
    const contract = await MaintenanceContract.findOneAndUpdate(query, updateData, { new: true });
    if (!contract) {
      const err = new Error('Contract not found');
      err.statusCode = 404;
      throw err;
    }

    return contract;
  }

  /**
   * Renew contract
   */
  static async renewContract(id, { newStartDate, newEndDate, newCost, terms }, userId) {
    const isMongoId = id.match(/^[0-9a-fA-F]{24}$/);
    const query = isMongoId ? { _id: id } : { contractId: id };

    const contract = await MaintenanceContract.findOne(query);
    if (!contract) {
      const err = new Error('Contract not found');
      err.statusCode = 404;
      throw err;
    }

    contract.startDate = new Date(newStartDate);
    contract.endDate = new Date(newEndDate);
    if (newCost !== undefined) contract.cost = newCost;
    if (terms) contract.terms = terms;
    contract.status = 'ACTIVE';

    const rem = new Date(newEndDate);
    rem.setDate(rem.getDate() - 30);
    contract.renewalReminderDate = rem;
    contract.updatedBy = userId;
    await contract.save();

    await AuditService.logEvent({
      action: 'MAINTENANCE_CONTRACT_RENEWED',
      module: 'MAINTENANCE',
      entityId: contract.contractId,
      performedBy: userId,
      details: { contractId: contract.contractId, newEndDate }
    });

    return contract;
  }
}

module.exports = ContractService;
