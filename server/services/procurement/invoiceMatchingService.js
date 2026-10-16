const SupplierInvoice = require('../../models/SupplierInvoice');
const PurchaseOrder = require('../../models/PurchaseOrder');
const GoodsReceipt = require('../../models/GoodsReceipt');
const IdGeneratorService = require('../IdGeneratorService');
const AuditService = require('../AuditService');
const NotificationService = require('../NotificationService');
const ExceptionService = require('../ExceptionService');

class InvoiceMatchingService {
  /**
   * Register a supplier invoice
   */
  static async registerInvoice(data, user = { userId: 'SYSTEM', role: 'BILLING_STAFF' }) {
    if (!data.vendorId) throw new Error('Vendor ID is required');
    if (!data.invoiceNumber) throw new Error('Invoice number is required');
    if (!data.purchaseOrderId) throw new Error('Purchase Order ID is required');
    if (!data.items || !Array.isArray(data.items) || data.items.length === 0) {
      throw new Error('Invoice must contain at least one item');
    }

    // Check duplicate invoice from same vendor
    const existing = await SupplierInvoice.findOne({
      vendorId: data.vendorId,
      invoiceNumber: data.invoiceNumber
    });
    if (existing) {
      throw new Error(`Invoice number ${data.invoiceNumber} already exists for vendor ${data.vendorId}`);
    }

    const supplierInvoiceId = await IdGeneratorService.generateSupplierInvoiceId();

    let subtotal = 0;
    let totalTax = 0;
    let totalDiscount = 0;

    const items = data.items.map((it, idx) => {
      const quantity = Math.max(1, Number(it.quantity) || 1);
      const unitPrice = Math.max(0, Number(it.unitPrice) || 0);
      const tax = Number(it.tax) || 0;
      const discount = Number(it.discount) || 0;
      const lineTotal = quantity * unitPrice - discount + tax;

      subtotal += quantity * unitPrice;
      totalTax += tax;
      totalDiscount += discount;

      return {
        invoiceItemId: `INV-ITEM-${idx + 1}`,
        inventoryItemId: it.inventoryItemId,
        description: it.description || 'Invoice Line',
        quantity,
        unitPrice,
        tax,
        discount,
        lineTotal
      };
    });

    const grandTotal = subtotal - totalDiscount + totalTax;

    const invoice = new SupplierInvoice({
      supplierInvoiceId,
      vendorId: data.vendorId,
      vendorName: data.vendorName || data.vendorId,
      invoiceNumber: data.invoiceNumber,
      purchaseOrderId: data.purchaseOrderId,
      goodsReceiptId: data.goodsReceiptId || null,
      invoiceDate: data.invoiceDate ? new Date(data.invoiceDate) : new Date(),
      dueDate: data.dueDate ? new Date(data.dueDate) : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      currency: data.currency || 'INR',
      items,
      subtotal,
      tax: totalTax,
      discount: totalDiscount,
      grandTotal,
      matchStatus: 'PENDING_MATCH',
      status: 'RECEIVED',
      financeHandoffStatus: 'NOT_HANDED_OFF',
      documents: data.documents || [],
      notes: data.notes || ''
    });

    await invoice.save();

    await AuditService.logEvent({
      userId: user.userId,
      role: user.role,
      action: 'SUPPLIER_INVOICE_RECORDED',
      module: 'PROCUREMENT',
      entityType: 'SupplierInvoice',
      entityId: supplierInvoiceId,
      newValue: { grandTotal, invoiceNumber: data.invoiceNumber, purchaseOrderId: data.purchaseOrderId },
      details: `Recorded invoice ${data.invoiceNumber} from vendor ${data.vendorName || data.vendorId} totaling ₹${grandTotal.toLocaleString()}.`
    });

    // Auto-trigger three-way matching if GoodsReceipt is available
    const matched = await this.performThreeWayMatch(supplierInvoiceId, user);

    return matched || invoice;
  }

  /**
   * Three-Way Match Engine (Section 48 to 52 & 68)
   * Validates PO vs GRN vs Supplier Invoice
   */
  static async performThreeWayMatch(invoiceId, user = { userId: 'SYSTEM' }) {
    const invoice = await SupplierInvoice.findOne({ supplierInvoiceId: invoiceId });
    if (!invoice) throw new Error(`Supplier Invoice ${invoiceId} not found`);

    const po = await PurchaseOrder.findOne({ purchaseOrderId: invoice.purchaseOrderId });
    if (!po) {
      invoice.matchStatus = 'REJECTED';
      invoice.status = 'MISMATCH';
      invoice.matchDiscrepancies = [
        {
          type: 'MISSING_DOC',
          field: 'purchaseOrderId',
          description: `Associated Purchase Order ${invoice.purchaseOrderId} does not exist.`
        }
      ];
      await invoice.save();
      return invoice;
    }

    // Find linked Goods Receipt
    let grn = null;
    if (invoice.goodsReceiptId) {
      grn = await GoodsReceipt.findOne({ goodsReceiptId: invoice.goodsReceiptId });
    } else {
      grn = await GoodsReceipt.findOne({ purchaseOrderId: po.purchaseOrderId });
      if (grn) {
        invoice.goodsReceiptId = grn.goodsReceiptId;
      }
    }

    const discrepancies = [];

    if (!grn) {
      discrepancies.push({
        type: 'MISSING_DOC',
        field: 'goodsReceiptId',
        description: `No Goods Receipt (GRN) found for PO ${po.purchaseOrderId}. Physical inventory receipt is pending.`
      });
      invoice.matchStatus = 'MISSING_RECEIPT';
      invoice.status = 'VALIDATING';
      invoice.matchDiscrepancies = discrepancies;
      await invoice.save();
      return invoice;
    }

    // Compare Line Items
    let hasPriceMismatch = false;
    let hasQtyMismatch = false;
    let hasItemMismatch = false;

    invoice.items.forEach((invItem) => {
      const poItem = po.items.find((p) => p.inventoryItemId === invItem.inventoryItemId);
      const grnItem = grn.items.find((g) => g.inventoryItemId === invItem.inventoryItemId);

      if (!poItem) {
        hasItemMismatch = true;
        discrepancies.push({
          type: 'ITEM',
          field: 'inventoryItemId',
          inventoryItemId: invItem.inventoryItemId,
          invoiceValue: invItem.description,
          description: `Item ${invItem.inventoryItemId} is present on invoice but NOT on PO ${po.purchaseOrderId}.`
        });
        return;
      }

      // 1. Price comparison (PO Unit Price vs Invoiced Unit Price)
      const priceDiff = Math.abs(invItem.unitPrice - poItem.unitPrice);
      if (priceDiff > 0.01) {
        hasPriceMismatch = true;
        discrepancies.push({
          type: 'PRICE',
          field: 'unitPrice',
          inventoryItemId: invItem.inventoryItemId,
          poValue: poItem.unitPrice,
          invoiceValue: invItem.unitPrice,
          difference: invItem.unitPrice - poItem.unitPrice,
          description: `Unit price mismatch for ${invItem.description}: PO is ₹${poItem.unitPrice}, Invoice is ₹${invItem.unitPrice} (Variance: ₹${(invItem.unitPrice - poItem.unitPrice).toFixed(2)})`
        });
      }

      // 2. Quantity comparison (GRN Accepted Qty vs Invoiced Qty)
      if (grnItem) {
        const acceptedQty = grnItem.acceptedQuantity !== undefined ? grnItem.acceptedQuantity : grnItem.receivedQuantity;
        if (invItem.quantity > acceptedQty) {
          hasQtyMismatch = true;
          discrepancies.push({
            type: 'QUANTITY',
            field: 'quantity',
            inventoryItemId: invItem.inventoryItemId,
            poValue: poItem.quantity,
            grnValue: acceptedQty,
            invoiceValue: invItem.quantity,
            difference: invItem.quantity - acceptedQty,
            description: `Quantity mismatch for ${invItem.description}: GRN accepted ${acceptedQty} units, Invoice claims ${invItem.quantity} units (Excess: ${invItem.quantity - acceptedQty})`
          });
        }
      }
    });

    // 3. Total Amount comparison
    const poLineTotalSum = po.subtotal - (po.discount || 0) + (po.tax || 0);
    const invoiceLineTotalSum = invoice.subtotal - (invoice.discount || 0) + (invoice.tax || 0);
    const totalDiff = Math.abs(invoiceLineTotalSum - poLineTotalSum);
    if (totalDiff > 1.0 && !hasPriceMismatch && !hasQtyMismatch) {
      discrepancies.push({
        type: 'TOTAL',
        field: 'grandTotal',
        poValue: poLineTotalSum,
        invoiceValue: invoiceLineTotalSum,
        difference: invoiceLineTotalSum - poLineTotalSum,
        description: `Total amount mismatch: PO items total ₹${poLineTotalSum}, Invoice items total ₹${invoiceLineTotalSum}`
      });
    }

    invoice.matchDiscrepancies = discrepancies;

    if (discrepancies.length === 0) {
      invoice.matchStatus = 'MATCHED';
      invoice.status = 'MATCHED';
    } else if (hasPriceMismatch) {
      invoice.matchStatus = 'PRICE_MISMATCH';
      invoice.status = 'MISMATCH';
      // Raise Exception
      await ExceptionService.raiseException({
        module: 'PROCUREMENT',
        entityType: 'SupplierInvoice',
        entityId: invoice.supplierInvoiceId,
        exceptionType: 'PRICE_MISMATCH',
        description: `Price mismatch detected on invoice ${invoice.invoiceNumber}: Unit price variance found against PO ${po.purchaseOrderId}.`,
        severity: 'HIGH',
        source: 'SYSTEM',
        assignedRole: 'BILLING_STAFF',
        metadata: { discrepancies }
      });
    } else if (hasQtyMismatch) {
      invoice.matchStatus = 'QUANTITY_MISMATCH';
      invoice.status = 'MISMATCH';
      await ExceptionService.raiseException({
        module: 'PROCUREMENT',
        entityType: 'SupplierInvoice',
        entityId: invoice.supplierInvoiceId,
        exceptionType: 'QUANTITY_MISMATCH',
        description: `Quantity mismatch on invoice ${invoice.invoiceNumber}: Invoiced quantity exceeds physical GRN accepted count.`,
        severity: 'HIGH',
        source: 'SYSTEM',
        assignedRole: 'BILLING_STAFF',
        metadata: { discrepancies }
      });
    } else {
      invoice.matchStatus = 'PARTIAL_MATCH';
      invoice.status = 'MISMATCH';
    }

    await invoice.save();

    await AuditService.logEvent({
      userId: user.userId,
      role: user.role,
      action: 'THREE_WAY_MATCH_COMPLETED',
      module: 'PROCUREMENT',
      entityType: 'SupplierInvoice',
      entityId: invoice.supplierInvoiceId,
      newValue: { matchStatus: invoice.matchStatus, discrepanciesCount: discrepancies.length },
      details: `Completed three-way matching for invoice ${invoice.supplierInvoiceId}: ${invoice.matchStatus}.`
    });

    return invoice;
  }

  /**
   * Approve Match & Hand off to Finance (Section 55)
   */
  static async approveMatchAndHandoffToFinance(id, user = { userId: 'SYSTEM', role: 'PROCUREMENT_MANAGER' }) {
    const invoice = await SupplierInvoice.findOne({ supplierInvoiceId: id });
    if (!invoice) throw new Error(`Supplier Invoice ${id} not found`);

    if (invoice.matchStatus !== 'MATCHED' && invoice.status !== 'MATCHED') {
      throw new Error(`Cannot approve invoice with unresolved discrepancies. Current status: ${invoice.matchStatus}`);
    }

    invoice.status = 'APPROVED_FOR_PAYMENT';
    invoice.financeHandoffStatus = 'SENT_TO_FINANCE';
    invoice.approvedBy = user.userId;
    invoice.approvedAt = new Date();
    invoice.sentToFinanceAt = new Date();

    await invoice.save();

    await AuditService.logEvent({
      userId: user.userId,
      role: user.role,
      action: 'INVOICE_SENT_TO_FINANCE',
      module: 'PROCUREMENT',
      entityType: 'SupplierInvoice',
      entityId: id,
      newValue: { status: 'APPROVED_FOR_PAYMENT', financeHandoffStatus: 'SENT_TO_FINANCE' },
      details: `Approved 3-way match for invoice ${id} and handed off to Finance for disbursement.`
    });

    await NotificationService.sendNotification({
      channel: 'IN_APP',
      event: 'INVOICE_HANDED_OFF_TO_FINANCE',
      title: `Invoice ${invoice.invoiceNumber} Ready for Payment`,
      message: `Invoice ${invoice.invoiceNumber} from ${invoice.vendorName} (₹${invoice.grandTotal.toLocaleString()}) passed 3-way match and is ready for finance processing.`,
      entityType: 'SupplierInvoice',
      entityId: id
    });

    return invoice;
  }

  /**
   * Query invoices
   */
  static async getInvoices(query = {}) {
    const filter = {};
    if (query.purchaseOrderId) filter.purchaseOrderId = query.purchaseOrderId;
    if (query.vendorId) filter.vendorId = query.vendorId;
    if (query.matchStatus) filter.matchStatus = query.matchStatus;
    if (query.status) filter.status = query.status;
    if (query.search) {
      filter.$or = [
        { supplierInvoiceId: new RegExp(query.search, 'i') },
        { invoiceNumber: new RegExp(query.search, 'i') },
        { purchaseOrderId: new RegExp(query.search, 'i') },
        { vendorName: new RegExp(query.search, 'i') }
      ];
    }

    const page = Math.max(1, parseInt(query.page, 10) || 1);
    const limit = Math.max(1, Math.min(100, parseInt(query.limit, 10) || 20));
    const skip = (page - 1) * limit;

    const [invoices, total] = await Promise.all([
      SupplierInvoice.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      SupplierInvoice.countDocuments(filter)
    ]);

    return {
      invoices,
      total,
      page,
      totalPages: Math.ceil(total / limit)
    };
  }

  static async getInvoiceById(id) {
    const invoice = await SupplierInvoice.findOne({ supplierInvoiceId: id }).lean();
    if (!invoice) throw new Error(`Supplier Invoice ${id} not found`);

    // Attach PO and GRN details if present
    const [po, grn] = await Promise.all([
      PurchaseOrder.findOne({ purchaseOrderId: invoice.purchaseOrderId }).lean(),
      invoice.goodsReceiptId ? GoodsReceipt.findOne({ goodsReceiptId: invoice.goodsReceiptId }).lean() : null
    ]);

    return { ...invoice, po, grn };
  }
}

module.exports = InvoiceMatchingService;
