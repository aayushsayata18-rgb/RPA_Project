const Vendor = require('../../models/Vendor');
const VendorContact = require('../../models/VendorContact');
const VendorAddress = require('../../models/VendorAddress');
const VendorDocument = require('../../models/VendorDocument');
const VendorContract = require('../../models/VendorContract');
const VendorPerformanceReview = require('../../models/VendorPerformanceReview');
const VendorIssue = require('../../models/VendorIssue');
const VendorCommunication = require('../../models/VendorCommunication');
const VendorPaymentProfile = require('../../models/VendorPaymentProfile');
const VendorChangeRequest = require('../../models/VendorChangeRequest');
const PurchaseOrder = require('../../models/PurchaseOrder');
const AuditService = require('../AuditService');
const IdGeneratorService = require('../IdGeneratorService');
const DuplicateDetectionService = require('./duplicateDetectionService');
const VendorDocumentService = require('./vendorDocumentService');
const VendorContractService = require('./vendorContractService');

class VendorService {
  /**
   * Register a new vendor master record
   */
  static async createVendor(vendorData, createdBy, options = { bypassDuplicateCheck: false }) {
    // 1. Run duplicate check if not bypassed
    if (!options.bypassDuplicateCheck) {
      const dupCheck = await DuplicateDetectionService.checkDuplicate(vendorData);
      if (dupCheck.isDuplicate) {
        return {
          duplicateDetected: true,
          matches: dupCheck.matches,
          message: dupCheck.message
        };
      }
    }

    // 2. Generate Vendor ID (or use provided external ID if valid and unique)
    let vendorId = vendorData.vendorId;
    if (!vendorId) {
      vendorId = await IdGeneratorService.generateVendorId();
    } else {
      const existing = await Vendor.findOne({ vendorId });
      if (existing) {
        throw new Error(`Vendor with ID ${vendorId} already exists`);
      }
    }

    const initialStatus = vendorData.status || (options.isSelfRegistration ? 'PENDING_VERIFICATION' : 'DRAFT');

    const vendor = new Vendor({
      vendorId,
      legalName: vendorData.legalName.trim(),
      displayName: (vendorData.displayName || vendorData.legalName).trim(),
      vendorType: vendorData.vendorType || 'SUPPLIER',
      vendorCategory: Array.isArray(vendorData.vendorCategory) ? vendorData.vendorCategory : (vendorData.vendorCategory ? [vendorData.vendorCategory] : ['GENERAL']),
      registrationNumber: vendorData.registrationNumber || '',
      taxIdentificationNumber: vendorData.taxIdentificationNumber || '',
      businessRegistrationNumber: vendorData.businessRegistrationNumber || '',
      website: vendorData.website || '',
      email: vendorData.email.trim().toLowerCase(),
      phone: vendorData.phone.trim(),
      alternatePhone: vendorData.alternatePhone || '',
      address: vendorData.address || '',
      city: vendorData.city || '',
      state: vendorData.state || '',
      country: vendorData.country || 'India',
      postalCode: vendorData.postalCode || '',
      status: initialStatus,
      riskLevel: vendorData.riskLevel || 'LOW',
      verificationStatus: 'NOT_STARTED',
      preferredVendor: !!vendorData.preferredVendor,
      externalVendorId: vendorData.externalVendorId || null,
      sourceSystem: vendorData.sourceSystem || 'INTERNAL',
      externalReference: vendorData.externalReference || null,
      notes: vendorData.notes || '',
      servicesOffered: vendorData.servicesOffered || [],
      createdBy: createdBy || 'SYSTEM',
      updatedBy: createdBy || 'SYSTEM'
    });

    await vendor.save();

    // 3. Create primary contact if contact details provided
    if (vendorData.primaryContact || vendorData.contactName) {
      const contactName = vendorData.primaryContact?.name || vendorData.contactName;
      const contactEmail = vendorData.primaryContact?.email || vendorData.contactEmail || vendorData.email;
      const contactPhone = vendorData.primaryContact?.phone || vendorData.contactPhone || vendorData.phone;
      const contactId = await IdGeneratorService.generateVendorContactId();

      const contact = new VendorContact({
        vendorContactId: contactId,
        vendorId,
        name: contactName,
        designation: vendorData.primaryContact?.designation || 'Primary Contact',
        email: contactEmail,
        phone: contactPhone,
        contactType: 'PRIMARY',
        isPrimary: true,
        status: 'ACTIVE'
      });
      await contact.save();
      vendor.primaryContactId = contactId;
      await vendor.save();
    }

    // 4. Create primary address if full address provided
    if (vendorData.line1 || vendorData.address) {
      const addressId = await IdGeneratorService.generateVendorAddressId();
      const addr = new VendorAddress({
        addressId,
        vendorId,
        addressType: 'REGISTERED',
        line1: vendorData.line1 || vendorData.address,
        line2: vendorData.line2 || '',
        city: vendorData.city || 'City',
        state: vendorData.state || 'State',
        country: vendorData.country || 'India',
        postalCode: vendorData.postalCode || '000000',
        isPrimary: true,
        status: 'ACTIVE'
      });
      await addr.save();
    }

    // 5. Audit log
    await AuditService.logEvent({
      action: 'VENDOR_CREATED',
      module: 'VENDOR_MANAGEMENT',
      entityId: vendorId,
      entityType: 'Vendor',
      userId: createdBy || 'SYSTEM',
      details: `Vendor ${vendor.displayName} (${vendorId}) registered in ${initialStatus} state`
    });

    return {
      duplicateDetected: false,
      vendor
    };
  }

  /**
   * Update existing vendor master information
   */
  static async updateVendor(vendorId, updateData, updatedBy) {
    const vendor = await Vendor.findOne({ vendorId });
    if (!vendor) throw new Error(`Vendor ${vendorId} not found`);

    if (['DEACTIVATED'].includes(vendor.status)) {
      throw new Error(`Cannot update a DEACTIVATED vendor`);
    }

    const updatableFields = [
      'legalName',
      'displayName',
      'vendorType',
      'vendorCategory',
      'registrationNumber',
      'taxIdentificationNumber',
      'businessRegistrationNumber',
      'website',
      'email',
      'phone',
      'alternatePhone',
      'address',
      'city',
      'state',
      'country',
      'postalCode',
      'riskLevel',
      'preferredVendor',
      'notes',
      'servicesOffered'
    ];

    updatableFields.forEach((field) => {
      if (updateData[field] !== undefined) {
        vendor[field] = updateData[field];
      }
    });

    vendor.updatedBy = updatedBy || 'SYSTEM';
    await vendor.save();

    await AuditService.logEvent({
      action: 'VENDOR_UPDATED',
      module: 'VENDOR_MANAGEMENT',
      entityId: vendorId,
      entityType: 'Vendor',
      userId: updatedBy || 'SYSTEM',
      details: `Vendor ${vendor.displayName} master data updated by ${updatedBy}`
    });

    return vendor;
  }

  /**
   * Get vendor by ID with populated children (contacts, addresses, documents, contracts, issues, reviews, payment profile)
   */
  static async getVendorById(vendorId, options = { maskSensitiveBank: true }) {
    const vendor = await Vendor.findOne({ vendorId }).lean();
    if (!vendor) return null;

    const [
      contacts,
      addresses,
      documents,
      contracts,
      issues,
      reviews,
      communications,
      paymentProfile,
      recentPOs
    ] = await Promise.all([
      VendorContact.find({ vendorId }).sort({ isPrimary: -1, createdAt: 1 }).lean(),
      VendorAddress.find({ vendorId }).sort({ isPrimary: -1, createdAt: 1 }).lean(),
      VendorDocument.find({ vendorId }).sort({ createdAt: -1 }).lean(),
      VendorContract.find({ vendorId }).sort({ endDate: -1 }).lean(),
      VendorIssue.find({ vendorId }).sort({ createdAt: -1 }).limit(10).lean(),
      VendorPerformanceReview.find({ vendorId }).sort({ periodEnd: -1 }).limit(5).lean(),
      VendorCommunication.find({ vendorId }).sort({ timestamp: -1 }).limit(15).lean(),
      VendorPaymentProfile.findOne({ vendorId }).lean(),
      PurchaseOrder.find({ vendorId }).select('purchaseOrderId orderDate expectedDeliveryDate grandTotal status').sort({ orderDate: -1 }).limit(10).lean()
    ]);

    let safePaymentProfile = null;
    if (paymentProfile) {
      safePaymentProfile = {
        profileId: paymentProfile.profileId,
        accountName: paymentProfile.accountName,
        bankName: paymentProfile.bankName,
        branchName: paymentProfile.branchName,
        maskedAccountNumber: paymentProfile.maskedAccountNumber,
        ifscCode: paymentProfile.ifscCode,
        verificationStatus: paymentProfile.verificationStatus
      };
    }

    return {
      ...vendor,
      contacts,
      addresses,
      documents,
      contracts,
      issues,
      reviews,
      communications,
      paymentProfile: safePaymentProfile,
      recentPOs
    };
  }

  /**
   * Search / query vendors with filtering and pagination
   */
  static async queryVendors(filters = {}, pagination = { page: 1, limit: 20 }) {
    const query = {};

    if (filters.status) {
      if (Array.isArray(filters.status)) {
        query.status = { $in: filters.status };
      } else {
        query.status = filters.status;
      }
    }

    if (filters.vendorCategory) {
      query.vendorCategory = filters.vendorCategory.toUpperCase();
    }

    if (filters.vendorType) {
      query.vendorType = filters.vendorType;
    }

    if (filters.riskLevel) {
      query.riskLevel = filters.riskLevel;
    }

    if (filters.verificationStatus) {
      query.verificationStatus = filters.verificationStatus;
    }

    if (filters.preferredVendor !== undefined) {
      query.preferredVendor = filters.preferredVendor === 'true' || filters.preferredVendor === true;
    }

    if (filters.search && filters.search.trim()) {
      const term = filters.search.trim();
      query.$or = [
        { vendorId: new RegExp(term, 'i') },
        { legalName: new RegExp(term, 'i') },
        { displayName: new RegExp(term, 'i') },
        { registrationNumber: new RegExp(term, 'i') },
        { taxIdentificationNumber: new RegExp(term, 'i') },
        { email: new RegExp(term, 'i') },
        { city: new RegExp(term, 'i') }
      ];
    }

    const page = Math.max(1, parseInt(pagination.page, 10) || 1);
    const limit = Math.max(1, parseInt(pagination.limit, 10) || 20);
    const skip = (page - 1) * limit;

    const [vendors, total] = await Promise.all([
      Vendor.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      Vendor.countDocuments(query)
    ]);

    return {
      vendors,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    };
  }

  /**
   * Dashboard statistics and KPIs (Section 68 & 106)
   */
  static async getDashboardKPIs() {
    const now = new Date();
    const expiryThreshold = new Date();
    expiryThreshold.setDate(now.getDate() + 30);

    const [
      totalVendors,
      activeVendors,
      pendingVerification,
      pendingApproval,
      suspendedVendors,
      onHoldVendors,
      highRiskVendors,
      expiringDocumentsCount,
      expiringContractsCount,
      openIssuesCount
    ] = await Promise.all([
      Vendor.countDocuments({ status: { $ne: 'DEACTIVATED' } }),
      Vendor.countDocuments({ status: 'ACTIVE' }),
      Vendor.countDocuments({ status: 'PENDING_VERIFICATION' }),
      Vendor.countDocuments({ status: 'PENDING_APPROVAL' }),
      Vendor.countDocuments({ status: 'SUSPENDED' }),
      Vendor.countDocuments({ status: 'ON_HOLD' }),
      Vendor.countDocuments({ riskLevel: { $in: ['HIGH', 'CRITICAL'] }, status: 'ACTIVE' }),
      VendorDocument.countDocuments({ expiryDate: { $gte: now, $lte: expiryThreshold }, status: { $in: ['UPLOADED', 'VERIFIED'] } }),
      VendorContract.countDocuments({ endDate: { $gte: now, $lte: expiryThreshold }, status: { $in: ['ACTIVE', 'EXPIRING'] } }),
      VendorIssue.countDocuments({ status: { $in: ['OPEN', 'UNDER_REVIEW', 'VENDOR_RESPONSE_REQUIRED', 'IN_PROGRESS'] } })
    ]);

    // Aggregate category distribution
    const categoryDistribution = await Vendor.aggregate([
      { $match: { status: 'ACTIVE' } },
      { $unwind: '$vendorCategory' },
      { $group: { _id: '$vendorCategory', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    // Aggregate type distribution
    const typeDistribution = await Vendor.aggregate([
      { $match: { status: { $ne: 'DEACTIVATED' } } },
      { $group: { _id: '$vendorType', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    return {
      totalVendors,
      activeVendors,
      pendingVerification,
      pendingApproval,
      suspendedVendors,
      onHoldVendors,
      highRiskVendors,
      expiringDocumentsCount,
      expiringContractsCount,
      openIssuesCount,
      categoryDistribution,
      typeDistribution
    };
  }

  /**
   * Log communication message
   */
  static async logCommunication(commData, sender) {
    const { vendorId, communicationType, subject, message, referenceType, referenceId, direction, recipient } = commData;
    const communicationId = await IdGeneratorService.generateVendorCommunicationId();

    const comm = new VendorCommunication({
      communicationId,
      vendorId,
      communicationType: communicationType || 'Portal Message',
      subject,
      message,
      referenceType: referenceType || 'GENERAL',
      referenceId: referenceId || null,
      direction: direction || 'OUTBOUND',
      sender: sender || 'SYSTEM',
      recipient: recipient || vendorId,
      status: 'SENT'
    });

    await comm.save();
    return comm;
  }
}

module.exports = VendorService;
