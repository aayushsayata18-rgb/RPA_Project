const Quotation = require('../../models/Quotation');
const RFQ = require('../../models/RFQ');
const IdGeneratorService = require('../IdGeneratorService');
const AuditService = require('../AuditService');

class QuotationService {
  /**
   * Record a vendor quotation
   */
  static async recordQuotation(data, user = { userId: 'SYSTEM', role: 'PROCUREMENT_OFFICER' }) {
    if (!data.rfqId) throw new Error('RFQ ID is required');
    if (!data.vendorId) throw new Error('Vendor ID is required');
    if (!data.validUntil) throw new Error('Validity date is required');
    if (!data.items || !Array.isArray(data.items) || data.items.length === 0) {
      throw new Error('Quotation must contain at least one item');
    }

    const quotationId = await IdGeneratorService.generateQuotationId();

    let subtotal = 0;
    let totalTax = 0;
    let totalDiscount = 0;

    const items = data.items.map((it, idx) => {
      const quotedQuantity = Math.max(1, Number(it.quotedQuantity) || 1);
      const unitPrice = Math.max(0, Number(it.unitPrice) || 0);
      const taxPercent = Math.max(0, Number(it.taxPercent) || 0);
      const discount = Math.max(0, Number(it.discount) || 0);

      const baseAmount = quotedQuantity * unitPrice;
      const tax = (baseAmount - discount) * (taxPercent / 100);
      const lineTotal = baseAmount - discount + tax;

      subtotal += baseAmount;
      totalTax += tax;
      totalDiscount += discount;

      return {
        quotationItemId: `QUO-ITEM-${idx + 1}`,
        inventoryItemId: it.inventoryItemId,
        description: it.description || 'Quoted Item',
        quotedQuantity,
        unitPrice,
        taxPercent,
        tax,
        discount,
        lineTotal,
        deliveryDays: Number(it.deliveryDays) || 7,
        brand: it.brand || '',
        manufacturer: it.manufacturer || '',
        specification: it.specification || '',
        compliance: it.compliance !== undefined ? Boolean(it.compliance) : true
      };
    });

    const shipping = Number(data.shipping) || 0;
    const otherCharges = Number(data.otherCharges) || 0;
    const grandTotal = subtotal - totalDiscount + totalTax + shipping + otherCharges;

    // Check expiry
    const isValid = new Date(data.validUntil) >= new Date();
    const status = isValid ? (data.status || 'RECEIVED') : 'EXPIRED';

    const quotation = new Quotation({
      quotationId,
      rfqId: data.rfqId,
      vendorId: data.vendorId,
      vendorName: data.vendorName || data.vendorId,
      vendorContactEmail: data.vendorContactEmail || '',
      vendorContactPhone: data.vendorContactPhone || '',
      quotationReference: data.quotationReference || '',
      quotationDate: data.quotationDate ? new Date(data.quotationDate) : new Date(),
      validUntil: new Date(data.validUntil),
      items,
      subtotal,
      tax: totalTax,
      discount: totalDiscount,
      shipping,
      otherCharges,
      grandTotal,
      paymentTerms: data.paymentTerms || 'Net 30',
      deliveryTerms: data.deliveryTerms || 'FOB Destination',
      warrantyPeriod: data.warrantyPeriod || '1 Year',
      documents: data.documents || [],
      status,
      notes: data.notes || ''
    });

    await quotation.save();

    // Update RFQ status if needed
    const rfq = await RFQ.findOne({ rfqId: data.rfqId });
    if (rfq && rfq.status === 'ISSUED') {
      const quoteCount = await Quotation.countDocuments({ rfqId: data.rfqId });
      rfq.status = quoteCount >= rfq.vendorIds.length ? 'RESPONDED' : 'PARTIALLY_RESPONDED';
      await rfq.save();
    }

    await AuditService.logEvent({
      userId: user.userId,
      role: user.role,
      action: 'QUOTATION_RECORDED',
      module: 'PROCUREMENT',
      entityType: 'Quotation',
      entityId: quotationId,
      newValue: { grandTotal, vendorId: data.vendorId, rfqId: data.rfqId },
      details: `Recorded Quotation ${quotationId} from vendor ${data.vendorName || data.vendorId} for ₹${grandTotal.toLocaleString()}.`
    });

    return quotation;
  }

  /**
   * Update quotation status
   */
  static async updateQuotationStatus(id, status, user = { userId: 'SYSTEM', role: 'PROCUREMENT_OFFICER' }) {
    const quotation = await Quotation.findOne({ quotationId: id });
    if (!quotation) throw new Error(`Quotation ${id} not found`);

    quotation.status = status;
    await quotation.save();

    await AuditService.logEvent({
      userId: user.userId,
      role: user.role,
      action: 'QUOTATION_STATUS_UPDATED',
      module: 'PROCUREMENT',
      entityType: 'Quotation',
      entityId: id,
      newValue: { status },
      details: `Quotation ${id} status updated to ${status}.`
    });

    return quotation;
  }

  /**
   * Check and mark expired quotations
   */
  static async checkExpirations() {
    const now = new Date();
    const result = await Quotation.updateMany(
      { validUntil: { $lt: now }, status: { $in: ['RECEIVED', 'UNDER_REVIEW', 'SHORTLISTED'] } },
      { $set: { status: 'EXPIRED' } }
    );
    return result.modifiedCount;
  }

  /**
   * Query quotations
   */
  static async getQuotations(query = {}) {
    const filter = {};
    if (query.rfqId) filter.rfqId = query.rfqId;
    if (query.vendorId) filter.vendorId = query.vendorId;
    if (query.status) filter.status = query.status;

    const page = Math.max(1, parseInt(query.page, 10) || 1);
    const limit = Math.max(1, Math.min(100, parseInt(query.limit, 10) || 20));
    const skip = (page - 1) * limit;

    const [quotations, total] = await Promise.all([
      Quotation.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      Quotation.countDocuments(filter)
    ]);

    return {
      quotations,
      total,
      page,
      totalPages: Math.ceil(total / limit)
    };
  }

  static async getQuotationById(id) {
    const quotation = await Quotation.findOne({ quotationId: id }).lean();
    if (!quotation) throw new Error(`Quotation ${id} not found`);
    return quotation;
  }
}

module.exports = QuotationService;
