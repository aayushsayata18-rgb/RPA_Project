const VendorContract = require('../../models/VendorContract');
const Vendor = require('../../models/Vendor');
const AuditEvent = require('../../models/AuditEvent');
const NotificationService = require('../NotificationService');
const IdGeneratorService = require('../IdGeneratorService');

class VendorContractService {
  /**
   * Create a new vendor contract (in DRAFT)
   */
  static async createContract(contractData, createdBy) {
    const { vendorId, title, contractType, startDate, endDate, scope, value, currency, renewalType, renewalNoticeDays, terms, documents } = contractData;

    const vendor = await Vendor.findOne({ vendorId });
    if (!vendor) {
      throw new Error(`Vendor ${vendorId} not found`);
    }

    const contractId = await IdGeneratorService.generateVendorContractId();
    const contractNumber = contractData.contractNumber || `CNT-${new Date().getFullYear()}-${contractId.split('-')[2] || '0001'}`;

    const contract = new VendorContract({
      contractId,
      vendorId,
      contractNumber,
      title: title || `${contractType || 'Supply'} Contract - ${vendor.displayName}`,
      contractType: contractType || 'SUPPLY',
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      status: 'DRAFT',
      scope: scope || '',
      value: value || 0,
      currency: currency || 'INR',
      renewalType: renewalType || 'MANUAL',
      renewalNoticeDays: renewalNoticeDays || 30,
      terms: terms || '',
      documents: documents || [],
      createdBy: createdBy || 'SYSTEM'
    });

    await contract.save();

    await AuditEvent.create({
      eventType: 'CONTRACT_CREATED',
      entityId: vendorId,
      entityType: 'VendorContract',
      userId: createdBy || 'SYSTEM',
      description: `Contract ${contractNumber} created in DRAFT for vendor ${vendor.displayName}`,
      metadata: { contractId, contractNumber, value }
    }).catch(() => {});

    return contract;
  }

  /**
   * Update contract details (while DRAFT or PENDING_APPROVAL)
   */
  static async updateContract(contractId, updateData, updatedBy) {
    const contract = await VendorContract.findOne({ contractId });
    if (!contract) {
      throw new Error(`Contract ${contractId} not found`);
    }

    if (['TERMINATED', 'EXPIRED'].includes(contract.status)) {
      throw new Error(`Cannot update contract in ${contract.status} state`);
    }

    const allowedFields = ['title', 'contractType', 'startDate', 'endDate', 'scope', 'value', 'currency', 'renewalType', 'renewalNoticeDays', 'terms', 'documents'];
    allowedFields.forEach((f) => {
      if (updateData[f] !== undefined) contract[f] = updateData[f];
    });

    await contract.save();
    return contract;
  }

  /**
   * Approve contract and activate it
   */
  static async approveContract(contractId, approvedBy) {
    const contract = await VendorContract.findOne({ contractId });
    if (!contract) {
      throw new Error(`Contract ${contractId} not found`);
    }

    contract.status = 'ACTIVE';
    contract.approvedBy = approvedBy;
    contract.approvedAt = new Date();
    await contract.save();

    await AuditEvent.create({
      eventType: 'CONTRACT_APPROVED',
      entityId: contract.vendorId,
      entityType: 'VendorContract',
      userId: approvedBy || 'SYSTEM',
      description: `Contract ${contract.contractNumber} approved and activated by ${approvedBy}`,
      metadata: { contractId, contractNumber: contract.contractNumber }
    }).catch(() => {});

    return contract;
  }

  /**
   * Terminate contract
   */
  static async terminateContract(contractId, terminationReason, terminatedBy) {
    const contract = await VendorContract.findOne({ contractId });
    if (!contract) {
      throw new Error(`Contract ${contractId} not found`);
    }

    contract.status = 'TERMINATED';
    contract.terminationReason = terminationReason || 'Terminated by authorized hospital administrator';
    contract.terminatedAt = new Date();
    contract.terminatedBy = terminatedBy;
    await contract.save();

    await AuditEvent.create({
      eventType: 'CONTRACT_TERMINATED',
      entityId: contract.vendorId,
      entityType: 'VendorContract',
      userId: terminatedBy || 'SYSTEM',
      description: `Contract ${contract.contractNumber} terminated: ${terminationReason}`,
      metadata: { contractId, contractNumber: contract.contractNumber, terminationReason }
    }).catch(() => {});

    return contract;
  }

  /**
   * Renew contract: marks current as renewed, creates new period or extends endDate
   */
  static async renewContract(contractId, renewalData, renewedBy) {
    const currentContract = await VendorContract.findOne({ contractId });
    if (!currentContract) {
      throw new Error(`Contract ${contractId} not found`);
    }

    const { newEndDate, newValue, terms } = renewalData;
    if (!newEndDate) {
      throw new Error('New end date is required for contract renewal');
    }

    const newContractId = await IdGeneratorService.generateVendorContractId();
    const newContract = new VendorContract({
      contractId: newContractId,
      vendorId: currentContract.vendorId,
      contractNumber: `${currentContract.contractNumber}-R${Date.now().toString().slice(-4)}`,
      title: currentContract.title,
      contractType: currentContract.contractType,
      startDate: currentContract.endDate,
      endDate: new Date(newEndDate),
      status: 'ACTIVE',
      scope: currentContract.scope,
      value: newValue !== undefined ? newValue : currentContract.value,
      currency: currentContract.currency,
      renewalType: currentContract.renewalType,
      renewalNoticeDays: currentContract.renewalNoticeDays,
      terms: terms || currentContract.terms,
      documents: currentContract.documents,
      approvedBy: renewedBy,
      approvedAt: new Date(),
      createdBy: renewedBy
    });

    await newContract.save();

    currentContract.status = 'EXPIRED';
    await currentContract.save();

    await AuditEvent.create({
      eventType: 'CONTRACT_RENEWED',
      entityId: currentContract.vendorId,
      entityType: 'VendorContract',
      userId: renewedBy || 'SYSTEM',
      description: `Contract ${currentContract.contractNumber} renewed into ${newContract.contractNumber}`,
      metadata: { oldContractId: contractId, newContractId, newEndDate }
    }).catch(() => {});

    return newContract;
  }

  /**
   * Monitor contract expirations (Section 52)
   */
  static async checkExpiringContracts() {
    const now = new Date();
    const activeContracts = await VendorContract.find({
      status: { $in: ['ACTIVE', 'EXPIRING'] }
    }).lean();

    const results = [];
    for (const c of activeContracts) {
      const noticeDays = c.renewalNoticeDays || 30;
      const expiry = new Date(c.endDate);
      const diffMs = expiry - now;
      const daysRemaining = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

      if (daysRemaining <= 0) {
        // Expired
        await VendorContract.updateOne({ contractId: c.contractId }, { status: 'EXPIRED' });
      } else if (daysRemaining <= noticeDays) {
        // Expiring soon
        await VendorContract.updateOne({ contractId: c.contractId }, { status: 'EXPIRING' });
        results.push({
          contract: c,
          daysRemaining
        });

        try {
          await NotificationService.sendNotification({
            recipientId: 'PROCUREMENT_OFFICER',
            event: 'CONTRACT_EXPIRING',
            title: `Vendor Contract Expiring: ${c.contractNumber}`,
            message: `Contract ${c.contractNumber} (${c.title}) expires in ${daysRemaining} day(s).`,
            channel: 'IN_APP',
            entityType: 'VendorContract',
            entityId: c.contractId
          });
        } catch (e) {}
      }
    }

    return {
      expiringContractsCount: results.length,
      expiringContracts: results
    };
  }

  /**
   * List contracts by vendor
   */
  static async getContractsByVendor(vendorId) {
    return await VendorContract.find({ vendorId }).sort({ createdAt: -1 });
  }
}

module.exports = VendorContractService;
